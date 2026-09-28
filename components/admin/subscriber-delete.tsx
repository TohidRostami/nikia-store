"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteSubscriber } from "@/app/admin/subscribers/actions";

export function SubscriberDelete({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      className="text-destructive"
      onClick={() =>
        startTransition(async () => {
          await deleteSubscriber(id);
          router.refresh();
        })
      }
    >
      حذف
    </Button>
  );
}
