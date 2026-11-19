/**
 * Demo plans for the demo athletes. Dates are relative to "today" so the demo
 * always looks live.
 *
 *   Jordan – pre-season block, week 3 check-in open, next block lined up, full road map.
 *   Mia    – coming back from an ankle injury; week 3 checked in, waiting for feedback.
 *   Tom    – nothing set up yet, to show the empty starting point.
 */
import { eq, inArray } from "drizzle-orm";
import type { V3Trend } from "../config/v3";
import { addDays } from "../lib/dates";
import { db } from "./index";
import { users, v3Blocks, v3Categories, v3CheckIns, v3CheckInTrends, v3Goals, v3GoalSteps, v3Milestones, v3Profiles, type V3ReviewPoint } from "./schema";

const at = (iso: string, hour = 9) => Date.parse(`${iso}T${String(hour).padStart(2, "0")}:00:00Z`);

/** Player Roadmap for the demo athletes: where they're aiming to be in about three years. */
function demoAims(today: string) {
  const year = Number(today.slice(0, 4)) + 3;
  return {
    "jordan@goe.test": { aimTeam: "A US college program (NCAA Division 1)", aimRole: "Starting point guard", aimYear: year },
    "mia@goe.test": { aimTeam: "Australian U20 women's national team", aimRole: "Starting wing and lockdown defender", aimYear: year },
  } as const;
}

/**
 * Adds the roadmap aim to demo athletes who don't have one yet (demo data loaded
 * before the Player Roadmap existed). Only touches the demo accounts, and never
 * overwrites an aim someone has set. Returns how many were updated.
 */
export async function topUpDemoRoadmaps(today: string): Promise<number> {
  let updated = 0;
  for (const [email, aim] of Object.entries(demoAims(today))) {
    const user = await db.query.users.findFirst({ columns: { id: true }, where: eq(users.email, email) });
    if (!user) continue;
    const profile = await db.query.v3Profiles.findFirst({ where: eq(v3Profiles.athleteId, user.id) });
    if (!profile || profile.aimTeam || profile.aimRole) continue;
    await db.update(v3Profiles).set(aim).where(eq(v3Profiles.athleteId, user.id));
    updated++;
  }
  return updated;
}

/** Deletes every plan row. */
export async function wipePlans() {
  await db.delete(v3CheckInTrends);
  await db.delete(v3CheckIns);
  await db.delete(v3Categories);
  await db.delete(v3Blocks);
  await db.delete(v3GoalSteps);
  await db.delete(v3Goals);
  await db.delete(v3Milestones);
  await db.delete(v3Profiles);
}

async function block(opts: {
  athleteId: string;
  name: string;
  startDate: string;
  endDate: string;
  reviewPoints: V3ReviewPoint[];
  categories: Array<[name: string, detail: string]>;
  notes?: string;
}) {
  const id = crypto.randomUUID();
  await db.insert(v3Blocks).values({
    id,
    athleteId: opts.athleteId,
    name: opts.name,
    startDate: opts.startDate,
    endDate: opts.endDate,
    reviewPoints: opts.reviewPoints,
    notes: opts.notes ?? null,
    createdBy: opts.athleteId,
    createdAt: at(addDays(opts.startDate, -3)),
  });
  const categoryIds = opts.categories.map(() => crypto.randomUUID());
  await db.insert(v3Categories).values(opts.categories.map(([name, detail], position) => ({ id: categoryIds[position], blockId: id, position, name, detail })));
  return { id, categoryIds };
}

async function checkIn(opts: {
  athleteId: string;
  blockId: string;
  categoryIds: string[];
  week: number;
  date: string;
  notes: string;
  trends: Array<[V3Trend, string | null]>;
  feedback?: string;
}) {
  const id = crypto.randomUUID();
  await db.insert(v3CheckIns).values({
    id,
    athleteId: opts.athleteId,
    blockId: opts.blockId,
    weekNumber: opts.week,
    date: opts.date,
    notes: opts.notes,
    coachFeedback: opts.feedback ?? null,
    coachFeedbackAt: opts.feedback ? at(opts.date, 21) : null,
    createdAt: at(opts.date, 19),
  });
  await db.insert(v3CheckInTrends).values(opts.trends.map(([trend, note], i) => ({ checkInId: id, categoryId: opts.categoryIds[i], trend, note })));
}

async function goal(athleteId: string, horizon: "pressing" | "long_term", title: string, detail: string | null, targetDate: string, steps: Array<[string, string | null]>) {
  const id = crypto.randomUUID();
  await db.insert(v3Goals).values({ id, athleteId, horizon, title, detail, targetDate });
  await db.insert(v3GoalSteps).values(steps.map(([text, doneOn], position) => ({ goalId: id, position, text, doneAt: doneOn ? at(doneOn, 18) : null })));
}

/** Loads the demo plans for whichever demo athletes exist. Returns false if none do. */
export async function seedDemoPlans(today: string): Promise<boolean> {
  const daysAgo = (n: number) => addDays(today, -n);
  const inDays = (n: number) => addDays(today, n);
  const demo = await db.query.users.findMany({
    columns: { id: true, email: true },
    where: inArray(users.email, ["jordan@goe.test", "mia@goe.test"]),
  });
  const idOf = (email: string) => demo.find((u) => u.email === email)?.id;

  // ── Jordan ───────────────────────────────────────────────────────────────
  const jordan = idOf("jordan@goe.test");
  if (jordan) {
    await db.insert(v3Profiles).values({
      athleteId: jordan,
      primaryArchetype: "combo_guard",
      secondaryArchetype: "floor_general",
      contexts: ["pre_season", "trials_lead_up"],
      contextNote: "NBL1 East pre-season is underway. State U20 trials are the first big date on the road map.",
      ...demoAims(today)["jordan@goe.test"],
      updatedAt: at(daysAgo(17)),
      updatedBy: jordan,
    });

    // Off-season base – finished.
    const offStart = daysAgo(58);
    const off = await block({
      athleteId: jordan,
      name: "Off-season base",
      startDate: offStart,
      endDate: addDays(offStart, 41),
      reviewPoints: [
        { date: addDays(offStart, 20), label: "Mid-block review" },
        { date: addDays(offStart, 41), label: "End-of-block review" },
      ],
      categories: [
        ["Left-hand finishing", "Both feet, both hands, every rep. Track makes in the Mikan series."],
        ["Conditioning base", "Three runs a week. 2 km under 7:30 by the end."],
        ["Pull-up consistency", "Balance on the hop, same release every time."],
      ],
    });
    const offWeeks: Array<[V3Trend, V3Trend, V3Trend]> = [
      ["same", "up", "same"],
      ["up", "up", "same"],
      ["up", "same", "down"],
      ["up", "up", "up"],
      ["same", "up", "up"],
      ["up", "up", "same"],
    ];
    for (const [i, trends] of offWeeks.entries()) {
      await checkIn({
        athleteId: jordan,
        blockId: off.id,
        categoryIds: off.categoryIds,
        week: i + 1,
        date: addDays(offStart, i * 7 + 6),
        notes: ["Getting back into it.", "Legs feel better.", "Pull-up felt off all week – tired.", "Best week so far.", "Steady.", "Finished strong. 2 km in 7:24."][i],
        trends: trends.map((t) => [t, null]),
        feedback: i === 2 ? "Fatigue shows up in the pull-up first. Do your shooting before conditioning next week." : undefined,
      });
    }

    // Pre-season – current, week 3 open.
    const preStart = daysAgo(16);
    const pre = await block({
      athleteId: jordan,
      name: "Pre-season: run the team",
      startDate: preStart,
      endDate: addDays(preStart, 27),
      reviewPoints: [
        { date: addDays(preStart, 13), label: "Mid-block review" },
        { date: addDays(preStart, 27), label: "End-of-block review" },
      ],
      categories: [
        ["Ball security under pressure", "Zero turnovers against full-court pressure. Eyes up, pound dribble."],
        ["Communication – calling every screen", "Early and loud. Be the voice on defence."],
        ["Catch & shoot rhythm", "Feet set before the catch. Track makes out of 100 in the 5-spot test."],
        ["Conditioning for 30+ minutes", "Legs still under me in the fourth quarter."],
      ],
      notes: "Coach's brief: take care of the ball and run the team. Scoring comes second this block.",
    });
    await checkIn({
      athleteId: jordan,
      blockId: pre.id,
      categoryIds: pre.categoryIds,
      week: 1,
      date: addDays(preStart, 6),
      notes: "Settling in. New pressure drills are hard – good hard.",
      trends: [
        ["up", "Two-ball routine three times without losing it"],
        ["same", "Called most screens in shell, missed some late"],
        ["up", "54/100 in the 5-spot test"],
        ["same", null],
      ],
      feedback: "Good start. On the late calls – say it before the screener gets there, not when they arrive.",
    });
    await checkIn({
      athleteId: jordan,
      blockId: pre.id,
      categoryIds: pre.categoryIds,
      week: 2,
      date: addDays(preStart, 13),
      notes: "Best week of the block. Coach said my voice was the difference on Saturday.",
      trends: [
        ["up", "No turnovers against full-court pressure on Tuesday"],
        ["up", "Called every ball screen in the game"],
        ["same", "56/100 – flat"],
        ["down", "Faded in the last 8 minutes on Saturday"],
      ],
    });

    // Lead-up to trials – next.
    const trialsStart = addDays(preStart, 28);
    await block({
      athleteId: jordan,
      name: "Lead-up to trials",
      startDate: trialsStart,
      endDate: addDays(trialsStart, 41),
      reviewPoints: [
        { date: addDays(trialsStart, 20), label: "Mid-block review" },
        { date: addDays(trialsStart, 41), label: "Pre-trials review" },
      ],
      categories: [
        ["Pick & roll reads", "Hit the roller or the skip – make the second defender commit."],
        ["Defensive pressure on the ball", "Pick up full court for a whole quarter."],
        ["Shot selection late in games", "Last 5 minutes: only shots I'd take in the first 5."],
      ],
    });

    await goal(jordan, "pressing", "Earn a starting spot in the NBL1 East rotation by round 1", "Coach wants a guard who takes care of the ball and talks. That's the gap.", inDays(130), [
      ["Zero turnovers vs full-court press in 3 straight sessions", daysAgo(5)],
      ["Call every ball screen in the Tuesday shell drill", daysAgo(9)],
      ["Weekly film with Sam – 2 good and 2 bad decisions", null],
      ["Hit 60/100 in the 5-spot catch-and-shoot test", null],
      ["Play 30+ minutes in the last pre-season game without fading", null],
    ]);
    await goal(jordan, "long_term", "Earn a college roster spot for the 2027 season", "US college or a strong pathway program.", inDays(290), [
      ["Build a highlight reel from NBL1 games (10 clips)", null],
      ["Shortlist 15 programs that fit my game and grades", daysAgo(30)],
      ["Email 5 coaches with my reel and schedule", null],
      ["Book and sit the SAT", null],
      ["Attend a showcase camp", null],
    ]);
    await db.insert(v3Milestones).values([
      { athleteId: jordan, date: inDays(86), title: "State U20 trials", detail: "Two-day selection camp" },
      { athleteId: jordan, date: inDays(130), title: "NBL1 East – round 1", detail: null },
      { athleteId: jordan, date: inDays(200), title: "College showcase camp", detail: "Coaches from 30+ programs" },
      { athleteId: jordan, date: inDays(300), title: "Decide on 2027 offers", detail: null },
    ]);
  }

  // ── Mia ──────────────────────────────────────────────────────────────────
  const mia = idOf("mia@goe.test");
  if (mia) {
    await db.insert(v3Profiles).values({
      athleteId: mia,
      primaryArchetype: "three_and_d_wing",
      secondaryArchetype: "two_way_wing",
      contexts: ["injury_return", "pre_season"],
      contextNote: "Rolled my left ankle five weeks ago. Cleared for full contact – building back trust in it.",
      ...demoAims(today)["mia@goe.test"],
      updatedAt: at(daysAgo(21)),
      updatedBy: mia,
    });
    const rtpStart = daysAgo(20);
    const rtp = await block({
      athleteId: mia,
      name: "Return to play",
      startDate: rtpStart,
      endDate: addDays(rtpStart, 27),
      reviewPoints: [
        { date: addDays(rtpStart, 10), label: "Physio check" },
        { date: addDays(rtpStart, 13), label: "Mid-block review" },
        { date: addDays(rtpStart, 27), label: "End-of-block review" },
      ],
      categories: [
        ["Ankle strength & landing", "Single-leg hops and landings with the physio program, 4× a week."],
        ["Attacking closeouts", "One hard dribble, get two feet in the paint."],
        ["On-ball defence confidence", "Trust the ankle when I slide – no protecting it."],
      ],
    });
    const miaWeeks: Array<{ notes: string; trends: Array<[V3Trend, string | null]>; feedback?: string }> = [
      {
        notes: "First week back with the team. Nervous on cuts.",
        trends: [
          ["up", "Hop test 80% of the right side"],
          ["same", "Didn't attack much – hesitant"],
          ["down", "Kept protecting the ankle in slides"],
        ],
        feedback: "Totally normal. We'll build slides back slowly – half-court only this week.",
      },
      {
        notes: "Physio happy. Got downhill twice in the scrimmage.",
        trends: [
          ["up", "Hop test 90%"],
          ["up", "Two drives, one and-one"],
          ["same", null],
        ],
        feedback: "Big week. Keep stacking the landing work even on game days.",
      },
      {
        notes: "Forgot about the ankle for most of Thursday's session. That's a first.",
        trends: [
          ["same", "Kept up the program, 4/4 sessions"],
          ["up", "Scored 9 off closeouts in the practice game"],
          ["up", "Guarded their best wing for a quarter"],
        ],
      },
    ];
    for (const [i, w] of miaWeeks.entries()) {
      await checkIn({
        athleteId: mia,
        blockId: rtp.id,
        categoryIds: rtp.categoryIds,
        week: i + 1,
        date: i === 2 ? daysAgo(1) : addDays(rtpStart, i * 7 + 6),
        notes: w.notes,
        trends: w.trends,
        feedback: w.feedback,
      });
    }
    const champStart = addDays(rtpStart, 28);
    await block({
      athleteId: mia,
      name: "U18 Championship lead-up",
      startDate: champStart,
      endDate: addDays(champStart, 34),
      reviewPoints: [{ date: addDays(champStart, 34), label: "End-of-block review" }],
      categories: [
        ["Catch & shoot from the corners", "Feet set, same release. 40% in game-speed drills."],
        ["Taking the toughest matchup", "Ask for their best wing every game."],
        ["Ankle maintenance", "Keep the physio program going 3× a week."],
      ],
    });
    await goal(mia, "pressing", "Back to full minutes by the first U18 Championship game", "Without thinking about the ankle.", inDays(45), [
      ["Physio sign-off on single-leg hop tests", daysAgo(10)],
      ["Back to full-contact training 3× a week", daysAgo(6)],
      ["20 minutes in a practice game, no pain the next morning", null],
      ["Full minutes in the last scrimmage before the championship", null],
    ]);
    await goal(mia, "long_term", "Make the U18 national squad", null, inDays(250), [
      ["Get back to my pre-injury defensive level", null],
      ["Shoot 38% from three in championship games", null],
      ["Make the state team for nationals", null],
    ]);
    await db.insert(v3Milestones).values([
      { athleteId: mia, date: inDays(45), title: "U18 Championship – game 1", detail: null },
      { athleteId: mia, date: inDays(120), title: "State team selection", detail: null },
      { athleteId: mia, date: inDays(240), title: "U18 Nationals", detail: null },
    ]);
  }

  return Boolean(jordan || mia);
}

