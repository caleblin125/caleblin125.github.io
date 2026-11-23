# STYLE.md — Webpage styling & canvas structure

This document describes the visual language and the canvas conventions used across the
site, so new pages and visualizations match the existing ones. Everything below is
derived from the live code in `src/style.css` and `src/main.ts` — if you change the CSS,
update this file to match.

---

## 1. Design tokens

All tokens live on `:root` in `src/style.css` (plus a few hard-coded values in the
component rules).

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#120d18` | page / body background, frame background |
| `--bg-surface` | `#1a1320` | control bars, panel backgrounds |
| `--bg-surface-alt` | `#2a1e32` | `.math-display`, `.vector-diagram`, `.code-block` |
| boids frame | `#0e101c` | `.boids-frame` (darker, near-black) |
| `--text` | `#eee8f2` | main foreground text |
| `--text-heading` | `#f2ecf5` | heading and metric text |
| `--text-muted` | `#b9acbe` | paragraphs |
| `--text-subtle` | `#a192a7` | tags, secondary labels |
| `--text-dim` | `#9a8da0` | HUD text, seeds, footnotes |
| `--accent` | `#c59ad8` | kickers, hover links, brand slash, diagram titles |
| `--border` | `#51425a` | headers, rows, frames, table rules |
| `--border-subtle` | `#403248` | inner control-bar rules |

`html` sets `color-scheme: dark`, so native controls (range, select) follow the dark palette.

### Fonts

- **Body / headings:** "Space Grotesk".
- **Mono / labels:** "DM Mono" — used for `.kicker`, `.tag`, `.visual-label`,
  `.header-note`, table headers, diagram captions, the nebula HUD and its controls.
  These elements typically use
  `font: .68rem "DM Mono", monospace; letter-spacing: .08em; text-transform: uppercase;`.
- Fonts are loaded from Google Fonts with `<link>` tags in `index.html`, after
  `preconnect` hints. Do not add a CSS `@import`; it blocks rendering later than the
  document-level links.

### Layout constants

- App max width: `1240px`, centered, `padding: 0 48px` (`20px` below 760px).
- Header min-height: `84px` (`76px` mobile), bottom border `1px solid #51425a`.
- Article column: `max-width: 820px; margin: 0 auto`.
- Paragraph max width inside cards/articles: `620px`.
- Mobile breakpoint: `760px` (single-column grids, smaller type).

---

## 2. Page anatomy

Every page is a module in `src/pages/` exporting a `Page` value; the `pages`
record mapping routes to those modules lives in `src/pages/index.ts`. The shell
(header/nav/footer) is rendered once by `main.ts`; the page contributes only its
`content`.

`Page` is `{ title, eyebrow, content, description? }`. `description` is optional but
should be set on every page: `main.ts` uses it for the meta description, Open Graph,
and Twitter tags, and rewrites those tags on every route change.

Unknown routes render `notFoundPage` (also exported from `src/pages/index.ts`), with
`noindex, nofollow` and no canonical link. The deploy workflow copies `index.html` to
`404.html`, so the same app boots for unknown deep links.

### Common elements

- `<p class="kicker">` — small magenta mono label above an `<h1>` (e.g. `Project / Boids`).
- `<h1>` — the page title (large, light-weight `Space Grotesk`).
- `<p class="lede">` — one-sentence summary under the title.
- `.link-row` — inline links with `<a class="text-link">` ("uppercase mono" buttons).

### Landing page (`/`)

```
<section class="hero-grid">
  <div class="hero-copy">…kicker / h1 / lede / link-row…</div>
  <div class="nebula-frame" data-nebula>
    <div class="nebula-stage">
      <canvas data-visualization="nebula" role="img" aria-label="…"></canvas>
      <div class="nebula-hud" aria-hidden="true">Field 01 / … · WebGL2 / …</div>
      <p class="nebula-caption">Nebula <span>pointer parallax / seed-reproducible</span></p>
      <div class="nebula-fallback">…shown when WebGL2 is unavailable…</div>
    </div>
    <div class="nebula-controls">
      density range · scale range · palette select · seed readout · reseed button
    </div>
  </div>
</section>
<section class="selected-work" id="selected-work">
  <div class="section-head"><p class="kicker">Selected work</p><a class="text-link">…</a></div>
  <div class="work-list">
    <a class="work-row" href="/projects/…">
      <span class="work-number">01</span>
      <div><h2>Title</h2><p>One-sentence claim.</p></div>
      <span class="work-metric"><strong>3×</strong><span>class throughput</span></span>
    </a>
    …
  </div>
</section>
<section class="home-strip">…three-column "at the moment" strip…</section>
```

Use the work rows for three projects with a hard, sourced number each — not for a
generic list. The nebula is the only visualization on the homepage; the Mandelbrot
canvas lives on `/projects/mandelbrot`.

### Project index (`/projects`)

```
<section class="page-intro">…</section>
<section class="project-list">
  <article class="project-row">
    <div class="project-number">01</div>
    <div><h2><a>Title</a></h2><p>Description</p>
         <div class="project-links"><a>Link</a>…</div>
         <span class="tag">WebGL / TypeScript</span></div>
    <div class="project-status">Building</div>
  </article>
  …
</section>
```

### Blog index (`/blog`)

```
<section class="page-intro">…</section>
<section class="post-list">
  <a class="post-row" href="/blog/…">
    <span class="post-date">2026 / 08 / 20</span>
    <span><h2>Title</h2><p>Excerpt</p></span>
    <span class="arrow">↗</span>
  </a>
  …
</section>
```

### Résumé page (`/resume`)

```
<article class="article resume">
  <p class="kicker">Résumé</p><h1>Caleb Lin.</h1><p class="lede">…</p>
  <div class="resume-contact">…email / LinkedIn / GitHub / location…</div>
  <div class="link-row"><a class="text-link" href="/caleb-lin-resume.pdf">Download PDF ↗</a></div>
  <section class="resume-section">
    <h2>Education</h2>
    <div class="resume-entry"><div><h3>…</h3><p class="resume-sub">…</p></div>
         <div class="resume-date">Expected June 2027</div></div>
    <p class="resume-note">GPA …</p>
    <ul class="article-list"><li>…</li></ul>
  </section>
  <section class="resume-section"><h2>Skills</h2>
    <div class="skill-grid"><div><span class="skill-label">Languages</span><p>…</p></div>…</div>
  </section>
</article>
```

The downloadable PDF lives at `public/caleb-lin-resume.pdf` and is served from `/caleb-lin-resume.pdf`.

### Article pages (`/projects/*`, `/blog/*`)

```
<article class="article">
  <p class="kicker">Project / Boids</p>
  <h1>Title.</h1>
  <p class="lede">…</p>
  <div class="article-visual visual-frame …"><canvas data-visualization="…">…
       <div class="visual-label">…</div></div>
  <p>…body…</p>
  <h2>Section</h2>  <h3>Sub-section</h3>
  <div class="math-display">$$…$$</div>
  <div class="table-wrap"><table class="spec-table">…</table></div>
  <svg class="vector-diagram">…</svg>
</article>
```

Project pages that report measurements end with a **Limitations** section: a short
paragraph that says what the number is not, so the result is not overclaimed. See
`/projects/fpga` and `/projects/hpc`.

### 404 page

`src/pages/not-found.ts` supplies the content for any route missing from the `pages`
record. It uses `.page-intro`, `.mono-note` (a dim mono line), and a `.link-row` back to
the main sections. Keep it useful, not cute. `main.ts` marks unknown routes with
`noindex, nofollow`, removes the canonical link, and clears the active nav item.

---

## 3. Canvas elements & visualizations

### The DOM pattern (required)

A visualization lives inside a `.visual-frame`:

```html
<div class="article-visual visual-frame boids-frame">
  <canvas data-visualization="boids"
          aria-label="Interactive boids flocking simulation"></canvas>
  <div class="visual-label">Boids <span>move the pointer through the flock</span></div>
</div>
```

Rules:

- The `<canvas>` **must** carry a `data-visualization` attribute. `main.ts` finds every
  such canvas after rendering a page and instantiates the matching renderer inside a
  try/catch:
  ```ts
  for (const canvas of document.querySelectorAll("canvas[data-visualization]")) {
      try {
          if (kind === "boids") new BoidsRenderer(canvas).start();
          else if (kind === "nebula") new NebulaRenderer(canvas).start();
          else new ChaosRenderer(canvas, new Mandelbrot()).start();
      } catch (error) {
          canvas.closest(".visual-frame, .nebula-frame")?.classList.add("is-fallback");
      }
  }
  ```
  Add a new branch here when you introduce a new visualization kind. A failed renderer
  must not stop the other canvases on the page.
- `.visual-frame` gives the canvas its dark background, min-height (`500px`, `360px`
  mobile; `.article-visual` variant `460px`/`320px`), and the `1px solid #51425a` border.
  `.is-fallback` hides the canvas and shows a "needs WebGL2" note via a pseudo-element.
- `.nebula-frame` is the homepage variant: it stacks a `.nebula-stage` (canvas + HUD +
  caption + fallback) over a `.nebula-controls` bar, with the same hairline border.
- `.visual-label` is absolutely positioned at the bottom of the frame; it shows the viz
  name in accent color plus a hint (`.visual-label span`) in muted text. Keep it
  `pointer-events: none` so it never blocks pointer interaction.
- Give the canvas a `role="img"` and an `aria-label` that describes what it shows. The
  controls are separate native inputs, not canvas interaction.

### Renderer conventions (TypeScript side)

Each renderer (`src/boids/renderer.ts`, `src/chaos/renderer.ts`, `src/nebula/renderer.ts`)
follows this shape:

1. **Context:** `canvas.getContext("webgl2")`. Boids additionally passes
   `{ preserveDrawingBuffer: true }` because its trails rely on the framebuffer
   persisting between frames (the canvas is not cleared each frame — a fade pass
   decays it). The Mandelbrot and nebula renderers clear every frame and do not need it.
2. **Shaders:** imported as raw strings and compiled at construction:
   ```ts
   import fragmentSource from "./shaders/boids.glsl?raw";
   ```
3. **Resize:** a `resize` handler multiplies `clientWidth/Height` by
   `window.devicePixelRatio`, sets `canvas.width/height`, updates `gl.viewport`, and
   repaints. Register it on `window` for `"resize"`; the nebula also uses
   `ResizeObserver`. Repaint on every resize: changing the drawing-buffer size clears
   the canvas, so a paused loop would otherwise leave a black frame.
4. **Loop:** `requestAnimationFrame(this.render)`; the boids loop steps a fixed-timestep
   simulation, the chaos renderer re-renders on demand (`requestRender`) to avoid work
   while idle. Boids and nebula pause their loops when the canvas leaves the viewport
   (`IntersectionObserver`) or the document is hidden, and resume on return.
5. **Instancing:** boids uses `drawArraysInstanced` for 489 chevrons; chaos uses
   instanced `POINTS` with `gl_InstanceID` driving orbit iteration in the vertex shader.
   The nebula uses a single full-screen triangle generated from `gl_VertexID`; the
   fragment shader owns the whole image, so there are no vertex buffers or attributes.

### Nebula renderer specifics

- **Model:** domain-warped fBm in the fragment shader (four value-noise octaves, two
  warp passes), plus hashed-grid stars and a low-frequency veil. It is a 2D field, not a
  ray-marched volume — chosen for cost and for the filament shapes it produces.
- **Controls:** `data-nebula-density`, `data-nebula-scale`, `data-nebula-palette`, and
  `data-nebula-reseed` are read from the closest `[data-nebula]` frame. Palette keys are
  `violet`, `ice`, and `ember`; keep the `<option>` values and `PALETTES` in sync.
- **Seeds:** `?seed=<hex>` (1–8 hex digits) selects a frame. `0x1a2b3c4d` is the curated
  default; `offsetForSeed` hashes every other seed into a decorrelated region of the
  field. Reseed writes the new seed back to the URL with `history.replaceState`, so a
  frame can be reloaded or shared.
- **Budget:** DPR is capped at 2; an adaptive quality factor downscales the drawing
  buffer when the average frame time stays above ~24 ms, and recovers below ~14 ms.
  Reduced-motion users get a single static frame at `u_time = 12` and no loop.
- **Fallback:** if WebGL2 is unavailable or the context is lost, the frame gets
  `.is-fallback`; the canvas is hidden and the `.nebula-fallback` note is shown.

### Shader file layout

GLSL ES 3.00 (`#version 300 es`), imported with `?raw`, one file per shader stage:

```
src/<viz>/shaders/
├── <name>.vert.glsl      # vertex shader
├── <name>.glsl           # fragment shader
└── fade.*                # (boids) trail-decay pass
```

---

## 4. Content components

### Math (`KaTeX`)

`main.ts` calls `renderMathInElement(app, { delimiters: [{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}] })`.
Use:

- `$$…$$` inside a `<div class="math-display">` for display math — gets the accent left
  border and panel background.
- `$…$` inline in paragraphs.

**Important:** page content strings are JS template literals, so backslashes must be
escaped — write `\\text{sep}` in the page module (renders as `\text{sep}`). See
`src/pages/boids.ts` for examples.

### Tables

Wrap tables in a scroll container and use the shared class:

```html
<div class="table-wrap">
  <table class="spec-table">
    <thead><tr><th>…</th></tr></thead>
    <tbody><tr><td>…</td></tr></tbody>
  </table>
</div>
```

`.spec-table` is full width (min-width 640px so it scrolls on mobile), mono uppercase
headers in accent, body rows in muted text with `1px solid #51425a` row rules. Add the
`wrap` class (`<table class="spec-table wrap">`) when cells contain prose rather than
short numeric values; it lets body cells wrap instead of forcing horizontal scroll, and
below `760px` it drops the 640px minimum so the whole table fits the screen.

### Code blocks

Wrap a short excerpt in `.code-block`:

```html
<div class="code-block"><pre>assign rgb_o = {12{shouldDraw}} &amp; rgb;</pre></div>
```

`.code-block` mirrors `.math-display` — panel background, accent left rule, and
horizontal scroll — and its `pre` uses the mono font. Escape HTML characters
(`&lt;`, `&amp;`) inside the excerpt, and keep code blocks to a few lines; longer
listings belong in a repository or a linked file.

### Figures

```html
<figure class="article-figure">
  <img src="/blog/name.png" alt="…" loading="lazy">
  <figcaption>What the image shows and why it matters.</figcaption>
</figure>
```

Images live in `public/blog/` and are referenced by absolute path. `.article-figure`
sets the vertical rhythm, a hairline border on the image, and a small mono caption in
muted text. Keep figures to the article's 820px measure and write real `alt` text.

### Lists

Use `<ul class="article-list">` for bulleted content on article and résumé pages. It sets the muted body color, line height, and accent-colored markers. Avoid a bare `<ul>` — the base stylesheet does not reset its spacing or color.

### Résumé

The `/resume` page uses `.resume`, `.resume-section`, `.resume-entry`, `.resume-sub`, `.resume-date`, `.resume-note`, `.resume-contact`, `.skill-grid`, and `.skill-label`. Section headings are small mono uppercase, entries are a two-column grid, and the skill grid is two columns; both collapse to one column at `760px`.

### Vector diagrams (SVG)

Inline SVGs are styled with `.vector-diagram` (panel background, border, full width).
Internal text uses `.diagram-title` (accent, mono, uppercase) and `.diagram-caption`
(muted mono). Marker arrowheads are defined in `<defs>` and referenced via
`marker-end="url(#…)"`. See the boids page for a three-panel example
(separation / alignment / cohesion).

---

## 5. Responsive behavior

At `max-width: 760px`:

- `#app` padding drops to `20px`; grids (`hero-grid`, `about-grid`, `home-strip`,
  `project-row`) collapse to a single column.
- `.header-note` hides; header/nav shrink.
- Visual frames drop to `min-height: 360px` (article variant `320px`); the nebula stage
  drops to `420px`.
- The nebula HUD's right label and the caption's right hint hide; the control bar wraps
  and the seed group loses its `margin-left: auto`.
- `.work-row` becomes one column, with the metric moved under the description in a
  horizontal pair.
- Tables rely on `.table-wrap { overflow-x: auto }` rather than resizing.
- `.spec-table.wrap` drops its minimum width, so prose tables fit the screen.
- `.resume-entry` collapses to one column (dates go left) and `.skill-grid` becomes one column.

---

## 6. Accessibility & motion

- `index.html` starts with a `.skip-link` to `#main`; `main` has `tabindex="-1"` so the
  skip target takes focus. The link is translated off-screen until `:focus-visible`.
- `:focus-visible` gets a 2px accent outline with a 3px offset. Do not remove outlines.
- The active nav item carries `aria-current="page"`. Unknown routes clear it.
- Inline links inside `.article` and `.about-grid` prose are underlined with
  `text-decoration-color: var(--border)`; do not rely on hover color alone.
- Canvas controls are native `<input type="range">`, `<select>`, and `<button>` with
  visible `<label>` text. The seed readout is `aria-live="polite"`.
- `@media (prefers-reduced-motion: reduce)` collapses animation/transition durations.
  The nebula detects it directly and draws one static frame instead of looping; boids
  still simulates but is not motion-safe by nature, so keep it behind a link rather than
  autoplaying it on the homepage.

---

## 7. Adding a new page — quick checklist

1. Create a page module in `src/pages/` (e.g. `my-page.ts`) exporting a `Page`
   `{ title, eyebrow, description, content }` — copy an existing page file or use the
   templates in `templates/`.
2. Register it in `src/pages/index.ts` under its route key (e.g.
   `"/projects/my-page": myPage`). The shell, routing, and 404 fallback in
   `src/main.ts` need no changes.
3. Write the `content` string as an `<article class="article">` (or a
   `page-intro` + list section for index pages). Project pages with measurements get a
   **Limitations** section.
4. If the page has a visualization, add a `<canvas data-visualization="…" role="img"
   aria-label="…">` inside a `.visual-frame` and a matching branch in the canvas wiring
   loop in `src/main.ts`.
5. Escape LaTeX backslashes (`\\`), keep `aria-label`s, and verify at
   `http://localhost:5173/<route>`.
6. Check the page in the built app as well (`npm run build && npm run preview`); confirm
   the title, description, and canonical URL update, and that unknown routes render the
   404 page rather than the homepage.
