# caleblin125.github.io

A personal website and portfolio for Caleb Lin: an engineering / graphics / HPC-focused
homepage built around interactive **WebGL2** visual experiments. The site is a Vite +
TypeScript single-page app that renders its content from an in-code page table, with
KaTeX-rendered math and two canvas visualizations (Mandelbrot orbit points and a boids
flocking simulation). It also hosts a web-readable résumé at `/resume` and dedicated
FPGA and HPC project pages.

## Purpose

This repo is the source of the personal website served at `caleblin125.github.io`.
It started from two earlier Java experiments — [Chaos-Equations](https://github.com/OppositeShark/Chaos-Equations.git)
(Mandelbrot orbit points, angle-based coloring) and [Boids](https://github.com/OppositeShark/Boids/tree/main/Boids/src)
(prey/predator flocking) — and reimplements both in the browser with WebGL2 and TypeScript,
as a way to learn rendering while keeping the projects visible.

## Project structure

```
├── index.html              # Vite entry point; mounts #app and loads /src/main.ts
├── package.json            # npm project: vite, typescript, katex
├── tsconfig.json           # strict-ish TS config, bundler resolution, noEmit
├── _config.yml             # legacy Jekyll config (GitHub Pages theme); the site itself is the Vite app
├── public/                 # static assets copied verbatim into dist/
│   ├── caleb-lin-resume.pdf
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.ts             # SPA shell: routing, header/footer, KaTeX init, canvas wiring
│   ├── style.css           # all site styling: design tokens, layout, article, tables, diagrams
│   ├── pages/              # one file per page; assembled into the `pages` record by index.ts
│   │   ├── index.ts        # barrel: maps routes to the page modules below
│   │   ├── types.ts        # the shared `Page` type ({ title, eyebrow, content })
│   │   ├── constants.ts    # shared URL constants used inside content strings
│   │   ├── home.ts         # "/"
│   │   ├── projects.ts     # "/projects"
│   │   ├── resume.ts       # "/resume" (web version + PDF download)
│   │   ├── about.ts        # "/about"
│   │   ├── mandelbrot.ts   # "/projects/mandelbrot"
│   │   ├── boids.ts        # "/projects/boids"
│   │   ├── fpga.ts         # "/projects/fpga"
│   │   ├── hpc.ts          # "/projects/hpc"
│   │   ├── blog.ts         # "/blog"
│   │   └── seeing-the-mandelbrot-set.ts  # "/blog/seeing-the-mandelbrot-set"
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
  (`{ title, eyebrow, content }`). `src/pages/index.ts` assembles them into the
  `pages` record keyed by route (`/`, `/projects`, `/projects/fpga`,
  `/projects/hpc`, `/projects/boids`, `/projects/mandelbrot`, `/resume`,
  `/blog`, `/blog/...`).
- **`src/main.ts`** imports that record, injects the current route's content into
  `#app`, KaTeX auto-renders `$...$` / `$$...$$` math, and hands every
  `canvas[data-visualization]` on the page to its renderer:
  - `data-visualization="boids"` → `new BoidsRenderer(canvas)`
  - anything else (currently `"mandelbrot"`) → `new ChaosRenderer(canvas, new Mandelbrot())`
  To add a page: create a file in `src/pages/` and register it in
  `src/pages/index.ts` — the shell and routing need no changes.
- **Renderers** (`src/boids/renderer.ts`, `src/chaos/renderer.ts`) follow a common shape:
  grab a `webgl2` context (boids uses `{ preserveDrawingBuffer: true }` for trail persistence),
  compile shaders imported via Vite's `?raw` suffix, listen for `resize` (respecting
  `devicePixelRatio`), and drive a `requestAnimationFrame` loop.
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
