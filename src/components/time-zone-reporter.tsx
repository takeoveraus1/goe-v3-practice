"use client";

import { useEffect } from "react";

const COOKIE = "goe_tz";

/**
 * Tells the server the browser's time zone so "today" (check-ins, schedule, block
 * progress) matches the athlete's calendar. Refreshes once if the zone changed.
 */
export function TimeZoneReporter() {
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return;
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE}=`))
      ?.split("=")[1];
    let decoded: string | undefined;
    try {
      decoded = current ? decodeURIComponent(current) : undefined;
    } catch {
      decoded = undefined;
    }
    if (decoded === zone) return;
    document.cookie = `${COOKIE}=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`;
    if (current !== undefined) window.location.reload();
  }, []);
  return null;
}
