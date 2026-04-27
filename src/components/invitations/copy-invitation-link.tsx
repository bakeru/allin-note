"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyInvitationLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? "コピーしました" : "リンクをコピー"}
    </Button>
  );
}
