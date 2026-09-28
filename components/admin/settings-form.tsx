"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  HeroImagesManager,
  type HeroImageItem,
} from "@/components/admin/hero-images-manager";
import type { SiteSettings } from "@/lib/queries/settings";
import type { HeroImageDTO } from "@/lib/queries/hero-images";
import {
  updateSiteSettings,
  uploadHeroImage,
} from "@/app/admin/settings/actions";

export function SettingsForm({
  settings,
  heroImages: initialHeroImages,
}: {
  settings: SiteSettings;
  heroImages: HeroImageDTO[];
}) {
  const router = useRouter();
  const [emailLoginEnabled, setEmailLoginEnabled] = useState(
    settings.emailLoginEnabled,
  );
  const [smsLoginEnabled, setSmsLoginEnabled] = useState(
    settings.smsLoginEnabled,
  );
  const [standardShippingCost, setStandardShippingCost] = useState(
    settings.standardShippingCost.toString(),
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    settings.freeShippingThreshold?.toString() ?? "",
  );
  const [heroImages, setHeroImages] = useState<HeroImageItem[]>(
    initialHeroImages.map((i) => ({ url: i.url, isActive: i.isActive })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateSiteSettings({
      emailLoginEnabled,
      smsLoginEnabled,
      standardShippingCost: Number(standardShippingCost) || 0,
      freeShippingThreshold: freeShippingThreshold
        ? Number(freeShippingThreshold)
        : null,
      heroImages,
    });

    setLoading(false);
    if ("error" in result) {
      setError(result.error ?? "خطایی رخ داد.");
      return;
    }
    toast.success("تنظیمات ذخیره شد");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
        <div>
          <h2 className="text-sm font-medium">تصاویر هیرو (صفحه اصلی)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            اگر چند عکس اضافه کنید، در صفحه اصلی به‌صورت اسلایدشو نمایش داده
            می‌شوند. عکس‌های غیرفعال در فروشگاه نمایش داده نمی‌شوند اما حذف
            نمی‌شوند. اگر هیچ عکس فعالی نباشد، طرح انیمیشنی پیش‌فرض نمایش داده
            می‌شود.
          </p>
        </div>
        <HeroImagesManager
          images={heroImages}
          onChange={setHeroImages}
          uploadAction={uploadHeroImage}
        />
      </div>

      <div className="flex flex-col gap-5 rounded-lg border border-border p-6">
        <div>
          <h2 className="text-sm font-medium">روش‌های ورود</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            هرکدام را که می‌خواهید در صفحه‌ی ورود نمایش داده شود، فعال نگه
            دارید.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm">ورود با ایمیل و رمز عبور</p>
          </div>
          <Switch
            checked={emailLoginEnabled}
            onCheckedChange={setEmailLoginEnabled}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm">ورود با پیامک (کد یک‌بار مصرف)</p>
          </div>
          <Switch
            checked={smsLoginEnabled}
            onCheckedChange={setSmsLoginEnabled}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium">هزینه ارسال</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shippingCost">هزینه ارسال استاندارد (تومان)</Label>
          <Input
            id="shippingCost"
            thousandSeparator
            dir="ltr"
            min={0}
            value={standardShippingCost}
            onChange={(e) => setStandardShippingCost(e.target.value)}
            className="text-end appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="freeThreshold">
            ارسال رایگان از این مبلغ به بالا (تومان، اختیاری)
          </Label>
          <Input
            id="freeThreshold"
            thousandSeparator
            dir="ltr"
            min={0}
            placeholder="خالی = بدون ارسال رایگان"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(e.target.value)}
            className="text-end appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={loading} className="w-fit">
        {loading ? "در حال ذخیره..." : "ذخیره تنظیمات"}
      </Button>
    </form>
  );
}
