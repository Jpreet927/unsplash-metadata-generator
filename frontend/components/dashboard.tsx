"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UnsplashPhoto } from "@/lib/types";

type PhotoSuccess = {
  success: true;
  photos?: UnsplashPhoto[];
  message?: string;
};

type PhotoError = {
  success: false;
  error?: string;
};

type PhotosResponse = PhotoSuccess | PhotoError;

function getTags(photo: UnsplashPhoto) {
  return photo.tags
    .map((tag) => tag.title?.trim())
    .filter((tag): tag is string => Boolean(tag));
}

export function Dashboard() {
  const searchParams = useSearchParams();
  const [count, setCount] = useState("5");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const authState = searchParams.get("auth");
  const authReason = searchParams.get("reason");

  const authBanner = useMemo(() => {
    if (authState === "success") {
      return "Connected to Unsplash. You can retrieve your recent photos now.";
    }

    if (authState === "error") {
      return authReason
        ? `Unsplash sign-in failed: ${authReason}`
        : "Unsplash sign-in failed.";
    }

    return null;
  }, [authReason, authState]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setMessage(null);

    const response = await fetch("/api/photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        count: Number(count),
      }),
    });

    const payload = (await response.json()) as PhotosResponse;

    startTransition(async () => {
      if (!response.ok || !payload.success) {
        setPhotos([]);
        setError(
          payload.success
            ? "Unable to load photos."
            : (payload.error ?? "Unable to load photos."),
        );
        return;
      }

      setPhotos(payload.photos ?? []);
      setMessage(
        payload.message ?? `Loaded ${payload.photos?.length ?? 0} photo(s).`,
      );
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-12 md:px-10">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden">
          <Badge className="mb-5">Unsplash Workspace</Badge>
          <CardTitle className="max-w-xl text-4xl leading-tight md:text-5xl">
            Sign in, pull your recent photos, and review their existing
            metadata.
          </CardTitle>
          <CardDescription className="mt-4 max-w-2xl text-base leading-7">
            Expand each photo to edit its description and tags. New descriptions
            and tags can be generated based on the photo's content. Each photo
            must have a maximum of 20 tags.
          </CardDescription>
        </Card>

        <Card>
          <CardTitle>Retrieve Photos</CardTitle>
          <CardDescription className="mt-2">
            Choose how many recent photos to fetch from Unsplash.
          </CardDescription>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="count">Recent photo count</Label>
              <Input
                id="count"
                max={20}
                min={1}
                name="count"
                onChange={(event) => setCount(event.target.value)}
                type="number"
                value={count}
              />
            </div>
            <Button className="w-full" disabled={isPending} type="submit">
              {isPending ? "Loading photos..." : "Fetch photos"}
            </Button>
          </form>
          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          {message ? (
            <p className="mt-4 text-sm text-muted">{message}</p>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo) => {
          const tags = getTags(photo);

          return (
            <Card className="overflow-hidden p-0" key={photo.id}>
              <div className="relative aspect-4/3 w-full overflow-hidden">
                <Image
                  alt={photo.description ?? `Unsplash photo ${photo.id}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  src={photo.urls.regular}
                />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted">
                    Photo {photo.id}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {photo.description?.trim() ||
                      "No description on this photo yet."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge
                        key={`${photo.id}-${tag}`}
                        className="rounded-lg py-2"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <Badge>No tags yet</Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
