"use client";

import { useState } from "react";

/**
 * Share + copy-link actions for an article. Uses the Web Share sheet when the
 * browser supports it, and falls back to copying the URL to the clipboard.
 */
export function ArticleShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed — fall through to copy
      }
    }
    copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — no-op
    }
  };

  return (
    <div className="share">
      <a role="button" tabIndex={0} onClick={share}>
        Share
      </a>
      <a role="button" tabIndex={0} onClick={copy}>
        {copied ? "Copied" : "Copy link"}
      </a>
    </div>
  );
}
