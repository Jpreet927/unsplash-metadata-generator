import type { UnsplashPhoto } from "./types";

export function createTagsArrayFormBody(description: string, tags: string[]) {
  const params = new URLSearchParams();
  params.set("description", description);

  for (const tag of tags) {
    params.append("tags[]", tag);
  }

  return params.toString();
}

export function createCommaSeparatedTagsFormBody(
  description: string,
  tags: string[],
) {
  const params = new URLSearchParams();
  params.set("description", description);
  params.set("tags", tags.join(","));
  return params.toString();
}

export function getExistingTags(photo: UnsplashPhoto) {
  return (photo.tags ?? [])
    .map((tag) => tag.title?.trim())
    .filter((tag): tag is string => Boolean(tag));
}

export function formatTags(tags: string[]) {
  return tags.length > 0 ? tags.join(", ") : "(missing)";
}
