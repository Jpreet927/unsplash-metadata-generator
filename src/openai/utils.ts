export function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const directOutputText = Reflect.get(payload, "output_text");
  if (
    typeof directOutputText === "string" &&
    directOutputText.trim().length > 0
  ) {
    return directOutputText;
  }

  const output = Reflect.get(payload, "output");
  if (!Array.isArray(output)) {
    return "";
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Reflect.get(item, "content");
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = Reflect.get(part, "text");
      if (typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    }
  }

  return "";
}

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(value.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }

    return null;
  }
}
