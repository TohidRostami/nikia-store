"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { ProductPlaceholder } from "@/components/shared/product-placeholder";
import { TransitionLink } from "@/components/shared/transition-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPersianDigits } from "@/lib/format";

/** A snapshot of what was just added — kept separate from the live selection so the dialog doesn't change while it animates closed. */
export type AddedToCartItem = {
  name: string;
  image: string | null;
  categorySlug: string;
  color: string | null;
  size: string | null;
  quantity: number;
  /** The customer asked for more than the stock allows, so fewer were added. */
  limited: boolean;
};

/** "Added to cart" — continue shopping, or go to the cart? */
export function AddedToCartDialog({
  item,
  open,
  onOpenChange,
}: {
  item: AddedToCartItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            به سبد خرید اضافه شد
          </DialogTitle>
          <DialogDescription>می‌خواهید به خرید ادامه دهید یا به سبد خرید بروید؟</DialogDescription>
        </DialogHeader>

        {item && (
          <div className="flex items-center gap-3.5 rounded-md bg-sand p-3">
            <div className="relative h-[72px] w-14 shrink-0 overflow-hidden rounded-sm bg-white">
              {item.image ? (
                <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <ProductPlaceholder categorySlug={item.categorySlug} />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {[
                  item.color && `رنگ: ${item.color}`,
                  item.size && `سایز: ${toPersianDigits(item.size)}`,
                  `${toPersianDigits(item.quantity)} عدد`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          </div>
        )}
        {item?.limited && (
          <p role="status" className="-mt-2 text-xs text-sale">
            به‌دلیل محدودیت موجودی، {toPersianDigits(item.quantity)} عدد اضافه شد.
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg" className="sm:flex-1">
              ادامه خرید
            </Button>
          </DialogClose>
          <Button asChild size="lg" className="sm:flex-1">
            <TransitionLink href="/cart">مشاهده سبد خرید</TransitionLink>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
