---
name: "create-frontend"
description: "Use when asked to create, scaffold, build, extend or fix a frontend (website, landing page, dashboard, web app UI, a page or component) in a new, existing or partially built code project. Classifies the project, decides the stack by priority, draws the frontend/backend boundary, composes a distinct design direction per project (theme from a contrast-checked library or derived from the brand, hero archetype, navigation, rhythm, type voice, imagery, motion level; never the same twice in a workspace), builds (including motion, 3D and icons when wanted), verifies in eight explicit categories (code, types, build, tests, browser, visual, accessibility, delivery), ships to GitHub with branch/PR/CI/Pages when asked, applies security headers, observability and consent, and prepares deploy."
license: "MIT"
compatibility: "Any Agent Skills client. scripts/ need Node 18+ and a POSIX shell; GitHub delivery needs the user's Git identity and optionally the GitHub CLI; browser, visual and accessibility checks need a browser tool or Playwright."
metadata:
  version: "4.0.0"
  homepage: "https://github.com/vardhan23v/frontend-skill"
---

# Create Frontend

Build a working, verified frontend end to end: understand the project, respect or choose the stack, implement, verify, and leave it ready to deploy.

The finish line is a frontend that builds cleanly and has been checked in a browser, not code that merely looks right. Never report a check you did not run.

## 0. Classify the project and size the task

Classify before touching anything. Read `package.json`, the lockfile, the source tree and git state (`git status --short`, `git log --oneline -5`).

| Class | How to tell | What it means for the work |
|---|---|---|
| A. New | No `package.json` or source, or an untouched scaffold | Full workflow; you choose the stack (step 3) |
| B. Existing | Working build, consistent structure | Extend in its own style; no re-scaffold, framework migration, major-version upgrade or reformatting of untouched files |
| C. Partially implemented | Half-built pages, TODOs, failing build, mixed conventions, unused dependencies | Inventory first: what works, what is broken, what is missing. Finish in the dominant style. Do not delete half-done work without saying so. |
| D. Needs refactoring | The user asks for it, or the task cannot be done safely without it | Refactor only what the task needs, keep behaviour, work in small reviewable steps, and say what changed and why |

Then size the task so you run only the steps it needs:

| Task | Steps |
|---|---|
| New project | All |
| New page or feature in an existing frontend | 1, 2, 4, 7, 8, 9, 10, 13 |
| Single component or small change | 1 (conventions only), 7, 10 (code, types, build, browser), 13 |
| Fix or restyle | 1, the fix, 10, 13 |

When the request includes GitHub, CI, a pull request or a deployment, step 12 is in scope even for a feature or a small change.

For a new project, or a feature over about three screens, write a short plan first: stack and reason, pages, components, data sources, backend dependencies, delivery target, order of work. Track it as a task list. Keep going unless a choice is expensive to undo and unclear, in which case ask.

## 1. Read the project

Existing conventions win over this skill's defaults unless the user asks for a change or a convention blocks the task. Inspect:

- `package.json`: framework, scripts (`dev`, `build`, `test`, `lint`, `typecheck`), dependencies, `engines`; `.nvmrc`
- Team constraints: `AGENTS.md`, `CLAUDE.md`, a contributing guide, lint and format config; these rank above this skill's defaults (step 3)
- Lockfile decides the package manager: `pnpm-lock.yaml` pnpm, `yarn.lock` yarn, `bun.lock`/`bun.lockb` bun, `package-lock.json` npm. Never mix managers.
- Config: `vite.config.*`, `next.config.*`, `astro.config.*`, `tsconfig.json`, ESLint, Prettier, Tailwind
- Routing: file-based (`app/`, `pages/`, `src/pages/`) or a router package and its route table
- Styling: Tailwind, CSS modules, styled-components or plain CSS; existing tokens, theme files, design system or component library (shadcn/ui, MUI, Chakra, Radix, Vuetify). Use what is there; never add a second.
- Components: naming, folder layout, import aliases, patterns for props, state and data
- Data: existing API client, response types, mocks; `.env.example` and which variables are public
- Tests: framework, location, how they run, whether they pass now
- Delivery: Git remote and default branch, existing workflows in `.github/workflows/`, branch protection, `gh auth status` if installed, and the commit name/email (`git config --get user.name`, `git config --get user.email`). Never default the identity to a bot.
- Security and observability: existing security headers and CSP, error tracking, analytics, consent handling, and whether a privacy page exists
- Framework idioms: Vue/Nuxt, Svelte/SvelteKit, Angular and Solid projects keep their own idioms. Never introduce React into them.

Run the existing `install`, `typecheck`, `lint`, `test` and `build` once before changing anything and record what already fails. You are not responsible for pre-existing failures, but you must not make them worse, and the report lists them.

## 2. Settle the requirements

Infer what is safe to infer. Ask one short batch of questions only for items that materially change the implementation. If the client has a structured question tool, respect its limits (typically four or five questions, each with two to four choices and a free-text "other"); everything a pick-list cannot capture becomes a stated assumption at the top of the plan, which the user can correct in one reply. If the user is unavailable, take the most reasonable reading, state it at the top of the report, and continue.

| Area | Default when not stated | Ask when |
|---|---|---|
| Purpose, users, devices | Infer from the request and repo | It is unclear who uses it |
| Pages, screens, user flows | The obvious set; most important screen first | Scope could reasonably double |
| Data and APIs | The existing API; otherwise a labelled mock behind a contract (step 4) | No API exists and the data model is unclear |
| Auth and roles | None for public sites; the existing auth for apps | Login or roles are needed and no provider exists |
| Responsive and browser support | Mobile first; current evergreen browsers | Legacy browsers, kiosk or tablet-only use |
| Accessibility | WCAG 2.2 AA (step 7, `references/accessibility.md`) | A stricter or audited standard is required |
| SEO | Public site: yes; private app or dashboard: no | Unclear whether it is public |
| Performance | Core Web Vitals targets and the quality gates in step 8 | Unusual constraints (slow networks, very large data) |
| Loading, error, empty, success states | Always, on every async view | - |
| Design references and colour | Use what is supplied; otherwise a named theme from step 6, chosen by project type | Brand matters and nothing is supplied |
| Motion and 3D | The motion level the theme defaults to, usually `functional` (step 7, `references/motion.md`); no 3D | The user asks for more or less motion, or a reference relies on it |
| Favicon and app icons | Always; from the user's logo or an original mark (step 7) | - |
| Security headers | Baseline set in step 7 and verified in step 10 | The host cannot set headers, or a required integration would break |
| Analytics and consent | None; when requested, consent-gated with no PII (step 7, `references/observability.md`) | A legal, contractual or audited standard applies |
| GitHub delivery and CI | No commit, push or PR unless asked; when asked: branch, PR, CI and the user's identity, never a bot (step 12) | A direct push, merge, tag or deploy is requested |
| Deploy target, environment variables, integrations | Record what is known | A host or integration forces a framework choice |

## 3. Decide the stack

Priority, highest first:

1. Explicit user requirements
2. Existing project architecture
3. Existing dependencies and conventions
4. Team or company constraints (`AGENTS.md`, `CLAUDE.md`, contributing guides, lint rules)
5. Project requirements
6. This skill's defaults

An existing stack is preserved unless the user asks for a migration. For a new project, state the stack and the one-line reason before scaffolding.

| Decision | Existing project | New project default | Choose otherwise when |
|---|---|---|---|
| Framework | Keep | Plain HTML+CSS+JS for one or two static pages; Astro for content sites; Vite + React for client-rendered apps; Next.js (App Router) when server rendering, SEO on dynamic pages or API routes are needed | The user names Vue, Svelte, Angular or another: use its official scaffold and apply the rest of this skill unchanged |
| Language | Keep | TypeScript, strict | Plain HTML project |
| Styling | Keep | Tailwind CSS | An existing design system dictates otherwise |
| Component library | Keep the one present | None; build from tokens | Many standard widgets (dialogs, menus, tables) are needed: one accessible headless library (shadcn/ui, Radix) |
| State | Keep | Component state and context | Shared, frequently changing state across many screens: one small store (Zustand, Pinia) |
| Routing | Keep | The framework's router; React Router for Vite SPAs | - |
| Data fetching | Keep | `fetch` in a typed API module | Caching, refetching or shared server state: TanStack Query or framework loaders |
| Forms | Keep | Native elements and built-in validation | Multi-step or many fields: React Hook Form + Zod, or the framework equivalent |
| Testing | Keep | Vitest + Testing Library; Playwright for end-to-end | Plain HTML: Playwright smoke tests only |
| Icons | Keep | One icon set, imported per icon (for example `lucide-react`) | - |
| Animation | Keep | CSS transitions and keyframes | Orchestration, gestures or layout animation: `motion` in React, GSAP for timelines; designer-made vector animation: dotLottie |
| 3D | Keep | None | 3D is the content or the user asks: `<model-viewer>` for a model, `three` + `@react-three/fiber` for a scene (step 7) |
| CI | Keep the existing workflow | GitHub Actions from `assets/github/ci.yml` when the project is on GitHub; the host's CI otherwise | The team uses GitLab, Bitbucket or another runner |
| Error tracking | Keep the existing provider | None; a small adapter with a no-op when no provider is configured | The user names Sentry, GlitchTip or another service |
| Analytics and consent | Keep the existing setup | None; when requested, a consent-gated analytics module with a short event plan | A legal or contractual standard requires a specific vendor |
| Build tooling | Keep | The framework's own (Vite, Next, Astro) | - |

Scaffold: `scripts/scaffold.sh <vite-react|next|astro|vue|svelte|html> <name>`, next to this file, runs the official scaffolders non-interactively with current flags. Without it: `npm create vite@latest <name> -- --template react-ts --no-interactive`, `npx create-next-app@latest <name> --yes`, `npm create astro@latest`, `npm create vue@latest`, `npx sv create`. These change between major versions: if the script or a command fails or prompts unexpectedly, read the tool's current docs rather than guessing flags, and prefer non-interactive flags. With Vite + Tailwind: `npm install tailwindcss @tailwindcss/vite`, add the plugin to `vite.config.ts`, put `@import "tailwindcss";` in the main CSS.

Add dependencies sparingly and say why for each.

## 4. Backend boundary

This skill builds frontends. Detect when a request needs backend work and do not fake it.

**Backend triggers:** authentication and sessions; roles and permissions; database persistence; server-side validation; private API keys or service-role keys; file uploads to storage; payments; email or SMS; server-side processing, scheduling or webhooks; anything other users must see after a reload.

When a trigger is hit:

1. Name it in the plan and the report as a backend dependency.
2. Do not simulate it with hard-coded data presented as working. A mock is acceptable only when it is labelled as mock in code, in the UI (a dev-only banner or console warning) and in the report, and sits behind the same interface the real implementation will use.
3. Never move a secret into the client to make something "work".
4. Write the contract the frontend codes against: for each endpoint, the method and path, request shape, response shape, error shape and status codes, and auth requirement. Put it in a typed module (for example `src/lib/api/contracts.ts`) or `docs/api-contract.md`, following the existing API client conventions if any.
5. Integrate against the contract with real loading, error, empty and success handling, so the real backend drops in without UI changes.
6. If the user also asked for the backend and the session has the tools for it, hand the contract to that work; otherwise the report lists exactly which backend pieces remain.

## 5. Structure

For a React app (adapt names to the framework's conventions):

```
src/
  components/   reusable UI pieces (Button, Card, Modal)
  features/     feature-specific components, hooks and logic
  pages/        route-level screens (or app/ for Next.js)
  lib/          api client, contracts, utilities, constants
  styles/       global CSS and design tokens
  assets/       images, fonts
  mocks/        mock data, clearly named as mock
```

Delivery files live at the project root and are part of the build:

```
.github/workflows/ci.yml      copy from assets/github/ci.yml and adjust to the stack
.github/workflows/pages.yml   only for a static GitHub Pages deploy
docs/design.md                the chosen design direction and its reasons
docs/api-contract.md          when there is a backend dependency
```

Keep components small and single-purpose. Co-locate a component's styles and tests with it. No dead code, commented-out blocks or leftover scaffold boilerplate (remove the default demo page, logos and counter). Do not create abstractions or components for a single use.

## 6. Design tokens and visual quality

Before building more than a screen or two, define the tokens once and use them everywhere: colours with semantic names (`background`, `foreground`, `surface`, `muted`, `border`, `input`, `primary`, `accent`, `ring`, `danger`, `success`, `warning`, each with a `-foreground` where text sits on it), type scale, spacing scale, radii, shadows, breakpoints, and the states each interactive component needs (hover, focus, active, disabled, loading, error).

- Put them in CSS custom properties or the Tailwind theme, never as scattered literal values
- A tiny project gets a short token file, not a design system
- **Motion tokens**: three durations (120, 200 and 320 ms), two easings (ease-out for entrances, ease-in for exits) and a travel distance, defined once and collapsed under `prefers-reduced-motion`; the exact block is in `references/motion.md`, and every animation uses them. What may move, and how, is in step 7.
- **Fonts**: at most two families (the chosen theme names a pairing); `font-display: swap`; self-host or preconnect

### Design direction

A theme is a palette, not a design; two projects of the same type must not come out as one template in two colours. Before the first screen, compose a direction from ten axes (theme and alternates, hero archetype, navigation, section rhythm, card character, button shape, type voice and scale, imagery treatment, motion level, density), defined in `references/design-directions.md`:

1. Run `node <skill directory>/scripts/design-direction.js --type <project type> --name "<project name>" --avoid <every docs/design.md you can find in the workspace>`. It is seeded by the project name, so a second café differs from the first by construction; the three candidates differ on at least four axes, one uses an alternate theme, and none repeats an avoided direction. Without the script, compose three by hand under the same rules.
2. Pick the candidate the brief and references lean toward (the first when nothing leans); the user may name one instead. Give every axis a reason tied to the content; a choice without a reason is decoration, choose again.
3. Write `docs/design.md` in the project (template in the reference) and list the two alternatives as one line each in the plan and the report, so the user can switch with one word.
4. Existing projects keep their established direction; read it from the code and write it down only if the task touches the look.

### Colour theme

Choose the palette deliberately before the first screen, name it in the plan and the report, and never start from a framework default or the white-page-with-indigo-buttons look. `references/themes.md`, next to this file, holds eleven named themes; each has light and dark token sets, a font pairing, a shape character, ready-to-paste `:root` and `.dark` blocks, and contrast figures produced by `scripts/check-contrast.js`. If this file was installed on its own and `references/` is missing, the appendix at the end of this file has the same tokens in compact form and an inline contrast check.

| Situation | Do |
|---|---|
| Existing project with tokens, a theme file or a component library | Use them; never add a second palette |
| Brand colours, a logo or a design file supplied | Derive: take the closest theme by temperature and mood, replace `primary` and `ring` with the brand colour (darken it in light mode and lighten it in dark mode until the checker passes), tint the neutrals toward the brand's temperature, keep the rest |
| Nothing supplied | The direction above names it: the project type's primary theme from the table below, or one of its alternates when the primary was used recently in the workspace or the brief leans that way (alternates and remix rules are in `references/design-directions.md`) |

| Project | Theme |
|---|---|
| Product landing page, SaaS marketing site, startup homepage, pricing page | Birch (or the theme of the product it markets) |
| E-commerce, marketplace, D2C storefront | Birch; artisan or boutique → Terracotta; eco → Forest; luxury → Brass |
| Blog, help centre, handbook, newsletter, long-form reading | Paper & Ink |
| SaaS dashboard, admin panel, internal tool, data-dense UI (light-first) | Pewter |
| Farming, food production, outdoors, nutrition, climate, non-profit | Forest |
| Restaurant, café, bar, hotel, travel, crafts, local business | Terracotta |
| Developer tool, infrastructure, developer docs, trading, security (dark-first) | Midnight |
| Healthcare, insurance, government, civic, school and university sites, consumer fintech | Harbour |
| Upbeat consumer app, student-facing learning app, events, clubs, recipe and delivery apps | Citrus |
| Portfolio, photography, architecture, fashion, agency, museum | Gallery |
| Creative tool, beauty, lifestyle, music, meditation, sleep, journaling, habit tracker | Dusk |
| Luxury, wealth, law, premium services | Brass |

- Copy the theme's `:root` and `.dark` blocks and the wiring from the reference; components use tokens only, never the hex values. Form controls use the `input` token for their outline, focus rings use `ring` with a 2px offset in `background`.
- Light and dark: ship both when the project or user wants them. The `.dark` class goes on `<html>` from a blocking inline script in `<head>` before any stylesheet (no flash; `is:inline` in Astro), `color-scheme` follows the class, and Next.js needs `suppressHydrationWarning` on `<html>`; the reference has the exact snippet. Single mode: light-only deletes the `.dark` block; dark-only (a dark-first product such as Midnight) copies the `.dark` values over the matching lines in `:root` and deletes `.dark`; both drop the script and the dark variant.
- Colour is scarce: `primary` for the one main action per view and for links; `accent` for selected states, badges and highlights (fill-only where the theme says so); status colours only for status, and never as text inside a `muted` fill; everything else neutral. A screen that is mostly `background`, `surface` and `foreground` with one `primary` reads as designed; one that uses every token reads as a template.
- Changed or derived any value? Run `node <skill directory>/scripts/check-contrast.js tokens.json` (text pairs at least 4.5:1, UI pairs 3:1, in every shipped mode) and fix each failing pair before building on it; its warnings name hue collisions and fill-only tokens

Avoid the generic AI look: gradient backgrounds everywhere, glassmorphism, random animations, a grid of equally rounded cards, decorative elements that do not aid use, and inconsistent spacing or type sizes between screens. Every screen should look like it belongs to the same product.

When a design or reference is supplied, analyse it first: name the characteristics that matter (layout rhythm, type, colour, density, component shapes), reproduce those, and ignore incidental details. The user's brand colours, fonts or design file are the source of truth; the theme library only fills what they leave open.

If a dedicated visual-design skill is installed alongside this one (for example one named `frontend-design`) and the look matters more than usual, load it for art direction. Nothing here depends on it: the theme library, the shape and font choices and the rules above are the visual direction when no such skill exists.

## 7. Build

Build the most important screen first, show it works, then the rest.

### States

Every async view handles loading (skeletons over spinners for content), error with a retry, empty with a next action, and success. Long text, missing images, zero items and very many items must not break the layout. Use realistic copy and data shapes, not lorem ipsum, unless the user wants placeholders.

### Responsive

Mobile first. Design for about 375 px, 768 px and 1280 px, not one viewport. Check each explicitly: navigation (collapses, stays reachable), typography (readable at every width), grids (reflow, no orphan columns), tables (scroll within their container or stack), forms (full-width inputs, keyboard does not hide the submit), dialogs (fit the viewport, scroll inside), buttons (do not wrap awkwardly), images (scale, never overflow), no horizontal page scroll, touch targets at least 44 px, hover-only interactions have a touch equivalent.

### Accessibility

Native semantics first; ARIA only when a native element cannot express the role or state. The standard is **WCAG 2.2 AA**; `references/accessibility.md` has the full checklist, component notes and the 2.2 additions.

- Semantic HTML: `button` for actions, `a` for navigation, `nav`, `main`, `header`, `label`; one `h1` per page, headings in order
- Keyboard: everything reachable and operable in a logical order; visible focus; Escape closes dialogs and menus; arrow keys in menus, tabs and listboxes
- Focus not obscured: a sticky header, cookie banner or chat widget never covers the focused element; test with Tab, not a mouse
- Dialogs: focus moves in on open, is trapped while open, and returns to the trigger on close
- Forms: inputs tied to labels; errors in text, linked with `aria-describedby`, announced on submit; allow paste and password managers; do not ask for the same information twice
- Images: alt text on meaningful images, empty `alt` on decorative ones
- Contrast at least 4.5:1 for body text, 3:1 for large text and UI controls; meaning never by colour alone
- Target size: pointer targets at least 24×24 px, touch targets 44×44 px; any drag-only interaction has a single-pointer alternative
- Help: a help mechanism (chat, phone, FAQ) appears in the same relative order on every page where it exists
- Text scales to 200% and reflows at 400% / 320 px without clipping; motion honours `prefers-reduced-motion`; `lang` set on `<html>`

### Data and state

- One typed API module in `lib/`; components never call `fetch` with hand-built URLs
- Type responses; validate at the boundary when the data is not under your control
- Handle slow, failed and empty responses; cancel or ignore stale requests; no duplicate requests for the same data on one screen
- Mock data lives in `mocks/`, is labelled, and swaps for the real API through one switch

### Forms

- Client validation is for speed, never for security; the server must validate too
- Errors next to the field, in words, after the user has tried; keep what they typed
- Submitting: disable the button, show progress, prevent double submission
- Submission errors are shown with a retry; success is confirmed
- Correct input types and `autocomplete` values

### Auth (only when login is required)

- Use the project's existing auth or the provider the user names; never hand-roll crypto or sessions
- Prefer server-set `HttpOnly`, `Secure`, `SameSite` cookies; avoid long-lived tokens in `localStorage`
- Guard private routes, redirect to login and back, handle expired sessions
- Hiding a button is not authorisation; the server enforces permissions

### Errors

A real 404 page and a top-level error boundary (or framework error page) with a way back. User-facing messages say what happened and what to do; details go to the console or a logger.

### Animation

Motion must explain something: where an element came from, what changed, what is loading. Decorative or looping motion with no job is removed, not polished.

`references/motion.md`, next to this file, holds the tokens, three motion levels and twelve paste-ready recipes (hover and press, menu and dialog open/close, reveal once on scroll, staggered entrance, accordion, tab indicator, skeleton, toast, theme cross-fade, page and view transitions, scroll-driven hero, count-up), each with reduced motion built in. Pick the level first and name it in the plan and the report:

| Level | Use for |
|---|---|
| `minimal` | Paper & Ink, Gallery, Brass, Pewter; reading-heavy pages, dense tools, "no animation" requests: hover, press, focus, open/close, skeletons only |
| `functional` (default) | Harbour, Forest, Terracotta, Midnight, Dusk and any app: minimal plus reveal-once, accordion and tab indicators, toasts, theme cross-fade |
| `expressive` | Birch, Citrus, landing and launch pages, or when asked: functional plus staggered hero entrance, scroll-driven hero, view transitions, count-ups |

- Use the motion tokens from step 6; no ad-hoc durations or easings
- Use the recipes as written; implement in this order and stop at the first that works: CSS transitions and keyframes (hover, focus, open and close, skeletons) → the View Transitions API for page and list changes where supported → a library only for orchestration, gestures, layout or shared-element animation: `motion` in React, GSAP for complex timelines and scroll choreography, dotLottie for designer-made vector animations (the reference's library table says when each is justified)
- Animate `transform` and `opacity` only; never `width`, `height`, `top`, `left` or shadows in a loop. `will-change` only on elements about to animate, removed afterwards.
- Scroll-driven animation: CSS scroll-driven animations where supported, otherwise IntersectionObserver; never the scroll event. Reveal-on-scroll runs once, and the content is visible without JavaScript.
- Budget: entrances at most 400 ms, micro-interactions 100 to 250 ms, one animated focal point per view, nothing that delays the user's next action
- `prefers-reduced-motion: reduce` removes movement and leaves short fades or nothing; anything that autoplays for more than 5 s has a pause control

### 3D

Use 3D only when it is the content (a product, a model, a space, a data visualisation) or the user asks for it. A 3D hero on a page about something else is decoration (step 6).

| Need | Approach |
|---|---|
| Tilt, flip, parallax, card depth | CSS 3D transforms and `perspective`; no library |
| Show a model the user can rotate | `<model-viewer>` with a glTF/GLB file: lazy loading, poster image and AR built in |
| An interactive scene | `three` with `@react-three/fiber` and `@react-three/drei` in React; plain `three` elsewhere |
| A designer-made scene | Export it (Spline, or Blender to glTF) and load it; do not rebuild it by hand |

- Lazy-load the scene and its library off the critical path; show a poster image or skeleton until ready and keep it on failure or without WebGL
- Models: glTF/GLB, Draco or Meshopt compressed, textures at most 2048 px, about 5 MB total on a page people visit cold; state the size in the report
- Cap `devicePixelRatio` at 2; render on demand or pause when off-screen or the tab is hidden; dispose geometries, materials and textures on unmount
- Test at 375 px with CPU throttling; if it stutters, ship the poster image on mobile
- Reduced motion: no auto-rotate or camera flythrough; the scene is still until the user interacts
- The canvas has an accessible name and a text alternative; nothing essential exists only inside the scene; keyboard focus is never trapped in it

### Favicon and app icons

Every project ships its own icon; the scaffold default is boilerplate.

- Source: one `favicon.svg`. Use the user's logo if supplied; otherwise make a simple original mark (an initial or plain shape in the primary token colour on a rounded square) and say so in the report. Never copy a third-party logo or a well-known mark.
- It must read at 16 px: one shape, strong contrast, no thin lines, at most two characters. For dark tabs, embed `@media (prefers-color-scheme: dark)` styles inside the SVG.
- Generate from the SVG with `sharp` and `png-to-ico` (dev dependencies, or run once and delete):
  ```
  node -e "const s=require('sharp'),ico=require('png-to-ico').default;Promise.all([16,32,48,180,192,512].map(n=>s('favicon.svg').resize(n,n).png().toFile('icon-'+n+'.png'))).then(()=>ico(['icon-16.png','icon-32.png','icon-48.png'])).then(b=>require('fs').writeFileSync('favicon.ico',b))"
  ```
  Then rename: `icon-180.png` → `apple-touch-icon.png` (give it an opaque background; iOS ignores transparency), keep `icon-192.png` and `icon-512.png` for `site.webmanifest` (512 also as `maskable` with safe padding), delete the 16/32/48 PNGs.
- Head tags: `<link rel="icon" href="/favicon.ico" sizes="32x32">`, `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, `<link rel="manifest" href="/site.webmanifest">`, `<meta name="theme-color">` per colour scheme
- Placement: Vite and Astro in `public/`; Next.js App Router uses `app/icon.svg`, `app/apple-icon.png` and `app/manifest.ts` and writes the tags itself
- The Open Graph image is a separate 1200×630 image, not the favicon

### SEO (public sites only; skip for private apps and dashboards)

Unique `<title>` and meta description per page; canonical URL where relevant; semantic headings; Open Graph and Twitter card tags with an image; `robots.txt`; a sitemap for multi-page sites; structured data (JSON-LD) when the content type has a schema (article, product, organisation, event). Indexable content is rendered on the server or at build time.

### Internationalisation (only when more than one language is needed)

No hard-coded user-facing strings; the framework's i18n library and message files; `Intl` for dates, numbers and currency; logical CSS properties (`margin-inline`) for right-to-left.

### Security

| Variable kind | Prefix | Where it may appear |
|---|---|---|
| Public (API base URL, public keys, feature flags) | `VITE_*`, `NEXT_PUBLIC_*`, `PUBLIC_*` | Client code, build output |
| Private (API secrets, service-role keys, database URLs, signing secrets) | No public prefix | Server, serverless functions, CI only. Never in client code, never in the bundle. |

- Anything shipped to the browser is public. If a task seems to need a secret in the client, stop and say so (step 4).
- Add `.env.example` with public variables and placeholders; keep `.env*` in `.gitignore`; before finishing, grep the diff for keys and tokens
- Never render untrusted HTML (`dangerouslySetInnerHTML`, `v-html`, `innerHTML`) without sanitising
- URLs: reject `javascript:` and unexpected schemes in user-supplied links; validate redirect targets; `rel="noopener noreferrer"` on external links in new tabs
- Run the package manager's audit after adding dependencies; report high-severity findings; do not auto-apply breaking fixes
- Frontend validation and hidden UI are never security controls

### Security headers

A page that runs is not the same as a page that cannot be framed, sniffed or injected. Set the baseline in the host's header configuration (or Next.js `headers()` / middleware), never only in a comment:

- `Content-Security-Policy` starting from `default-src 'self'`, allowing only the origins the page uses; nonce or hash for inline scripts, never `unsafe-eval`
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`
- `integrity` and `crossorigin` on third-party scripts and styles; no analytics or marketing tag before consent
- GitHub Pages cannot set response headers; do not claim CSP or HSTS there without a CDN or proxy

`references/security-headers.md` has the baseline, a report-only rollout, Next.js and Astro sketches, and host snippets for Vercel, Netlify, Cloudflare and GitHub Pages. Verify with `curl -sI` and the browser console; a policy that breaks the page is a bug, not a win.

### Observability, analytics and consent

The default is no analytics and no third-party tracking. When the user asks for observability:

- Keep the top-level error boundary, report through one provider adapter, scrub PII, and keep source maps private
- Send Web Vitals (LCP, INP, CLS, TTFB) to the project's analytics or RUM; targets are in step 8
- Write a short typed event plan before adding a tag manager; name events for what the user did, not the widget that was clicked
- Consent categories are necessary, analytics and marketing, default denied. Do not load analytics or marketing before a choice; provide reject as easily as accept, and a privacy page
- Never put emails, names, tokens or full form values in an event

`references/observability.md` has the adapter, Web Vitals, event-map, consent and verification patterns. Verify in the network panel with consent denied and accepted; code that compiles is not evidence.

## 8. Performance

Targets on a mid-range phone: Largest Contentful Paint at or under 2.5 s, Interaction to Next Paint at or under 200 ms, Cumulative Layout Shift at or under 0.1. Measure before optimising; fix the largest cost first.

- Dependencies: no library for one function; check the build output for unexpectedly large chunks and say what is in them
- Images: modern formats, correct dimensions, `width` and `height` set, lazy-load below the fold, prioritise the hero
- JavaScript: split by route, lazy-load heavy components; in Next.js keep components server-rendered unless they need browser APIs or interactivity
- Rendering: avoid re-renders from unstable props and context that changes on every render; no API requests in loops or on every keystroke without debouncing
- Loading: no render-blocking scripts or stylesheets that are not needed for the first paint; avoid layout shift from late fonts, images and banners
- Motion and 3D: compositor-only properties; animation and 3D libraries, models and Lottie files lazy-loaded off the critical path and within the budgets in step 7
- Budgets: write the numbers in the repository and make them fail CI — Lighthouse CI for LCP, CLS and accessibility, a bundle-size gate for the first route, and a visual regression gate for the layouts people see. `references/quality-gates.md` has the configs and failure policy.
- Measure before optimising and after the fix; report the numbers, not the intention. A budget that lives only in a chat message is not a gate.

## 9. Tests

Prefer the project's existing tools. For a new project use the stack chosen in step 3. Do not write tests that only assert a component renders, and do not weaken an assertion to make it pass. Tests must be able to fail.

| Level | Write for | Skip for |
|---|---|---|
| Unit | Utilities, formatters, validators, non-trivial business logic, API mappers | Trivial wrappers |
| Component | Forms, interactive components, important UI states (loading, error, empty) | Static presentational components |
| End-to-end | Critical journeys: sign-in, checkout or payment, the main create/edit flow, primary navigation; a smoke test that each main page loads without console errors | Everything else |

- Add Playwright screenshot baselines for the pages people see at desktop and mobile, plus dark mode when both ship. Review the diff before updating a baseline; never update one just to make a red run green.
- Add axe to the end-to-end suite (`@axe-core/playwright`) and fail on serious or critical violations; it complements the keyboard walk, it does not replace it.
- Run the same tests in CI. A test that only runs on the author's machine is a suggestion. `references/quality-gates.md` has the configs and CI wiring.

## 10. Verify

Eight categories. Run what you can, fix what you find, and report each one honestly. If a tool or command is unavailable: say exactly what was not verified, do not fabricate a result, and give the command the user can run.

| Category | What it covers | Typical command |
|---|---|---|
| Code | Lint and format pass; no dead code, debug output, TODOs presented as done, or secrets in the diff | project `lint`; the skill's `scripts/verify.sh`; review `git diff` |
| Types | Typecheck passes | `tsc --noEmit` or the project script |
| Build | Production build succeeds; bundle sizes reviewed | `npm run build` (or the manager's equivalent) |
| Tests | Existing and new tests pass | project `test`; `npx playwright test` |
| Browser | App runs; routes open; console and network clean; interactions, states, forms and navigation work at desktop and mobile widths | dev or preview server plus a browser tool or Playwright |
| Visual | Screenshots at 375 and 1280 wide (light and dark if both ship) read by you: layout, spacing and typography consistent; nothing clipped or overflowing; animations and 3D settle as intended, honour reduced motion and show their poster until loaded; the tab icon renders | `npx playwright screenshot --viewport-size=375,812 <url> mobile.png` |
| Accessibility | Automated scan plus a keyboard walk, WCAG 2.2 AA | `npx @axe-core/cli <url>` plus the checks in `references/accessibility.md` |
| Delivery | CI ran and passed; PR opened under the user's identity; preview or deployed URL smoke-checked; security headers present; consent behaves | `gh pr checks`; `curl -sI`; browser on the deployed URL |

Optional for public sites: `npx lighthouse <url> --only-categories=performance,accessibility,best-practices,seo`; report the scores and fix clear failures.

Pre-existing failures found in step 1 are reported as such, not as yours and not as fixed.

### Browser verification

When a browser tool or Playwright is available: start the app; open every important route at 1280x800 and 375x812; read console errors and warnings; check the network panel for failed requests (4xx, 5xx, CORS, mixed content); exercise the main interactions (navigation, forms with valid and invalid input, submit, dialogs, menus); trigger loading, error and empty states (throttle, block or mock the API); run through the responsive list in step 7; confirm the favicon, manifest and any model or Lottie file load without 404s. Fix what you find and re-check.

When it is not available, write exactly this in the report:

```
BROWSER VERIFICATION: NOT AVAILABLE
```

followed by manual steps the user can run: the command to start the app, the URLs to open, what to look for on each, which interactions to try, and which viewport widths to test.

### Accessibility verification

Semantic HTML existing in the code is not verification. When a browser is available: tab through every page (order logical, focus visible, no traps, sticky elements do not cover focus); Enter and Space activate buttons, Enter activates links; Escape closes dialogs and focus returns to the trigger; arrow keys move within menus and tabs; forms announce labels and errors; allow paste and password managers; check 24 px pointer targets and 44 px touch targets; test any drag interaction with a single pointer; zoom to 200% and reflow at 400% / 320 px without clipping; reduced motion honoured (emulate `prefers-reduced-motion: reduce` and confirm nothing travels); contrast checked twice, the tokens with `scripts/check-contrast.js` and the rendered pages with axe. Run the axe scan and fix serious and critical issues. When no browser is available, report the review as code-level only. `references/accessibility.md` has the 2.2 criteria and component checks.

### Delivery verification

When the user asked for GitHub, CI or a deployment:

- Run the skill's `scripts/verify.sh --install` against the project (`sh <skill>/scripts/verify.sh --install <project-dir>`) and report each line. It runs the project's own lint, format, types, tests, build and Playwright scripts and skips what is not defined.
- Open the PR and wait for CI: `gh pr checks --watch` or `gh run watch`. A green check means the workflow ran; no workflow means "CI not configured", not "passed".
- Read the headers from the deployed or preview response with `curl -sI`; confirm the CSP does not break the console and that HSTS is not set on localhost. GitHub Pages cannot set custom headers; say so.
- With consent denied, confirm no analytics or marketing request fires; with consent accepted, confirm the event fires once.
- Open the deployed URL, a deep link and a missing path. Check assets, console, network and the base path.
- Confirm the commits are authored by the user and have no bot trailer: `git log --format='%an <%ae>%n%b' origin/main..HEAD`.
- If any of this was not run, write `not run` with the command. Never claim a CI run, preview or deployment that does not exist.

Stop any server you started. Delete screenshots and temporary files unless the user wants them.

## 11. Failure recovery

When something fails: diagnose from the actual error, identify the root cause, fix it, re-run the verification that failed, then report the result. Do not retry the same command unchanged more than twice; change the approach or isolate the cause.

When blocked by missing credentials, an unavailable service or tool, or a decision only the user can make: name the blocker, finish everything that can be completed safely, and list what remains.

| Symptom | Likely cause |
|---|---|
| Install or build fails on syntax inside a dependency | Node older than the tool requires; check `engines` and `.nvmrc` |
| Port already in use | Another dev server; use the next port or stop the one you started |
| Tailwind classes have no effect | Plugin or `@import "tailwindcss"` missing; content paths wrong in older versions |
| Works in dev, blank page in production | Wrong `base` path, missing SPA fallback, or an env variable unset at build time |
| Hydration mismatch warnings | Server and client render differently (dates, random values, `window` access) |
| API calls blocked in the browser | CORS on the API, or a mixed http/https request; fix on the server or use a dev proxy |
| Deep links 404 after deploy | SPA fallback not configured on the host; on GitHub Pages, copy `index.html` to `404.html` |
| Tests pass locally, fail in CI | Timezone, locale, missing env variable, or a timing-dependent test; reproduce with `npm ci` and the CI Node version |
| 3D canvas blank or "WebGL context lost" | No GPU in a headless browser, too many contexts, or a disposed scene; test in a real browser and keep the poster fallback |
| `gh: not logged in` or wrong account | The GitHub CLI session is missing or belongs to someone else; ask the user to authenticate, never use another token |
| Push rejected by a protected branch | Direct push to `main`; push the feature branch and open a PR, do not disable protection |
| CI cannot find a script or lockfile | The workflow assumes npm while the project uses pnpm, yarn or bun, or the lockfile is not committed; match the package manager and commit the lockfile |
| Pages loads without CSS/JS or 404s on deep links | Wrong base path or missing SPA fallback; set the base for a project page and rebuild |
| CSP blocks a script, font or API call | An origin is missing from `script-src`, `font-src` or `connect-src`; add the exact origin, never `*` or `unsafe-eval` |
| Analytics fires before consent | The tag is loaded at module top level; load it only after the consent decision |
| Visual test fails on every run | Fonts, animations or device scale differ; wait for fonts, disable animations, then update the baseline deliberately |

## 12. Prepare for delivery and deploy

Delivery is optional. Always record what the host needs; commit, push, open a pull request or deploy only when the user explicitly asks. When you do, the identity rule is not optional: the commit author and committer are the user, never a bot.

### GitHub delivery

1. **Preflight.** Check `git status --short`, `git remote -v`, the default branch, `gh auth status` and `gh api user --jq .login`. Confirm `git config user.name` and `git config user.email`. If either is missing or belongs to someone else, stop and ask. Never install or authenticate `gh` silently, and never use another account.
2. **Branch.** `git switch -c feat/<slug> origin/main`. Use `fix/`, `refactor/`, `chore/` or `docs/` for the other change types.
3. **Commit.** Stage only the intended files; run `git diff --cached`, `git diff --check` and a secret scan. The message is imperative and explains why. No `Co-Authored-By` bot trailer and no "generated by" footer. Check before pushing: `git log --format='%an <%ae>%n%b' origin/main..HEAD`.
4. **Push and PR.** `git push -u origin feat/<slug>`, then `gh pr create --base main --head feat/<slug> --title ... --body-file ...`. The PR body carries the summary, the eight verification categories, screenshots, backend/environment notes, risks and rollback. Do not merge unless asked.
5. **CI.** Copy `assets/github/ci.yml` to `.github/workflows/ci.yml`, adjust the output paths and package manager, and commit it with the feature. Wait for the checks (`gh pr checks --watch`); read the failed log and fix the cause. Never disable a check or weaken an assertion to get green.
6. **Pages.** Static only. Copy `assets/github/pages.yml`, set the framework base path for a project page (`/<repo>/`), and keep the `404.html` fallback. In the repository: Settings → Pages → Source: GitHub Actions. Next.js SSR and API routes need a Node host, not Pages. GitHub Pages cannot set security headers; state that limitation.
7. **Merge, tag, deploy.** Only when asked. Merge with the repository's convention, delete the branch, and tag `v<version>` only when the version matches. Smoke-check the deployed URL, a deep link and a missing path.

`references/github-delivery.md` has the exact commands, the PR body template, the identity checks, the Pages rules and the failure table.

### Host deployment

| Stack | Build command | Output | Framework-specific |
|---|---|---|---|
| Plain HTML | none | project root | - |
| Vite | `npm run build` | `dist` | Set `base` if not served from `/`; SPA fallback for client routing |
| Astro | `npm run build` | `dist` | SSR needs the host's adapter; static needs none |
| Next.js | `npm run build` | `.next` via the host adapter; static export uses `out` | Needs a Node host or adapter unless statically exported; image optimisation needs a loader on static hosts |

- SPA fallback: serve `index.html` for unknown routes (`_redirects` with `/* /index.html 200` on Netlify and Cloudflare Pages, a rewrite in `vercel.json`, or the host's equivalent). On GitHub Pages, copy `index.html` to `404.html`.
- List every environment variable, marked public or private, and which are needed at build time
- State the Node version the build needs
- Add the security headers from `references/security-headers.md` to the host config and verify them on the deployed response
- Common risks: env variables set at runtime but needed at build; wrong output directory; missing fallback; free plans that sleep or restrict commercial use (tell the user to check the plan's current terms rather than asserting them); secrets in the repo; a CSP that blocks the API, fonts or analytics
- Update the project README with run, build and deploy instructions
- No commits, pushes, hosting projects or deploys unless asked. If asked and the tooling is present: build locally first, run the skill's `scripts/verify.sh --install`, confirm env variables are set on the host, deploy to a preview or staging target if the host has one, smoke-check the deployed URL and headers, then promote.

## 13. Verification report

End every run with this report. Keep each line short; omit a section only if it is truly empty, and say so.

```
PROJECT
Framework:
Language:
Styling:
Theme: (name from references/themes.md, derived from brand, or existing tokens; modes shipped)
Motion: (minimal | functional | expressive, and which recipes were used)
Design: (direction chosen: hero, nav, rhythm, cards, buttons, type, imagery; the two alternatives offered; path of docs/design.md)
Testing:
Build tool:
Repository: (remote and default branch, or "not a Git repository")

IMPLEMENTED
- ...

VERIFIED
- Code:
- Types:
- Build:
- Tests:
- Browser:
- Visual:
- Accessibility:
- Delivery:

NOT VERIFIED
- ... (what, why, and the command to run manually)

PRE-EXISTING ISSUES
- ...

KNOWN LIMITATIONS
- ... (including anything mock or placeholder, and how to replace it)

BACKEND DEPENDENCIES
- ... (each with its contract location)

ENVIRONMENT VARIABLES
- NAME (public|private, build-time|runtime): purpose

GIT
- Branch:
- Commit:
- PR:
- CI: (workflow and result, or "not configured")
- Preview:
- Deployed:

DELIVERY
- Security headers:
- Analytics and consent:
- Error reporting:
- Privacy page:

DEPLOYMENT NOTES
- build command, output directory, fallback, Node version, risks
```

## Definition of done

- [ ] Project classified; existing conventions followed, or the stack choice stated with a reason
- [ ] Colour theme named (existing tokens, derived from brand, or one from the library); contrast checked in every shipped mode
- [ ] Design direction composed and written to `docs/design.md`, with reasons, two alternatives offered, and no repeat of a previous direction in the workspace
- [ ] Motion level named; every animation uses the tokens and honours reduced motion (checked in the browser, not assumed)
- [ ] Code, types, build and tests pass (pre-existing failures reported, not hidden); the skill's `scripts/verify.sh` run or its gaps reported
- [ ] Browser, visual and accessibility checks run to WCAG 2.2 AA, or reported as not available with manual steps
- [ ] Security headers set and verified on the response, or the host limitation stated (GitHub Pages cannot set them)
- [ ] Error boundary present; analytics and consent configured or explicitly not needed; no PII in events
- [ ] Loading, empty, error and success states exist on every async view
- [ ] Backend dependencies named, with contracts; nothing faked as working
- [ ] No secrets in client code; `.env*` ignored; `.env.example` present
- [ ] No scaffold boilerplate (including the default favicon), dead code or unlabelled mock data
- [ ] CI workflow added and green; PR opened under the user's identity with no bot trailer, or delivery reported as not requested or not available
- [ ] README and deploy settings current; verification report produced

## Rules

- Existing project conventions beat this skill's defaults
- Match effort to the task size; do not rebuild what was not asked for
- Prefer the simplest solution that meets the requirements: no library, store, abstraction, component, animation or design system the task does not need; no framework migration without the user asking
- Do not fake backend behaviour; do not present mocks as real
- No secrets in client code, ever
- No commits, pushes or deploys unless asked
- When asked to commit or open a PR: the author and committer are the user, never a bot; no `Co-Authored-By` bot trailer, no force-push to a shared branch, no direct push to `main`, no merge unless asked
- No analytics or marketing request before consent; no PII in events
- Never claim a CI run, deployment or header check you did not run
- A frontend that has not been built and run is not finished

## Appendix: theme tokens (single-file fallback)

Use this only when `references/themes.md` is not next to this file. The reference has the same values with fonts, shadows, usage notes and wiring; prefer it. Columns are in the order of the CSS variable names (`--background`, `--foreground`, …, `--warning-foreground`); `input` is the form-control outline, `ring` the focus ring (drawn with a 2px offset in `background`). Every row passed `scripts/check-contrast.js` when generated.

| Theme | Mode | background | foreground | surface | muted | muted-foreground | border | input | primary | primary-foreground | accent | accent-foreground | ring | danger | danger-foreground | success | success-foreground | warning | warning-foreground |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Birch | light | #fafaf7 | #16181a | #fefefc | #eeede8 | #5b5f64 | #d8d7d0 | #90908d | #0e7a50 | #effbf4 | #b8431a | #fff6f0 | #15996a | #b01f45 | #fdf2f4 | #4a7a12 | #eefaf1 | #8c5a0a | #fdf6e8 |
| Birch | dark | #121416 | #e8e8e3 | #1a1d20 | #24282c | #9ea3a8 | #343a3f | #666b6d | #4fd198 | #05231a | #f28a5c | #2a140a | #66dcaa | #f27d8a | #2a0c11 | #a6d65c | #07251a | #e9b24f | #291a05 |
| Paper & Ink | light | #f8f4ec | #221e1a | #fdfaf4 | #ebe5da | #675e55 | #dcd3c5 | #928b81 | #3d5a73 | #f4f8fb | #a2381d | #fdf6ee | #4f7596 | #ab1f4a | #fdf2f4 | #3f6b34 | #f3f8ee | #8a5a0b | #fdf6e8 |
| Paper & Ink | dark | #1a1612 | #ece4d6 | #221d18 | #2e2822 | #a89e90 | #3a332b | #716a60 | #8fb0c9 | #14181c | #e07a60 | #1f1410 | #a3c2d8 | #ec7d9e | #1f1114 | #96c284 | #141a0f | #e0a94a | #1f1608 |
| Pewter | light | #f1f4f7 | #1a2430 | #fafbfc | #e2e7ec | #52616e | #c9d2da | #838c96 | #2b4d50 | #eefafb | #a4408f | #fdf2fa | #1a8d97 | #b52f45 | #fff3f4 | #1c7049 | #ecfaf1 | #8f5a12 | #fff7e8 |
| Pewter | dark | #10161c | #e3e9ee | #171f26 | #222c35 | #97a6b3 | #303d49 | #606b76 | #45adb5 | #07242a | #c97fb6 | #2a0f24 | #5ec4cc | #e8707c | #2c0a10 | #5cc08a | #08261a | #e3a84a | #2b1a04 |
| Forest | light | #f2f3e4 | #1c261f | #fafbf4 | #e4e7d2 | #55604f | #cdd2b8 | #868d7b | #2e5c3b | #f5f1e6 | #b07d22 | #1f1706 | #3f7a50 | #ad2a3c | #fbf4ee | #3f7a28 | #f3f8ee | #9c4a0e | #fbf5e8 |
| Forest | dark | #111a14 | #e9e4d5 | #192319 | #243126 | #a7b19f | #34433a | #656e64 | #86bd8f | #0f1b13 | #d8a94f | #1f1706 | #9bd1a5 | #ec7f88 | #2b100b | #a6d66a | #112009 | #f08a3c | #261b06 |
| Terracotta | light | #f4ecdf | #2b211a | #fbf6ee | #e9dece | #66554a | #d8c9b4 | #918475 | #a8432a | #fdf6ee | #6b6e27 | #f6f6ea | #c4552f | #b01f48 | #fdf2f0 | #3d6e3c | #f0f7ee | #8f5c0f | #fdf6e8 |
| Terracotta | dark | #1c1613 | #f1e8db | #262019 | #332b23 | #a89b8b | #4a3f35 | #756b60 | #e07b55 | #2b1711 | #c2c768 | #23240a | #ea8a64 | #f27d95 | #2e0f0e | #79b07e | #0f2612 | #e0a94a | #2a1b05 |
| Midnight | light | #f2f6f9 | #041b2f | #fafcfd | #dde8ef | #455f77 | #bccbd6 | #7d8f9d | #006a7e | #f0fbfc | #577600 | #f7faef | #00869c | #be2132 | #fff6f5 | #007840 | #f2fbf5 | #975800 | #fef8ed |
| Midnight | dark | #06132a | #e2edf2 | #071c2f | #112c42 | #90a9b9 | #263b4d | #596b7a | #38c3d2 | #01151b | #a9d64a | #121904 | #5fdbe8 | #fd7e82 | #230708 | #56db8f | #021709 | #fab549 | #231200 |
| Harbour | light | #f4f8fb | #15252f | #fbfdfe | #dde7ee | #4d6273 | #c6d4de | #81909a | #205a9a | #f4f9fc | #0f7a6c | #f2faf8 | #2e6fb5 | #b42d3a | #fdf4f4 | #2c7836 | #f1faf5 | #8a5a0e | #fdf7ec |
| Harbour | dark | #0d1a24 | #e4edf3 | #15252f | #1f333f | #9bb0bf | #2f4656 | #5e717f | #6facea | #0b1b27 | #4fc3ae | #06201a | #86bdf0 | #f08c92 | #2a0b0e | #74d27f | #06271a | #e8b45c | #2b1d05 |
| Citrus | light | #fff8ec | #3b1f42 | #fffcf5 | #f7e8cc | #6e5473 | #e8d5b4 | #a18a85 | #a84e00 | #fffaf0 | #7a3fb0 | #f8f3ff | #cf5f08 | #bb2449 | #fff5f0 | #33791f | #f3fbe9 | #855f00 | #fff8e1 |
| Citrus | dark | #1a1120 | #f6ecdc | #251a2b | #332539 | #b9a6bf | #3f3046 | #746772 | #f0954f | #2a1430 | #c49bf0 | #24103a | #f6a85e | #f5788f | #2d0f0c | #86d06a | #15260c | #f5cc4f | #2e2000 |
| Gallery | light | #f9f8f5 | #1c1b18 | #fefdfb | #e9e6df | #625f58 | #dad7d0 | #908e88 | #141311 | #f9f8f5 | #1446a0 | #f9f8f5 | #1446a0 | #b4281e | #fdf6f4 | #3d6b2c | #f4f8ef | #8c5a0c | #fdf7ec |
| Gallery | dark | #141311 | #ece9e3 | #1c1b18 | #2a2825 | #a39f96 | #353330 | #6a6864 | #f0ede7 | #141311 | #6190f2 | #141311 | #6f9af7 | #ee7f6e | #1d0e0b | #8dc283 | #121a0c | #e3a84e | #1e1507 |
| Dusk | light | #f8f4f5 | #2b2229 | #fdfafb | #eae1e5 | #6a5a63 | #d9ccd2 | #958a90 | #7a4a6a | #fdf7f6 | #c4724a | #2c1710 | #8e5a7f | #b23f45 | #fdf7f6 | #3f7355 | #fdf7f6 | #93601e | #fdf7f6 |
| Dusk | dark | #1a1418 | #f1e8ec | #241c22 | #322730 | #ab9ba3 | #3d313a | #73686f | #cf9bbb | #2a1a24 | #e8ab86 | #2c1a12 | #d9a8c8 | #e2868a | #2a1214 | #8fbf9d | #122018 | #e6b84f | #2a1d0a |
| Brass | light | #f6f1e7 | #1e1b17 | #fcfaf5 | #ebe3d3 | #675d50 | #d5cab5 | #91897b | #7a5c10 | #fbf6ea | #1c4a3a | #eef3ee | #9c7620 | #9c1f38 | #fcf1ee | #3d6b2a | #eef5ee | #9a4a0c | #fff3e6 |
| Brass | dark | #141210 | #ede6d6 | #1e1a16 | #2b2620 | #a89e8c | #3a332a | #6e675c | #c9a650 | #1a1610 | #5aa58c | #0f1a15 | #d9b865 | #e8707a | #2a1210 | #86bb84 | #0f1f14 | #f0862e | #2a1a08 |

| Theme | Heading / body font | Radius sm / md / lg | Card shadow |
|---|---|---|---|
| Birch | Bricolage Grotesque / Figtree | 8px / 12px / 16px | soft |
| Paper & Ink | Fraunces / Source Serif 4 | 2px / 4px / 6px | none |
| Pewter | Instrument Sans / Public Sans | 2px / 4px / 6px | none |
| Forest | Lora / Work Sans | 4px / 8px / 12px | soft |
| Terracotta | Fraunces / Nunito Sans | 6px / 10px / 16px | soft |
| Midnight | IBM Plex Mono / IBM Plex Sans | 4px / 6px / 10px | none |
| Harbour | Libre Franklin / Source Sans 3 | 4px / 6px / 10px | soft |
| Citrus | Red Hat Display / Red Hat Text | 8px / 12px / 20px | soft |
| Gallery | Archivo / Archivo | 0px / 2px / 4px | none |
| Dusk | Bodoni Moda / Albert Sans | 10px / 14px / 20px | soft |
| Brass | Cormorant Garamond / Jost | 0px / 2px / 4px | none |

Wiring without the reference: put the light row in `:root` and the dark row in `.dark` as `--background: …;` custom properties, add `--font-heading`, `--font-body`, `--radius-sm/md/lg` and `--shadow-card`, map them once in Tailwind v4 with `@theme inline { --color-background: var(--background); … }` plus `@custom-variant dark (&:where(.dark, .dark *));`, and set the `.dark` class on `<html>` from a blocking inline script in `<head>` (Next.js: `<html suppressHydrationWarning>`). Focus: `outline: 2px solid var(--ring); outline-offset: 2px`.

Inline contrast check when `scripts/check-contrast.js` is missing (same hard rules: text pairs 4.5:1, UI pairs 3:1; `tokens.json` is `{"light": {...}, "dark": {...}}` with camelCase keys):

```bash
node -e 'const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const L=h=>{const n=parseInt(h.slice(1),16);return[16,8,0].map(s=>{let c=((n>>s)&255)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0)};const R=(a,b)=>{const x=L(a),y=L(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};const P=[["foreground","background",4.5],["foreground","surface",4.5],["foreground","muted",4.5],["mutedForeground","background",4.5],["mutedForeground","surface",4.5],["mutedForeground","muted",4.5],["primaryForeground","primary",4.5],["accentForeground","accent",4.5],["dangerForeground","danger",4.5],["successForeground","success",4.5],["warningForeground","warning",4.5],["primary","background",4.5],["primary","surface",4.5],["danger","background",4.5],["danger","surface",4.5],["success","background",4.5],["warning","background",4.5],["accent","background",3],["ring","background",3],["ring","surface",3],["ring","muted",3],["input","surface",3],["input","background",3]];let ok=true;for(const m of ["light","dark"])if(t[m])for(const[f,b,q]of P){if(!t[m][f]||!t[m][b])continue;const r=R(t[m][f],t[m][b]);if(r<q){ok=false;console.log(m,f,"on",b,r.toFixed(2),"<",q)}}console.log(ok?"PASS":"FAIL");process.exit(ok?0:1)' tokens.json
```
