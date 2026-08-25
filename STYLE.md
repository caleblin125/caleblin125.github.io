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
| `--text` color | `#eee8f2` | main foreground text |
| page background | `#201625` | body / app background |
| panel background | `#2a1e32` | `.math-display`, `.vector-diagram`, table headers |
| frame background | `#120d18` | `.visual-frame` (canvas container) |
| boids frame | `#0e101c` | `.boids-frame` (darker, near-black) |
| accent | `#c59ad8` | kickers, links on hover, brand slash, math-display border |
| border | `#51425a` | headers, rows, frames, table rules |
| muted text | `#b1a4b6` / `#a192a7` / `#85768b` | paragraphs, tags, footer |
| link hover | `#c59ad8` | interactive emphasis |

### Fonts

- **Body / headings:** "Space Grotesk" (loaded from Google Fonts).
- **Mono / labels:** "DM Mono" — used for `.kicker`, `.tag`, `.visual-label`,
  `.header-note`, table headers, and the diagram captions. These elements typically use
  `font: .68rem "DM Mono", monospace; letter-spacing: .08em; text-transform: uppercase;`.

### Layout constants

- App max width: `1240px`, centered, `padding: 0 48px` (`20px` below 760px).
- Header min-height: `84px` (`76px` mobile), bottom border `1px solid #51425a`.
- Article column: `max-width: 820px; margin: 0 auto`.
- Paragraph max width inside cards/articles: `620px`.
- Mobile breakpoint: `760px` (single-column grids, smaller type).

---

## 2. Page anatomy

Every page is a value in the `pages` record in `src/main.ts`. The shell
(header/nav/footer) is rendered once by `main.ts`; the page contributes only its
`content` string.

### Common elements

- `<p class="kicker">` — small magenta mono label above an `<h1>` (e.g. `Project / Boids`).
- `<h1>` — the page title (large, light-weight `Space Grotesk`).
- `<p class="lede">` — one-sentence summary under the title.
- `.link-row` — inline links with `<a class="text-link">` ("uppercase mono" buttons).

### Landing page (`/`)

```
<section class="hero-grid">
  <div class="hero-copy">…kicker / h1 / lede / link-row…</div>
  <div class="visual-frame"><canvas data-visualization="mandelbrot">…</canvas>
    <div class="visual-label">…</div></div>
</section>
<section class="home-strip">…three-column "at the moment" strip…</section>
```

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
  such canvas after rendering a page and instantiates the matching renderer:
  ```ts
  for (const canvas of document.querySelectorAll("canvas[data-visualization]")) {
      if (canvas.dataset.visualization === "boids") new BoidsRenderer(canvas).start();
      else new ChaosRenderer(canvas, new Mandelbrot()).start();
  }
  ```
  Add a new branch here when you introduce a new visualization kind.
- `.visual-frame` gives the canvas its dark background, min-height (`500px`, `360px`
  mobile; `.article-visual` variant `460px`/`320px`), and the `1px solid #51425a` border.
- `.visual-label` is absolutely positioned at the bottom of the frame; it shows the viz
  name in accent color plus a hint (`.visual-label span`) in muted text. Keep it
  `pointer-events: none` so it never blocks pointer interaction.
- `aria-label` on the canvas is required for accessibility.

### Renderer conventions (TypeScript side)

Each renderer (`src/boids/renderer.ts`, `src/chaos/renderer.ts`) follows this shape:

1. **Context:** `canvas.getContext("webgl2")`. Boids additionally passes
   `{ preserveDrawingBuffer: true }` because its trails rely on the framebuffer
   persisting between frames (the canvas is not cleared each frame — a fade pass
   decays it). The Mandelbrot renderer clears every frame and does not need it.
2. **Shaders:** imported as raw strings and compiled at construction:
   ```ts
   import fragmentSource from "./shaders/boids.glsl?raw";
   ```
3. **Resize:** a `resize` handler multiplies `clientWidth/Height` by
   `window.devicePixelRatio`, sets `canvas.width/height`, updates `gl.viewport`, and
   (for boids) performs the initial clear. Register it on `window` for `"resize"`.
4. **Loop:** `requestAnimationFrame(this.render)`; the boids loop steps a fixed-timestep
   simulation, the chaos renderer re-renders on demand (`requestRender`) to avoid work
   while idle.
5. **Instancing:** boids uses `drawArraysInstanced` for 489 chevrons; chaos uses
   instanced `POINTS` with `gl_InstanceID` driving orbit iteration in the vertex shader.

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
escaped — write `\\text{sep}` in `main.ts` (renders as `\text{sep}`). See
`src/main.ts` `/projects/boids` for examples.

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
headers in accent, body rows in muted text with `1px solid #51425a` row rules.

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
- Visual frames drop to `min-height: 360px` (article variant `320px`).
- Tables rely on `.table-wrap { overflow-x: auto }` rather than resizing.

---

## 6. Adding a new page — quick checklist

1. Add an entry to the `pages` record in `src/main.ts` keyed by route
   (`{ title, eyebrow, content }`); the fallback is the home page.
2. Write the `content` string as an `<article class="article">` (or a `page-intro` +
   list section for index pages). Use the templates in `templates/`.
3. If the page has a visualization, add a `<canvas data-visualization="…">` inside a
   `.visual-frame` and a matching branch in the canvas wiring loop.
4. Escape LaTeX backslashes (`\\`), keep `aria-label`s, and verify at
   `http://localhost:5173/<route>`.
