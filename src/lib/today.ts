import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_TIMEZONE } from "@/config/app";
import { todayIn } from "./dates";

export const TIMEZONE_COOKIE = "goe_tz";

/** The viewer's time zone (reported by their browser), falling back to APP_TIMEZONE, then DEFAULT_TIMEZONE. */
export async function viewerTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  let fromBrowser: string | undefined;
  try {
    const raw = cookieStore.get(TIMEZONE_COOKIE)?.value;
    fromBrowser = raw ? decodeURIComponent(raw) : undefined;
  } catch {
    // Malformed cookie – fall back to the default zone.
  }
  // todayIn() also falls back to UTC for anything that isn't a real IANA zone.
  return fromBrowser || process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;
}

/** Today's date (YYYY-MM-DD) for the person viewing the page. */
export async function today(): Promise<string> {
  return todayIn(await viewerTimeZone());
}
