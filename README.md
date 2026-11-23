# caleblin125.github.io

A personal website and portfolio for Caleb Lin: an engineering / graphics / HPC-focused
homepage built around interactive **WebGL2** visual experiments. The site is a Vite +
TypeScript app whose content lives in an in-code page table; at build time every route is
pre-rendered to static HTML, and the client hydrates only the canvas visualizations and
route-specific metadata. It has KaTeX-rendered math and three canvas visualizations: a
procedural seed-reproducible nebula on the homepage, Mandelbrot orbit points, and a boids
flocking simulation. It also hosts a web-readable résumé at `/resume`, dedicated FPGA and
HPC project pages, engineering notes, and a real 404 page.

The same source also produces agent-readable representations: Markdown for every page,
`/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt`, and per-page JSON-LD. The
human pages and those files share one content layer, so they cannot drift.

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
├── _config.yml             # legacy Jekyll config (GitHub Pages theme); the site itself is the Vite app
├── public/                 # static assets copied verbatim into dist/
│   ├── blog/               # post figures (poster, robot CAD, glove plots, VGA frames and sprites)
│   ├── caleb-lin-resume.pdf
│   ├── favicon.svg
│   └── icons.svg
├── scripts/
│   ├── generate.mjs        # loads the TS generator through Vite's SSR module loader
│   ├── generate-site.ts    # static HTML, Markdown, llms.txt, sitemap, robots
│   └── validate.mjs        # serves dist/ and checks the agent-facing surface
├── src/
│   ├── main.ts             # hydration: route check, dev rendering, meta updates, canvas wiring
│   ├── render.ts           # shared shell (header/nav/footer), canonical/Markdown paths, page meta
│   ├── math.ts             # build-time KaTeX rendering for static pages
│   ├── structured-data.ts  # JSON-LD @graph per page
│   ├── style.css           # all site styling: tokens, layout, article, tables, diagrams, nebula
│   ├── data/               # shared source of truth for projects and notes
│   │   ├── projects.ts     # project index, metrics, links, keywords, descriptions
│   │   └── posts.ts        # note titles, dates, summaries, keywords
│   ├── pages/              # one file per page; assembled into the `pages` record by index.ts
│   │   ├── index.ts        # barrel: maps routes to the page modules below
│   │   ├── types.ts        # the shared `Page` type (title, kind, description, dates, keywords, content)
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

## How the site is put together

- **`src/pages/`** holds one module per page, each exporting a `Page`. `src/pages/index.ts`
  assembles them into the `pages` record keyed by route (`/`, `/projects`,
  `/projects/fpga`, `/projects/hpc`, `/projects/boids`, `/projects/mandelbrot`,
  `/resume`, `/blog`, `/blog/...`).
- **`src/data/`** is the shared source of truth for things that appear in more than one
  place. `projects.ts` supplies the project index rows, the homepage selected work, the
  project pages' descriptions and keywords, thumbnails, `llms.txt`, and JSON-LD.
  `posts.ts` supplies the note index, post front matter, dates, and per-post metadata.
  Edit these files first when a project or post changes; do not duplicate the same
  sentence in a page and in the generated files.
- **Project thumbnails:** every `ProjectEntry` needs an `image: { src, alt }`. Use an
  actual project output where one exists (`public/blog/` or `public/projects/`);
  otherwise add a 3:2 technical SVG under `public/projects/`. Raster thumbnails are
  480 × 320. `npm run generate:thumbnails` re-renders the Mandelbrot and Boids images
  from the same rules as their canvases.
- **`src/render.ts`** owns the parts that must match between the static build and the
  client: the header/nav/footer shell, canonical URL normalization (directory routes end
  in `/`), Markdown paths, and document/meta title rules. `src/main.ts` and the generator
  both call it.
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

## Machine-readable surface

| URL | Contents |
|---|---|
| `/llms.txt` | Site summary, project and note index, links to every page and representation |
| `/llms-full.txt` | Every indexable page as Markdown in one file, separated by canonical URLs |
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
