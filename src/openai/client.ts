import OpenAI from "openai";
import type { OpenAiMetadata } from "./types";
import type { UnsplashPhoto } from "../unsplash/types";
import { safeJsonParse } from "./utils";
import { UPDATE_TAGS_DESCRIPTION } from "./prompts";
import { env } from "../utils/env";

const MODEL = "gpt-5.4";
const client = new OpenAI({ apiKey: env.openAiApiKey });

export async function generateMetadata(
  photo: UnsplashPhoto,
): Promise<OpenAiMetadata> {
  const imageUrl =
    photo.urls.regular ?? photo.urls.full ?? photo.urls.raw ?? photo.urls.small;

  if (!imageUrl) {
    throw new Error(`Photo ${photo.id} has no usable image URL.`);
  }

  const response = await client.responses.create({
    model: MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: UPDATE_TAGS_DESCRIPTION,
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "auto",
          },
        ],
      },
    ],
  });

  const outputText = response.output_text;

  if (!outputText) {
    throw new Error(
      `OpenAI response did not include text for photo ${photo.id}.`,
    );
  }

  const parsed = safeJsonParse<Partial<OpenAiMetadata>>(outputText);

  if (
    !parsed ||
    typeof parsed.description !== "string" ||
    !Array.isArray(parsed.tags)
  ) {
    throw new Error(
      `OpenAI returned invalid JSON for photo ${photo.id}: ${outputText}`,
    );
  }

  const description = parsed.description.trim();
  const tags = parsed.tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 20);

  if (!description) {
    throw new Error(
      `OpenAI returned an empty description for photo ${photo.id}.`,
    );
  }

  if (tags.length === 0) {
    throw new Error(`OpenAI returned no usable tags for photo ${photo.id}.`);
  }

  return { description, tags };
}
