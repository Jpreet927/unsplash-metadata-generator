import React, { useState } from "react";
import { UnsplashPhoto } from "@/lib/types";
import Image from "next/image";
import { Badge } from "./core/badge";
import { Button } from "./core/button";
import { Input } from "./core/input";
import { X, Sparkles } from "lucide-react";

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

  const originalTags = photo.tags.map((tag) => tag.title);
  const originalDescription = photo.description || "";

  return (
    <form className="flex flex-row gap-4 w-[66%] h-[66%] rounded-lg border border-border bg-panel shadow-[0_30px_60px_-40px_rgba(50,38,15,0.4)] backdrop-blur overflow-hidden">
      <div className="relative w-[40%] overflow-hidden">
        <Image
          src={photo.urls.regular}
          alt={photo.description || "Photo"}
          className="object-cover"
          fill
        />
      </div>
      <div className="flex flex-col w-[60%] gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <p className="uppercase text-2xl font-bold">Photo {photo.id}</p>
          <div>
            <Button className="flex gap-1">
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
          <Input
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
                    setTags([...tags, newTag]);
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-auto">
          <Button type="submit">Update Photo</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};

export default MetadataForm;
