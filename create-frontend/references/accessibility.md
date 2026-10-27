# Accessibility

Companion to the Accessibility section of step 7 and the Accessibility verification in step 10 of `SKILL.md`. The standard is **WCAG 2.2 AA** unless the user names a stricter one.

Accessibility is not a final checklist. It changes the markup, the component API, the focus order and the copy while the screen is built. Native semantics first; ARIA only when a native element cannot express the role or state.

## WCAG 2.2 additions

WCAG 2.1 AA still applies. These 2.2 criteria are the ones most frontends miss:

| Criterion | Level | What it means in the build |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | A sticky header, footer, banner or chat widget must not cover the element that has focus. Scroll padding and `scroll-margin` help; test with Tab, not with a mouse. |
| 2.5.7 Dragging Movements | AA | A drag-only interaction (slider, sortable list, map, canvas) needs a single-pointer alternative: buttons, arrow keys or a numeric input. |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets are at least 24×24 CSS px, or have 24 px of spacing. Touch targets still aim for 44×44. Exceptions: inline text links, essential targets, user-agent controls. |
| 3.3.7 Redundant Entry | A | Do not ask for the same information twice in one process. Prefill from earlier steps, offer "same as billing", and use `autocomplete`. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Do not require a cognitive test to sign in. Allow paste and password managers, do not block them; if a CAPTCHA is unavoidable, provide an accessible alternative. |
| 3.2.6 Consistent Help | A | A help mechanism (chat, phone, FAQ link) appears in the same relative order on every page where it exists. |

## Core checklist

### Semantics

- One `h1` per page; headings in order, not chosen for size.
- `button` for actions, `a` for navigation, `nav`, `main`, `header`, `footer`, `label`.
- Lists are `ul`/`ol`; tables are `table` with `th` and `scope`, not div grids.
- Landmarks are unique enough to navigate; `aria-label` only when a landmark repeats.
- No `role="button"` on a div when a `button` works.
- The language is set on `<html lang="...">`; a language change inside the page uses `lang`.

### Keyboard and focus

- Everything operable with a keyboard, in a logical order.
- Focus is always visible. Do not remove the outline without a stronger replacement.
- Focus does not move unexpectedly on load or on scroll.
- Escape closes dialogs, menus and popovers; focus returns to the trigger.
- Arrow keys move within menus, tabs, listboxes, grids and radio groups; Home/End where expected.
- Sticky headers, cookie banners and chat widgets do not hide the focused element (2.4.11).
- Skip link to the main content when there is a repeated header.

### Forms

- Every input has a visible label tied with `for`/`id`; placeholder is not a label.
- Errors are in text next to the field, linked with `aria-describedby`, and announced on submit.
- The error summary links to the fields; the first invalid field receives focus.
- Required fields are marked in text, not only with an asterisk or colour.
- Do not block paste in password or code fields.
- Correct `type` and `autocomplete` values (`email`, `tel`, `current-password`, `one-time-code`, `street-address`).
- Do not ask for the same data twice (3.3.7); prefill where possible.
- Authentication has an accessible path: password manager, passkey, magic link, or a CAPTCHA alternative (3.3.8).

### Images, media and colour

- Meaningful images have alt text that says what matters; decorative images have `alt=""`.
- Complex images (charts, diagrams) have a short alt and a longer description or data table.
- Video has captions; audio has a transcript; autoplay is off or has a pause control.
- Contrast: 4.5:1 for body text, 3:1 for large text and UI controls. Check the tokens with `scripts/check-contrast.js` and the rendered page with axe.
- Meaning is never carried by colour alone: pair it with text, an icon or a pattern.
- Focus indicators meet 3:1 against the adjacent colours.

### Motion and zoom

- `prefers-reduced-motion: reduce` removes movement and leaves short fades or nothing.
- Nothing flashes more than three times per second.
- Text scales to 200% without clipping or loss of content; the page reflows at 400% zoom / 320 px width.
- Text spacing can be increased (line height 1.5, paragraph 2, letter 0.12em, word 0.16em) without breaking the layout.
- Nothing depends on hover alone; touch and keyboard have equivalents.

### Touch and pointer

- Touch targets at least 44×44 px where practical; never below 24×24 (2.5.8).
- Drag interactions have a single-pointer alternative (2.5.7).
- Gestures have a simple alternative (for example, pinch-to-zoom has buttons).
- The page does not hijack scroll or block zoom (`user-scalable=no` is a failure).

## Component checks

| Component | Must check |
|---|---|
| Button | Native `button`; disabled state is not the only signal; loading state keeps the label |
| Link | Clear purpose; no "click here"; external links announce the new tab when it matters |
| Dialog | `dialog` or a labelled `role="dialog"`; focus moves in, is trapped, Escape closes, focus returns |
| Menu | Trigger has `aria-expanded`; arrow keys move; Escape closes; click outside closes |
| Tabs | `tablist`/`tab`/`tabpanel`; arrow keys move; the selected tab is programmatically selected |
| Accordion | Button with `aria-expanded` and `aria-controls`; content is not hidden from the accessibility tree when open |
| Table | Caption or heading; `th` with `scope`; sortable headers announce the sort state |
| Toast | `role="status"` or `aria-live="polite"`; errors use `role="alert"`; it does not steal focus |
| Carousel | Pause control; keyboard controls; the current slide is announced; no autoplay under reduced motion |
| Chart | Text summary or data table; colour-blind-safe palette; patterns or labels, not colour alone |
| Map | Keyboard pan/zoom or a list alternative; the map is not the only way to get the address |
| Upload | Native file input or a labelled button; drag-and-drop has a click alternative; errors are announced |
| Cookie banner | Dialog semantics; focus management; reject is as easy as accept; no pre-ticked boxes |

## Verification

Automated tools catch a minority of issues. Run both.

```bash
npx @axe-core/cli http://localhost:4173
```

Or in Playwright:

```ts
import AxeBuilder from '@axe-core/playwright';

const results = await new AxeBuilder({ page }).analyze();
expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
```

Then, with a browser:

1. Tab through every page. The order is logical, focus is visible, nothing is trapped, and sticky elements do not cover the focus.
2. Activate buttons with Enter and Space, links with Enter.
3. Open and close dialogs and menus with the keyboard; focus returns to the trigger.
4. Use arrow keys in menus, tabs and listboxes.
5. Submit an empty form, then a valid one; errors are announced and linked.
6. Zoom to 200% and 400%; no clipping, no horizontal page scroll at 320 px.
7. Emulate `prefers-reduced-motion: reduce`; nothing travels or loops.
8. Check touch targets and contrast in the browser's accessibility inspector.
9. Run a screen reader pass on the main journey: VoiceOver (macOS) or NVDA (Windows). Check name, role, value, state and error announcements.
10. Fix critical and serious axe issues. Report moderate issues you deliberately leave, with the reason.

## Report

```text
ACCESSIBILITY
- Standard: WCAG 2.2 AA
- Automated: axe serious/critical = 0 | N remaining (list)
- Keyboard: passed | issues
- Screen reader: passed | not run (why)
- Zoom/reflow: 200% / 400% passed | issues
- Reduced motion: passed | not run
- Contrast: tokens + rendered page passed | issues
- Target size: passed | issues
```

Never write "accessible" because the markup uses semantic elements. The keyboard walk and the axe scan are the evidence; if they were not run, say so and give the command.
