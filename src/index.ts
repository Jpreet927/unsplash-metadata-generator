import { generateMetadata } from "./openai/client";
import type { CliOptions } from "./ts/general";
import {
  getPhoto,
  listRecentPhotos,
  resolveUsername,
  updatePhoto,
} from "./unsplash/client";
import {
  formatNullable,
  formatTags,
  needsMetadata,
  getExistingTags,
  hasMeaningfulText,
  hasTags,
} from "./unsplash/utils";

const unsplashBearerToken = Bun.env.UNSPLASH_BEARER_TOKEN;

async function main() {
  if (!unsplashBearerToken) throw new Error("Invalid Unsplash bearer token.");

  const options = parseArgs(Bun.argv.slice(2));

  if (hasHelpFlag(Bun.argv.slice(2))) {
    printHelp();
    return;
  }

  const username =
    options.username ?? (await resolveUsername(unsplashBearerToken));

  console.log(
    `Inspecting the ${options.count} most recent photo(s) for @${username}...`,
  );

  const recentPhotos = await listRecentPhotos(username, options.count);
  const detailedPhotos = await mapWithConcurrency(
    recentPhotos,
    options.concurrency,
    async (photo) => getPhoto(photo.id),
  );

  const candidates = detailedPhotos.filter(needsMetadata);

  console.log(
    `Found ${candidates.length} candidate photo(s) missing a description or tags out of ${detailedPhotos.length} inspected.`,
  );

  if (candidates.length === 0) {
    console.log("Nothing to update.");
    return;
  }

  let updatedCount = 0;

  for (const photo of candidates) {
    const metadata = await generateMetadata(photo);

    const nextDescription = hasMeaningfulText(photo.description)
      ? photo.description!.trim()
      : metadata.description;
    const nextTags = hasTags(photo) ? getExistingTags(photo) : metadata.tags;

    console.log("");
    console.log(`Photo ${photo.id}`);
    console.log(`  Current description: ${formatNullable(photo.description)}`);
    console.log(`  Current tags: ${formatTags(getExistingTags(photo))}`);
    console.log(`  Proposed description: ${nextDescription}`);
    console.log(`  Proposed tags: ${formatTags(nextTags)}`);

    if (options.dryRun) {
      console.log("  Dry run enabled, skipping Unsplash update.");
      continue;
    }

    await updatePhoto(photo.id, {
      bearerToken: unsplashBearerToken,
      description: nextDescription,
      tags: nextTags,
    });

    console.log("  Updated in Unsplash.");
    updatedCount += 1;
  }

  console.log("");
  if (options.dryRun) {
    console.log("Dry run complete.");
  } else {
    console.log(`Finished. Updated ${updatedCount} photo(s).`);
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    count: 10,
    dryRun: false,
    openAiModel: "gpt-5.4",
    maxTags: 8,
    concurrency: 3,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--username":
        options.username = readNextValue(argv, index, arg);
        index += 1;
        break;
      case "--count":
        options.count = parsePositiveInteger(
          readNextValue(argv, index, arg),
          arg,
        );
        index += 1;
        break;
      case "--openai-model":
        options.openAiModel = readNextValue(argv, index, arg);
        index += 1;
        break;
      case "--max-tags":
        options.maxTags = parsePositiveInteger(
          readNextValue(argv, index, arg),
          arg,
        );
        index += 1;
        break;
      case "--concurrency":
        options.concurrency = parsePositiveInteger(
          readNextValue(argv, index, arg),
          arg,
        );
        index += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.count > 100) {
    throw new Error(
      "--count must be 100 or less to keep API usage reasonable.",
    );
  }

  if (options.maxTags > 20) {
    throw new Error("--max-tags must be 20 or less.");
  }

  return options;
}

function hasHelpFlag(argv: string[]) {
  return argv.includes("--help") || argv.includes("-h");
}

function printHelp() {
  console.log(`Usage:
  bun run index.ts --count 10 [--username your_name] [--dry-run]

Required environment variables:
  UNSPLASH_ACCESS_KEY
  UNSPLASH_BEARER_TOKEN
  OPENAI_API_KEY

Options:
  --username <value>      Unsplash username to inspect. If omitted, the tool uses /me from the bearer token.
  --count <value>         Number of recent photos to inspect. Default: 10
  --openai-model <value>  OpenAI model for metadata generation. Default: gpt-5
  --max-tags <value>      Maximum generated tags per photo. Default: 8
  --concurrency <value>   Parallel Unsplash detail fetches. Default: 3
  --dry-run               Print proposed updates without calling Unsplash PUT /photos/:id
  --help, -h              Show this help text
`);
}

function readNextValue(argv: string[], index: number, flag: string) {
  const value = argv[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function parsePositiveInteger(value: string, flag: string) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
