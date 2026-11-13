"use client";

import type { ComponentProps } from "react";
import { Button } from "./button";

export function SubmitButton({
  children,
  pending = false,
  pendingLabel,
  ...props
}: Omit<ComponentProps<typeof Button>, "type"> & { pending?: boolean; pendingLabel?: string }) {
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}
