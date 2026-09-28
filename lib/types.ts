export type CategoryDTO = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
};

export type ColorDTO = {
  id: string;
  name: string;
  hexValue: string | null;
  sortOrder: number;
};

export type SizeDTO = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type ProductImageDTO = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  colorId: string | null;
};

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  materialCare?: string | null;
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  inStock: boolean;
  category: CategoryDTO;
  images: ProductImageDTO[];
  colors: ColorDTO[];
  /** Average of approved reviews (null when there are none). Storefront queries only. */
  rating?: number | null;
  reviewCount?: number;
};

export type ProductVariantDTO = {
  id: string;
  sizeId: string | null;
  size: SizeDTO | null;
  colorId: string | null;
  color: ColorDTO | null;
  stock: number;
};

export type ProductDetailDTO = ProductDTO & {
  colors: ColorDTO[];
  variants: ProductVariantDTO[];
};
