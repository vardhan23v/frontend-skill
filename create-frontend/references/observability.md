# Observability, analytics and consent

Companion to the Errors and Security sections of step 7, the performance work in step 8 and the Delivery check in step 10 of `SKILL.md`. Read it when the user asks for error tracking, analytics, Web Vitals reporting or a cookie banner.

The default is no analytics and no third-party tracking. Add observability when the user asks for it, keep it small, and make consent a real gate rather than a banner that changes nothing.

## What to add, in order

| Need | Add | Do not add |
|---|---|---|
| Know when the UI crashes | A top-level error boundary with a retry, plus error reporting when the user has a service | A silent `catch` that logs to the console |
| Know when real users are slow | Web Vitals (LCP, INP, CLS, TTFB) sent to the project's analytics or RUM | A dashboard nobody reads |
| Understand a funnel | A short event plan with named events and typed properties | A tag for every click |
| Legal compliance | Consent categories, a privacy page and a retention policy | A banner that loads analytics before "Accept" |
| Debug a release | Source maps uploaded privately and a release/version tag | Public source maps and secrets in the bundle |

## Error reporting

Use the provider the user names. If there is no provider, use a small adapter behind one interface and report it as not configured; do not hard-code a vendor SDK into every component.

```ts
// src/lib/observability/report.ts
export type ErrorContext = {
  route?: string;
  release?: string;
  userId?: string; // only an opaque id, never an email or name
};

export function reportError(error: unknown, context: ErrorContext = {}) {
  if (import.meta.env.DEV) {
    console.error(error, context);
    return;
  }
  // Provider adapter (Sentry, GlitchTip, ...) or a no-op when none is configured.
}
```

Rules:

- Initialise error reporting before the app renders, with the environment and a release identifier.
- The DSN or public key is not a secret; a server-side auth token is. Never put a write token in the client.
- Scrub PII before sending: no emails, names, tokens, passwords, full URLs with query strings, or form values.
- Sample in production (for example 10–25% of traces) and keep 100% of unhandled errors.
- Upload source maps privately during CI; do not publish them in the build output.
- The fallback UI says what happened, offers retry or home, and shows a short reference id the user can quote.
- Route-level boundaries keep one broken page from taking down the shell.

## Web Vitals

Use the `web-vitals` package or the browser's PerformanceObserver; do not hand-roll thresholds.

```ts
import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';

const send = (metric: { name: string; value: number; id: string }) => {
  // Send only after consent when analytics consent is required.
  navigator.sendBeacon?.('/api/vitals', JSON.stringify(metric));
};

onCLS(send);
onINP(send);
onLCP(send);
onTTFB(send);
```

Targets on a mid-range phone: LCP at or under 2.5 s, INP at or under 200 ms, CLS at or under 0.1. These are field targets; Lighthouse is a lab proxy and cannot measure INP reliably.

## Event plan

Write the events before adding a tag manager. A small typed map prevents "clicked_button_2".

```ts
// src/lib/analytics/events.ts
export type AnalyticsEvent =
  | { name: 'signup_started'; props: { source: 'hero' | 'pricing' } }
  | { name: 'signup_completed'; props: { plan: 'free' | 'team' } }
  | { name: 'waitlist_submitted'; props: { tier: 'solo' | 'team' } }
  | { name: 'checkout_failed'; props: { reason: 'card' | 'network' } };
```

Rules:

- Name events for what the user did, not how the UI is built (`signup_completed`, not `green_button_click`).
- Properties are typed and small; never send free text from an input.
- No PII: no email, name, address, phone, precise location, or full URL with a query string.
- Do not send an event for every hover, scroll or keystroke; sample or aggregate.
- Keep one analytics module; components call it, they do not call `gtag`, `posthog` or `plausible` directly.
- Ad blockers and privacy browsers will drop some events; do not make product decisions on a single day of data.

## Consent

Consent is a product and legal decision, not a UI decoration. The skill sets a safe default; the user or their lawyer confirms the jurisdiction.

1. Categories: **necessary** (always on), **analytics**, **marketing**. Do not bundle analytics and marketing into one switch.
2. Default is denied for analytics and marketing. Do not load those tags before a choice.
3. The banner is keyboard accessible, has a visible focus ring, and offers "Accept all", "Reject non-essential" and a way to change the choice later.
4. Store the choice (cookie or local storage) with a version and timestamp; re-ask when the policy changes.
5. Honour Global Privacy Control (`navigator.globalPrivacyControl`) and Do Not Track where the project claims to.
6. A privacy page explains what is collected, why, how long it is kept, who processes it and how to request deletion.
7. Server-side tagging does not remove the need for consent; it moves where the data is collected.
8. Do not use a dark pattern: no pre-ticked boxes, no "accept" only, no consent wall that blocks the content.

Sketch:

```ts
type Consent = { analytics: boolean; marketing: boolean; version: number; at: string };

const KEY = 'consent-v1';

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean, marketing: boolean): Consent {
  const value = { analytics, marketing, version: 1, at: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(value));
  return value;
}

export function loadAnalytics() {
  if (readConsent()?.analytics !== true) return;
  // Dynamically import the analytics module only now.
}
```

Do not initialise the analytics SDK at module top level "so it is ready". That defeats the gate.

## Privacy page and data map

For each tool, record:

| Tool | Purpose | Data | Consent category | Retention | Processor |
|---|---|---|---|---|---|
| Error reporting | Debug crashes | Stack, route, release, opaque user id | Necessary (legitimate interest) or analytics | 30–90 days | Vendor |
| Analytics | Product usage | Event name, typed properties, no PII | Analytics | 14 months or less | Vendor |
| Marketing pixels | Ads | Cookies, page views | Marketing | Per vendor | Vendor |

The privacy page lists these in plain language. If the project has no privacy page and collects data, that is a gap, not a design choice.

## Verify

1. Trigger a handled error in development and confirm the fallback and the report (or the labelled no-op).
2. With consent denied, open the network panel and confirm no analytics or marketing requests fire.
3. Accept analytics, reload, and confirm the event fires once, not twice.
4. Check that no request contains an email, name, token or full form value.
5. Confirm source maps are not publicly reachable (`/assets/*.map` returns 404 in production).
6. Run the browser and accessibility checks on the banner itself; it is a dialog and must trap focus, close with Escape, and restore focus.
7. Check the privacy page link from the banner and the footer.

## Report

```text
OBSERVABILITY
- Error reporting: provider | adapter with no-op | not configured (why)
- Web Vitals: field | lab only | not measured
- Analytics: events and provider | none
- Consent: necessary/analytics/marketing, default denied | not applicable (no tracking)
- Privacy page: path | missing (why)
- Verified: browser network, consent denied/accepted, source maps, not run (command)
```

Never claim analytics or consent are working because the code compiles. The network panel is the check.
