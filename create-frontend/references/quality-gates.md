# Quality gates

Companion to steps 8, 9 and 10 of `SKILL.md`. Read it when the project has a GitHub remote, when CI is being added, or when performance and visual regressions need to fail a build instead of being noticed later.

A gate is a check that can fail the build. Set the budget from the product's needs, not from the current score, and never widen a gate just to get green.

## Performance budgets

| Metric | Target | Gate |
|---|---|---|
| Largest Contentful Paint (LCP) | at most 2.5 s on a mid-range phone | Lighthouse CI `error` at 2.5 s |
| Interaction to Next Paint (INP) | at most 200 ms in the field | RUM alert; Lighthouse uses TBT as a lab proxy |
| Cumulative Layout Shift (CLS) | at most 0.1 | Lighthouse CI `error` at 0.1 |
| Total blocking time (lab) | at most 200 ms | Lighthouse CI `warn` |
| JavaScript shipped to the first route | project budget, for example 200 kB gzip | bundle-size gate |
| CSS shipped to the first route | project budget, for example 50 kB gzip | bundle-size gate |
| Hero image | at most 300 kB, correctly sized | review + build output |
| Third-party scripts on first load | 0 unless justified | review |

Write the budgets in the repository so CI and reviewers read the same numbers. A budget that exists only in a chat message is not a gate.

## Lighthouse CI

Install `@lhci/cli` as a dev dependency and add `lighthouserc.js`:

```js
module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop', // remove for the mobile default; test both when the product is mobile-first
        chromeFlags: '--no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

Run it against a production build, not the dev server:

```bash
npm run build
npx serve dist -l 4173 &
npx lhci autorun
```

Notes:

- Lighthouse is lab data. It cannot measure INP; use field data (Web Vitals) for that. Do not present a Lighthouse score as a field guarantee.
- Three runs reduce noise. Keep the median; a single run on a shared CI runner is flaky.
- Start with `warn` for a category the project has never met, then make it `error` when the baseline is stable. Do not leave it `warn` forever.
- `temporary-public-storage` uploads the report to a public URL. Use a private server or omit the upload for private projects.
- CI runners are noisy. Pin the runner image, disable animations, and use the same viewport for comparisons.

## Bundle-size gate

Use `size-limit` when the project is JavaScript-heavy:

```json
{
  "size-limit": [
    { "name": "first route", "path": "dist/assets/index-*.js", "limit": "200 kB" },
    { "name": "CSS", "path": "dist/assets/index-*.css", "limit": "50 kB" }
  ]
}
```

```bash
npx size-limit
```

Or use the host's build output and a small script that fails when a chunk exceeds the budget. The point is a number in CI, not a dashboard.

Rules:

- Budget the route the user lands on, not the sum of every lazy chunk.
- Lazy-load heavy editors, maps, 3D and chart libraries; report the chunk name and size.
- A new dependency that adds 40 kB must justify itself in the PR.
- Do not raise the budget without saying what changed and why.

## Visual regression

Playwright's screenshot assertions catch the layout break that unit tests cannot see.

```js
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [
    { name: 'desktop-light', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'light' } },
    { name: 'mobile-light', use: { ...devices['iPhone 13'], colorScheme: 'light' } },
    { name: 'desktop-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'dark' } },
  ],
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
```

```ts
import { test, expect } from '@playwright/test';

test('home page has no visual regressions', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});
```

Rules:

- Generate the first baseline deliberately and review it; do not commit a screenshot you have not seen.
- Wait for fonts, images and animations to settle. Disable animations for the screenshot; test motion separately.
- Keep baselines in the repository, one directory per project/viewport/theme. They are review artifacts.
- CI uploads the diff, actual and expected images as artifacts on failure; review the diff before updating.
- Update with `npx playwright test --update-snapshots`, then review the changed images in the PR. Never update on a red run to make it green.
- If the visual test is flaky because of fonts or antialiasing, pin the font files and the browser version; do not set `maxDiffPixelRatio: 1`.

## Accessibility gate

Add axe to the end-to-end suite so a serious regression fails CI:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('no serious accessibility violations on the main routes', async ({ page }) => {
  for (const path of ['/', '/pricing', '/contact']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, `${path}: ${serious.map(v => v.id).join(', ')}`).toEqual([]);
  }
});
```

This complements the manual keyboard walk; it does not replace it.

## CI wiring

Add the gates to the project's workflow after the unit tests:

```yaml
      - name: Build
        run: npm run build

      - name: Bundle budget
        run: npx size-limit

      - name: Lighthouse CI
        run: npx lhci autorun

      - name: Visual and accessibility tests
        run: npx playwright test

      - name: Upload visual and test artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: quality-artifacts
          path: |
            playwright-report/
            test-results/
            .lighthouseci/
          if-no-files-found: ignore
```

The generated-project workflow in [`assets/github/ci.yml`](../assets/github/ci.yml) already runs lint, types, tests and build; add these gates when the project has them.

## Failure policy

| Failure | Action |
|---|---|
| Lighthouse performance below budget | Find the largest cost (image, font, JS, render-blocking), fix it, rerun. Do not lower the budget. |
| Lighthouse accessibility below budget | Fix the axe findings; if a rule is a false positive, document the exception and the reason. |
| Bundle over budget | Remove, split or lazy-load; if the feature is essential, raise the budget in the PR with numbers. |
| Visual diff | Read the diff image. If the change is intended, update the baseline and explain it; if not, fix the layout. |
| Flaky visual test | Stabilise fonts, animations and data; retry once only for infrastructure. Do not hide it with retries. |
| CI runner noisy | Pin the runner, use a fixed viewport, run three times and take the median. Report the variance. |

## Report

```text
PERFORMANCE
- LCP / INP / CLS: field | lab (Lighthouse) | not measured
- Budgets: passed | failed (which) | not configured
- Bundle: first route JS/CSS sizes

VISUAL
- Baselines: desktop/mobile, light/dark | not configured
- Screenshots reviewed: yes | no (why)
- Diffs: none | intended (updated) | unintended (fixed)

QUALITY GATES
- CI: workflow name and result | not configured
- Failures fixed this run: ...
- Gates deliberately left as warnings: ...
```
