import type { UnsplashListPhoto, UnsplashPhoto } from "./types";
import {
  createTagsArrayFormBody,
  createCommaSeparatedTagsFormBody,
} from "./utils";

const UNSPLASH_API_BASE_URL = "https://api.unsplash.com";
const unsplashAccessKey = Bun.env.UNSPLASH_ACCESS_KEY;

async function unsplashRequest<T>(
  path: string,
  options: {
    headers: Record<string, string>;
  },
): Promise<T> {
  const response = await fetch(`${UNSPLASH_API_BASE_URL}${path}`, {
    headers: {
      "Accept-Version": "v1",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Unsplash request failed for ${path}: ${response.status} ${errorText}`,
    );
  }

  return (await response.json()) as T;
}

export async function resolveUsername(bearerToken: string) {
  const me = await unsplashRequest<{ username: string }>("/me", {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  return me.username;
}

export async function listRecentPhotos(username: string, count: number) {
  const photos: UnsplashListPhoto[] = [];
  let page = 1;

  while (photos.length < count) {
    const perPage = Math.min(30, count - photos.length);
    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      order_by: "latest",
    });

    const pagePhotos = await unsplashRequest<UnsplashListPhoto[]>(
      `/users/${encodeURIComponent(username)}/photos?${query.toString()}`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      },
    );

    if (pagePhotos.length === 0) {
      break;
    }

    photos.push(...pagePhotos);
    page += 1;
  }

  return photos.slice(0, count);
}

export async function getPhoto(id: string) {
  return unsplashRequest<UnsplashPhoto>(`/photos/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Client-ID ${unsplashAccessKey}`,
    },
  });
}

export async function updatePhoto(
  bearerToken: string,
  imageId: string,
  description: string,
  tags: string[],
) {
  const attempts: Array<{
    body: string;
    headers: Record<string, string>;
  }> = [
    {
      body: JSON.stringify({
        description,
        tags,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
    {
      body: createTagsArrayFormBody(description, tags),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    {
      body: createCommaSeparatedTagsFormBody(description, tags),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  ];

  let lastError = "";

  for (const attempt of attempts) {
    const response = await fetch(
      `${UNSPLASH_API_BASE_URL}/photos/${encodeURIComponent(imageId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Accept-Version": "v1",
          ...attempt.headers,
        },
        body: attempt.body,
      },
    );

    if (response.ok) {
      return;
    }

    lastError = await response.text();
  }

  throw new Error(`Unsplash update failed for photo ${imageId}: ${lastError}`);
}
