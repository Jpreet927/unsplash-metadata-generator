import { Elysia, t } from "elysia";
import { generateMetadata } from "./openai/client";
import {
  getPhoto,
  listRecentPhotos,
  resolveUsername,
  updatePhoto,
} from "./unsplash/client";
import {
  needsMetadata,
  getExistingTags,
  hasMeaningfulText,
  hasTags,
} from "./unsplash/utils";
import { generateHash } from "./utils/utils";
import { mapWithConcurrency } from "./utils/concurrency";
import { exchangeCodeForToken, issueOauthState } from "./auth/auth";
import { env } from "./utils/env";

const app = new Elysia();
const sessions = new Map<string, { accessToken: string }>();

const authenticated = new Elysia()
  .guard({
    cookie: t.Cookie({
      session: t.Optional(t.String()),
    }),
  })
  .resolve(({ cookie: { session }, status }) => {
    const sessionId = session.value;
    const auth = sessionId ? sessions.get(sessionId) : undefined;

    if (!sessionId || !auth) {
      return status(401, {
        success: false,
        error: "Invalid authorization.",
      });
    }

    return { auth };
  });

app
  .get(
    "/login",
    ({ redirect, cookie: { oauth_state } }) => {
      const state = issueOauthState(oauth_state);

      const params = new URLSearchParams({
        client_id: env.unsplashAccessKey,
        redirect_uri: env.unsplashRedirectUri,
        response_type: "code",
        scope: "public read_user write_photos",
        state,
      });

      return redirect(
        `https://unsplash.com/oauth/authorize?${params.toString()}`,
      );
    },
    {
      cookie: t.Cookie({
        oauth_state: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/callback",
    async ({ query, cookie: { oauth_state, session }, set }) => {
      const storedState = oauth_state.value;
      const returnedState = query.state;

      if (!returnedState || !storedState || returnedState !== storedState) {
        set.status = 400;
        return { success: false, error: "Invalid OAuth state" };
      }

      try {
        const sessionId = generateHash(32);
        const token = await exchangeCodeForToken(query.code);
        sessions.set(sessionId, { accessToken: token });

        session.set({
          value: sessionId,
          httpOnly: true,
          secure: env.isProduction,
          sameSite: "lax",
          path: "/",
        });

        return {
          success: true,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "OAuth exchange failed",
        };
      }
    },
    {
      query: t.Object({
        code: t.String(),
        state: t.String(),
      }),
      cookie: t.Cookie({
        oauth_state: t.Optional(t.String()),
        session: t.Optional(t.String()),
      }),
    },
  )
  .use(
    authenticated
      .get(
        "/photos",
        async ({ body, auth }) => {
          const username = await resolveUsername(auth.accessToken);

          const recentPhotos = await listRecentPhotos(username, body.count);
          const detailedPhotos = await mapWithConcurrency(
            recentPhotos,
            3,
            async (photo) => getPhoto(photo.id),
          );
          const candidates = detailedPhotos.filter(needsMetadata);

          if (candidates.length === 0) {
            return {
              success: true,
              message: "No photos need metadata updates.",
            };
          }

          return { success: true, photos: candidates };
        },
        {
          body: t.Object({
            count: t.Number({ minimum: 1, maximum: 10, default: 5 }),
            dryRun: t.Boolean({ default: false }),
          }),
          cookie: t.Cookie({
            session: t.Optional(t.String()),
          }),
        },
      )
      .post(
        "/generate",
        async ({ body, auth }) => {
          let updatedCount = 0;

          for (const photo of body.images) {
            const metadata = await generateMetadata(photo);

            const nextDescription = hasMeaningfulText(photo.description)
              ? photo.description!.trim()
              : metadata.description;
            const nextTags = hasTags(photo)
              ? getExistingTags(photo)
              : metadata.tags;

            updatedCount++;

            if (body.dryRun) {
              console.log("Dry run enabled, skipping Unsplash update.");
              continue;
            }

            await updatePhoto(photo.id, {
              bearerToken: auth.accessToken,
              description: nextDescription,
              tags: nextTags,
            });
          }

          const message = body.dryRun
            ? `Dry run completed. Would have updated ${updatedCount} photo(s).`
            : `Updated ${updatedCount} photo(s) in Unsplash.`;

          return { success: true, message };
        },
        {
          body: t.Object({
            images: t.Array(
              t.Object({
                id: t.String(),
                description: t.String(),
                tags: t.Array(
                  t.Object({
                    title: t.String(),
                  }),
                ),
                urls: t.Object({
                  raw: t.String(),
                  full: t.String(),
                  regular: t.String(),
                  small: t.String(),
                  thumb: t.String(),
                }),
              }),
            ),
            dryRun: t.Boolean({ default: false }),
          }),
          cookie: t.Cookie({
            session: t.Optional(t.String()),
          }),
        },
      ),
  )
  .listen(3001);
