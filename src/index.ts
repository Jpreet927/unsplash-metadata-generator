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

const app = new Elysia();
const sessions = new Map<string, { accessToken: string }>();

const UNSPLASH_ACCESS_KEY = Bun.env.UNSPLASH_ACCESS_KEY!;
const UNSPLASH_SECRET_KEY = Bun.env.UNSPLASH_SECRET_KEY!;
const UNSPLASH_REDIRECT_URI = Bun.env.UNSPLASH_REDIRECT_URI!;
const ENVIRONMENT = Bun.env.ENVIRONMENT!;

app
  .get(
    "/login",
    ({ redirect, cookie: { oauth_state } }) => {
      const state = generateHash(16);
      oauth_state.set({
        value: state,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      const params = new URLSearchParams({
        client_id: UNSPLASH_ACCESS_KEY,
        redirect_uri: UNSPLASH_REDIRECT_URI,
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

      const code = query.code;

      const body = JSON.stringify({
        client_id: UNSPLASH_ACCESS_KEY,
        client_secret: UNSPLASH_SECRET_KEY,
        redirect_uri: UNSPLASH_REDIRECT_URI,
        code,
        grant_type: "authorization_code",
      });

      const response = await fetch("https://unsplash.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      if (!response.ok) {
        set.status = 400;
        return {
          success: false,
          error: await response.text(),
        };
      }

      const auth = (await response.json()) as {
        access_token: string;
        token_type: string;
        scope: string;
        created_at: number;
      };

      const sessionId = generateHash(32);
      sessions.set(sessionId, { accessToken: auth.access_token });

      session.set({
        value: sessionId,
        httpOnly: true,
        secure: ENVIRONMENT === "prod",
        sameSite: "lax",
        path: "/",
      });

      return {
        success: true,
      };
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
  .post(
    "/generate",
    async ({ body, cookie: { session }, set }) => {
      const sessionId = session.value;
      const auth = sessionId ? sessions.get(sessionId) : undefined;

      if (!sessionId || !auth) {
        set.status = 401;
        return { success: false, error: "Invalid authorization." };
      }

      const username = await resolveUsername(auth.accessToken);

      const recentPhotos = await listRecentPhotos(username, body.count);
      const detailedPhotos = await mapWithConcurrency(
        recentPhotos,
        3,
        async (photo) => getPhoto(photo.id),
      );
      const candidates = detailedPhotos.filter(needsMetadata);

      if (candidates.length === 0) {
        return { success: true, message: "No photos need metadata updates." };
      }

      console.log(
        `Found ${candidates.length} candidate photo(s) missing a description or tags out of ${detailedPhotos.length} inspected.`,
      );

      let updatedCount = 0;

      for (const photo of candidates) {
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
        count: t.Number({ minimum: 1, maximum: 10, default: 5 }),
        dryRun: t.Boolean({ default: false }),
      }),
      cookie: t.Cookie({
        session: t.Optional(t.String()),
      }),
    },
  )
  .listen(3001);

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
) {
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      const currentItem = items[currentIndex];
      nextIndex += 1;

      if (currentItem === undefined) {
        continue;
      }

      results[currentIndex] = await mapper(currentItem, currentIndex);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length || 1) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
}
