import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** GOE Platform – Version 3 Practice. */

const V3_LABEL = "GOE Platform · Version 3 Practice";
const v3Login = login;

test("the app is clearly labelled and the dashboard is stacked in the agreed order @mobile", async ({ page }) => {
  await login(page, "jordan@goe.test");
  await expect(page).toHaveURL(/\/athlete$/);
  await expect(page).toHaveTitle(/GOE V3 Practice/);
  await expect(page.getByText(V3_LABEL)).toBeVisible();
  await expect(page.getByRole("img", { name: "G.O.E Next Level" }).first()).toBeVisible();
  // Identity & Archetype → Training Block → Player Roadmap → Action Steps, one under the other.
  await expect(page.locator("main h2")).toHaveText(["Identity & Archetype", "Training Block", "Player Roadmap", "Action Steps"]);
  await expect(page.getByText("Combo Guard").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pre-season: run the team" })).toBeVisible();
  // Each focus area rated week by week.
  await expect(page.getByRole("rowheader", { name: "Ball security under pressure" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Week 1" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Ball security under pressure, week 2: Trending up" })).toBeVisible();
  // Where Jordan is aiming to be in ~3 years.
  await expect(page.getByText("Starting point guard")).toBeVisible();
  await expect(page.getByText("A US college program (NCAA Division 1)").first()).toBeVisible();
  await expect(page.getByText("Earn a starting spot in the NBL1 East rotation by round 1").first()).toBeVisible();
});

test("a new athlete signs up and joins their coach with the invite code", async ({ page }) => {
  await page.goto("/register");
  await page.getByText("I'm an athlete").click();
  await page.getByLabel("Full name").fill("Riley Park");
  await page.getByLabel("Email").fill(`riley-${Date.now()}@goe.test`);
  await page.getByLabel("Password").fill("a-good-password");
  await page.getByRole("button", { name: /Create account/ }).click();
  await expect(page).toHaveURL(/\/athlete$/);
  await expect(page.getByRole("heading", { name: "Hey Riley" })).toBeVisible();
  await expect(page.getByText("Set up the plan in this order")).toBeVisible();

  await page.getByLabel("Coach invite code").fill("goedemo");
  await page.getByRole("button", { name: "Link coach" }).click();
  await expect(page.getByText("You're now linked with your coach.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Coach invite code")).toHaveCount(0);
});

test("athlete's weekly check-in rates every focus area and has a journal", async ({ page }) => {
  await v3Login(page, "jordan@goe.test");
  await page.goto("/athlete/check-ins/new");
  await expect(page.getByRole("heading", { name: "Week 3 check-in" })).toBeVisible();

  await expect(page.getByLabel("What happened? (optional)")).toHaveCount(0);
  await page.getByLabel("Journal").fill("Zero turnovers against the press on Tuesday");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByText("Rate every focus area for the week.")).toBeVisible();
  await expect(page.getByLabel("Journal")).toHaveValue("Zero turnovers against the press on Tuesday");

  for (const radio of await page.getByRole("radio", { name: "Trending up" }).all()) await radio.check({ force: true });
  await page.getByRole("button", { name: "Save check-in" }).click();

  await expect(page).toHaveURL(/\/athlete\/check-ins\?saved=3/);
  await expect(page.getByText("Week 3 check-in saved.")).toBeVisible();
  await expect(page.getByText("Zero turnovers against the press on Tuesday")).toBeVisible();

  // The new ratings show on the dashboard's week-by-week grid.
  await page.goto("/athlete");
  await expect(page.getByRole("img", { name: "Catch & shoot rhythm, week 3: Trending up" })).toBeVisible();
});

test("athlete ticks off an action step on the dashboard, and editing the steps keeps the tick", async ({ page }) => {
  await v3Login(page, "jordan@goe.test");
  const step = page.getByRole("checkbox", { name: /Step 3: Weekly film with Sam/ });
  await expect(step).toHaveAttribute("aria-checked", "false");
  await step.click();
  await expect(page.getByText("3/5 done")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Step 3: Weekly film with Sam/ })).toHaveAttribute("aria-checked", "true");

  await page.goto("/athlete/goals");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Save goals" }).click();
  await expect(page.getByText("Action Steps saved.")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Step 3: Weekly film with Sam/ })).toHaveAttribute("aria-checked", "true");
});

test("block dates can't overlap another block or run too long", async ({ page }) => {
  // The demo's current block runs through today.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());
  await v3Login(page, "jordan@goe.test");
  await page.goto("/athlete/blocks/new");
  await page.getByLabel("Block name").fill("Clashing block");
  await page.getByLabel("Starts").fill(today);
  await page.getByLabel("Finishes").fill(today);
  await page.getByRole("button", { name: "Create block" }).click();
  await expect(page.getByText(/Overlaps "Pre-season: run the team"/)).toBeVisible();

  await page.getByLabel("Starts").fill("2030-01-01");
  await page.getByLabel("Finishes").fill("2031-01-01");
  await page.getByRole("button", { name: "Create block" }).click();
  await expect(page.getByText("Keep a block to 26 weeks or less.")).toBeVisible();
  await expect(page).toHaveURL(/\/athlete\/blocks\/new/);
});

test("a new athlete sets up their whole plan from scratch", async ({ page }) => {
  await v3Login(page, "tom@goe.test");
  await expect(page.getByText("Set up the plan in this order")).toBeVisible();
  await expect(page.getByRole("link", { name: /Identity & Archetype\s*Do this next/ })).toBeVisible();

  // 1. Identity & Archetype.
  await page.goto("/athlete/profile");
  await page.getByLabel("Primary archetype").selectOption({ label: "Rim Protector" });
  await page.getByText("Off-season", { exact: true }).click();
  await page.getByText("Coming back from injury", { exact: true }).click();
  await page.getByLabel("Anything else about right now?").fill("Wrist is in a brace for two more weeks.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Identity & Archetype saved.")).toBeVisible();
  await expect(page.getByText("Rim Protector")).toBeVisible();
  await expect(page.getByText("Wrist is in a brace for two more weeks.")).toBeVisible();

  // 2. Training Block with four open-ended focus areas (the max).
  await expect(page.getByRole("link", { name: /Training Block\s*Do this next/ })).toBeVisible();
  await page.getByRole("link", { name: "New block" }).click();
  await page.getByLabel("Block name").fill("Off-season strength");
  const names = ["Vertical jump", "Left-hand hook", "Rim protection timing", "Footwork in the post"];
  for (const [i, name] of names.entries()) {
    if (i > 0) await page.getByRole("button", { name: "Add focus area" }).click();
    await page.getByLabel(`Focus area ${i + 1}`, { exact: true }).fill(name);
  }
  await expect(page.getByRole("button", { name: "4 is the max" })).toBeDisabled();
  await page.getByRole("button", { name: "Create block" }).click();
  await expect(page.getByText("Training block saved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Off-season strength" })).toBeVisible();
  await expect(page.getByText("Next review:", { exact: false })).toContainText("Mid-block review");
  await expect(page.getByText("Week 1 check-in is open", { exact: false })).toBeVisible();
  for (const name of names) await expect(page.getByRole("rowheader", { name })).toBeVisible();

  // 3. Player Roadmap: team, role and year, plus a milestone.
  await expect(page.getByRole("link", { name: /Player Roadmap\s*Do this next/ })).toBeVisible();
  await page.goto("/athlete/roadmap");
  await page.getByLabel("Team", { exact: true }).fill("Sydney Kings");
  await page.getByLabel("Role in that team").fill("Starting centre");
  await page.getByLabel("Milestone 1 date").fill("2027-03-01");
  await page.getByLabel("Milestone 1", { exact: true }).fill("U16 state trials");
  await page.getByRole("button", { name: "Save roadmap" }).click();
  await expect(page.getByText("Player Roadmap saved.")).toBeVisible();
  await expect(page.getByText("Sydney Kings")).toBeVisible();
  await expect(page.getByText("Starting centre")).toBeVisible();
  await expect(page.getByText("U16 state trials")).toBeVisible();

  // 4. Action Steps.
  await page.goto("/athlete/goals");
  await page.getByLabel("Goal", { exact: true }).first().fill("Make the U16 state team");
  await page.getByLabel("Step 1", { exact: true }).first().fill("Get the wrist cleared");
  await page.getByRole("button", { name: "Add step" }).first().click();
  await page.getByLabel("Step 2", { exact: true }).first().fill("Block 2 shots a game in scrimmages");
  await page.getByRole("button", { name: "Save goals" }).click();
  await expect(page.getByText("Action Steps saved.")).toBeVisible();
  await expect(page.getByText("Make the U16 state team").first()).toBeVisible();
  await expect(page.getByText("0/2 done")).toBeVisible();

  // Everything's set up, so the getting-started guide is gone.
  await expect(page.getByText("Set up the plan in this order")).toHaveCount(0);
});

test("coach sees review points and leaves feedback on a check-in", async ({ page }) => {
  await v3Login(page, "coach@goe.test");
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByText(V3_LABEL)).toBeVisible();
  await expect(page.getByText("GOEDEMO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review points coming up" })).toBeVisible();
  await expect(page.getByText("End-of-block review · Return to play")).toBeVisible();
  await expect(page.getByText("Starting wing and lockdown defender, Australian U20 women's national team", { exact: false })).toBeVisible();

  await page.getByRole("link", { name: /^Mia Chen Week 3/ }).click();
  await expect(page).toHaveURL(/\/coach\/athletes\/[^/]+\/check-ins$/);
  await expect(page.getByText("Forgot about the ankle for most of Thursday's session.", { exact: false })).toBeVisible();
  await page.getByLabel("Leave feedback").first().fill("That's the sign we wanted. Full scrimmage next week.");
  await page.getByRole("button", { name: "Send feedback" }).first().click();
  await expect(page.getByText("Feedback sent.")).toBeVisible();

  // The coach sees the athlete's dashboard in the same order, and can't submit check-ins.
  await page.getByRole("link", { name: "Dashboard", exact: true }).last().click();
  await expect(page.locator("main h2")).toHaveText(["Identity & Archetype", "Training Block", "Player Roadmap", "Action Steps"]);
  await expect(page.getByRole("link", { name: /Check in for week/ })).toHaveCount(0);
});

test("each role stays in its own area", async ({ page }) => {
  await v3Login(page, "jordan@goe.test");
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/athlete$/);
  const response = await page.goto("/athlete/blocks/not-a-real-block");
  expect(response?.status()).toBe(404);
});
