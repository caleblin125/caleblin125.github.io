# caleblin125.github.io

A personal website and portfolio for Caleb Lin: an engineering / graphics / HPC-focused
homepage built around interactive **WebGL2** visual experiments. The site is a Vite +
TypeScript single-page app that renders its content from an in-code page table, with
KaTeX-rendered math and three canvas visualizations: a procedural seed-reproducible
nebula on the homepage, Mandelbrot orbit points, and a boids flocking simulation. It
also hosts a web-readable résumé at `/resume`, dedicated FPGA and HPC project pages,
engineering notes, and a real 404 page.

## Purpose

This repo is the source of the personal website served at `caleblin125.github.io`.
It started from two earlier Java experiments — [Chaos-Equations](https://github.com/OppositeShark/Chaos-Equations.git)
(Mandelbrot orbit points, angle-based coloring) and [Boids](https://github.com/OppositeShark/Boids/tree/main/Boids/src)
(prey/predator flocking) — and reimplements both in the browser with WebGL2 and TypeScript,
as a way to learn rendering while keeping the projects visible.

## Project structure

```
├── index.html              # document head (meta/OG/canonical/JSON-LD/fonts), skip link, mounts #app
├── package.json            # npm project: vite, typescript, katex
├── tsconfig.json           # strict-ish TS config, bundler resolution, noEmit
├── _config.yml             # legacy Jekyll config (GitHub Pages theme); the site itself is the Vite app
├── public/                 # static assets copied verbatim into dist/
│   ├── blog/               # post figures (poster, robot CAD, glove plots, VGA frames and sprites)
│   ├── caleb-lin-resume.pdf
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.ts             # SPA shell: routing/404, header/footer, meta updates, KaTeX, canvas wiring
│   ├── style.css           # all site styling: tokens, layout, article, tables, diagrams, nebula
│   ├── pages/              # one file per page; assembled into the `pages` record by index.ts
│   │   ├── index.ts        # barrel: maps routes to the page modules below
│   │   ├── types.ts        # the shared `Page` type ({ title, eyebrow, description?, content })
│   │   ├── constants.ts    # shared URL constants used inside content strings
│   │   ├── home.ts         # "/" (nebula + selected work)
│   │   ├── not-found.ts    # 404 content for unknown routes
│   │   ├── projects.ts     # "/projects"
│   │   ├── resume.ts       # "/resume" (web version + PDF download)
│   │   ├── about.ts        # "/about"
│   │   ├── mandelbrot.ts   # "/projects/mandelbrot"
│   │   ├── boids.ts        # "/projects/boids"
│   │   ├── fpga.ts         # "/projects/fpga"
│   │   ├── hpc.ts          # "/projects/hpc"
│   │   ├── blog.ts         # "/blog"
│   │   ├── a-game-with-no-framebuffer.ts       # "/blog/a-game-with-no-framebuffer"
│   │   ├── a-robot-on-a-field-with-no-map.ts   # "/blog/a-robot-on-a-field-with-no-map"
│   │   ├── seeing-the-mandelbrot-set.ts        # "/blog/seeing-the-mandelbrot-set"
│   │   ├── the-glove-is-the-controller.ts      # "/blog/the-glove-is-the-controller"
│   │   └── where-the-file-meets-the-machine.ts # "/blog/where-the-file-meets-the-machine"
│   ├── nebula/             # homepage procedural nebula
│   │   ├── renderer.ts     # NebulaRenderer: seeded uniforms, controls, quality, pause, fallback
│   │   └── shaders/
│   │       ├── nebula.glsl      # domain-warped fBm field, stars, palettes, dither
│   │       └── nebula.vert.glsl # full-screen triangle from gl_VertexID
│   ├── boids/              # boids flocking visualization
│   │   ├── renderer.ts     # BoidsRenderer: CPU simulation + instanced WebGL2 chevrons + trail fade
│   │   └── shaders/
│   │       ├── boids.glsl      # boid fragment shader (chevron color, alpha 0.88)
│   │       ├── boids.vert.glsl # boid vertex shader (6-vertex chevron, rotate/scale per instance)
│   │       ├── fade.glsl       # trail-decay fragment shader (background + fade alpha)
│   │       └── fade.vert.glsl  # fullscreen-triangle vertex shader for the fade pass
│   └── chaos/              # Mandelbrot orbit-point visualization
│       ├── renderer.ts     # ChaosRenderer: instanced point rendering of stable orbits
│       ├── mandelbrot.ts   # Mandelbrot model: center/zoom/iterations state, pan/scale
│       └── shaders/
│           ├── mandelbrot.glsl # point fragment shader (discard + point-sprite circle)
│           └── vertex.glsl     # per-instance orbit iteration, HSV coloring by step angle
├── templates/              # copy-paste templates for new pages/shaders (see templates/README.md)
├── dist/                   # build output (gitignored; regenerate with `npm run build`)
└── docs-of-style: STYLE.md # design tokens, layout classes, and canvas-element conventions
```

## How the app is put together

- **`src/pages/`** holds one module per page, each exporting a `Page`
  (`{ title, eyebrow, description?, content }`). `src/pages/index.ts` assembles them
  into the `pages` record keyed by route (`/`, `/projects`, `/projects/fpga`,
  `/projects/hpc`, `/projects/boids`, `/projects/mandelbrot`, `/resume`,
  `/blog`, `/blog/...`).
- **`src/main.ts`** imports that record, injects the current route's content into
  `#app`, and updates `document.title`, the meta description, Open Graph/Twitter tags,
  the canonical link, and `robots` for the route. Unknown routes render
  `src/pages/not-found.ts` with `noindex, nofollow`. It then KaTeX-renders `$...$` /
  `$$...$$` math and hands every `canvas[data-visualization]` on the page to its
  renderer inside a try/catch:
  - `data-visualization="boids"` → `new BoidsRenderer(canvas)`
  - `data-visualization="nebula"` → `new NebulaRenderer(canvas)`
  - anything else (currently `"mandelbrot"`) → `new ChaosRenderer(canvas, new Mandelbrot())`
  A failing renderer marks its frame `.is-fallback` and does not stop the page.
  To add a page: create a file in `src/pages/` and register it in
  `src/pages/index.ts` — the shell and routing need no changes.
- **Renderers** (`src/nebula/renderer.ts`, `src/boids/renderer.ts`,
  `src/chaos/renderer.ts`) follow a common shape: grab a `webgl2` context (boids uses
  `{ preserveDrawingBuffer: true }` for trail persistence), compile shaders imported via
  Vite's `?raw` suffix, listen for `resize` (respecting `devicePixelRatio`), and drive a
  `requestAnimationFrame` loop. Boids and nebula pause offscreen and when the tab is
  hidden; the nebula also caps DPR, adapts its render scale to frame time, and draws a
  static frame under `prefers-reduced-motion`.
- **Nebula seeding:** the URL accepts `?seed=<hex>`; `0x1a2b3c4d` is the curated default.
  The Reseed button updates the URL so a field can be shared and reproduced. Density,
  scale, and palette (`violet` / `ice` / `ember`) are uniform inputs to the fragment
  shader.
- **Shaders** are plain GLSL ES 3.00 files imported as raw strings. They live next to their
  renderer under `src/<viz>/shaders/`.
- **Math** on pages is KaTeX. Write `$$...$$` for display math and `$...$` for inline; the
  `math-display` class styles the block form.

## Commands

```bash
npm install       # install dependencies (vite, typescript, katex)
npm run dev       # start the Vite dev server (hot reload)
npm run build     # type-check with tsc, then build into dist/
npm run preview   # serve the built dist/ locally
```

## Styling and templates

- Read **`STYLE.md`** for the design system (colors, fonts, layout classes) and the exact
  conventions for placing `<canvas>` elements and wiring visualizations.
- Use the files in **`templates/`** as starting points for new blog posts, project pages,
  and shaders — see **`templates/README.md`** for usage.

## Deployment

GitHub Pages serves the built app, not the repo root. `.github/workflows/deploy.yml`
runs on every push to `main`: it installs dependencies, runs `npm run build`, copies
`dist/index.html` to `dist/404.html` so deep links fall back to the SPA, adds
`.nojekyll`, and deploys `dist/` as the Pages artifact. Pages must be configured with
**Build and deployment → Source: GitHub Actions**; nothing is committed from `dist/`.
