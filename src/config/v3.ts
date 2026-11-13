/**
 * GOE Platform – Version 3 Practice.
 *
 * A simpler take on player development: no identity score, no weights, no
 * fixed sub-attribute list. Just the training block, its dates and review
 * points, up to four open-ended categories with a weekly trend, the athlete's
 * current context, two goals with step-by-step actions, and an anticipated
 * road map.
 */

export const V3_NAME = "GOE Platform";
export const V3_VERSION_LABEL = "Version 3 Practice";
export const V3_FULL_LABEL = `${V3_NAME} · ${V3_VERSION_LABEL}`;
export const V3_SHORT_LABEL = "V3 Practice";

/** Open-ended categories the athlete is working on in a block. */
export const V3_MAX_CATEGORIES = 4;
export const V3_MAX_REVIEW_POINTS = 4;
export const V3_MAX_STEPS = 8;
export const V3_MAX_MILESTONES = 8;
/** Longest block allowed, in weeks. */
export const V3_BLOCK_MAX_WEEKS = 26;

/** Archetypes are labels only in V3 – nothing is weighted or scored against them. */
export const V3_ARCHETYPE_GROUPS = [
  {
    position: "guard",
    label: "Guard",
    archetypes: [
      { key: "playmaking_guard", name: "Playmaking Guard" },
      { key: "combo_guard", name: "Combo Guard" },
      { key: "scoring_guard", name: "Scoring Guard" },
      { key: "floor_general", name: "Floor General" },
      { key: "defensive_guard", name: "Defensive Guard" },
    ],
  },
  {
    position: "wing",
    label: "Wing",
    archetypes: [
      { key: "two_way_wing", name: "Two-Way Wing" },
      { key: "shot_creator", name: "Shot Creator" },
      { key: "slasher", name: "Slasher" },
      { key: "three_and_d_wing", name: "3-and-D Wing" },
    ],
  },
  {
    position: "big",
    label: "Big",
    archetypes: [
      { key: "stretch_big", name: "Stretch Big" },
      { key: "rim_protector", name: "Rim Protector" },
      { key: "interior_finisher", name: "Interior Finisher" },
      { key: "mobile_big", name: "Mobile Big" },
    ],
  },
] as const;

const ARCHETYPE_NAMES: ReadonlyMap<string, string> = new Map(V3_ARCHETYPE_GROUPS.flatMap((g) => g.archetypes.map((a) => [a.key, a.name] as const)));

export function v3ArchetypeName(key: string | null | undefined): string | null {
  return key ? (ARCHETYPE_NAMES.get(key) ?? null) : null;
}

export function isV3Archetype(key: string): boolean {
  return ARCHETYPE_NAMES.has(key);
}

/** Where the athlete is at right now. More than one can apply (e.g. in season + coming back from injury). */
export const V3_CONTEXTS = [
  { key: "off_season", name: "Off-season" },
  { key: "pre_season", name: "Pre-season" },
  { key: "in_season", name: "In season" },
  { key: "trials_lead_up", name: "Lead-up to trials" },
  { key: "finals", name: "Finals" },
  { key: "injury_return", name: "Coming back from injury" },
  { key: "managing_load", name: "Managing a niggle / load" },
  { key: "break", name: "Break / recovery" },
] as const;
export type V3ContextKey = (typeof V3_CONTEXTS)[number]["key"];

const CONTEXT_KEYS: ReadonlySet<string> = new Set(V3_CONTEXTS.map((c) => c.key));

export function isV3Context(key: string): key is V3ContextKey {
  return CONTEXT_KEYS.has(key);
}

export function v3ContextName(key: string): string {
  return V3_CONTEXTS.find((c) => c.key === key)?.name ?? key;
}

/** The weekly check-in: how each category is trending. */
export const V3_TRENDS = [
  { key: "up", name: "Trending up", short: "Up" },
  { key: "same", name: "Staying the same", short: "Same" },
  { key: "down", name: "Trending down", short: "Down" },
] as const;
export type V3Trend = (typeof V3_TRENDS)[number]["key"];

export function v3TrendName(key: V3Trend): string {
  return V3_TRENDS.find((t) => t.key === key)?.name ?? key;
}

/** Two goals at most: the most pressing one, and the longer-term one. */
export const V3_GOAL_HORIZONS = [
  { key: "pressing", name: "Most pressing", hint: "The one thing that matters most right now." },
  { key: "long_term", name: "Longer term", hint: "Where this is all heading." },
] as const;
export type V3GoalHorizon = (typeof V3_GOAL_HORIZONS)[number]["key"];

/** Review points suggested when a new block is set up. */
export const V3_DEFAULT_REVIEW_LABELS = { mid: "Mid-block review", end: "End-of-block review" } as const;
