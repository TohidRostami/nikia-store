"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { HexColorPicker, HexColorInput } from "react-colorful";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CategoryDTO, ProductDetailDTO, SizeDTO } from "@/lib/types";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  type ProductFormInput,
  type ColorGroupInput,
} from "@/app/admin/products/actions";
import { createSize } from "@/app/admin/sizes/actions";
import { MultiImageUploader } from "@/components/admin/multi-image-uploader";
import { slugify } from "@/lib/slug";

type ColorGroupState = {
  key: string; // client-side only, for React keys — not persisted
  name: string;
  hexValue: string;
  images: string[];
  variantStocks: Record<string, number>; // sizeId -> stock
};

function newColorGroup(): ColorGroupState {
  return {
    key: crypto.randomUUID(),
    name: "",
    hexValue: "#000000",
    images: [],
    variantStocks: {},
  };
}

export function ProductForm({
  categories,
  sizes: initialSizes,
  product,
}: {
  categories: CategoryDTO[];
  sizes: SizeDTO[];
  product?: ProductDetailDTO;
}) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [categoryId, setCategoryId] = useState(
    product?.category.id ?? categories[0]?.id ?? "",
  );
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice?.toString() ?? "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [materialCare, setMaterialCare] = useState(product?.materialCare ?? "");
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);

  // Sizes are still a store-wide list — extended in place here if the
  // admin creates a new one, so every color block immediately shows it.
  const [sizes, setSizes] = useState(initialSizes);

  // Each color the product comes in — its own name/hex, its own
  // size+stock checklist, and its own photos.
  const [colorGroups, setColorGroups] = useState<ColorGroupState[]>(() => {
    if (!product) return [newColorGroup()];
    if (product.colors.length === 0) return [newColorGroup()];

    return product.colors.map((c) => {
      const variantStocks: Record<string, number> = {};
      product.variants
        .filter((v) => v.colorId === c.id)
        .forEach((v) => {
          if (v.sizeId) variantStocks[v.sizeId] = v.stock;
        });
      const images = product.images
        .filter((img) => img.colorId === c.id)
        .map((img) => img.url);
      return {
        key: c.id,
        name: c.name,
        hexValue: c.hexValue ?? "#000000",
        images,
        variantStocks,
      };
    });
  });

  const [newSizeOpen, setNewSizeOpen] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeDesc, setNewSizeDesc] = useState("");
  const [newSizeLoading, setNewSizeLoading] = useState(false);
  const [newSizeError, setNewSizeError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      const generated = slugify(value);
      setSlug(/[a-z0-9]/.test(generated) ? generated : "");
    }
  }

  function updateGroup(index: number, patch: Partial<ColorGroupState>) {
    setColorGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    );
  }

  function toggleGroupSize(
    groupIndex: number,
    sizeId: string,
    checked: boolean,
  ) {
    setColorGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIndex) return g;
        const stocks = { ...g.variantStocks };
        if (checked) stocks[sizeId] = stocks[sizeId] ?? 0;
        else delete stocks[sizeId];
        return { ...g, variantStocks: stocks };
      }),
    );
  }

  function updateGroupStock(groupIndex: number, sizeId: string, stock: number) {
    setColorGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, variantStocks: { ...g.variantStocks, [sizeId]: stock } }
          : g,
      ),
    );
  }

  function addColorGroup() {
    setColorGroups((prev) => [...prev, newColorGroup()]);
  }

  function removeColorGroup(index: number) {
    setColorGroups((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddSize() {
    if (!newSizeName.trim()) return;
    setNewSizeLoading(true);
    setNewSizeError(null);

    const result = await createSize({
      name: newSizeName,
      description: newSizeDesc,
      sortOrder: sizes.length + 1,
    });

    setNewSizeLoading(false);
    if ("error" in result) {
      setNewSizeError(result.error);
      return;
    }

    setSizes((prev) => [...prev, result.size]);
    toast.success(
      `سایز «${result.size.name}» ساخته شد — از این به بعد برای همه رنگ‌ها در دسترس است`,
    );
    setNewSizeName("");
    setNewSizeDesc("");
    setNewSizeOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const colorGroupsInput: ColorGroupInput[] = colorGroups.map((g) => ({
      name: g.name,
      hexValue: g.hexValue,
      images: g.images,
      sizes: Object.entries(g.variantStocks).map(([sizeId, stock]) => ({
        sizeId,
        stock,
      })),
    }));

    const input: ProductFormInput = {
      name,
      slug,
      categoryId,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      description,
      materialCare,
      isPublished,
      isFeatured,
      isNew,
      colorGroups: colorGroupsInput,
    };

    const result = isEdit
      ? await updateProduct(product.id, input)
      : await createProduct(input);
    setLoading(false);

    if ("error" in result) {
      setError(result.error ?? "خطایی رخ داد.");
      return;
    }
    toast.success(isEdit ? "محصول به‌روزرسانی شد" : "محصول ساخته شد");
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 rounded-lg border border-border p-6 lg:col-span-2">
          <h2 className="text-sm font-medium">اطلاعات پایه</h2>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">نام محصول</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">اسلاگ (برای آدرس صفحه)</Label>
            <Input
              id="slug"
              required
              dir="ltr"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground">
              فقط حروف انگلیسی کوچک، عدد و خط‌تیره — مثل{" "}
              <span dir="ltr">pirahan-abi</span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">دسته‌بندی</Label>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">قیمت (تومان)</Label>
              <Input
                id="price"
                thousandSeparator
                required
                dir="ltr"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compareAtPrice">
                قیمت قبل از تخفیف (اختیاری)
              </Label>
              <Input
                id="compareAtPrice"
                thousandSeparator
                dir="ltr"
                min={0}
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">توضیحات</Label>
            <textarea
              id="description"
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="materialCare">جنس و نگهداری (اختیاری)</Label>
            <textarea
              id="materialCare"
              rows={3}
              value={materialCare}
              onChange={(e) => setMaterialCare(e.target.value)}
              placeholder="مثلاً: ۱۰۰٪ کتان. شست‌وشو در دمای ۳۰ درجه، اتو با حرارت متوسط."
              className="rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
            <h2 className="text-sm font-medium">وضعیت</h2>
            <ToggleRow
              label="منتشرشده"
              description="در فروشگاه نمایش داده شود"
              checked={isPublished}
              onChange={setIsPublished}
            />
            <ToggleRow
              label="محصول ویژه"
              description="در صفحه اصلی نمایش داده شود"
              checked={isFeatured}
              onChange={setIsFeatured}
            />
            <ToggleRow
              label="جدید"
              description="نشان «جدید» روی محصول"
              checked={isNew}
              onChange={setIsNew}
            />
          </div>
        </div>
      </div>

      {/* Color / variant blocks — full width, since each one now carries
          its own picker, size checklist, and image uploader. */}
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-medium">
            مدل‌ها (رنگ، سایز، موجودی و عکس)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            برای هر رنگی که این محصول در آن موجود است، یک مدل جداگانه اضافه
            کنید.
          </p>
        </div>

        {colorGroups.map((group, index) => (
          <div
            key={group.key}
            className="flex flex-col gap-5 rounded-lg border border-border p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium">مدل {index + 1}</h3>
              {colorGroups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColorGroup(index)}
                  aria-label="حذف این مدل"
                  className="flex items-center gap-1 text-xs text-destructive transition-colors hover:underline"
                >
                  <X className="size-3.5" />
                  حذف مدل
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-start gap-2.5">
                <Label>رنگ</Label>
                <HexColorPicker
                  color={group.hexValue}
                  onChange={(hex) => updateGroup(index, { hexValue: hex })}
                />
                <div className="flex items-center gap-2">
                  <span
                    className="size-6 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: group.hexValue }}
                  />
                  <HexColorInput
                    color={group.hexValue}
                    onChange={(hex) => updateGroup(index, { hexValue: hex })}
                    prefixed
                    dir="ltr"
                    className="h-9 w-28 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`color-name-${group.key}`}>نام رنگ</Label>
                  <Input
                    id={`color-name-${group.key}`}
                    required
                    placeholder="مثلاً قرمز، سرمه‌ای، طوسی روشن"
                    value={group.name}
                    onChange={(e) =>
                      updateGroup(index, { name: e.target.value })
                    }
                    className="max-w-xs"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label>سایز و موجودی این رنگ</Label>

                  {sizes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      هنوز سایزی ساخته نشده — اولین سایز را پایین بسازید.
                    </p>
                  )}

                  <div className="flex flex-col gap-2.5">
                    {sizes.map((s) => {
                      const checked = s.id in group.variantStocks;
                      return (
                        <div key={s.id} className="flex items-center gap-3">
                          <label className="flex min-w-0 items-center gap-2.5 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                toggleGroupSize(index, s.id, e.target.checked)
                              }
                              className="size-4 shrink-0 rounded-sm border-input accent-foreground"
                            />
                            <span className="shrink-0 font-nums font-medium">
                              {s.name}
                            </span>
                            {s.description && (
                              <span className="min-w-0 truncate text-xs text-muted-foreground">
                                {s.description}
                              </span>
                            )}
                          </label>
                          {checked && (
                            <Input
                              type="number"
                              dir="ltr"
                              min={0}
                              value={group.variantStocks[s.id]}
                              onChange={(e) =>
                                updateGroupStock(
                                  index,
                                  s.id,
                                  Number(e.target.value),
                                )
                              }
                              className="h-8 w-16 shrink-0 px-1 text-center appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>عکس‌های این رنگ</Label>
                  <MultiImageUploader
                    images={group.images}
                    onChange={(images) => updateGroup(index, { images })}
                    uploadAction={uploadProductImage}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {newSizeOpen ? (
          <div className="flex flex-col gap-3 rounded-md border border-dashed border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                autoFocus
                placeholder="نام سایز — مثلاً M یا 42"
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
              />
              <Input
                placeholder="توضیح/ابعاد (اختیاری)"
                value={newSizeDesc}
                onChange={(e) => setNewSizeDesc(e.target.value)}
              />
            </div>
            {newSizeError && (
              <p className="text-xs text-destructive">{newSizeError}</p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAddSize}
                disabled={newSizeLoading || !newSizeName.trim()}
              >
                {newSizeLoading ? "در حال ساخت..." : "افزودن سایز"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setNewSizeOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNewSizeOpen(true)}
            className="flex items-center gap-1.5 self-start text-sm text-accent-2 transition-colors hover:underline"
          >
            <Plus className="size-3.5" />
            افزودن سایز جدید (برای همه رنگ‌ها)
          </button>
        )}

        <button
          type="button"
          onClick={addColorGroup}
          className="flex items-center justify-center gap-1.5 self-start rounded-md border border-dashed border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:border-foreground/40 hover:bg-secondary"
        >
          <Plus className="size-4" />
          افزودن مدل
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={loading}>
          {loading
            ? "در حال ذخیره..."
            : isEdit
              ? "ذخیره تغییرات"
              : "ساخت محصول"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          انصراف
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
