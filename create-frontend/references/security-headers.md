# Security headers

Companion to the Security section of step 7 and the Delivery check in step 10 of `SKILL.md`. Use it for every public site and every app that handles accounts, payments or personal data.

Headers are part of the frontend contract even when a host sets them. The job is to set a safe baseline, prove it in a response, and not break the page while doing it.

## Baseline

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | Start from `default-src 'self'` and add only the origins the page uses | Stops injected scripts and unexpected network calls |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS after the first visit. Only set it when every subdomain is HTTPS. |
| `X-Content-Type-Options` | `nosniff` | Stops MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends the origin, not the full path, to other sites |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Turns off features the page does not use |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the browsing context |
| `X-Frame-Options` | `DENY` | Legacy clickjacking protection; keep `frame-ancestors 'none'` in the CSP too |
| `Content-Type` | `text/html; charset=utf-8` | Correct decoding; servers usually set it |

`Cross-Origin-Resource-Policy: same-origin` is useful for sensitive apps, but it breaks assets served from a CDN or another origin. Set it only after checking the asset origins.

## A CSP that does not break the page

Start in report-only mode, collect violations, then enforce:

```text
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.example.com; font-src 'self'; connect-src 'self' https://api.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
```

Then remove what the page does not need and enforce it:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.example.com; font-src 'self'; connect-src 'self' https://api.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
```

Rules:

- `script-src 'self'` is the goal. If inline scripts are unavoidable, use a nonce or a hash, not `'unsafe-inline'`.
- `style-src 'unsafe-inline'` is common with CSS-in-JS and Tailwind's runtime, but prefer a nonce or extracted CSS when the stack allows it.
- `strict-dynamic` only when the bootstrap script is nonce-protected and you understand the trade-off.
- Never add `'unsafe-eval'` to make a library work; replace the library or isolate it.
- Allowlist exact origins, never `*` for scripts, styles or connections.
- `connect-src` must include the API, websocket origin and any error-reporting endpoint.
- `img-src` includes `data:` only when the app actually uses data URLs; `blob:` only for generated previews or uploads.
- `frame-ancestors 'none'` is the modern replacement for `X-Frame-Options`; both are fine.
- `form-action 'self'` breaks a payment or newsletter form posted to another origin; add that exact origin.
- `upgrade-insecure-requests` is for production. Do not ship it to a local HTTP dev server.
- A nonce must be generated per response and must not be cached across users.

Next.js nonce sketch (App Router, middleware):

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
}
```

Pass the nonce to scripts that need it and keep the policy in one module. Next.js caches aggressively; test the response headers before trusting the middleware.

## Host configuration

### Netlify and Cloudflare Pages

`public/_headers` (copied to the build output):

```text
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  X-Frame-Options: DENY
```

Cloudflare Pages reads `_headers` from the build output. Netlify reads it from the publish directory. Confirm the file is in the deployed output, not only in the repository root.

### Vercel

`vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    }
  ]
}
```

### Next.js

`next.config.mjs`:

```js
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

export default {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

When the CSP needs a per-request nonce, use middleware as above; a static `headers()` entry cannot vary the nonce.

### Astro

Static Astro uses the host's header file. SSR Astro can set headers in middleware:

```ts
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  return response;
});
```

### GitHub Pages

GitHub Pages does not let you set response headers. A `<meta http-equiv="Content-Security-Policy">` covers some directives but not `frame-ancestors`, HSTS or report-only. Do not claim a header policy for Pages unless a CDN or proxy adds it; state the limitation in the report.

## Third-party scripts and SRI

Every third-party script or stylesheet is a trust decision.

```html
<script
  src="https://cdn.example.com/widget.js"
  integrity="sha384-..."
  crossorigin="anonymous"
  defer
></script>
```

- Generate the hash from the exact file the CDN serves; a version bump changes it.
- Prefer self-hosting a pinned copy for critical dependencies.
- Do not load analytics, chat widgets or A/B tools before consent (see `observability.md`).
- `crossorigin` is required for SRI on cross-origin resources.

## Verify

```bash
curl -sI https://example.com | grep -iE 'content-security-policy|strict-transport|content-type-options|referrer-policy|permissions-policy|frame-options'
```

Then:

1. Open the page with the browser console visible. A CSP violation is a real failure, not noise.
2. Check the network panel: fonts, images, API calls and analytics are all allowed by the policy.
3. Run the axe scan and Lighthouse best-practices category; fix clear failures.
4. Test a 404, a form submit and a login redirect — `form-action` and `connect-src` often break these first.
5. Confirm HSTS is **not** set on localhost; it poisons the browser for local development.
6. If the site is public and the user wants a second opinion, `https://securityheaders.com` is a checker, not a source of truth; report what it says and what you fixed.

## Report

```text
SECURITY HEADERS
- CSP: enforced | report-only | not set (why)
- HSTS: set | not set (why)
- Other baseline headers: set | not set
- Verified with: curl | browser console | Lighthouse | not run (command)
- Third-party scripts: count and SRI status
```

Never mark headers as verified because they are in a config file. Read them from the deployed response.
