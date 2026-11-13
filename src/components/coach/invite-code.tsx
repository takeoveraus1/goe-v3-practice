"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(kind: "code" | "link") {
    const text = kind === "code" ? code : `${window.location.origin}/register?code=${code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the code is still visible to copy by hand.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-3 py-1.5 font-mono text-lg font-semibold tracking-[0.2em]">
        {code}
      </span>
      <Button variant="secondary" size="sm" onClick={() => copy("code")}>
        {copied === "code" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied === "code" ? "Copied" : "Copy code"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => copy("link")}>
        {copied === "link" ? "Link copied" : "Copy sign-up link"}
      </Button>
    </div>
  );
}
