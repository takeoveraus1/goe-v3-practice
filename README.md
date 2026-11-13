# GOE Platform – Version 3 Practice

A simpler take on GOE player development, built as its own app. It's separate from the main GOE platform: its own website, logins and database.

An athlete logs in and sees, on one page:

- **Archetype**: primary and optional secondary, as labels only. Nothing is weighted or scored against them.
- **Current context**: off-season, pre-season, in season, lead-up to trials, finals, coming back from injury and so on. More than one can apply, plus a note.
- **Training block**: start and finish dates, which week of the block it is, and **review points**. A mid-block and an end-of-block review are suggested, and up to 4 can be set. Blocks run one after another, and every past, current and upcoming block is listed.
- **What I'm working on**: up to **4 open-ended categories** per block, with no fixed list, each with its week-by-week trend.
- **Weekly check-in**: one per block week. Each category is **trending up / staying the same / trending down**, with an optional note, and the coach can reply on each check-in.
- **Goals**: two at most, the **most pressing** one and the **longer-term** one, each with an optional target date and **step-by-step action steps** that tick off from the plan.
- **Road map**: dated milestones such as trials or the season start, on one timeline with block dates, review points and goal dates.

Coaches share an invite code. Athletes enter it when they sign up, or later on their plan page. The coach then sees every athlete's block, context and latest trends, the review points coming up, and the check-ins waiting for feedback. Coaches can edit any part of an athlete's plan except the check-ins.

## Try it locally

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env          # then set SESSION_SECRET (openssl rand -base64 32)
npm run db:setup              # create the database and load demo data
npm run dev                   # http://localhost:3000
```

Demo logins (password `password123`). One-click buttons for these are on the login page while demo mode is on.

| Email | Who |
|---|---|
| `coach@goe.test` | Coach Sam Taylor (invite code `GOEDEMO`) |
| `jordan@goe.test` | Pre-season block, week 3 check-in open, next block lined up, full road map |
| `mia@goe.test` | Coming back from an ankle injury; week 3 checked in, waiting for feedback |
| `tom@goe.test` | New, nothing set up yet |

`npm run db:seed` wipes the local database and reloads the demo. Dates are relative to today, so the demo always looks current.

## Put it online (Vercel + Turso, free tiers)

1. **Import the repo:** in [Vercel](https://vercel.com), choose **Add New → Project**, import this repository and click **Deploy**. No settings are needed. Until step 2 is done the site shows an "Almost there" page.
2. **Connect a database:** in the new project, open **Storage → Create Database → Turso** (free plan) and connect it to the project for all environments.
3. **Redeploy** from **Deployments → ⋯ → Redeploy**. Your app is now live at the address under **Domains**, for example `goe-v3-practice.vercel.app`. Share that address; Vercel's longer per-deployment links need a Vercel login.

What happens on each deploy:

- Every build runs `src/db/deploy.ts` before `next build`. It updates the database tables and, while demo mode is on and nobody has signed up yet, loads the demo accounts. It never wipes or overwrites existing data.
- **Demo mode is on by default**, which puts one-click demo logins on the login page. Set the environment variable `DEMO_MODE=false` in Vercel (and remove the demo accounts) before real athletes use it.
- Logins are signed with `SESSION_SECRET` if it's set, otherwise with a key derived from the database token. Setting `SESSION_SECRET` later signs everyone out once.
- Pushing to the main branch redeploys automatically.

## Project layout

```
src/
  app/                 pages: login, register, athlete/…, coach/…, actions/ (all writes; each checks access)
  components/          UI: v3/ (plan, check-ins, forms, shell), auth, ui primitives, brand logo
  config/              v3.ts (archetypes, contexts, trends, limits), app name, demo accounts
  db/                  Drizzle schema, migrations runner, deploy step, demo data
  lib/                 auth (passwords, signed session cookie, access checks), dates, v3/ (block weeks, road map, queries)
  proxy.ts             keeps signed-out visitors on the login page and athletes/coaches in their own areas
drizzle/               SQL migrations
tests/e2e/             Playwright end-to-end tests
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Drizzle ORM on SQLite/libSQL (Turso when hosted), Zod, jose for sessions, and Node's scrypt for passwords.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright). Run `npm run build` first; uses a separate `data/e2e.db` |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Reset the local database to the demo (refuses on hosted or production databases) |

## Not in this version yet

Password reset and email verification, email invites, rate limiting on login, more than one coach per athlete, and notifications.
