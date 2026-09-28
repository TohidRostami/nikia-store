"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UploadOutcome } from "@/lib/image-upload";

export function MultiImageUploader({
  images,
  onChange,
  uploadAction,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  uploadAction: (formData: FormData) => Promise<UploadOutcome>;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    // A local accumulator, not the `images` prop — onChange is called
    // once per file below, and relying on the (stale) `images` closure
    // across iterations would silently drop everything but the last
    // successful upload when more than one file is selected at once.
    let currentImages = images;

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const result = await uploadAction(formData);
          if ("error" in result) {
            toast.error(result.error);
            continue;
          }
          currentImages = [...currentImages, result.url];
          onChange(currentImages);
        } catch {
          // A thrown exception (network drop, the file exceeding the
          // server's body-size limit, etc.) shouldn't take down the
          // whole batch or leave the uploader stuck — report it and
          // move on to the next file.
          toast.error(
            "آپلود این فایل با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
          );
        }
      }
    } finally {
      // Guaranteed to run whether the loop finished cleanly or an
      // unexpected error escaped it — this is exactly what was missing
      // before, and why a failed upload could leave the button stuck on
      // "در حال آپلود..." forever.
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((i) => i !== url));
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-secondary"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="حذف تصویر"
                className="absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            در حال آپلود...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            افزودن عکس
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
