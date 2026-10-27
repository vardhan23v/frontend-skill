# frontend-skill

[![CI](https://github.com/vardhan23v/frontend-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/vardhan23v/frontend-skill/actions/workflows/ci.yml) [![Scaffold drift](https://github.com/vardhan23v/frontend-skill/actions/workflows/scaffold-drift.yml/badge.svg)](https://github.com/vardhan23v/frontend-skill/actions/workflows/scaffold-drift.yml)

An open-source [Agent Skill](https://agentskills.io) (`create-frontend`) for Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and any other agent that reads `SKILL.md`. It turns "build me a frontend" into a production-oriented workflow: classify the project, respect or choose the stack, draw the frontend/backend boundary, pick a contrast-checked colour theme, build with real states and accessibility, verify in eight explicit categories, ship to GitHub with the user's identity and CI, and finish with an honest verification report.

**Version:** 4.0.0 · **Licence:** MIT · **Status:** specification complete, not yet validated on a large set of real projects (see [Validation Status](#validation-status))

---

## Contents

- [What it does](#what-it-does)
- [Supported project types](#supported-project-types)
- [Installation](#installation)
- [Usage](#usage)
- [Workflow](#workflow)
- [Stack decisions](#stack-decisions)
- [Colour themes](#colour-themes)
- [A new design every time](#a-new-design-every-time)
- [Motion](#motion)
- [Delivery and GitHub](#delivery-and-github)
- [Security headers](#security-headers)
- [Observability and consent](#observability-and-consent)
- [Quality gates](#quality-gates)
- [When backend work is required](#when-backend-work-is-required)
- [Testing expectations](#testing-expectations)
- [Verification levels](#verification-levels)
- [Browser verification behaviour](#browser-verification-behaviour)
- [Failure and recovery behaviour](#failure-and-recovery-behaviour)
- [The verification report](#the-verification-report)
- [Customising](#customising)
- [Related skills](#related-skills)
- [Limitations](#limitations)
- [Validation Status](#validation-status)
- [License](#license)
- [Changelog](#changelog)

---

## What it does

| Stage | Outcome |
|---|---|
| Classify | Decides whether the project is new, existing, partially implemented, or needs refactoring, and sizes the task so a one-component change does not get the new-project treatment |
| Read | Inspects `package.json`, lockfile, config, routing, styling, components, data layer, tests and environment; runs the existing checks once and records what already fails |
| Decide | Chooses the stack by a fixed priority (user → existing architecture → conventions → team constraints → requirements → defaults) |
| Boundary | Detects features that need a backend, writes the API contract, and refuses to fake them |
| Build | A named colour theme (from the library, or derived from the brand) and design tokens first, then screens with loading/empty/error/success states, responsive layout, accessibility, forms, security, headers, observability and consent |
| Verify | Code, types, build, tests, browser, visual, accessibility and delivery, each reported separately and never fabricated |
| Recover | Diagnose → root cause → fix → re-verify, with a retry limit and explicit blocker handling |
| Deliver | Branch → commit as the user → PR → CI → preview or GitHub Pages, with no bot author and no force-push; deploys only on request |
| Deploy prep | Build command, output directory, SPA fallback, env variables (public vs private), Node version, security headers, risks; deploys only on request |
| Report | A fixed-format verification report at the end of every run, including GIT and DELIVERY |

## Supported project types

| Type | Support |
|---|---|
| React + Vite | Default for client-rendered apps; scaffold and Tailwind setup included |
| Next.js (App Router) | Default when server rendering, SEO on dynamic pages or API routes are needed; server/client component guidance; deploy notes |
| Astro | Default for content sites; static and SSR deploy notes |
| Plain HTML/CSS/JS | For one or two static pages; Playwright smoke tests only |
| Vue/Nuxt, Svelte/SvelteKit, Angular, Solid | Detected and respected in existing projects; scaffolded on request; the rest of the workflow applies unchanged |
| Existing repositories | Conventions, package manager, styling, component library, data layer and tests are reused; no re-scaffold or migration |
| Partially implemented or messy projects | Inventoried first (works / broken / missing), finished in the dominant style, half-done work never silently deleted |
| Projects with a design system | The existing tokens and component library are the source of truth; a second library is never added |
| Projects with existing APIs | The existing client and types are reused; new endpoints follow the same conventions |
| Projects with existing tests | Existing tools are preferred; pre-existing failures are recorded, not hidden |

## Installation

The skill is the `create-frontend/` folder, in the standard Agent Skills layout:

```
create-frontend/
  SKILL.md                    the workflow (self-sufficient: an appendix carries the theme tokens in compact form)
  references/themes.md        eleven colour themes with light and dark tokens, fonts, shape and wiring
  references/motion.md        motion tokens, three motion levels and twelve paste-ready animation recipes
  references/design-directions.md  ten design axes, theme alternates and remix rules, the docs/design.md template
  references/github-delivery.md   identity, branch/PR/CI/Pages, the report fields and the failure table
  references/security-headers.md  CSP, HSTS, host snippets, SRI and the verification commands
  references/observability.md     error reporting, Web Vitals, event plans, consent and privacy
  references/accessibility.md     WCAG 2.2 AA, component checks and the manual keyboard walk
  references/quality-gates.md     Lighthouse CI, bundle budgets, visual regression and axe in CI
  assets/github/ci.yml        generated-project CI for npm, pnpm, yarn and bun
  assets/github/pages.yml     static GitHub Pages deploy with base-path and SPA fallback notes
  scripts/design-direction.js  composes three distinct design directions per project, seeded by its name
  scripts/check-contrast.js   WCAG contrast checker for a token file (Node 18+, no dependencies)
  scripts/verify.sh           runs the project's own checks and prints the eight-category summary
  scripts/scaffold.sh         non-interactive scaffolds for Vite+React, Next.js, Astro, Vue, Svelte, plain HTML
  scripts/install.sh          installs or updates the skill for your agent(s)
```

Clone once, then install for the agent(s) you use. The installer symlinks the folder by default, so `git pull` in the clone updates every install; pass `--copy` if your agent cannot follow symlinks. Re-running the installer replaces a copied install (the old copy is moved aside as `create-frontend.bak.<timestamp>`), so keep customisations in the clone, not in the copy. Run it from the clone, never from inside a skills directory.

```bash
git clone https://github.com/vardhan23v/frontend-skill.git
```

```bash
frontend-skill/create-frontend/scripts/install.sh agents claude
```

| Agent | User-level directory | Project-level directory |
|---|---|---|
| Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and other clients that scan the shared convention | `~/.agents/skills/` (`install.sh agents`) | `.agents/skills/` (`install.sh --project agents`) |
| Claude Code | `~/.claude/skills/` (`install.sh claude`) | `.claude/skills/` (`install.sh --project claude`) |
| GitHub Copilot in VS Code (native location) | `~/.copilot/skills/` (`install.sh copilot`) | `.github/skills/` (`install.sh --project copilot`) |
| Hermes Agent | `~/.hermes/skills/` (`install.sh hermes`) | `.agents/skills/` (`install.sh --project hermes`) |
| Anything else | `install.sh <path your agent documents>` | same, with `--project` |

The `.agents/skills/` convention is described in the [Agent Skills implementor guide](https://agentskills.io/client-implementation/adding-skills-support); each client's own documentation lists its native directory. Claude Code is the notable exception and reads only `.claude/skills/`.

If you copy only `SKILL.md` somewhere (for example into a hosted skill store that accepts a single file), the skill still works: step 6 falls back to the appendix for theme tokens and to an inline contrast check, and step 3 falls back to the plain scaffold commands. You lose the full reference, the per-theme wiring notes and the helper scripts, so prefer the folder.

## Usage

Your agent loads the skill when a request matches its description. Most agents also let you invoke it by name (`/create-frontend` in Claude Code, `$create-frontend` in Codex, a mention in others):

```
/create-frontend
```

Examples:

```
Build an admissions landing page with a contact form. Brand colours are in /brand.
```

```
Add a students list page to this app. API is in src/lib/api, see /students in the contract.
```

```
This repo is half-finished. Get the dashboard building and finish the reports page.
```

Giving these up front reduces questions: purpose and users, pages, where data comes from, whether login is needed, and where it will be hosted.

## Workflow

| Step | Name | Runs for |
|---|---|---|
| 0 | Classify the project and size the task | Always |
| 1 | Read the project | Always |
| 2 | Settle the requirements | New project, new feature |
| 3 | Decide the stack | New project only |
| 4 | Backend boundary | New project, new feature |
| 5 | Structure | New project |
| 6 | Design tokens and visual quality | New project, or more than a screen or two |
| 7 | Build | Always |
| 8 | Performance | New project, new feature |
| 9 | Tests | New project, new feature |
| 10 | Verify | Always (subset for small changes) |
| 11 | Failure recovery | Whenever something fails |
| 12 | Prepare for delivery and deploy | New project, or whenever Git, CI or a deployment is requested |
| 13 | Verification report | Always |

Requirements (step 2) are inferred where safe; the skill asks one short batch of questions only for items that materially change the implementation (unclear users, scope that could double, login with no provider, legacy browsers, unclear public/private, brand with no reference, a host that forces a framework).

## Stack decisions

Priority, highest first: explicit user requirements → existing project architecture → existing dependencies and conventions → team or company constraints → project requirements → skill defaults. An existing stack is never migrated unless asked.

| Decision | New project default | Changed when |
|---|---|---|
| Framework | Plain HTML (1–2 static pages) · Astro (content) · Vite + React (client app) · Next.js (SSR, dynamic SEO, API routes) | User names another framework |
| Language | TypeScript, strict | Plain HTML |
| Styling | Tailwind CSS | Existing design system |
| Component library | None | Many standard widgets needed → one accessible headless library |
| State | Component state + context | Widely shared, fast-changing state → one small store |
| Routing | Framework router; React Router for Vite SPAs | — |
| Data fetching | `fetch` in a typed module | Caching/refetching → TanStack Query or loaders |
| Forms | Native + built-in validation | Multi-step or many fields → React Hook Form + Zod |
| Testing | Vitest + Testing Library; Playwright e2e | Plain HTML → Playwright smoke only |
| CI | GitHub Actions from `assets/github/ci.yml` | The host or team uses another runner |
| Error tracking | None; an adapter with a no-op | The user names Sentry, GlitchTip or another provider |
| Analytics and consent | None; consent-gated when requested | A legal or contractual standard applies |
| Build tooling | The framework's own | — |

## Colour themes

Most generated frontends look the same: white page, grey text, indigo buttons, Inter. This skill does not start there. Step 6 makes the agent choose a palette on purpose, name it in the plan and the report, and build only with tokens.

| Situation | What happens |
|---|---|
| The project already has tokens, a theme file or a component library | They are used; no second palette is added |
| Brand colours, a logo or a design file are supplied | The closest theme is taken as a base, `primary` and `ring` are replaced by the brand colour (adjusted until it passes contrast), neutrals are tinted toward the brand's temperature |
| Nothing is supplied | A theme is picked by project type from the table below, and the choice is stated |

| Theme | Picked for | Character |
|---|---|---|
| Birch | Product landing pages, SaaS marketing, startup homepages, mainstream e-commerce | Near-white canvas for screenshots and photos, one emerald action, coral promo accent |
| Paper & Ink | Blogs, help centres, handbooks, newsletters, long-form reading | Warm paper, ink text, fountain-pen-blue links, one vermilion highlight, two serifs |
| Pewter | SaaS dashboards, admin panels, internal tools (light-first) | Cool quiet neutrals so data carries the colour; deep petrol primary, plum highlight |
| Forest | Farming, food production, outdoors, nutrition, climate, non-profits | Sage paper, conifer green, ochre |
| Terracotta | Restaurants, bars, hotels, travel, crafts, local businesses | Clay primary on warm sand, olive-glaze accent |
| Midnight | Developer tools, infrastructure, developer docs, trading, security (dark-first) | Ink-navy background, cyan and lime at restrained lightness, monospace headings |
| Harbour | Healthcare, insurance, government, civic, schools and universities, consumer fintech | Institutional sea blue, maximal legibility |
| Citrus | Upbeat consumer apps, student-facing learning apps, events, clubs, recipe and delivery apps | Tangerine actions, aubergine ink, grape accent |
| Gallery | Portfolios, photography, architecture, fashion, agencies, museums | White-cube monochrome, ink buttons, one cobalt signal |
| Dusk | Creative tools, beauty, lifestyle, music, meditation, sleep, journaling | Muted mauve, apricot accent, Didone headings |
| Brass | Luxury, wealth, law, premium services | Charcoal, ivory, antique gold, bottle green; sharp corners |

Every theme in [`create-frontend/references/themes.md`](create-frontend/references/themes.md) ships:

- light and dark token sets (`background`, `foreground`, `surface`, `muted`, `border`, `input`, `primary`, `accent`, `ring`, `danger`, `success`, `warning`, each with its `-foreground` where text sits on it) as ready-to-paste `:root` and `.dark` blocks, with fonts, radii and per-mode card and popover shadows
- a font pairing that no other theme uses, a corner radius scale and a shadow character that match the mood
- contrast figures produced by [`scripts/check-contrast.js`](create-frontend/scripts/check-contrast.js): every text pair at least 4.5:1 and every UI pair at least 3:1, in both modes, plus notes on tokens that are fill-only

The reference also carries the wiring: the Tailwind v4 `@theme inline` mapping, focus rings with an offset (so they show on primary buttons), `color-mix` recipes for hover and selection instead of extra tokens, and a dark-mode setup that does not flash: a blocking inline script in `<head>` sets the `.dark` class before first paint, `color-scheme` follows the class, and Next.js gets `suppressHydrationWarning` on `<html>`.

The checker is also what the skill runs when it derives a theme from a brand colour or edits any value. It fails on any text pair under 4.5:1 or UI pair under 3:1, and warns about OKLCH hue collisions (primary vs danger, accent vs warning, …), status colours used as text on muted fills, indigo-band primaries and inverted dark modes:

```bash
node create-frontend/scripts/check-contrast.js tokens.json
```

Dark mode is not an inversion of light: backgrounds are the darkest value, surfaces are lifted, primaries are lightened, and text is off-white. Light and dark both ship only when the project or user wants them; otherwise one mode is kept and the other block deleted.

## A new design every time

A theme is a palette, not a design. Left alone, two cafés would both get Terracotta, Fraunces, the same hero and the same card grid. So step 6 composes a **design direction** from ten axes before the first screen: theme (primary or an alternate, with remix rules for fonts, hue and shape), hero archetype (split, statement, editorial, band, showcase, utility), navigation, section rhythm, card character, button shape, type voice and scale, imagery treatment, motion level, density.

[`scripts/design-direction.js`](create-frontend/scripts/design-direction.js) does it mechanically:

```bash
node create-frontend/scripts/design-direction.js --type cafe --name "Kiln & Bean" --avoid docs/design.md
```

It is seeded by the project name, so a second project of the same type is different by construction; the three candidates it prints differ on at least four axes, one uses an alternate theme, incoherent combinations are rejected (a dashboard never gets an expressive serif hero), and any `docs/design.md` you point it at is never repeated. The agent picks the candidate the brief leans toward, gives every axis a reason tied to the content, writes `docs/design.md` in the project, and offers the other two as one-liners so you can switch with one word. The report gets a `Design:` line. [`references/design-directions.md`](create-frontend/references/design-directions.md) has the axes, the theme alternates per project type and the template.

## Motion

Step 7 used to say only what motion may do; now it ships the motion the way it ships colour. [`create-frontend/references/motion.md`](create-frontend/references/motion.md) has:

- **Tokens**: three durations, two easings, a spring and a travel distance, defined once and collapsed to 1 ms and 0 px under `prefers-reduced-motion`, so end-of-transition listeners still fire for reduced-motion users
- **Three levels**, picked by project type like the themes: `minimal` (hover, press, open/close, skeletons), `functional` (plus reveal-once on scroll, accordion and tab indicators, toasts, theme cross-fade; the default) and `expressive` (plus staggered hero entrance, scroll-driven hero, page and view transitions, count-ups; landing pages and Birch/Citrus)
- **Twelve recipes**, CSS first, `transform` and `opacity` only: reveal-once uses CSS scroll-driven animations with an IntersectionObserver fallback and is visible without JavaScript; dialogs and popovers animate from `display: none` with `@starting-style`; accordions animate height with `grid-template-rows`; the skeleton shimmer is the one permitted loop
- **A library table** that says exactly when `motion`, GSAP or dotLottie are justified, and that they are lazy-loaded and their cost reported

The level is named in the plan and in the report's `Motion:` line, and step 10 checks reduced motion in the browser rather than assuming it.

## Delivery and GitHub

A frontend is not finished at the local build. Step 12 adds delivery without turning the skill into a deploy bot:

| Rule | Behaviour |
|---|---|
| Identity | The commit author and committer are the user. Never a bot, never `github-actions[bot]`, never a `Co-Authored-By` agent trailer. No global Git config changes. |
| Branch and PR | `feat/`, `fix/`, `refactor/`, `chore/` or `docs/` branch, a reviewable commit, a PR body with all eight verification categories. No merge unless asked. |
| CI | [`assets/github/ci.yml`](create-frontend/assets/github/ci.yml) detects npm, pnpm, yarn or bun, runs only the scripts the project defines, and uploads Playwright artifacts. [`scripts/verify.sh`](create-frontend/scripts/verify.sh) runs the same checks locally. |
| GitHub Pages | [`assets/github/pages.yml`](create-frontend/assets/github/pages.yml) deploys static output with a `404.html` fallback and base-path notes. Next.js SSR and API routes need a Node host. |
| Safety | No force-push to a shared branch, no direct push to `main`, no disabled checks. A red CI is fixed, not hidden. |
| Report | `GIT` (branch, commit, PR, CI, preview, deployed) and `DELIVERY` (headers, consent, error reporting, privacy) lines. Unrun checks say `not run` and give the command. |

[`references/github-delivery.md`](create-frontend/references/github-delivery.md) has the exact commands, the PR template, the Pages rules and the failure table.

## Security headers

The skill sets a baseline in the host config and verifies it on the response: `Content-Security-Policy` from `default-src 'self'`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `frame-ancestors 'none'`. Third-party scripts get SRI and `crossorigin`; analytics and marketing wait for consent.

[`references/security-headers.md`](create-frontend/references/security-headers.md) has a report-only rollout, Next.js and Astro sketches, and copy-paste configs for Vercel, Netlify, Cloudflare and GitHub Pages. GitHub Pages cannot set custom response headers; the skill states that instead of claiming a policy.

## Observability and consent

The default is no analytics and no third-party tracking. When observability is requested:

- a top-level error boundary and one provider adapter, with PII scrubbed and source maps kept private
- Web Vitals (LCP, INP, CLS, TTFB) sent to the project's RUM or analytics
- a small typed event plan, named for what the user did
- consent categories (necessary, analytics, marketing) default to denied, with reject as easy as accept and a privacy page

[`references/observability.md`](create-frontend/references/observability.md) has the adapter, event map, consent sketch and network-panel verification. A banner that loads analytics before the choice is a bug.

## Quality gates

Budgets are written in the repository and fail CI, not discovered after launch:

| Gate | Tool | Failure |
|---|---|---|
| LCP ≤ 2.5 s, CLS ≤ 0.1, accessibility ≥ 0.95 | Lighthouse CI | fail the job |
| First-route JavaScript and CSS | `size-limit` or equivalent | fail the job |
| Desktop/mobile/light/dark layouts | Playwright screenshot baselines | review the diff, fix or update deliberately |
| Serious and critical a11y violations | `@axe-core/playwright` | fail the job |

[`references/quality-gates.md`](create-frontend/references/quality-gates.md) has the configs, CI wiring, baseline-update rules and the failure policy. A gate that is always green because it was widened is not a gate.

## When backend work is required

The skill is frontend-only but detects these triggers: authentication and sessions, roles and permissions, database persistence, server-side validation, private API or service-role keys, file uploads to storage, payments, email or SMS, server-side processing, scheduling or webhooks, and anything other users must see after a reload.

When one is hit, the skill:

1. Names it as a backend dependency in the plan and the report
2. Does not simulate it with hard-coded data presented as working; any mock is labelled in code, UI and report, and sits behind the real interface
3. Never moves a secret into the client
4. Writes an API contract (method, path, request, response, errors, auth) in `src/lib/api/contracts.ts` or `docs/api-contract.md`
5. Integrates against the contract with real loading, error, empty and success handling
6. Lists exactly which backend pieces remain

## Testing expectations

| Level | Written for | Not written for |
|---|---|---|
| Unit | Utilities, formatters, validators, business logic, API mappers | Trivial wrappers |
| Component | Forms, interactive components, loading/error/empty states | Static presentational components |
| End-to-end | Sign-in, checkout/payment, main create/edit flow, primary navigation, a smoke test per main page | Everything else |

Existing project tools are preferred. Tests must be able to fail; render-only tests and weakened assertions are not accepted.

## Verification levels

| Category | Covers | Typical command |
|---|---|---|
| Code | Lint, format, no dead code or debug output, no secrets in the diff | project `lint`, `git diff` review |
| Types | Typecheck | `tsc --noEmit` |
| Build | Production build, bundle sizes | `npm run build` |
| Tests | Existing and new tests | project `test`, `npx playwright test` |
| Browser | Routes open, console and network clean, interactions and states work at desktop and mobile widths | dev server + browser tool or Playwright |
| Visual | Screenshots at 375 and 1280 wide, read by the agent | `npx playwright screenshot …` |
| Accessibility | Automated scan plus a keyboard walk, WCAG 2.2 AA | `npx @axe-core/cli <url>` + manual |
| Delivery | CI ran and passed, PR opened under the user's identity, preview/deployed URL smoke-checked, headers present, consent behaves | `gh pr checks`; `curl -sI`; browser |

Each category is reported separately. If a tool is unavailable the report states exactly what was not verified and gives the command to run manually. Pre-existing failures are reported as pre-existing, never as fixed.

## Browser verification behaviour

**When a browser tool or Playwright is available:** the app is started, every important route is opened at 1280×800 and 375×812, console errors and failed network requests are read, the main interactions are exercised (navigation, forms with valid and invalid input, dialogs, menus), loading/error/empty states are triggered, and the responsive checklist (navigation, typography, grids, tables, forms, dialogs, buttons, images, overflow, touch targets) is walked. Findings are fixed and re-checked.

**When it is not available:** the report contains the literal line `BROWSER VERIFICATION: NOT AVAILABLE`, followed by manual steps: how to start the app, which URLs to open, what to look for, which interactions to try, and which widths to test. The skill does not imply a browser check happened.

Accessibility follows the same rule: semantic HTML in the code is not treated as verification. With a browser, the keyboard walk and axe scan are run; without one, the review is reported as code-level only.

## Failure and recovery behaviour

On any failure: diagnose from the actual error → identify the root cause → fix → re-run the verification that failed → report. The same command is not retried unchanged more than twice; after that the approach changes.

When blocked by missing credentials, an unavailable service or tool, or a decision only the user can make, the skill names the blocker, finishes everything that can be completed safely, and lists what remains. A table of common failures (Node version, port in use, Tailwind not applying, blank production page, hydration mismatch, CORS, SPA 404s, CI-only test failures) is included in the skill.

## The verification report

Every run ends with:

```
PROJECT            framework, language, styling, theme, motion level, design direction, testing, build tool, repository
IMPLEMENTED        what was built
VERIFIED           code, types, build, tests, browser, visual, accessibility, delivery — each with its result
NOT VERIFIED       what, why, and the manual command
PRE-EXISTING ISSUES
KNOWN LIMITATIONS  including anything mock or placeholder and how to replace it
BACKEND DEPENDENCIES  each with its contract location
ENVIRONMENT VARIABLES  name (public|private, build-time|runtime): purpose
GIT                branch, commit, PR, CI, preview, deployed
DELIVERY           security headers, analytics/consent, error reporting, privacy page
DEPLOYMENT NOTES   build command, output, fallback, Node version, risks
```

## Customising

Edit `create-frontend/SKILL.md` unless the table says otherwise:

| To change | Edit |
|---|---|
| Default framework, styling or test stack | The decision table in step 3 |
| Team constraints the skill must respect | Add them to `AGENTS.md` or `CLAUDE.md`; the skill reads them in step 1 and ranks them above its own defaults |
| Which theme a project type gets | The project → theme table in step 6 |
| Which motion level a project gets, or a recipe | The level table in step 7; `create-frontend/references/motion.md` |
| The design axes, theme alternates or coherence rules | `create-frontend/references/design-directions.md`; the `THEMES`, axis lists and `coherent()` in `scripts/design-direction.js` |
| Add or change a colour theme | `create-frontend/references/themes.md`; run `node create-frontend/scripts/check-contrast.js` on the new values until it exits 0 |
| Your company's palette as the only theme | Replace the library with one theme derived from your brand and delete the project → theme table |
| Folder layout | Step 5 |
| Accessibility or browser-support standard | Step 2 defaults, step 7 and `create-frontend/references/accessibility.md` |
| Security header policy or host snippets | Step 7 and `create-frontend/references/security-headers.md` |
| Observability, analytics or consent defaults | Step 7 and `create-frontend/references/observability.md` |
| CI, Pages or identity rules | Step 12, `create-frontend/references/github-delivery.md` and `create-frontend/assets/github/` |
| Performance, bundle or visual-regression budgets | `create-frontend/references/quality-gates.md` |
| A fixed hosting provider | Step 12 |
| Report format | Step 13 |
| When the skill triggers | The `description` line in the frontmatter |

## Related skills

| Skill | Role |
|---|---|
| A visual-design skill such as `frontend-design` | Optional. If one is installed alongside, step 6 loads it for art direction when the look matters more than usual. Nothing depends on it: the theme library, shape and font choices, and the "avoid the generic AI look" rules are the visual direction when no such skill exists. |

## Limitations

- Web frontends only; no native mobile or desktop apps.
- Backend work is identified and contracted, not implemented.
- Browser, visual and accessibility verification depend on a browser tool or Playwright being available in the session; without them those categories are reported as not verified.
- GitHub delivery needs the user's Git identity and a Git remote; CI and Pages need GitHub. Without `gh`, the skill pushes the branch and gives a pull-request URL instead of claiming a PR exists.
- The CI and Pages templates are starting points. Every stack differs; the workflow is adjusted to the project's real scripts and output directory, never left as a workflow that passes because it ran nothing.
- Security headers depend on the host. Static hosts such as GitHub Pages cannot set response headers; the skill reports that limitation instead of claiming a policy.
- Consent defaults are a safe starting point, not legal advice. The user or their counsel confirms the jurisdiction, categories and retention.
- Scaffold commands and tool invocations (`create-vite`, `create-next-app`, `create-astro`, `sv create`, Playwright, axe, Lighthouse CI) are current major-version syntax and will drift; the skill is told to read current docs when a command fails.
- The skill reads `AGENTS.md`, `CLAUDE.md` and lint config for team constraints; constraints that live only in people's heads must be stated in the request.
- Design judgement is bounded: the skill avoids the generic AI look and follows supplied references, but does not replace a designer.
- The themes are starting palettes with verified contrast, not brand systems. A theme derived from a brand colour is only as accessible as the adjusted colour; the checker reports it, the skill must act on it.
- `check-contrast.js` checks token pairs, not rendered pages: text over images, gradients or overlapping surfaces still needs the axe scan.

## Validation Status

Be aware of this before relying on the skill.

**Tested projects:** one demo site (`examples/demo-site`). The skill has not yet driven a build on a framework project or a messy existing repository.

**Verification performed on 4.0.0 (27 Oct 2026):**

- `node .github/scripts/validate-skill.js` checks the frontmatter, every theme, the appendix, relative links, the CHANGELOG entry, the new reference files, the two workflow templates, and that `verify.sh` is executable and parses under `sh -n`
- The generated-project workflows are parsed as YAML in CI with the system Ruby, so a broken template fails before a user copies it
- `scripts/verify.sh` was run locally against `examples/demo-site` (no lint/type/build scripts; its 14 Playwright smoke tests pass) and CI runs it against a temporary project with passing and failing scripts; undefined checks are reported as `not defined`, not as passed
- The identity rules are enforced by the CI check that pull-request commits contain no bot author or `Co-Authored-By` trailer; the skill's delivery reference tells the agent to check the same before pushing
- Not yet done: running the GitHub delivery path end to end from a generated project (branch, PR, CI, Pages), a Lighthouse CI run against a real product, and a consent implementation reviewed by counsel. These are reported as unvalidated, not claimed.

**Verification performed on 3.1.0 (6 Oct 2026):**

- Ten themes were designed by independent agents, each re-verified by a second agent with the checker, then critiqued as a set through three lenses (overlap, coverage, practicality). The critique produced the eleventh theme (Birch), two renames (Slate → Pewter, Harbor → Harbour), a primary swap for Paper & Ink, unique font pairings, the `input` token, per-mode shadows, the focus-ring offset and the hue-collision warnings in the checker
- `node create-frontend/scripts/check-contrast.js` exits 0 for every theme in both modes; the contrast figures in `references/themes.md` and the appendix in `SKILL.md` are generated from that run, not typed
- `check-contrast.js` runs on Node 18+ with no dependencies and accepts a light-only or dark-only file; CI runs it on every theme and on a deliberately failing palette
- `install.sh` is exercised in CI for symlink, copy, project scope, a path with spaces, re-running over a copy, refusing a foreign directory and refusing to run from inside an installed copy
- `scaffold.sh` scaffolded and built all five stacks (Vite + React, Next.js, Astro, Vue, Svelte) in the Scaffold drift workflow on 6 Oct 2026, and `vite-react` and `vue` were also run locally; the flags will still drift, which is what the monthly run is for
- A release-review pass (three reviewers, each must-fix independently re-verified) found and fixed: `--shadow-card: none` cancelling Tailwind focus rings, wrong dark-only instructions, Astro needing `is:inline`, `next-themes` needing `attribute="class"`, an installer that could delete itself, path targets split on spaces, and stale hex values in one theme's notes
- A real build driven by the skill: [`examples/demo-site`](examples/demo-site) (plain HTML, Terracotta, functional motion, light and dark) was built by following SKILL.md end to end on 6 Oct 2026; 14 Playwright smoke tests pass at desktop and mobile, axe reports 0 violations on both pages, and the reveal and theme cross-fade recipes from `references/motion.md` were checked in a browser including under reduced motion
- Not yet done: a framework build (Vite + React, Next.js or Astro) driven by the skill; rendering the font pairings beyond the demo's Fraunces / Nunito Sans

**Verification performed on 3.0.0 (4 Oct 2026, in a sandbox):**

- Frontmatter parses; `name` and `description` present; description under the length limit
- No "production tested" or similar claims anywhere in the repo
- `npm create vite@latest --help`, `npx sv create --help`, `npx playwright screenshot --help` and `npx lighthouse --help` all resolve and run
- `npx playwright screenshot --viewport-size=375,812 <url> mobile.png` produced a screenshot of a locally served test page
- `@axe-core/cli` resolves on the registry (4.13.0) but could not be run here: it downloads a Chrome driver from a host the sandbox blocks. Untested end to end.
- `npx create-next-app@latest` and `npm create astro@latest` were not run

**Known issues:**

- Not yet exercised against a partially implemented or messy repository, which is the hardest class it claims to handle.
- The "ask only what materially matters" rule in step 2 has not been observed in practice; it may still ask too much or too little.
- Framework coverage beyond React/Vite, Next.js, Astro and plain HTML is by instruction only.

**Areas requiring further validation:**

1. A fresh Vite + React + TypeScript app from an empty folder (new project path, Tailwind setup, Playwright and axe commands)
2. An existing Next.js App Router project: add a page that reads an existing API, confirm no re-scaffold and server/client component choices are correct
3. A half-finished repository with a failing build: confirm the inventory, the pre-existing-failure reporting, and that nothing is silently deleted
4. A project with a design system (shadcn/ui or MUI already installed): confirm no second library is added and tokens are reused
5. A feature that needs auth with no provider present: confirm the backend boundary, the contract, and that nothing is faked
6. A session with no browser tooling: confirm the `BROWSER VERIFICATION: NOT AVAILABLE` block and manual steps appear

Recommended real projects to use: a personal portfolio (plain HTML or Astro), a small admin dashboard on Vite + React against a public demo API, an existing Next.js starter with a few pages, and one deliberately abandoned side project.

## Development

Three GitHub Actions workflows keep the repo honest:

| Workflow | Runs | Checks |
|---|---|---|
| [CI](.github/workflows/ci.yml) | every push and pull request, Node 18 and 22 | `SKILL.md` frontmatter follows the Agent Skills spec; every theme passes `check-contrast.js`; the appendix in `SKILL.md` matches `references/themes.md` value for value; theme tables and relative links resolve; every required reference, asset and script exists; the GitHub workflow templates parse as YAML; `verify.sh` is executable and passes `sh -n`; `CHANGELOG.md` has the current version; shell scripts pass shellcheck; `scaffold.sh html` and `install.sh` (symlink, copy, project, refusal) behave; on pull requests, no commit in the branch has a bot author or `Co-Authored-By` trailer |
| [Release](.github/workflows/release.yml) | on a `v*` tag | tag equals `metadata.version`, then publishes a release with `create-frontend/` zipped and the matching CHANGELOG section as notes |
| [Scaffold drift](.github/workflows/scaffold-drift.yml) | monthly and on demand | runs `scaffold.sh` for Vite + React, Next.js, Astro, Vue and Svelte with network access and builds each result, so flag drift shows up as a red badge rather than a broken session |

Run the CI checks locally with `node .github/scripts/validate-skill.js`. To cut a release: bump `metadata.version` in `SKILL.md`, add the CHANGELOG entry, then `git tag v4.0.0 && git push --tags`.

Editing a theme: change the values in `references/themes.md`, run the checker on them, and update the matching appendix rows in `SKILL.md`; CI fails if the two disagree.

## License

[MIT](LICENSE). Use it, fork it, ship it inside your own agent or plugin; attribution stays in the file.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
