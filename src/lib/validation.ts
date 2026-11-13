import { z } from "zod";
import { isIsoDate } from "./dates";

/** Optional free text: trimmed, empty → null. */
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : null));

export const isoDate = z.string().refine(isIsoDate, "Choose a valid date.");

export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.");

/** Integer form field within [min, max]. */
export const intInRange = (min: number, max: number, label = "Value") =>
  z.coerce
    .number({ message: `${label} is required.` })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} must be at least ${min}.`)
    .max(max, `${label} must be at most ${max}.`);

/** Optional integer field: empty → null. */
export const optionalInt = (min: number, max: number, label = "Value") =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    intInRange(min, max, label).nullable().default(null),
  );

export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => {
    if (!v) return true;
    try {
      const url = new URL(v);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a full link starting with https://");
