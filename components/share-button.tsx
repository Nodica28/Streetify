"use client";

import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  address: string;
  slug: string;
}

export function ShareButton({ address, slug }: Props) {
  const [copied, setCopied] = React.useState(false);

  const url = typeof window === "undefined" ? "" : `${window.location.origin}/a/${slug}`;
  const title = `Streetify — ${address}`;
  const text = `The neighborhood story of ${address}, told in three scores.`;

  async function handleClick() {
    const shareUrl = url || `/a/${slug}`;
    const canShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      /Mobi|Android|iPhone/.test(navigator.userAgent);

    if (canShare) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied", { description: "Paste it anywhere — it'll open to the same page." });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Couldn't copy — long-press and share the URL from your address bar.");
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant="signal"
      size="lg"
      className="w-full justify-center gap-2"
      data-testid="share-button"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Copied" : "Share this address"}
      <Copy className="ml-1 h-3.5 w-3.5 opacity-70" />
    </Button>
  );
}
