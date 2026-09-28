"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteMessage, setMessageRead } from "@/app/admin/messages/actions";

export function MessageActions({ id, isRead }: { id: string; isRead: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setMessageRead(id, !isRead);
            router.refresh();
          })
        }
      >
        {isRead ? "علامت‌گذاری نخوانده" : "خوانده شد"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        className="text-destructive"
        onClick={() => {
          if (!confirm("این پیام حذف شود؟")) return;
          startTransition(async () => {
            await deleteMessage(id);
            router.refresh();
          });
        }}
      >
        حذف
      </Button>
    </div>
  );
}
