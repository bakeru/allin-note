"use client";

import * as React from "react";
import { Toaster as Sonner, toast } from "sonner";

import { cn } from "@/lib/utils";

function Toaster({
  className,
  ...props
}: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      data-slot="toaster"
      className={cn("toaster group", className)}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
