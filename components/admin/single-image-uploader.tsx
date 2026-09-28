"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UploadOutcome } from "@/lib/image-upload";

export function SingleImageUploader({
  value,
  onChange,
  uploadAction,
  aspectClassName = "aspect-square",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  uploadAction: (formData: FormData) => Promise<UploadOutcome>;
  aspectClassName?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadAction(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onChange(result.url);
    } catch {
      // A thrown exception (network drop, file exceeding the server's
      // body-size limit, etc.) used to skip past the reset below and
      // leave this stuck on "در حال آپلود..." forever.
      toast.error("آپلود تصویر با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-md border border-border bg-secondary",
          aspectClassName,
        )}
      >
        <Image src={value} alt="" fill sizes="400px" className="object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="حذف تصویر"
          className="absolute end-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground",
        aspectClassName,
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          در حال آپلود...
        </>
      ) : (
        <>
          <Upload className="size-5" />
          افزودن عکس
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        disabled={uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </label>
  );
}
