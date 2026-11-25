# caleblin125.github.io

A personal website and portfolio for Caleb Lin: an engineering / graphics / HPC-focused
homepage built around interactive **WebGL2** visual experiments. The site is a Vite +
TypeScript app whose content lives in an in-code page table; at build time every route is
pre-rendered to static HTML, and the client hydrates only the canvas visualizations and
route-specific metadata. It has KaTeX-rendered math and four canvas visualizations: a
procedural seed-reproducible nebula on the homepage, Mandelbrot orbit points, a boids
flocking simulation, and a synthetic Kalman-filter demo. It also hosts a web-readable
résumé at `/resume`, nine project pages (FPGA, HPC, SCC Connect 2026, robotics, forecasting,
visualization, Mandelbrot, boids, tree simulation), engineering notes, and a real 404 page.

The same source also produces agent-readable representations: Markdown for every page,
`/llms.txt`, `/llms-full.txt`, `/projects.json`, `/feed.xml` (Atom), `/sitemap.xml`,
`/robots.txt`, and per-page JSON-LD. The human pages and those files share one content
layer, so they cannot drift.

## Purpose

This repo is the source of the personal website served at `caleblin125.github.io`.
It started from two earlier Java experiments — [Chaos-Equations](https://github.com/OppositeShark/Chaos-Equations.git)
(Mandelbrot orbit points, angle-based coloring) and [Boids](https://github.com/OppositeShark/Boids/tree/main/Boids/src)
(prey/predator flocking) — and reimplements both in the browser with WebGL2 and TypeScript,
as a way to learn rendering while keeping the projects visible.

## Project structure

```
├── index.html              # development shell: base metadata, skip link, mounts #app
├── package.json            # npm project: vite, typescript, katex, turndown
├── tsconfig.json           # strict-ish TS config, bundler resolution, noEmit
├── public/                 # static assets copied verbatim into dist/
│   ├── blog/               # post figures (poster, robot CAD, glove plots, VGA frames and sprites)
│   ├── projects/           # 3:2 project thumbnails (raster output + vector diagrams)
│   ├── caleb-lin-resume.pdf
│   ├── favicon.svg
│   └── icons.svg
├── scripts/
│   ├── generate.mjs        # loads the TS generator through Vite's SSR module loader
│   ├── generate-site.ts    # static HTML, Markdown, llms.txt, projects.json, feed, sitemap, robots
│   ├── generate-thumbnails.mjs # re-renders the Mandelbrot and Boids raster thumbnails
│   └── validate.mjs        # serves dist/ and checks the agent-facing surface
├── src/
│   ├── main.ts             # hydration: route check, dev rendering, meta updates, canvas wiring
│   ├── identity.ts         # single source for the name, affiliation, and social-preview image
│   ├── render.ts           # shared shell (header/nav/footer), canonical/Markdown paths, page meta
│   ├── math.ts             # build-time KaTeX rendering for static pages
│   ├── structured-data.ts  # JSON-LD @graph per page
│   ├── style.css           # all site styling: tokens, layout, article, tables, diagrams, nebula
│   ├── data/               # shared source of truth for projects and notes
│   │   ├── projects.ts     # project index, categories, problem/contribution, metrics, links
│   │   └── posts.ts        # note titles, dates, summaries, keywords
│   ├── pages/              # one file per page; assembled into the `pages` record by index.ts
│   │   ├── index.ts        # barrel: maps routes to the page modules below
│   │   ├── types.ts        # the shared `Page` type (title, kind, description, dates, keywords, content)
│   │   ├── constants.ts    # shared URL constants used inside content strings
│   │   ├── project-ui.ts   # shared project header, fact list, result rows, footer links
│   │   ├── home.ts         # "/" (nebula + five featured projects)
│   │   ├── not-found.ts    # 404 content for unknown routes
│   │   ├── projects.ts     # "/projects" (grouped: flagship, experiments, archive)
│   │   ├── lab.ts          # "/lab" (interactive experiment index)
│   │   ├── nebula-lab.ts   # "/lab/nebula" (full nebula control surface)
│   │   ├── resume.ts       # "/resume" (web version + PDF download)
│   │   ├── about.ts        # "/about"
│   │   ├── mandelbrot.ts   # "/projects/mandelbrot"
│   │   ├── boids.ts        # "/projects/boids"
│   │   ├── fpga.ts         # "/projects/fpga"
│   │   ├── hpc.ts          # "/projects/hpc"
│   │   ├── robotics.ts     # "/projects/robotics" (beacon receiver, control loop, Kalman demo)
│   │   ├── forecasting.ts  # "/projects/forecasting"
│   │   ├── visualization.ts # "/projects/visualization"
│   │   ├── treesim.ts      # "/projects/treesim"
│   │   ├── scc.ts          # "/projects/scc-connect" (SCC Connect 2026 benchmark work)
│   │   ├── blog.ts         # "/blog"
│   │   ├── a-game-with-no-framebuffer.ts       # "/blog/a-game-with-no-framebuffer"
│   │   ├── a-robot-on-a-field-with-no-map.ts   # "/blog/a-robot-on-a-field-with-no-map"
│   │   ├── seeing-the-mandelbrot-set.ts        # "/blog/seeing-the-mandelbrot-set"
│   │   ├── the-glove-is-the-controller.ts      # "/blog/the-glove-is-the-controller"
│   │   └── where-the-file-meets-the-machine.ts # "/blog/where-the-file-meets-the-machine"
│   ├── kalman/             # synthetic 1D Kalman demo on the robotics page
│   │   ├── filter.ts       # deterministic track, filter math, RMSE (testable without DOM)
│   │   └── demo.ts         # Canvas 2D controls, step history, drawing
│   ├── lab/                # measured-data and model explorers shared by pages
│   │   ├── bench-data.ts   # SCC Connect 2026 HPL/NCCL/STREAM values + accessible tables
│   │   ├── bench.ts        # Canvas 2D bar-chart explorer (no interpolation)
│   │   └── filter.ts       # cascaded Sallen-Key bandpass model (anchored, not swept)
│   ├── nebula/             # procedural nebula (homepage + laboratory)
│   │   ├── parameters.ts   # parameter model, six palettes, control schema, clamping
│   │   ├── presets.ts      # six curated presets and preset detection
│   │   ├── random.ts       # decimal seed helpers (1–999999)
│   │   ├── controls.ts     # schema-driven control markup for both surfaces
│   │   ├── renderer.ts     # site adapter: URL state, controls, pause, reduced motion, fallback
│   │   ├── engine/         # vendored WebGL2 engine: renderer, programs, bloom, timing
│   │   └── shaders/        # vertex, 2D field, volume, post, and shared GLSL includes
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
├── STYLE.md                # design tokens, layout classes, and canvas-element conventions
└── docs/AUDIT.md           # dated site audit and implementation report
```

## How the site is put together

- **`src/pages/`** holds one module per page, each exporting a `Page`. `src/pages/index.ts`
  assembles them into the `pages` record keyed by route (`/`, `/projects`, `/lab`,
  `/lab/nebula`, `/projects/fpga`, `/projects/hpc`, `/projects/robotics`,
  `/projects/forecasting`, `/projects/visualization`, `/projects/boids`,
  `/projects/mandelbrot`, `/projects/treesim`, `/projects/scc-connect`, `/resume`,
  `/blog`, `/blog/...`).
- **`src/data/`** is the shared source of truth for things that appear in more than one
  place. `projects.ts` supplies the project index rows, categories, problem and
  contribution text, homepage selected work, project pages' metadata, thumbnails,
  `projects.json`, `llms.txt`, the sitemap, and JSON-LD.
  `posts.ts` supplies the note index, post front matter, dates, the Atom feed, and
  per-post metadata. Edit these files first when a project or post changes; do not
  duplicate the same sentence in a page and in the generated files.
- **Project pages:** use `src/pages/project-ui.ts` for the shared header, fact list
  (category, work period, technologies, dates), result rows, and footer. The body follows
  Overview → Architecture → Implementation → Results → Analysis; omit a section rather
  than padding it. Diagrams are inline SVG inside a `.diagram-scroll` frame so they stay
  legible on narrow screens.
- **Project thumbnails:** every `ProjectEntry` needs an `image: { src, alt }`. Use an
  actual project output where one exists (`public/blog/` or `public/projects/`);
  otherwise add a 3:2 technical SVG under `public/projects/`. Raster thumbnails are
  480 × 320. `npm run generate:thumbnails` re-renders the Mandelbrot and Boids images
  from the same rules as their canvases. Thumbnail SVGs must be self-contained: an SVG
  loaded through `<img>` cannot fetch an external `<image href>`, so composite rasters
  are stored as PNG instead.
- **`src/render.ts`** owns the parts that must match between the static build and the
  client: the header/nav/footer shell, canonical URL normalization (directory routes end
  in `/`), Markdown paths, and document/meta title rules. `src/main.ts` and the generator
  both call it.
- **`src/identity.ts`** is the single source for the author's name, affiliation, degree
  programs, and social-preview image. `src/render.ts` and `src/structured-data.ts` read it;
  `index.html` repeats the Person JSON-LD for the dev shell, so keep that copy in step with
  the generated graph.
- **`scripts/generate-site.ts`** is the build-time renderer. `npm run generate:docs` writes
  the machine-readable files to `public/` for the dev server; `npm run generate:html`
  reads the Vite-built `dist/index.html` for the hashed asset tags, then writes static
  `index.html` files for every route plus `404.html`, Markdown, `llms.txt`,
  `llms-full.txt`, `sitemap.xml`, `robots.txt`, and `.nojekyll`.
- **Hydration:** generated pages carry `data-prerendered="true"` and `data-route="…"` on
  `#app`. `src/main.ts` skips re-rendering only when both match the current path; this
  protects against a static host's SPA fallback serving another route's document. It still
  updates metadata and starts the canvases.
- **Math:** static pages render KaTeX at build time (with a MathML annotation), so
  equations are readable without JavaScript. The dev server keeps KaTeX's
  `auto-render` path. Write `$$...$$` for display math and `$...$` for inline; the
  `math-display` class styles the block form.
- **Markdown:** Turndown + GFM convert each page's content. Custom rules preserve fenced
  code, protect math from escaping, turn canvas/SVG visuals into described placeholders,
  flatten selected-work rows, and drop canvas-only interface chrome.
- **JSON-LD:** `src/structured-data.ts` emits an `@graph` per page with Person, WebSite,
  WebPage/AboutPage/ProfilePage/CollectionPage, BreadcrumbList where applicable, and
  BlogPosting or CreativeWork for notes and projects.
- **Renderers** (`src/nebula/renderer.ts`, `src/boids/renderer.ts`,
  `src/chaos/renderer.ts`) follow a common shape: they own a canvas, compile shaders
  imported via Vite's `?raw` suffix, listen for layout changes (respecting
  `devicePixelRatio`), and drive or request frames. The nebula adapter sits on top of a
  vendored engine in `src/nebula/engine/`: the engine owns GL state, shader programs,
  bloom, GPU timing, adaptive quality, and the 2D/volume samplers; the adapter owns URL
  state, the DOM controls, intersection and visibility pausing, reduced motion, and the
  fallback. Boids and nebula pause offscreen and when the tab is hidden; the nebula caps
  DPR, adapts its render scale, and holds animation at zero for `prefers-reduced-motion`.
- **Nebula state:** the seed is a decimal integer from 1 to 999999. The URL carries
  `seed`, `preset`, `palette`, every numeric parameter, `mode` (`2d` or `volume`),
  `debug`, and `quality`. Six presets (Orion Deep, Carina Core, Veil Filaments, Cold
  Drift, Ember Bloom, Violet Hollow) and six five-stop palettes (Orion, Carina, Veil,
  Ember, Violet, Ice) are complete starting points, not hidden shader modes. The homepage
  exposes preset, density, scale, palette, seed, link, and reseed; `/lab/nebula` adds the
  volume renderer, the five diagnostic channels, quality, fullscreen, copy-link, the seed
  input, and every advanced parameter.
- **Interactive lab:** `/lab` indexes every live experiment and labels it *Measured*,
  *Model*, *Synthetic*, or *Live*. The labels are a claim about provenance, so keep them
  accurate when adding an entry. `/lab/nebula` is the only page that owns a full control
  surface; the homepage nebula shares the engine and parameter model with it.
- **Measured explorers:** `src/lab/bench-data.ts` holds the SCC Connect 2026 values
  exactly as reported, with the campaign note, run counts, and a matching HTML table.
  `src/lab/bench.ts` draws those points only; do not add interpolation, fitted trends, or
  synthesised rows. Every dataset must say what its rows do and do not support.
- **Model explorers:** `src/lab/filter.ts` is a calculated response, not a sweep. It is
  anchored at the published first-stage center and Q (2000.33 Hz, 20.3) repeated across
  three sections; changing the controls explores that model, not the assembled board.
  The page must keep saying so next to the chart.
- **Shaders** are plain GLSL ES 3.00 files imported as raw strings. They live next to their
  renderer under `src/<viz>/shaders/`.

## Machine-readable surface

| URL | Contents |
|---|---|
| `/llms.txt` | Site summary, project and note index, links to every page and representation |
| `/llms-full.txt` | Every indexable page as Markdown in one file, separated by canonical URLs |
| `/projects.json` | Structured project metadata: category, problem, contribution, technologies, dates, links, metrics |
| `/feed.xml` | Atom feed of the engineering notes, newest first |
| `/sitemap.xml` | Canonical URLs with `lastmod`, `changefreq`, and `priority` |
| `/robots.txt` | Crawl permission and the sitemap location |
| `/<route>.md` (`/index.md` for `/`) | YAML front matter plus the page body as Markdown |
| JSON-LD in each page `<head>` | Person, WebSite, the page type, breadcrumbs, and the work/article |

Every page also advertises its Markdown alternate and the sitemap through `<link>` tags,
and carries canonical, Open Graph, and Twitter metadata in the raw HTML.

## Commands

```bash
npm install            # install dependencies (vite, typescript, katex, turndown)
npm run dev            # generate the dev Markdown mirror, then start Vite (hot reload)
npm run generate:docs  # refresh public/ Markdown, llms.txt, sitemap, robots
npm run build          # tsc, Vite build, then static HTML + machine files into dist/
npm run preview        # serve the built dist/ locally
npm run validate       # serve dist/ and check HTML, Markdown, metadata, sitemap, 404
```

`npm run dev` runs `generate:docs` through `predev`. Generated files in `public/` are
gitignored; the build writes fresh copies into `dist/` from the same source modules.
Run `npm run build && npm run validate` before shipping a content or metadata change.

## Styling and templates

- Read **`STYLE.md`** for the design system (colors, fonts, layout classes) and the exact
  conventions for placing `<canvas>` elements and wiring visualizations.
- Use the files in **`templates/`** as starting points for new blog posts, project pages,
  and shaders — see **`templates/README.md`** for usage.

## Deployment

GitHub Pages serves the built output, not the repo root. `.github/workflows/deploy.yml`
runs on every push to `main`: it installs dependencies, runs `npm run build`, adds
`.nojekyll`, and deploys `dist/` as the Pages artifact. The build already writes a real
`404.html` with `noindex`, so there is no SPA fallback step. Pages must be configured with
**Build and deployment → Source: GitHub Actions**; nothing is committed from `dist/`.

Because every route is emitted as `<route>/index.html`, GitHub Pages redirects
`/projects/fpga` to `/projects/fpga/`; canonical URLs already use the trailing slash.
