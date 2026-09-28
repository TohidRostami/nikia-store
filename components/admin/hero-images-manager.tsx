"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import type { UploadOutcome } from "@/lib/image-upload";

export type HeroImageItem = { url: string; isActive: boolean };

export function HeroImagesManager({
  images,
  onChange,
  uploadAction,
}: {
  images: HeroImageItem[];
  onChange: (images: HeroImageItem[]) => void;
  uploadAction: (formData: FormData) => Promise<UploadOutcome>;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    // Same reasoning as MultiImageUploader: a local accumulator, not the
    // `images` prop, so multiple files uploaded in one batch don't
    // clobber each other through a stale closure.
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
          currentImages = [
            ...currentImages,
            { url: result.url, isActive: true },
          ];
          onChange(currentImages);
        } catch {
          toast.error(
            "آپلود این فایل با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
          );
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((i) => i.url !== url));
  }

  function toggleActive(url: string) {
    onChange(
      images.map((i) => (i.url === url ? { ...i, isActive: !i.isActive } : i)),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.url}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-md border bg-secondary transition-opacity",
                img.isActive ? "border-border" : "border-border opacity-50",
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />

              <button
                type="button"
                onClick={() => removeImage(img.url)}
                aria-label="حذف تصویر"
                className="absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-primary/75 px-2 py-1.5">
                <span className="text-[11px] text-background">
                  {img.isActive ? "فعال" : "غیرفعال"}
                </span>
                <Switch
                  checked={img.isActive}
                  onCheckedChange={() => toggleActive(img.url)}
                  aria-label={
                    img.isActive
                      ? "غیرفعال‌کردن این اسلاید"
                      : "فعال‌کردن این اسلاید"
                  }
                  className="scale-75"
                />
              </div>
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
