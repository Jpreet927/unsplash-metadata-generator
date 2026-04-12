import React, { useState } from "react";
import { UnsplashPhoto } from "@/lib/types";
import Image from "next/image";
import { Badge } from "./core/badge";
import { Button } from "./core/button";
import { Input } from "./core/input";
import { X, Sparkles } from "lucide-react";
import { TextArea } from "./core/textarea";
import { toast } from "sonner";

const MetadataForm = ({
  photo,
  onClose,
}: {
  photo: UnsplashPhoto;
  onClose: () => void;
}) => {
  const [tags, setTags] = useState<(string | null | undefined)[]>(
    photo.tags.map((tag) => tag.title),
  );
  const [description, setDescription] = useState<string>(
    photo.description || "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const originalTags = photo.tags.map((tag) => tag.title);
  const originalDescription = photo.description || "";

  const handleSubmit = async () => {
    if (tags.length > 20) {
      toast.error("You can only add up to 20 tags");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: photo.id,
          description: description.trim(),
          tags: tags.filter((tag): tag is string => Boolean(tag?.trim())),
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        toast.error(payload.error ?? "Failed to update photo metadata");
        return;
      }

      toast.success("Photo metadata updated");
      onClose();
    } catch {
      toast.error("Failed to update photo metadata");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: photo.id,
          description: description.trim(),
          tags: tags
            .filter((tag): tag is string => Boolean(tag?.trim()))
            .map((tag) => ({ title: tag.trim() })),
          urls: photo.urls,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error ?? "Failed to generate metadata");
        return;
      }

      setDescription(data.metadata.description);
      setTags((current) => mergeUniqueTags(current, data.metadata.tags));
    } catch {
      toast.error("Failed to generate metadata");
    } finally {
      setIsGenerating(false);
    }
  };

  const mergeUniqueTags = (
    current: (string | null | undefined)[],
    incoming: string[],
  ) => {
    const existing = new Set(
      current
        .filter((tag): tag is string => Boolean(tag))
        .map((tag) => tag.trim().toLowerCase()),
    );

    const uniqueIncoming = incoming.filter(
      (tag) => !existing.has(tag.trim().toLowerCase()),
    );

    return [...current, ...uniqueIncoming];
  };

  return (
    <form
      className="flex flex-row gap-4 w-[66%] h-[66%] rounded-lg border border-border bg-panel shadow-[0_30px_60px_-40px_rgba(50,38,15,0.4)] backdrop-blur overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="relative w-[40%] overflow-hidden">
        <Image
          src={photo.urls.regular}
          alt={photo.description || "Photo"}
          className="object-cover"
          fill
        />
      </div>
      <div className="flex flex-col w-[60%] gap-8 px-6 py-12 overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="uppercase text-2xl font-bold">Photo {photo.id}</p>
          <div>
            <Button
              className="flex gap-1"
              onClick={handleGenerate}
              disabled={isGenerating || isSubmitting}
            >
              <Sparkles size={16} fill="white" stroke="none" />
              Generate Metadata
            </Button>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                setTags(originalTags);
                setDescription(originalDescription);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="text-xs uppercase tracking-widest text-muted"
            htmlFor="description"
          >
            Description
          </label>
          <TextArea
            value={description || "No description"}
            placeholder="Add a description"
            onChange={(e) => setDescription(e.target.value)}
            id="description"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="text-xs uppercase tracking-widest text-muted"
            htmlFor="addTag"
          >
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">
              {tags.length > 0 ? (
                tags.map((tag, index) => (
                  <Badge
                    key={`${photo.id}-${tag}-${index}`}
                    className="rounded-lg py-2 flex gap-2"
                    variant={index >= 20 ? "destructive" : "default"}
                  >
                    {tag}
                    <X
                      size={16}
                      className="cursor-pointer"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                    />
                  </Badge>
                ))
              ) : (
                <Badge>No tags yet</Badge>
              )}
            </div>
            <Input
              placeholder="Add a tag"
              id="addTag"
              defaultValue=""
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const newTag = e.currentTarget.value;
                  if (newTag) {
                    if (!tags.includes(newTag)) {
                      setTags([...tags, newTag]);
                    }

                    e.currentTarget.value = "";
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-auto">
          <Button type="submit" disabled={isSubmitting || isGenerating}>
            Update Photo
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};

export default MetadataForm;
