"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminNav } from "@/components/admin/admin-nav";

export function AdminMobileHeader({ role }: { role?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-start border-b border-border bg-background px-4 py-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="باز کردن منوی مدیریت">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 border-none bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>منوی مدیریت</SheetTitle>
          </SheetHeader>
          <AdminNav onNavigate={() => setOpen(false)} role={role} />
        </SheetContent>
      </Sheet>
      <span className="text-sm font-medium">پنل مدیریت نیکیا</span>
    </div>
  );
}
