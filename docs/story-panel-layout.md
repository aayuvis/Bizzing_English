# Story panels: the layout recommendation for every Bizzing app

**Status:** recommended family standard · proven in Bizzing India, 4 Oct 2026 (docs/31, `tools/check-reading.js`)
**Applies to:** any screen that shows *a picture and the words that go with it, one page at a
time* — a story scene, an epic card, a verse, a lesson card, a chapter of a money story.

---

## 1. The rule

> **The words and the page-turn are on the first screen, at every screen size.
> The picture never pushes them off it, and never shrinks to a strip.**

Choose the layout by the screen's **shape**, not its width. The problem is height: a 1280×720
laptop has about 610 px under a sticky header, and a picture-over-words column spends all of it
on the picture. Width is the spare dimension on a landscape screen; use it.

What it fixed, measured in Bizzing India at 1280×720:

| screen | before | after |
|---|---|---|
| epic card | picture 73% of the screen, **no words**, no page-turn | words at 274 px, page-turn visible |
| verse | first line at 929 px (off screen) | 499 px |
| story question scene | 349 px, one narrow column | 266 px, question and all answers on screen |

## 2. Three layouts

| screen | media query | layout |
|---|---|---|
| **Landscape**: desktop, laptop, iPad sideways, a phone on its side | `(min-width: 640px) and (min-aspect-ratio: 6/5)` | **The spread.** Picture left (~57%) in its own shape, words right (~43%), page-turn under the words. On a long page the picture stays put (`position: sticky`) while the words scroll. |
| **Upright tablet** | `(min-width: 721px) and (max-aspect-ratio: 6/5)` | Picture on top, **capped at 38% of the screen height**; words a size larger (≈ 19.5 px). |
| **Phone, upright** | `(max-width: 720px) and (max-aspect-ratio: 6/5)` | Picture a **band of ~26% of the screen** (19% on a page that asks a question) that never collapses; words **whole** underneath; the page scrolls; the page-turn **pinned on its own strip above the tab bar**. |

Picture on the **left**, words on the right — a picture book reads that way, and it was the
owner's choice. The words column is the one that changes on a page turn; the picture column is
the anchor.

## 3. Markup contract

Three roles and two attributes. Class names are yours; the roles are not.

```html
<div class="read">                                   <!-- the page: one per screen -->
  <div class="read-head">back · dots · badge</div>   <!-- spans both columns -->
  <div class="read-pic" data-full="art/x.jpg"         <!-- the painting -->
       role="button" tabindex="0" aria-label="See the painting full screen"
       style="background-image:url(art/x.jpg)"></div>
  <div class="read-words">…the words…</div>
  <div class="read-act">
    <button data-swipe="back">←</button>
    <button data-swipe="next">Turn the page →</button>
  </div>
</div>
```

- **`data-swipe="next|back"`** marks the buttons a swipe or an arrow key presses. Nothing else
  turns a page.
- **`data-full`** on the picture opens it full screen.
- **Nothing is drawn over a painting.** No initials in discs, no stickers, no names on it. If a
  character has no portrait, their name goes in a row under the words.

## 4. CSS recipe

Copy this, rename the classes, and keep the numbers until you have measured a reason to change
them. `--hdr` is your sticky header's height; `--tabbar` is your phone tab bar's height.

```css
/* the picture: a button that keeps its painting's shape */
.read-pic { background: center / cover no-repeat; border-radius: 16px; cursor: zoom-in; }
.read-pic:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

/* LANDSCAPE: the spread */
@media (min-width: 640px) and (min-aspect-ratio: 6/5) {
  .read {
    display: grid; max-width: 1240px; margin: 0 auto;
    grid-template-columns: minmax(0, 1.35fr) minmax(300px, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    column-gap: clamp(18px, 2.4vw, 32px); row-gap: 12px;
  }
  .read-head  { grid-column: 1 / -1; }
  .read-pic   { grid-column: 1; grid-row: 2 / 4; align-self: start; width: 100%;
                aspect-ratio: 3 / 2;                 /* the painting's own ratio: 16/9, 4/3… */
                position: sticky; top: calc(var(--hdr) + 14px);
                max-height: calc(100dvh - var(--hdr) - 40px); }
  .read-words { grid-column: 2; grid-row: 2; font-size: clamp(17.5px, .5vw + 11px, 21px); line-height: 1.7; }
  .read-act   { grid-column: 2; grid-row: 3; }
}

/* UPRIGHT TABLET: capped picture, larger words */
@media (min-width: 721px) and (max-aspect-ratio: 6/5) {
  .read-pic   { max-height: 38vh; aspect-ratio: 3 / 2; }
  .read-words { font-size: 19.5px; line-height: 1.7; }
}

/* PHONE: a band that does not give way, words whole, the page-turn under the thumb */
@media (max-width: 720px) and (max-aspect-ratio: 6/5) {
  .read-pic   { height: min(26vh, calc((100vw - 30px) / 1.5)); }
  .read.asks .read-pic { height: min(19vh, calc((100vw - 30px) / 1.5)); }
  .read-words { overflow: visible; }                 /* never a scrolling box inside the page */
  .read-act {
    position: sticky; bottom: calc(var(--tabbar) + 6px + env(safe-area-inset-bottom)); z-index: 6;
    padding: 6px; border-radius: 999px; background: var(--card);
    border: 1px solid var(--line); box-shadow: 0 6px 22px rgba(30, 20, 70, .16);
  }
  .read-act .btn { min-height: 46px; }
}

/* swipes on a reading page are the page's, not the browser's history gesture */
html { overscroll-behavior-x: none; }
.read { touch-action: pan-y pinch-zoom; }
.read .scrolls-sideways { touch-action: pan-x pan-y; }  /* e.g. a strip of step tabs */

/* the full-screen painting */
.lbox { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 200; display: grid; place-items: center;
        background: rgba(12, 8, 26, .94);
        padding: calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom)); }
.lbox img { max-width: 100%; max-height: calc(100dvh - 90px); object-fit: contain; border-radius: 10px;
            transition: transform .25s ease; touch-action: none; cursor: zoom-in; }
.lbox.zoomed img { transform: scale(2.2); cursor: zoom-out; }
@media (prefers-reduced-motion: reduce) { .lbox img { transition: none; } }
```

Use `top/right/bottom/left: 0`, not the `inset` shorthand: older iPads ignore it and the overlay
collapses (India's `check-css-compat` exists because it happened).

## 5. Behaviour

### Swipe to turn the page
- A sideways swipe **clicks the same `[data-swipe]` button a tap would.** So it can never get
  past what a tap cannot: a page that asks a question has no next button until it is answered,
  and a swipe there does nothing.
- Counts as a swipe only if: **≥ 60 px sideways, sideways ≥ 1.6 × vertical, under 0.7 s**, one
  finger, not started inside something that scrolls sideways itself, not while the painting is
  full screen. Anything else is a scroll.
- Listen with `touchstart`/`touchend` (passive). Do not try to `preventDefault` — claim the
  gesture with `touch-action` instead (above).

### The painting, full screen
- Click, tap, or **Enter/Space** on the picture opens it. Use an **overlay on `<body>`**, not the
  Fullscreen API: an iPhone has no Fullscreen API outside video, and an overlay outside your
  render root survives a re-render.
- A tap on the picture zooms (2.2×) at the point tapped; while zoomed, the zoom follows the
  pointer or the dragging finger.
- **Four ways out:** ✕, Escape, Back, a tap outside the picture. Focus goes to ✕ on open and
  **returns to the picture** on close.
- While it is open it **owns the keyboard** (a capture-phase listener that stops propagation):
  nothing turns the page underneath, and Escape does not also trigger your app's own
  "Escape goes Home".

### Keyboard
← and → press `[data-swipe="back"]` / `[data-swipe="next"]` on every reading screen, unless focus
is in a text field. Same buttons as touch: one code path, one set of gates.

## 6. Rules that hold it

1. **Words first screen, every size.** ≥ 2 lines visible; on landscape the first line in the top
   55% of the screen.
2. **Page-turn first screen.** A page that asks a question shows the *question* there instead.
3. **Picture share.** Stacked: 15–62% of the screen under the header. In the spread it stands
   *beside* the words, never above them.
4. **Never clip the words on a phone.** No fixed-height column with the words scrolling inside
   it — that is how 37 scenes landed cut short. Let the page scroll; pin the action instead.
5. **Nothing drawn over a painting.**
6. **Don't touch the family shell's geometry** (header, tab bar). The gain comes from the content
   area. A slimmer "reading mode" header would be a family-wide change.
7. **The landing page's own story card is exempt.** Scope the rules to the reading route (India
   uses `#main > .reader`), not to every element with the class.

## 7. The check

Write it before you trust the layout, and **watch every rule fail once** before you trust the
check. India's is `tools/check-reading.js` (a Playwright file; copy it):

- **Sizes:** 1440×900, 1280×720, 1180×820 (iPad sideways), 820×1180 (iPad upright),
  390×760, 375×667 (iPhone SE).
- **Pages:** a normal page, a page that asks a question, the longest card you have, and any
  screen with its own picture (a verse, a lesson).
- **Measure from the live DOM:** first line of words vs the fold (the tab bar's top on a phone),
  lines visible, the `[data-swipe="next"]` button's box, the picture's share, children with
  height inside a painted stage, `scrollHeight − clientHeight` of the words box on a phone,
  sideways overflow of the page.
- **Interact for real:** open the painting by click and by Enter, zoom, close four ways, check
  focus; swipe with real touch events (Chrome DevTools Protocol `Input.dispatchTouchEvent`), both
  ways, plus a vertical drag that must *not* turn the page, plus a swipe on an unanswered question
  that must do nothing; press ← →.

What breaking it showed in India: switching the spread off failed 25 measurements; putting one
sticker back on the epic stage failed 6; disconnecting swipe and skipping the focus return each
failed their own check.

## 8. Traps we paid for

| trap | what happened | do this |
|---|---|---|
| **Class name collision** | the wrapper was called `.spread`, which was already a flex-row utility; on a phone the painting rendered 3 px wide | give the reading wrapper a name nobody else uses; test the phone, not just the desktop |
| **The browser's back swipe** | a right swipe on an epic card left the page for the episode list (overscroll history navigation) before the page-turn ran | `overscroll-behavior-x: none` on `html`, `touch-action: pan-y pinch-zoom` on the reading page |
| **Fixed-height phone column** | the words scrolled inside their own box; 37 scenes landed clipped | page scrolls, action pinned (`position: sticky`), words `overflow: visible` |
| **Wrong aspect box** | 16:9 epic paintings in a 4:3 stage lost a quarter of their width | give the stage the painting's own ratio; crop only on the phone band, and offer full screen |
| **A check selecting by class** | the sticker check looked for `.painted` stages; the old sticker path had no such class and slipped through | select by what is there (`backgroundImage` contains `url(`), not by what a class claims |
| **Sticky picture under a sticky header** | the picture slid under the header | `top: calc(var(--hdr) + 14px)` |

## 9. Adopting it

1. Find every "picture + words, one page at a time" screen in your app.
2. Give each the three roles and the two attributes (§3). Delete anything drawn over a painting.
3. Paste the CSS (§4) and wire swipe + full screen + arrows (§5) once, for all of them.
4. Copy and adapt the check (§7); break each rule once; add it to `npm test`.
5. Screenshot every reading screen at the six sizes before and after, and keep the numbers.

Reference implementation: Bizzing India — `app/app.css` ("THE READING SPREAD"), `app/app.js`
(`openFull`, the swipe block, `fullAttrs`), `app/gita.js` (a verse as a reading screen),
`tools/check-reading.js`, `docs/31-reading-spread.md`.
