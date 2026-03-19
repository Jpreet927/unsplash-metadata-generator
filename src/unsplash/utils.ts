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

export function needsMetadata(photo: UnsplashPhoto) {
  return !hasMeaningfulText(photo.description) || !hasTags(photo);
}

export function hasMeaningfulText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasTags(photo: UnsplashPhoto) {
  return getExistingTags(photo).length > 0;
}

export function getExistingTags(photo: UnsplashPhoto) {
  return (photo.tags ?? [])
    .map((tag) => tag.title?.trim())
    .filter((tag): tag is string => Boolean(tag));
}

export function formatNullable(value: string | null) {
  return hasMeaningfulText(value) ? value!.trim() : "(missing)";
}

export function formatTags(tags: string[]) {
  return tags.length > 0 ? tags.join(", ") : "(missing)";
}
