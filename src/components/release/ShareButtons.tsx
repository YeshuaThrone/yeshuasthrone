"use client";

import { useState } from "react";

interface ShareButtonsProps {
  /** Share text, e.g. "CHAMPION — Yeshua Throne". */
  text: string;
}

/** Intent URLs are pure so they can be tested without a browser. */
export function shareIntents(text: string, url: string) {
  return {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  };
}

type CopyState = "idle" | "copied" | "failed";

const COPY_LABEL: Record<CopyState, string> = {
  idle: "Copy link",
  copied: "Link copied",
  failed: "Copy failed",
};

/**
 * Copy link + X + WhatsApp. The page URL is read from the browser on click
 * so no canonical-domain env var is needed before a domain exists.
 */
export function ShareButtons({ text }: ShareButtonsProps) {
  const [copied, setCopied] = useState<CopyState>("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied("copied");
    } catch {
      // Clipboard blocked (insecure context / permissions): say so, no silent no-op.
      setCopied("failed");
    }
  };

  const open = (kind: "x" | "whatsapp") => {
    window.open(shareIntents(text, window.location.href)[kind], "_blank", "noopener,noreferrer");
  };

  const chip =
    "inline-flex items-center rounded-full border border-text/15 px-4 py-2 text-sm font-medium transition-colors hover:border-electric-2 hover:text-electric-2";

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share">
      <button type="button" onClick={copy} className={chip}>
        {COPY_LABEL[copied]}
      </button>
      <button type="button" onClick={() => open("x")} className={chip}>
        Share on X
      </button>
      <button type="button" onClick={() => open("whatsapp")} className={chip}>
        WhatsApp
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied === "copied" ? "Link copied to clipboard" : copied === "failed" ? "Could not copy the link" : ""}
      </span>
    </div>
  );
}
