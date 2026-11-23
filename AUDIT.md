# Site audit and implementation report

Date: 2026-11-23
Scope: `caleblin125.github.io` as it stood at commit `d4256cd`, plus the changes in this
working tree.

The goal was to move the site from a portfolio with three technical pages toward an
inspectable engineering record: every featured system states its problem, the part that is
mine, the technologies, and one measured result, and the same facts are available to
humans, crawlers, and agents without being maintained twice.

---

## 1. What was already strong

- **A real build pipeline.** Vite + TypeScript, pre-rendered HTML per route, and a small
  hydration layer. No client-side router and no framework to carry.
- **Static output with no server dependency.** Every route is a directory with an
  `index.html`; GitHub Pages can serve it as-is.
- **A distinct visual identity.** The dark surface, monospace labels, hairline borders, and
  the WebGL nebula are consistent and worth keeping. Nothing here needed a redesign.
- **A working content layer.** `src/data/projects.ts` and `src/data/posts.ts` already fed
  the index, project rows, sitemap, and JSON-LD, so a single edit propagated.
- **Machine-readable output before this pass.** `/llms.txt`, `/llms-full.txt`,
  `/sitemap.xml`, `/robots.txt`, per-page Markdown, and JSON-LD already existed and were
  validated at build time.
- **A validation script that serves `dist/` and checks the generated surface.** This is the
  reason the changes below could be verified without a browser for every route.

## 2. Problems found

| # | Problem | Severity | Effect |
|---|---|---|---|
| 1 | The homepage showed six projects in a flat list with no problem/contribution/result structure. | High | A reader could not tell what was built, what was measured, or what was the author's contribution. |
| 2 | Only FPGA and HPC had project pages. Robotics, forecasting, and visualization existed only as résumé lines or blog posts. | High | The strongest work was the least inspectable. |
| 3 | `/projects` rendered one free-form `tags` string per project. | Medium | Categories and technologies could not be filtered, styled, or emitted as structured data. |
| 4 | Project pages had no shared shape. | Medium | Each page invented its own headings, metadata, and links, so they drifted. |
| 5 | The nebula was impressive but unexplained. Seed, density, scale, and palette were not exposed as reproducible controls. | Medium | A visitor could not reproduce a frame or understand what they were looking at. |
| 6 | The site had no feed, no `projects.json`, and no feed discovery links. | Medium | Notes and project metadata were not subscribable or machine-consumable as data. |
| 7 | No interactive demonstration of estimation, simulation, or geometry beyond Mandelbrot and Boids. | Medium | The "laboratory" claim rested on two visual toys. |
| 8 | Architecture was described in prose only. | Low | Readers had to reconstruct signal and data flow themselves. |
| 9 | Thumbnails were inconsistent: some were real output, some were decorative SVGs, and two composite SVGs referenced external `<image href>` files that cannot load through `<img>`. | Low | Two thumbnails would silently render blank. |
| 10 | Wide diagrams were not handled on small screens. | Low | Labels became unreadable below ~600 px. |

## 3. What changed

### 3.1 Central project model

`src/data/projects.ts` is now the single source for the project index, homepage previews,
project pages, `projects.json`, `llms.txt`, the sitemap, Markdown front matter, and JSON-LD.
`ProjectEntry` gained:

- `category` — one stable label per project, used for display and grouping.
- `problem` — the constraint the project addresses.
- `contribution` — the part that is specifically the author's.
- `technologies` — a structured list replacing the free-form `tags` string.
- `dates` — optional `started`, `measured`, and `published` fields, kept separate from the
  human-readable `period` so a write-up date is never presented as an experiment date.

Eleven projects remain. Exactly five are `featured`: FPGA, HPC, robotics, forecasting, and
computational visualization. TreeSim, Mandelbrot, and Boids stay as individual project pages.

### 3.2 New and rebuilt pages

| Route | State |
|---|---|
| `/` | Rebuilt around the five featured projects. Each preview states problem, contribution, technologies, one measured result, and links to the full project. |
| `/projects` | Rebuilt to render category plus structured technology lists. |
| `/projects/fpga` | Reframed as Overview → Architecture → Implementation → Results → Analysis, with an inline architecture diagram. |
| `/projects/hpc` | Same structure, with an HPL sweep and scaling diagram. |
| `/projects/robotics` | New. Beacon receiver, control loop, state estimation, the synthetic Kalman demo, and an explicit note that the shipped match code used reactive tape logic and IR peak tracking, while the particle filter, opponent EKF, and A* were built and simulated but did not ship. |
| `/projects/forecasting` | New. Data-center load forecasting, 3% MAPE against a 10% baseline, and the feature/validation pipeline. |
| `/projects/visualization` | New. Mandelbrot orbit seeds and Boids as two views of the same rendering problem, with numbers drawn from the existing code and notes. |
| `/projects/treesim` | New. Evolutionary tree simulation: growth brain, light and soil fields, MPI run, two real single-seed runs, stand measurements, phylogeny, and the documented leaf-area gap. |
| `/projects/mandelbrot`, `/projects/boids` | Unchanged in scope; Boids now honors reduced motion with a still frame. |

`src/pages/project-ui.ts` holds the shared project header, fact list (category, period,
technologies, dates), result rows, and footer links. A project page that lacks a fact simply
omits it; no page pads a section it cannot support.

### 3.3 Demonstrations

- **Synthetic 1D Kalman filter** (`src/kalman/filter.ts`, `src/kalman/demo.ts`). Deterministic
  seed `0x5eed1234`, constant-velocity track, adjustable process and measurement noise,
  Run/Pause/Reset, live estimate and RMSE, and a faint truth path for context. The page
  states that the data is synthetic, that the RMSE is computed from that run only, and that
  it says nothing about the robot's field performance.
- **Nebula controls.** Presets (Filament, Ice drift, Ember core), density, scale, and palette
  sliders; a `?seed=` parameter; a permalink control; a Reseed button that writes the new
  seed back to the URL; a live seed readout; and an expandable explanation of the field,
  reduced-motion behavior, and the WebGL fallback.
- **Architecture diagrams.** Inline SVG for FPGA, HPC, robotics, forecasting,
  visualization, and tree simulation, each wrapped in `.diagram-scroll` so wide labels stay
  legible on narrow screens instead of shrinking.

### 3.4 Machine-readable surface

- `/projects.json` — every project as structured data: category, problem, contribution,
  technologies, dates, links, metrics, thumbnail, and route.
- `/feed.xml` — Atom feed of the engineering notes, newest first, with discovery links in
  every page `<head>`.
- `/llms.txt` — site summary, project and note index, and links to every representation.
- `/llms-full.txt` — every indexable page as Markdown, separated by canonical URLs.
- JSON-LD — `Person`, `WebSite`, the page type, breadcrumbs, and the work or article, with
  robotics, machine learning, forecasting, visualization, and simulation described explicitly.

### 3.5 Delivery and accessibility

- Canvas renderers, including the Kalman demo, are dynamically imported, so the initial
  bundle does not carry code a route never uses.
- The nebula canvas is absolutely positioned inside its stage; this fixes a `ResizeObserver`
  feedback loop that previously logged console errors during layout.
- Boids renders a still frame under `prefers-reduced-motion: reduce`.
- Project images have descriptive alt text; robot and visualization thumbnails are raster
  PNGs at 480 × 320 because an SVG loaded through `<img>` cannot fetch an external image.
- Nebula controls are native `<select>` and `<input type="range">`, so they work with a
  keyboard and expose their values to assistive technology.

## 4. Verification performed

- `npm run build` succeeds (`tsc`, `vite build`, `generate:html`).
- `npm run validate` passes **938 checks, 0 failures**, covering all 18 routes, the eleven
  project rows, the five homepage thumbnails, the Atom feed, `projects.json`, sitemap and
  robots, per-page feed discovery, JSON-LD, and Markdown representations.
- Bundle after the changes: main JS ~129 kB (gzip ~44 kB), CSS ~49 kB (gzip ~12.6 kB),
  with renderers and the Kalman demo in lazy chunks. KaTeX auto-render remains the largest
  single asset at ~255 kB and is only fetched by pages that contain math.
- Browser checks at 1440 × 900 and 390 × 844 for `/`, `/projects`, `/projects/robotics`,
  `/projects/forecasting`, `/projects/visualization`, and `/projects/treesim`: layout,
  thumbnails, diagrams, results, tables, and the Kalman controls all render and operate.
- Generated HTML, Markdown, XML, and JSON were re-read as UTF-8 and contain the intended
  characters (`—`, `±`). PowerShell console output shows mojibake; the files do not.

## 5. Known limitations

- **No automated accessibility or performance audit.** Keyboard order, contrast, and
  reduced motion were checked by inspection and by the browser where it was available, not
  by axe or Lighthouse in CI.
- **The in-app browser became undriveable** after roughly ten tabs
  (`No OpenChamber client connected here can control a page`). Nebula preset/reseed clicks,
  forced reduced-motion emulation, and the WebGL-disabled fallback were reviewed in code
  but not re-clicked in that final session.
- **No benchmark explorer.** The spec prioritizes one; shipping it would require sweep data
  that does not exist in the repository. Rather than invent a dataset, the pages report only
  documented values (3× class throughput, 663 GFLOPS / 47% of peak, 10 ms control period,
  3% vs 10% MAPE, 44,200 orbit seeds).
- **Dates are partial.** Several projects have a period but no exact start or measurement
  date, so those fields are omitted rather than guessed.
- **The Kalman demo is not the robot's filter.** It is a synthetic, clearly labeled
  demonstration of the same estimation idea, not a replay of field data.
- **Robotics scope is stated conservatively.** The page separates what shipped from what was
  built and simulated; it does not claim the filter ran on the competition robot.
- **KaTeX is still large.** It is lazy-loaded and route-scoped, so it does not affect the
  homepage, but a future pass could split it further.

## 6. Files changed

- `src/data/projects.ts` — extended model, 11 projects, 5 featured entries, new thumbnails.
- `src/pages/home.ts` — five-project homepage and nebula controls/explanation.
- `src/pages/projects.ts` — categories, structured technologies, and a lede that names simulation.
- `src/pages/project-ui.ts` — shared project header, facts, results, footer.
- `src/pages/fpga.ts`, `src/pages/hpc.ts` — restructured with architecture diagrams.
- `src/pages/robotics.ts`, `src/pages/forecasting.ts`, `src/pages/visualization.ts`, `src/pages/treesim.ts` — new.
- `src/pages/boids.ts`, `src/pages/index.ts` — diagram frame, route registration.
- `src/kalman/filter.ts`, `src/kalman/demo.ts` — synthetic filter and demo UI.
- `src/nebula/renderer.ts` — presets, permalink, seed, reduced motion, adaptive quality.
- `src/boids/renderer.ts` — reduced-motion still frame.
- `src/main.ts` — dynamic renderer imports, Kalman wiring.
- `src/render.ts`, `src/structured-data.ts`, `index.html` — feed discovery and metadata.
- `src/style.css` — project, chip, result, nebula-note, demo, and `.diagram-scroll` styles.
- `scripts/generate-site.ts` — Atom feed, `projects.json`, expanded `llms.txt`.
- `scripts/validate.mjs` — 938-check matrix, 11 project rows, `.jpg`/`.webp` content types.
- `public/projects/forecasting.svg`, `robotics.png`, `visualization.png` — new thumbnails.
- `public/projects/treesim.jpg`, `treesim-fittest.jpg`, `treesim-metrics.png` — TreeSim run output.
- `public/projects/exploratory.svg` — title no longer claims a simulation motif.
- `README.md` — routes, modules, machine-readable files, thumbnail constraints.

## 7. Recommended next steps

1. Add a CI accessibility check (axe or Lighthouse) and a link checker.
2. Build a benchmark explorer only once real sweep data is exported from the HPL runs.
3. Add exact experiment dates where artifacts exist (benchmark logs, competition records).
4. Re-run the nebula fallback and reduced-motion checks on a fresh browser session.
5. Consider splitting KaTeX per page or replacing it with pre-rendered math for static pages.
6. Run TreeSim on an ensemble of seeds before treating any stand measurement as characteristic.

## 8. Addendum: TreeSim page (2026-11-23)

The site now documents the tree simulation as project 06 at `/projects/treesim`. The source is
the public `caleblin125/TreeSimulation` repository on `haydean` (39 commits, first commit
2026-06-27, about 10,500 lines under `src/`, `include/`, and `tools/`). The page was written
from the repository's README, `docs/realism.md`, parameter files, tests, cluster scripts, and
two run directories under `/haydean/caleb/treesim/runs`; no result was inferred from a render.

Evidence is two real single-seed runs, kept separate because their code provenance differs:

- **235-year hills run with self-avoidance** — seed 7, 24 ranks, 2,160 founders on a 120 m
  plot with 25 m relief, 24 chained jobs, 42.6 h of recorded wall time. Recorded at commit
  `090e270` plus a saved `uncommitted.diff`. Ended at 51,755 trees, 6.11 million limbs, 1,327
  surviving lineages (711.7 effective), and a 10.65 m tallest tree. Its `stand_stats.txt`
  supplies the density, basal area, biomass, height distribution, and crown-shape figures.
- **1,778-year hills run** — seed 1591, 48 ranks, 37.2 h. Began at `b390b0c` and resumed after
  `57e28b7`. Ended at 5,637 trees, 1.14 million limbs, 41 lineages (10.9 effective), and an
  8.07 m tallest tree. It is the source of the UPGMA phylogeny result (400 sampled genomes,
  77% nearest genetic neighbour in the same founder lineage).

The page uses a cropped side-view stand render as its thumbnail, a six-fittest-trees panel as
its hero figure, and the run's own six-panel metrics plot. The phylogeny is cited in text
rather than embedded because its labels are unreadable at page width. The 20 m self-avoidance
comparison (25% to 15% crown self-overlap, taller trees with thicker trunks) is quoted from
the parameter file's project notes, not re-measured for this page.

`src/pages/treesim.ts` follows Overview, Architecture, Implementation, Results, Analysis with
an inline SVG of the growth-and-selection loop. `src/data/projects.ts` gains the entry and
renumbers Mandelbrot 07, Boids 08, AutoSentiment 09, AI tutoring 10, and Exploratory 11.
TreeSimulation is removed from the Exploratory links, and that thumbnail's title no longer
claims a simulation motif.

Known limits are stated on the page: one seed per run, different code provenance between the
two runs, light-catching area of 0.44 m²/m² against a real forest's 3–8, rare flat leaves,
fixed equal-width MPI strips, and a windowed viewer exercised only headless. The generic
build passes all simulation tests; the `-march=native` cluster build is compute-node only and
crashes on the older login node, as the README warns.
