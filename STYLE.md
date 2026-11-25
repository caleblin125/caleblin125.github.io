# STYLE.md — the Atlas system

This document describes the visual language and the canvas conventions used across the
site, so new pages and visualizations match the existing ones. Everything below is
derived from the live code in `src/style.css`, `src/pages/`, and `src/main.ts` — if you
change those, update this file.

The direction is **Atlas: the work is the page**. The site is set as a printed technical
record, not a portfolio. One ink ground, warm chalk text, a serif for prose and titles, a
mono face for numbers, dates, and plate captions. Images are plates, not cards: no border,
no radius, no shadow. Rules separate records; nothing glows, and no display headline
announces the author.

---

## 1. Design tokens

All tokens live on `:root` in `src/style.css` (plus a few hard-coded values in component
rules). The comment block at the top of the file states the intent; keep it accurate.

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0a0d10` | page ground, plate wells, accent-on-ink |
| `--bg-surface` | `#10161a` | figure panels, code and math panels, control bars |
| `--bg-surface-alt` | `#161d22` | raised row hover, nested panels, diagram panels |
| `--bg-recess` | `#06090b` | the deepest recess: canvas wells, table headers |
| `--text` | `#e6e2d8` | body prose |
| `--text-heading` | `#f4f0e7` | titles and large figures |
| `--text-muted` | `#b3b8b3` | secondary prose, captions |
| `--text-subtle` | `#99a09d` | dates, categories, small labels |
| `--text-dim` | `#858c89` | footnotes, plate numbers, inactive controls |
| `--accent` | `#d98a5f` | burnt sienna: links, rules under active nav, diagram labels |
| `--accent-deep` | `#7d4026` | pressed states, dark accent fills |
| `--accent-ink` | `#0a0d10` | text on an accent fill |
| `--border` | `#2b3439` | panel and frame outlines |
| `--border-subtle` | `#20272b` | inner control-bar rules |
| `--rule` | `#1b2226` | hairline separators between records |
| `--rule-strong` | `#2b353a` | section rules, table head rules |

### Type

| Token | Value |
|---|---|
| `--font-body` | `"Newsreader", Georgia, "Times New Roman", serif` |
| `--font-mono` | `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| `--measure` | `58ch` |
| `--reading-width` | `40rem` |

- **Body / headings:** Newsreader. Prose is set at `1.0625rem` / `1.62` with optical
  sizing on. Titles carry the serif's italic and oldstyle range; they are never
  `font-weight: 800` and never letter-spaced display type.
- **Mono / labels:** IBM Plex Mono — `.kicker`, `.plate-no`, `.plate-metric`,
  `.post-date`, `.work-number`, `.work-category`, table headers, the nebula HUD and its
  controls. The common recipe is
  `font: .68rem var(--font-mono); letter-spacing: .08em; text-transform: uppercase;`.
- Fonts load from Google Fonts with `<link>` tags in `index.html` after `preconnect`
  hints. Do not add a CSS `@import`; it delays rendering past the document links.

### Shape and layout

- `--radius: 2px`. Nothing is a pill, a card, or a glass panel. Rounded corners are a
  two-pixel softening on inputs only.
- App max width `1320px`, centred, with `--content-padding: clamp(18px, 4vw, 44px)`.
- Article shell `820px`; reading measure `40rem` (64 ch of serif); wide media breaks out
  to `--wide: 1060px`.
- Header min-height `84px` (`76px` mobile) with a `1px solid var(--border)` bottom rule.
- Breakpoints: `1120px`, `960px`, `760px`, `520px`. `760px` is the single-column line.

---

## 2. Page anatomy

Every page is a module in `src/pages/` exporting a `Page`; the `pages` record mapping
routes to modules lives in `src/pages/index.ts`. The shell (header/nav/footer) comes from
`src/render.ts`, which both the static generator and the dev client call, so a page
supplies only its `content`.

`Page` is `{ title, eyebrow, description?, content, kind?, date?, updated?, keywords?,
section? }`. `description` is required in practice: it feeds the meta description, Open
Graph, Twitter, Markdown front matter, and the site indexes. `kind` (`home`, `project`,
`post`, `index`, `profile`, `page`, `not-found`) selects JSON-LD and Open Graph type.
Notes set `date` (ISO) and often `keywords`; projects and posts set `section` for
breadcrumbs.

The name, affiliation, degree programs, and social-preview image live in
`src/identity.ts`; page modules, `src/render.ts`, and `src/structured-data.ts` read those
values instead of repeating strings.

Each project and note page derives its summary, keywords, and dates from
`src/data/projects.ts` or `src/data/posts.ts`. Edit the data file first: the page module
reads it, and the generated HTML, Markdown, `llms.txt`, sitemap, and JSON-LD follow. The
project and note indexes are generated from the same lists, so a new entry appears
everywhere at once.

Every `ProjectEntry` carries `image: { src, alt }`. The homepage plates and the project
catalogue render it at the record's own aspect; the alt text describes what the project
actually produces. Use real output when it exists. The Mandelbrot and Boids rasters come
from `npm run generate:thumbnails`; the other marks are hand-authored SVGs in
`public/projects/`. Do not use a generic icon, a logo, or an image that implies results
the project does not have.

**Static output:** `npm run build` emits `<route>/index.html` with `#app` marked
`data-prerendered="true"` and `data-route="<route>"`. `src/main.ts` re-renders only when
that route does not match the current path. Do not remove the marker unless you also
change the generator, and do not put essential prose in client-only markup.

Unknown routes render `notFoundPage` (also exported from `src/pages/index.ts`) with
`noindex, nofollow` and no canonical link. The build writes a real `dist/404.html`;
GitHub Pages serves it for unknown deep links, and no SPA fallback is used.

### Shared elements

- `.kicker` — small sienna mono label. On index pages it names the section; on records it
  names the project or note.
- `.atlas-name` / `.atlas-claim` — the homepage's only "heading" pair: a mono name line
  and a serif sentence set at body-title size, not display size.
- `.lede` — one-sentence summary under a title, in muted serif.
- `.text-link` — inline link, underlined with a sienna rule on hover; trailing `↗`
  arrows are `aria-hidden`.
- `.mono-note` — a dim mono line for counts and provenance ("14 records...").
- `.demo-link` — a sienna mono link to an interactive experiment, used beside "Project
  page".

### Homepage (`/`) — the specimen board

```
<section class="atlas-top">
  <p class="atlas-name">Caleb Lin <span>Santa Cruz, California</span></p>
  <h1 class="atlas-claim">…one sentence…</h1>
  <p class="atlas-lede">…</p>
  <div class="atlas-links">Selected work · Interactive lab · Résumé · GitHub</div>
</section>
<section class="atlas-plates" id="selected-work">
  <a class="plate" href="/projects/fpga">
    <span class="work-thumb"><img …></span>
    <div class="plate-cap">
      <span class="plate-no">01</span>
      <div class="plate-meta"><span>Digital hardware</span><span>2025–26</span></div>
      <h2>FPGA and digital hardware</h2>
      <span class="plate-metric">3× — class throughput</span>
    </div>
  </a>
  … five featured plates …
</section>
<section class="live-plate">…nebula frame…</section>
<section class="record-note">…how to read a record…</section>
<ol class="method">…Build / Instrument / Measure / Understand…</ol>
<section class="home-notes">…note rows…</section>
<section class="at-the-moment">…</section>
```

- Five featured projects appear as **plates on a 12-column irregular grid**, each set at
  a different span and alignment so the board reads as a specimen sheet rather than a
  card wall. Plate caption text is mono; the title is serif. The metric sits on its own
  mono line under the caption.
- The nebula is **one subordinate plate**, labelled `Field 01 / live`, not a second hero.
  It is the only visualization on the homepage; Mandelbrot and Boids live in `/lab`.
- `.record-note` carries the site's contract: every entry states **Problem**,
  **Contribution**, technologies, one measured result, and a limitation. This note is
  what replaces a "skills" band; do not add skill bars or percentage meters.
- `.method` is a four-step ordered list: Build → Instrument → Measure → Understand. It
  is prose about the practice, not a decorative timeline.
- `.home-notes` is the notes list; `.at-the-moment` is a single quiet line about current
  work (it carries the SCC figure and links to the record).

Use plates only for work that has a real image and a real number. A project without
either belongs in the notes or a row, not in the featured grid.

### Project catalogue (`/projects`)

```
<section class="page-intro">kicker · h1 · lede · mono-note · link-row</section>
<section class="project-group" id="flagship">
  <div class="group-head">title · count · note</div>
  <div class="project-lead-grid">
    <article class="project-lead">
      <figure class="project-thumb"><img …></figure>
      <div class="project-body">
        <p class="work-category"><span class="work-number">01</span>Digital hardware</p>
        <h2><a>Title</a></h2>
        <p>Problem or lede</p>
        <p class="project-lead-metric"><span class="work-label">Result</span><strong>3×</strong><span>…</span></p>
        <div class="project-links">Project page · demo link</div>
      </div>
    </article>
    …
  </div>
  <div class="project-list">
    <article class="project-row">thumb · body · status</article>
    …
  </div>
</section>
```

- The catalogue has three groups: **Flagship work**, **Experiments**, **Archive**. Each
  group states its count and a one-sentence scope note.
- Four flagship entries are **leads**: larger plates in a two-column irregular grid, with
  problem, result, and links. Everything else is a compact annotated row with a
  thumbnail, technologies, and period. Do not give every project identical weight.
- Technologies render as an inline `/`-separated mono list (`.tech-list`), never as
  pills or chips. `.project-status` is the period, not a fake build status.
- Every project row keeps `figure.project-thumb`. The validator counts them
  (currently 14), so adding a record means adding one there too.

### Blog index (`/blog`)

```
<section class="page-intro">…</section>
<section class="note-list">
  <a class="note-row" href="/blog/…">
    <span class="post-date">2026 / 08 / 20</span>
    <span><h2>Title</h2><p>Excerpt</p></span>
    <span class="note-arrow" aria-hidden="true">↗</span>
  </a>
</section>
```

Notes are a dated list with hairline rules, not cards. Dates are mono and use slashes.

### Résumé (`/resume`)

```
<article class="article resume">
  <p class="kicker">Résumé</p><h1>Caleb Lin.</h1><p class="lede">…</p>
  <div class="resume-contact">…email / LinkedIn / GitHub / location…</div>
  <div class="link-row"><a class="text-link" href="/caleb-lin-resume.pdf">Download PDF ↗</a></div>
  <section class="resume-section">
    <h2>Education</h2>
    <div class="resume-entry"><div><h3>…</h3><p class="resume-sub">…</p></div>
         <div class="resume-date">Expected June 2027</div></div>
    <ul class="article-list"><li>…</li></ul>
  </section>
  <section class="resume-section"><h2>Skills</h2>
    <div class="skill-grid"><div><span class="skill-label">Languages</span><p>…</p></div>…</div>
  </section>
</article>
```

The PDF lives at `public/caleb-lin-resume.pdf`, served from `/caleb-lin-resume.pdf`.
Skill groups are plain label + prose, not bars.

### Records (`/projects/*`, `/blog/*`)

```
<article class="article">
  <header class="project-header">          ← projects; notes use a plain kicker + h1
    <div class="project-main"><p class="kicker">…</p><h1>Title.</h1><p class="lede">…</p></div>
    <aside class="project-facts">…category / period / technologies / dates…</aside>
  </header>
  <p class="problem"><strong>Problem.</strong> …</p>
  <div class="article-visual visual-frame …"><canvas data-visualization="…">…
       <div class="visual-label">…</div></div>
  <h2>Overview</h2> … <h3>Sub-section</h3>
  <div class="math-display">$$…$$</div>
  <div class="table-wrap"><table class="spec-table">…</table></div>
  <svg class="vector-diagram">…</svg>
  <div class="result-grid"><div class="result-row">…</div>…</div>
</article>
```

- Project headers keep **two columns**: the record itself, and a right-hand facts rail
  (category, period, technologies, dates). The rail is mono; it never becomes a sidebar
  of badges.
- Section numbering is **CSS counters** on `.article h2::before`: `01`, `02`, … set in
  sienna mono. Do not type the numbers into the headings; it breaks when a section is
  inserted. `h2` in a record carries the rule and number, `h3` is unnumbered.
- Prose stays at `40rem`; wide media (figures, diagrams, tables, result grids) break out
  to `1060px` inside the 820px shell.
- Records that report measurements end with **Limitations**: what the number is not,
  and what would be needed to claim more. See `/projects/fpga` and `/projects/hpc`.

### 404

`src/pages/not-found.ts` supplies content for any route missing from the `pages` record.
It uses `.page-intro`, `.mono-note`, and a `.link-row` back to the main sections. Keep it
useful, not cute. The generated `404.html` is `noindex, nofollow`, has no canonical link,
and clears the active nav item.

---

## 3. Canvas elements & visualizations

### The DOM pattern (required)

```html
<div class="article-visual visual-frame boids-frame">
  <canvas data-visualization="boids"
          aria-label="Interactive boids flocking simulation"></canvas>
  <div class="visual-label">Boids <span>move the pointer through the flock</span></div>
</div>
```

Rules:

- The `<canvas>` **must** carry a `data-visualization` attribute. `main.ts` finds every
  such canvas after rendering and lazily imports the matching renderer:

  ```ts
  for (const canvas of document.querySelectorAll("canvas[data-visualization]")) {
      try {
          if (kind === "boids") { const { BoidsRenderer } = await import("./boids/renderer"); … }
          else if (kind === "nebula") { … }
          else { … Mandelbrot … }
      } catch (error) {
          canvas.closest(".visual-frame, .nebula-frame")?.classList.add("is-fallback");
      }
  }
  ```

  Add a new branch there when you add a visualization kind. A failed renderer must not
  stop the other canvases on the page, and lazy imports keep unused renderers out of the
  initial bundle.
- `.visual-frame` gives the canvas its recessed background, min-height (`500px`, `360px`
  at `760px`; `.article-visual` variant `460px` / `320px`) and a `1px solid
  var(--border)` frame. `.is-fallback` hides the canvas and shows a "needs WebGL2" note
  through a pseudo-element.
- `.nebula-frame` stacks `.nebula-stage` (HUD + canvas + caption + fallback) over the
  generated `.nebula-controls`, an optional advanced row and actions, and a
  `.nebula-notes` disclosure, with the same hairline frame. `.nebula-lab` adds the taller
  stage; `.nebula-frame:fullscreen` fills the screen and hides notes and the advanced
  panel.
- `.visual-label` sits at the bottom of the frame: visualization name in sienna, hint in
  muted text. It is `pointer-events: none` so it never blocks interaction.
- Give the canvas `role="img"` and an `aria-label` describing what it shows. Controls are
  separate native inputs, not canvas interaction.

### Renderer conventions (TypeScript side)

Each renderer (`src/boids/renderer.ts`, `src/chaos/renderer.ts`,
`src/nebula/renderer.ts`) follows this shape:

1. **Context.** Boids asks for `webgl2` with `preserveDrawingBuffer: true` because its
   trails rely on the framebuffer persisting between frames. Mandelbrot clears every
   frame and does not need it. The nebula engine creates its own context, programs, and
   framebuffers; the site adapter never touches GL.
2. **Shaders.** Imported as raw strings and compiled at construction. Boids and chaos
   compile their programs directly. The nebula engine resolves `#include` files and
   compiles each program lazily when its mode first appears:
   ```ts
   import fragmentSource from "./shaders/boids.glsl?raw";
   ```
3. **Layout.** Renderers multiply `clientWidth/Height` by `devicePixelRatio` (nebula caps
   DPR at 2), set `canvas.width/height`, and repaint. The nebula engine observes its
   canvas with `ResizeObserver`; boids and chaos listen for `"resize"`. Always repaint
   after a layout change: resizing the drawing buffer clears it.
4. **Loop.** `requestAnimationFrame` drives boids and the nebula; chaos renders on demand
   (`requestRender`) so it is idle when nothing changes. The nebula adapter calls
   `engine.setActive(false)` when the canvas leaves the viewport or the tab hides, and
   the engine stops requesting frames until reactivated.
5. **Instancing.** Boids uses `drawArraysInstanced` for 489 chevrons; chaos uses instanced
   `POINTS` with `gl_InstanceID` driving orbit iteration in the vertex shader. The
   nebula draws one full-screen triangle and evaluates the image in the fragment shader,
   so it has no vertex buffers.

### Nebula specifics

- **Model.** Analytic, hash-based gradient noise composed into a scalar density field:
  three to nine octaves (six by default, set per preset) of fBm with two domain-warp
  passes, crossing ridged terms for filaments and dust lanes, a low-frequency mask for
  negative space, and a movable soft threshold. Light is derived from the field through a
  five-stop sRGB-to-linear palette, emission, ACES tone mapping, quarter-resolution
  bloom, a hashed star layer, vignette, and dither. The same parameters feed two
  samplers: a screen-space 2D field and a raymarched unit-cube volume (56 steps by
  default at 0.72 internal scale). This is a designed visual model, not a physical
  simulation; the controls are aesthetic.
- **Controls.** Generated by `src/nebula/controls.ts` from `src/nebula/parameters.ts`.
  Numeric ranges carry `data-nebula-param`; the other hooks are `data-nebula-preset`,
  `-palette`, `-mode`, `-debug`, `-quality`, `-seed-input`, `-reseed`, `-link`, `-copy`,
  and `-fullscreen`. Keep the schema authoritative; never retype ranges in markup.
- **Seeds.** Decimal integers 1–999999 (`normalizeSeed`). `?seed=65521` opens Orion Deep;
  the homepage opens Violet Hollow (90210). Reseed writes the whole state back with
  `history.replaceState`, so any frame can be shared.
- **URL state.** `seed`, `preset`, `palette`, every numeric parameter, `mode`
  (`2d`/`volume`), `debug` (final/density/cloud/filament/shape/mask), and `quality`
  (adaptive/high/low). An inspection channel forces the 2D sampler; the old `view=` key
  is ignored safely.
- **Budget.** Adaptive quality targets about 21 ms of GPU cost (22 ms frame time without
  the GPU timer), scaling the buffer between 1.0 and 0.55. *High* pins scale 1 and
  disables adaptation; *Low* starts at 0.6. Reduced-motion users keep their chosen speed
  in the URL but the adapter passes `animationSpeed: 0`, drawing a still field.
- **Fallback.** Without WebGL2, or after context loss, the frame gains `.is-fallback`:
  canvas, HUD, caption, controls, and advanced panel hide, and `.nebula-fallback` sets
  the stage height. Prose and the rest of the page remain.

### Shader layout

GLSL ES 3.00 (`#version 300 es`), imported with `?raw`, one file per stage:

```
src/<viz>/shaders/
├── <name>.vert.glsl
├── <name>.glsl
└── fade.*            (boids trail-decay pass)

src/nebula/shaders/
├── vertex.glsl       full-screen triangle
├── nebula.frag       2D field
├── volume.frag       raymarched volume sampler
├── post.frag         bloom bright-pass, blur, composite
├── noise.glsl        gradient noise, fBm, ridged helpers
├── density.glsl      cloud, filament, mask, threshold
├── color.glsl        palette, emission, ACES, dither
└── stars.glsl        hashed star layer
```

Add a declaration to the right include rather than duplicating a function across both
fragment shaders; include order is preserved at compile time.

---

## 4. Content components

### Typography inside records

- `h2` — serif, `~1.55rem`, with a sienna counter number (`01`, `02`, …) in the left
  gutter at wide widths and inline above the text when the gutter collapses.
- `h3` — serif, smaller, no number, no rule.
- Prose paragraphs are `var(--text)`; captions and captions-under-plates are
  `var(--text-muted)`; metadata is `var(--text-subtle)`; footnotes are `var(--text-dim)`.
- Do not use uppercase display headings. Uppercase is reserved for mono labels at or
  below `0.72rem`.

### Math (KaTeX)

- `$$…$$` inside `<div class="math-display">` for display math; it gets the recessed panel,
  a sienna left rule, and horizontal scroll.
- `$…$` inline in paragraphs.

The static build renders math in `src/math.ts` with KaTeX's `htmlAndMathml` output, so
equations survive with JavaScript disabled. Do not typeset math only in client code.

**Important:** page content is a JS template literal, so backslashes are escaped — write
`\\text{sep}` in the page module. `src/pages/boids.ts` has examples. The Markdown
generator protects `$…$` / `$$…$$` before conversion, so do not wrap math in code tags.

### Tables

```html
<div class="table-wrap">
  <table class="spec-table">
    <thead><tr><th>…</th></tr></thead>
    <tbody><tr><td>…</td></tr></tbody>
  </table>
</div>
```

`.spec-table` is full width (min-width `640px`, so it scrolls), mono uppercase headers in
sienna, body rows in muted text, hairline `var(--rule)` row rules, and a stronger head
rule. Add `wrap` (`class="spec-table wrap"`) for prose cells: it lets body cells wrap,
and below `760px` it drops the 640px minimum.

### Code

```html
<div class="code-block"><pre>assign rgb_o = {12{shouldDraw}} &amp; rgb;</pre></div>
```

`.code-block` mirrors `.math-display` — recessed panel, sienna left rule, horizontal
scroll, mono `pre`. Escape HTML characters (`&lt;`, `&amp;`). Keep excerpts short; longer
listings belong in a repository.

### Figures and plates

```html
<figure class="article-figure">
  <img src="/blog/name.png" alt="…" loading="lazy" decoding="async">
  <figcaption>What the image shows and why it matters.</figcaption>
</figure>
```

Images live in `public/blog/` or `public/projects/` and are referenced by absolute path.
`.article-figure` sets the vertical rhythm, a hairline frame on the image, and a small
mono caption in muted text. Plates on the homepage and the catalogue
(`.work-thumb`, `.project-thumb`) carry **no** border, radius, or shadow: the image is
the plate, and the caption attaches to it below. Every image gets real `alt` text.

### Result blocks

Project pages that report numbers use `.result-grid` / `.result-row`: a three-up grid of
serif statements with a mono label (`Result`), a large figure, and a plain-language
basis. Values are quoted with their run count and comparison where the source has them.
Do not invent a chart when only summary numbers exist — use the result rows and a table.

### Lists

`<ul class="article-list">` for bulleted content on record and résumé pages: muted body
colour, generous line height, sienna markers. Avoid a bare `<ul>`; the base sheet does
not reset its spacing.

### Vector diagrams (SVG)

Inline SVGs use `.vector-diagram` (recessed panel, `1px solid var(--border)`, full width).
Internal text uses `.diagram-title` (sienna mono uppercase) and `.diagram-caption` (muted
mono). Arrowheads live in `<defs>` and are referenced with
`marker-end="url(#…)"`. Palette: sienna for the signal path, steel `#7fa6c9` for
secondary series, sage `#8fb3a0` for a third, ink surfaces elsewhere. Wide diagrams sit
in `.diagram-scroll` so labels stay legible instead of shrinking.

### Machine-readable representations

Page content must remain legible outside a browser. The build converts each page's
`content` to Markdown with Turndown + GFM and writes:

- `<route>.md` (or `/index.md` for the homepage) with YAML front matter.
- `/llms.txt` and `/llms-full.txt` from project/post data plus the page list.
- `/sitemap.xml` and `/robots.txt`, including the copied `/lab/aurora/` artifact with its
  own canonical URL.
- A JSON-LD `@graph` in each page's `<head>`. The homepage `Person` and the About
  `ProfilePage` share `#person` and the same GitHub/LinkedIn `sameAs` links.

Consequences for markup:

- Write real `<h1>`/`<h2>`/`<h3>` structure and prose, not text baked into an image.
- Put the substantive description of a canvas or SVG in its `aria-label`; the Markdown
  rule turns it into `[Interactive visualization: …]` or `[Diagram: …]`.
- Use `<figure>` + `<figcaption>` so captions survive conversion.
- Avoid interactive-only claims; the controls are enhancements, and the prose stands
  alone.
- Do not add an element whose only purpose is crawler metadata. Put authors, dates, and
  keywords in `Page` and the data modules.

### Content changes

1. Update `src/data/projects.ts` or `src/data/posts.ts`, then the page module. Keep a
   metric or summary consistent across both.
2. Run `npm run build && npm run validate`. The validator fails on a missing canonical
   URL, duplicate title, HTML left in Markdown, a missing sitemap entry, or a 404 that is
   not `noindex`.
3. Check one page with JavaScript disabled: content, headings, math, and figure captions
   must remain.

---

## 5. Responsive behaviour

At `max-width: 1120px` the plate grid takes fewer columns; at `960px` the project lead
grid, project header, and method strip go to one or two columns; at `760px`:

- `#app` padding drops to `18px`; homepage plates, project leads, rows, `.project-header`,
  `.about-grid`, `.home-strip`, and `.method` collapse to one column.
- `.header-note` hides; header/nav shrink; the nav wraps if needed.
- Plates go full width with their caption directly beneath; the irregular spans are
  dropped, so the board reads in a single column.
- Visual frames drop to `min-height: 360px` (article variant `320px`); the nebula stage
  drops to `420px`, the laboratory stage to `460px`.
- The nebula HUD's right label and caption hint hide; control bars wrap and the seed
  group loses `margin-left: auto`.
- `.spec-table.wrap` drops its minimum width; unwrapped tables rely on
  `.table-wrap { overflow-x: auto }`.
- `.result-grid` stacks; `.resume-entry` goes one column (dates first) and `.skill-grid`
  becomes one column.

At `520px`, mono labels drop to `0.6rem`, the article gutter rules are removed, and
result figures shrink a step.

---

## 6. Accessibility & motion

- `index.html` opens with `.skip-link` to `#main`; `main` has `tabindex="-1"` so the skip
  target takes focus. The link is translated off-screen until `:focus-visible`.
- `:focus-visible` gets a `2px solid var(--accent)` outline with `3px` offset. Do not
  remove outlines.
- The active nav item carries `aria-current="page"`; unknown routes clear it.
- Inline links in `.article` and prose blocks are underlined with
  `text-decoration-color: var(--border)`; hover adds the sienna. Colour alone never
  carries meaning.
- Canvas controls are native `<input type="range">`, `<select>`, and `<button>` with
  visible `<label>` text. The seed readout is `aria-live="polite"`.
- `prefers-reduced-motion: reduce` collapses animation and transition durations. The
  nebula adapter passes `animationSpeed: 0`, so the field is still and redraws only on
  parameter or layout change. Boids still simulates but is not motion-safe, so it stays
  behind a link rather than autoplaying on the homepage.
- Decorative marks (arrows, plate numbers, HUD labels) are `aria-hidden` where they
  repeat adjacent text.

---

## 7. Adding a new page — checklist

1. Create a page module in `src/pages/` (e.g. `my-page.ts`) exporting a `Page` — copy an
   existing record or use `templates/`. Set `description`, `kind`, and, for notes,
   `date`; set `section` for breadcrumbs.
2. Register it in `src/pages/index.ts` under its route key. The shell, generator, and 404
   handling need no changes.
3. For a project or note, add shared metadata to `src/data/projects.ts` or
   `src/data/posts.ts` and read it from the page. Never retype the summary.
4. Write `content` as `<article class="article">` (or `page-intro` + a group/list section
   for an index). A project with measurements gets **Results** and **Limitations**.
5. If it has a visualization, add a `<canvas data-visualization="…" role="img"
   aria-label="…">` inside `.visual-frame` and a branch in the canvas wiring loop in
   `src/main.ts`. Add its CSS to the existing visualization block, in the Atlas palette.
6. Escape LaTeX backslashes (`\\`), keep `aria-label`s, and verify at
   `http://localhost:5173/<route>`.
7. Run `npm run build && npm run preview`, check `<route>/` and `<route>.md`, and run
   `npm run validate`. Confirm the title, description, canonical URL, JSON-LD, sitemap
   entry, and that an unknown route renders the 404.
8. If the entry is featured, give it a plate on the homepage and, if it is a flagship, a
   lead in the catalogue. If not, add a row. Update the validator's counts.
