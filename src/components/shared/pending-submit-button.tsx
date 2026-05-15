"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "type"
> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
  showSpinner?: boolean;
};

export function PendingSubmitButton({
  children,
  pendingLabel,
  showSpinner = true,
  disabled,
  className,
  onClick,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [wasPressed, setWasPressed] = useState(false);

  useEffect(() => {
    if (!pending) {
      setWasPressed(false);
    }
  }, [pending]);

  const isActive = pending && wasPressed;

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={isActive}
      className={cn(isActive ? "cursor-wait" : undefined, className)}
      onClick={(event) => {
        setWasPressed(true);
        onClick?.(event);
      }}
      {...props}
    >
      {isActive && showSpinner ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      <span>{isActive ? pendingLabel ?? children : children}</span>
    </Button>
  );
}
