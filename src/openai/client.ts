import type { OpenAiMetadata } from "./types";
import type { UnsplashPhoto } from "../unsplash/types";
import { extractResponseText, safeJsonParse } from "./utils";
import { UPDATE_TAGS_DESCRIPTION } from "./prompts";

const OPENAI_API_BASE_URL = "https://api.openai.com/v1";
const MODEL = "gpt-5.4";
const openAiApiKey = Bun.env.OPENAI_API_KEY;

export async function generateMetadata(
  photo: UnsplashPhoto,
): Promise<OpenAiMetadata> {
  const imageUrl =
    photo.urls.regular ?? photo.urls.full ?? photo.urls.raw ?? photo.urls.small;

  if (!imageUrl) {
    throw new Error(`Photo ${photo.id} has no usable image URL.`);
  }

  const response = await fetch(`${OPENAI_API_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText = extractResponseText(payload);

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
