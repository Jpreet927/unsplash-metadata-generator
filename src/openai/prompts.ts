export const UPDATE_TAGS_DESCRIPTION = [
  "You are generating metadata for an Unsplash photo.",
  "Return JSON only with this exact shape:",
  '{"description":"string","tags":["string"]}',
  `Write a natural, concrete one-sentence description under 160 characters.`,
  `Generate exactly 20 tags optimized for discovery and being featured.`,
].join("\n");
