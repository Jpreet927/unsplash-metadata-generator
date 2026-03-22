import { Elysia, t } from "elysia";
import { bearer } from "@elysiajs/bearer";
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

const app = new Elysia();

app
  .use(bearer())
  .post(
    "/generate",
    async ({ body, bearer, set }) => {
      if (!bearer) {
        set.status = 401;
        return { success: false, error: "Invalid bearer token" };
      }

      const username = await resolveUsername(bearer);

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

        if (body.dryRun) {
          console.log("  Dry run enabled, skipping Unsplash update.");
          continue;
        }

        await updatePhoto(photo.id, {
          bearerToken: bearer,
          description: nextDescription,
          tags: nextTags,
        });

        updatedCount++;
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
