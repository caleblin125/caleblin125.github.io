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
- `npm run validate` passes **1,126 checks, 0 failures**, covering all 21 routes, the twelve
  project rows, the five homepage thumbnails, the Atom feed, `projects.json`, sitemap and
  robots, per-page feed discovery, JSON-LD, and Markdown representations.
- Bundle after the changes: main JS ~207 kB (gzip ~69.6 kB), CSS ~58 kB (gzip ~14 kB),
  with renderers, the bench explorer, the filter model, and the Kalman demo in lazy chunks.
  KaTeX auto-render remains the largest single asset at ~261 kB and is only fetched by pages
  that contain math.
- Browser checks at 1440 × 900 and 390 × 844 for `/`, `/projects`, `/lab`, `/lab/nebula`,
  `/projects/hpc#bench`, `/projects/robotics#filter`, `/projects/forecasting`, and
  `/projects/scc-connect`: layout, thumbnails, diagrams, results, tables, the benchmark
  explorer, the filter model, and the Kalman controls all render and operate.
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
- **No forecasting explorer.** The published record does not include the train/test
  boundary, horizon, features, missing-data rule, or per-horizon errors, so an explorer
  would need a fabricated series. The page documents the gaps instead; the HPC and filter
  explorers exist because their underlying numbers do.
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
- SCC Connect 2026 additions are listed in §9.

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
(SCC Connect 2026 later took 07 and shifted these to 08–12; see §9.) TreeSimulation is
removed from the Exploratory links, and that thumbnail's title no longer claims a simulation
motif.

Known limits are stated on the page: one seed per run, different code provenance between the
two runs, light-catching area of 0.44 m²/m² against a real forest's 3–8, rare flat leaves,
fixed equal-width MPI strips, and a windowed viewer exercised only headless. The generic
build passes all simulation tests; the `-march=native` cluster build is compute-node only and
crashes on the older login node, as the README warns.

## 9. Addendum: SCC Connect 2026 page (2026-11-23)

The site now documents the SCC Connect 2026 competition work as project 07 at
`/projects/scc-connect`. Later projects were renumbered Mandelbrot 08, Boids 09, AutoSentiment
10, AI tutoring 11, and Exploratory 12; the homepage still shows five featured projects. The
page is an engineering record of the three graded benchmarks — CPU HPL, CPU STREAM, and NCCL
over NVLink — on one NVIDIA LaunchPad bare-metal node, not a competition recap.

**Evidence.** The page was written from the team's submitted benchmark report and its LaTeX
sources on `scc-connect-17-gpu01` (`/home/nvidia/report`, sections `hpl.tex`, `stream.tex`,
`nccl.tex`, `tooling.tex`, and `ai.tex`), the submitted report and per-benchmark logs under
`/submissions/not_so_slow_slugs-benchmark-report/`, the run records and `outputs/best/*.json`
under `~/caleb/SCC-CONNECT-2026`, the separate WRF and MFC submission trees, and the ValQyriE
results snapshot. No number was taken from a tuner summary without a named run behind it.

**Headline results.** CPU HPL 4,403.6 GFLOPS at N = 324,520 (86.0% of the 5,120 GFLOPS
base-clock peak; mean 4,399.1 ± 3.0 over 24 large-N runs). CPU STREAM Triad 481.6 GB/s best and
476.2 ± 1.8 GB/s mean over 28,758 validated runs (72.4% and 71.5% of the 665.6 GB/s DRAM peak).
NCCL all_reduce 249.9 GB/s (78.4% of the 318.7 GB/s per-direction NVLink peak), with all_gather
249.7, reduce_scatter 246.4, and broadcast 251.4 GB/s. The page pairs each best value with its
mean and run count.

**Scope and credits.** The page credits Caleb for the HPL and STREAM harnesses, the NCCL grid,
the large-N and repeat campaigns, and most of the report; Myles Hallett for the local-AI
appendix and the final NCCL narrative; Indira Mariya for the final NCCL tuning; and Holden
Martinez for the ValQyriE results. Shiloh Sharmahd and Julien Lee are named as team members
without a specific claim.

**What stays separate.** WRF (298.5× on the team's Santa Cruz 3-hour case, not answer-checked;
the submitted Derecho case is a different 24-hour forecast), MFC (artifacts and figures, no
performance claim), ValQyriE (434.627 s single-core against 29,704.248 s for the reference
NumPy code, 68.3×, correctness gate passing, thread sweep pending), and the local AI assistant
(Qwen3.8-27B-FP8 with MTP2, 156 tok/s for one user on one GPU) are presented as separate
deliverables, not as points on the three graded benchmarks. GPU HPL (69.15 TFLOPS) and GPU
STREAM (3,446.5 GB/s) are labeled supplementary and ungraded.

**No placement.** The artifacts contain no award or placement, so the page claims none. It also
states that the SMAC3 runs are a sequential search, not independent experiments, and that best
values are best runs paired with means.

**Figures.** The page uses three real report figures — the HPL campaign scatter, the STREAM
array-size sweep, and the 648-run NCCL grid — plus a new self-contained SVG thumbnail that plots
the three graded results as a share of hardware peak. The figures were trimmed of surrounding
whitespace and resized to 1,400 px wide; no data was redrawn.

**Verification.** `npm run build` succeeds. `npm run validate` passes 1,004 checks across 19
routes, including 12 project rows and 12 thumbnails; `projects.json` lists 12 projects with 5
featured. The page was checked in the browser at 1440 × 900 and 390 × 844: the inline pipeline
diagram scrolls inside its frame on mobile, the three figures render, the results table does
not overflow, and the thumbnail is legible in the project index. Generated Markdown and JSON
were read back as UTF-8.

**Known limits.** One node, one event, one submission. The WRF tuning case was not
answer-checked and differs from the submitted Derecho forecast. The ValQyriE speedup is
single-core and was measured under shared-machine load; the thread sweep was still pending. The
GPU benchmark numbers are supplementary. The report's own limits stand: the 1 GB huge-page
reservation was untested, and no raw NVLink copy ceiling was measured with a separate tool.

**Files changed.** `src/pages/scc.ts` (new page), `src/pages/index.ts` (route),
`src/pages/constants.ts` (team repository), `src/data/projects.ts` (entry, metric, renumbering),
`src/pages/projects.ts` (lede and keywords), `src/pages/hpc.ts` and `src/pages/resume.ts` (SCC
links), `src/structured-data.ts` (`knowsAbout`), `scripts/validate.mjs` (counts and needles),
`public/projects/scc-connect.svg`, `scc-hpl.png`, `scc-stream.png`, `scc-nccl.png`, `README.md`,
and this file.


## 10. Addendum: Evidence, interactivity, and the lab (2026-11-23)

This pass changed the site from "pages that describe work" to "pages that show the
measured record and let a reader move it." It is additive: the framework, the nebula,
the five homepage projects, and the existing project text are unchanged in intent.

**New routes.** `/lab` indexes every interactive experiment with a provenance tag
(*Measured*, *Model*, *Synthetic*, *Live*). `/lab/nebula` exposes the full control surface
for the shader the homepage already used: seed, view, octaves, warp, variant, density,
scale, palette, quality, fullscreen, copy-config, and URL restoration. The homepage keeps
its smaller control set and its existing instance; both use the same renderer and shader,
and the default seed reproduces the original frame.

**Measured explorer.** `/projects/hpc#bench` charts the SCC Connect 2026 HPL, NCCL, and
STREAM values from `src/lab/bench-data.ts`: four HPL sizes with min–max whiskers, four
separate HPL settings campaigns, the 8 GiB NCCL matrix (four collectives, eight channel
configurations), and the STREAM repeat variations. Every point was run; no curve is
interpolated and no row is synthesised. The tables under the chart carry the same values,
run counts, and campaign provenance, including the fact that the settings rows come from
unequal campaigns rather than a factorial experiment.

**Model explorer.** `/projects/robotics#filter` plots three cascaded second-order
bandpass sections anchored at the published first-stage Monte Carlo result
(f0 = 2000.33 Hz, Q = 20.3 ± 2.7). The page labels it a model next to the chart and in the
caption, marks the 1.5 and 2.5 kHz wall tones, and names what is missing: component values,
the other sections' individual results, a swept Bode plot, and the field SNR.

**Forecasting record.** The forecasting page now separates what is published (decade of
10-minute data, 3% MAPE, 10% baseline) from what is not (split, horizon, features,
missing-data treatment, per-horizon errors, robustness). It states why there is no
explorer: a verified forecast series and holdout boundary do not exist in the repository,
so any chart would be invented. A contribution note separates the lab's dataset and
baseline from the modelling work.

**Robotics evidence.** Two real glove-study figures were added, and the page now says that
no video of the final run is published, so the minspec claim rests on the team's recorded
result rather than a replayable artifact.

**Projects index.** The twelve projects are grouped into Flagship work (7), Experiments
(3), and Archive (2). Rows gained demo links and an *Interactive* badge; the homepage
gained the same badge on rows that have one, a direct *Interactive lab* link, and a
Build → Instrument → Measure → Understand strip.

**Verification.** `npm run build` succeeds. `npm run validate` passes **1,126 checks, 0
failures** across **21 routes**, including the two lab routes, the grouped project index,
and needles for the HPC explorer, filter model, and forecasting record. Browser checks at
1440 × 900 and 390 × 844 covered `/lab`, `/lab/nebula` (all five views, preset, palette,
variant, octaves, warp, seed, fullscreen entry points, URL state), `/projects`,
`/projects/hpc#bench` (all four datasets, hover readout, tables), `/projects/robotics#filter`
(1 and 3 stages, sliders, legend), and the homepage method strip. The nebula still renders
its default frame and the bench legend now wraps instead of clipping on phones.

**Bundle.** Main JS ~207 kB raw / ~69.6 kB gzip; CSS ~58 kB / ~14 kB gzip. The two new
explorers are lazy chunks (`bench` ~5.6 kB, `filter` ~5.0 kB raw). The main-chunk growth
comes from the shared bench dataset and the expanded nebula renderer reaching every page
through the static page modules.

**Known limits.** No forecasting explorer (no verified series), no FPGA synthesis panel
(no public report), no robot video. Only mean/SD/Q are published for the filter, so no
Monte Carlo distribution is drawn. The filter model repeats the first-stage result across
all sections and is not the assembled board's measured response. The HPC settings rows are
not a controlled experiment and the page does not test significance. The bench chart
suppresses numeric labels on phones and relies on the hover readout plus the tables.

**Files changed.** `src/lab/{bench-data,bench,filter}.ts` (new), `src/pages/{lab,nebula-lab}.ts`
(new), `src/nebula/{renderer.ts,shaders/nebula.glsl}` (views, octaves, warp, variant, URL
state, quality, fullscreen), `src/pages/{hpc,robotics,forecasting,projects,home,index}.ts`,
`src/data/projects.ts` (group/demo), `src/main.ts` (explorer dispatch), `src/style.css`,
`scripts/generate-site.ts` (lab entries in llms.txt and the full corpus), `scripts/validate.mjs`
(new needles), `README.md`, and this file.

## 11. Addendum: Nebula engine replacement (2026-11-23)

This pass replaces the site's single-shader nebula with the fuller engine from the separate
`nebula` project, without changing the site's framework, visual identity, or interaction
layer. The components are now:

- **Engine** (`src/nebula/engine/`) — WebGL2 context, shader programs with an `#include`
  resolver, the 2D field and raymarched volume samplers, bloom, GPU timing, adaptive
  quality, context recovery, and an on-demand render loop. It owns GL state and nothing
  about the page.
- **Shaders** (`src/nebula/shaders/`) — `vertex.glsl`, `nebula.frag`, `volume.frag`, and
  `post.frag`, plus shared `noise.glsl`, `density.glsl`, `color.glsl`, and `stars.glsl`
  includes. The old `nebula.glsl` and `nebula.vert.glsl` are gone.
- **Site adapter** (`src/nebula/renderer.ts`) — URL state, the `data-nebula-*` control
  contract, seeding, preset detection, reduced motion, intersection and visibility
  pausing, fullscreen, copy-link, and the text fallback.
- **Model and controls** (`parameters.ts`, `presets.ts`, `controls.ts`) — one parameter
  model generates both control bars; six presets and six five-stop palettes; clamping and
  formatting live with the schema.

**What a visitor sees.** The homepage keeps its smaller bar over the Violet Hollow preset
(seed 90210). `/lab/nebula` opens Orion Deep (seed 65521) and adds the renderer switch
(2D field or 3D volume), five inspection channels (density, cloud base, filaments, shape
field, mask), quality (adaptive, high, low), an explicit seed input, copy-link, fullscreen,
and an advanced parameter disclosure. Inspection channels map to values the shader already
computes, bypass palette/bloom/stars/vignette, and force the 2D sampler. The lab page now
documents the model, the channels, all six presets, the measured performance, the URL
state, and the limits; the `/lab` index entry was rewritten to match.

**Reproducibility.** Seeds are decimal integers from 1 to 999999. The URL carries `seed`,
`preset`, `palette`, every numeric parameter, `mode`, `debug`, and `quality`; preset
detection adds `preset` only when the current values match a preset. Reopening a copied
address restores the frame, including the volume renderer. The old `view=` key is ignored
rather than misread.

**Motion and fallback.** Under `prefers-reduced-motion`, the adapter passes
`animationSpeed: 0` at runtime; the chosen speed stays in the URL and the engine stops
advancing time, redrawing only when a parameter or the layout changes. Without WebGL2 the
frame gains `is-fallback`: canvas, HUD, caption, controls, and advanced panel are hidden,
and a note sets the stage height. The model description and the rest of the page remain.

**Performance.** The page cites the engine's measured numbers rather than estimating: on
one Intel iGPU (0xA7AC, ANGLE Direct3D11) under Windows Chromium, with adaptive quality
off and a full-resolution buffer, the 2D field cost 33.1 ms per frame at 1920×1080
(about 30 fps) and 15.1 ms at 1280×720; the volume cost 133.1 ms and 60.4 ms at the same
sizes. Adaptive quality targets about 21 ms of GPU cost (22 ms frame time without the GPU
timer), scales between 1.0 and 0.55, and the volume starts at 0.72 internal scale. Those
are one machine's measurements, and the page says so.

**Verification.** `npm run build` succeeds (`tsc`, Vite, static generation).
`npm run validate` passes **1,132 checks, 0 failures** across 21 routes, including the
updated lab needles for the five channels, the volume, the decimal seed range, and reduced
motion. Browser checks at 1440 × 900 and 390 × 844 covered the homepage and laboratory:
preset switching, the 3D volume, the density and mask channels, the Ice palette, low
quality, reseed, and the resulting URL state. The control bar fits its 820 px frame in
three rows at desktop width and reflows without overflow at 390 px.

Two behaviors were checked outside the in-app browser. A headless Chrome run with
`--force-prefers-reduced-motion` reported `reduced: true` and produced two identical
screenshots 1.3 s apart; the same run without the flag produced different frames, which
confirms the comparison is sensitive to motion. A run with WebGL disabled put the frame in
`is-fallback`, hid the controls, showed the note, and kept the model text.

**Known limits.** Fullscreen was invoked but the browser panel did not enter fullscreen, so
only the entry point and the CSS contract were verified in that environment. The copy-link
button was clicked, but the panel could not be read within its 1.6 s label window, so the
clipboard result was not asserted. Seed reproducibility is fixed on one GPU; floating-point
rounding may change the last bits across vendors. The diagnostic channels are 2D-only by
design, and the volume is intentionally the expensive mode. The existing gaps still stand:
no forecasting explorer, no FPGA synthesis panel, no robot video, and no Monte Carlo
distribution for the filter.

**Files changed.** `src/nebula/engine/*` and `src/nebula/shaders/*` (vendored engine and
shaders), `src/nebula/{parameters,presets,random,controls,renderer}.ts`,
`src/pages/{home,nebula-lab,lab}.ts`, `src/style.css`, `scripts/validate.mjs`,
`scripts/generate-site.ts`, `README.md`, `STYLE.md`, and this file. The old
`src/nebula/shaders/nebula.glsl` and `nebula.vert.glsl` were deleted.

## 12. Addendum: visual direction (2026-11-24)

The site's content had become an inspectable record, but its visual language still read as
a generic dark technical portfolio: a purple accent, Space Grotesk display headings, a
uniform card grid, pills, a second hero-sized visualization, and glow-adjacent gradients.
Three directions were prototyped. **Direction C — Atlas, "the work is the page"** was
chosen: a printed specimen board where the actual outputs are the composition, and no
heading announces the author.

### Why Direction C

- The evidence is the differentiator. Setting the real plates — the VGA game frames, CAD,
  run metrics, benchmark figures — as the page means the site cannot be mistaken for a
  template, and a reader meets the work before the copy.
- It removes the gestures that signal generated design without requiring fabricated
  content: no oversized hero, no glass, no neon, no gradients, no repeated rounded cards,
  no pills, no skill bars, no fake terminal, no decorative metadata, no animation for its
  own sake.
- It scales down honestly. A plate board that degrades to a single column still reads as a
  record, whereas a six-card grid at 390 px becomes the generic layout it started as.

### What changed

- **Ground and colour.** `--bg #0a0d10`, surfaces `#10161a` / `#161d22`, recess `#06090b`,
  text `#e6e2d8` with three quieter steps, a single sienna accent `#d98a5f`
  (`--accent-deep #7d4026`), and neutral rules `#1b2226` / `#2b3439`. The old purple
  identity is gone from the shell, the article chrome, the inline SVG diagrams, the six
  generated project SVGs, `public/icons.svg`, and the favicon. Chart series keep three
  distinguishable hues (sienna, steel, sage); the nebula's own palettes are artwork presets
  and were left untouched.
- **Type.** Newsreader for prose and titles, IBM Plex Mono for numbers, dates, plate
  captions, and nav. Space Grotesk and DM Mono were removed from the font link. Uppercase
  is now confined to mono labels at or below `0.72rem`; headings are serif and never
  display-sized.
- **Shape.** Radius drops to `2px`; images are square plates with no border, radius, or
  shadow. Panels are separated by hairline rules rather than nested cards.
- **Homepage.** The hero/visualization split is replaced by a name line, a quiet one-line
  claim, a lede, and four links, followed by the featured plates on a 12-column irregular
  grid. Plate spans are data: `plateSpans(count)` assigns `7, 5`, then rows of `4`, closing
  with `12` or `6, 6`, and each plate carries `data-span` that the CSS selects on instead
  of `:nth-child`. The nebula is demoted to one subordinate `Field 01 / live` plate. A
  "The record" note states the shared structure (problem, contribution, technologies, one
  measured result, limitation), which replaces the old skills band. The four-step method
  and notes list follow, then a single "At the moment" line.
- **First paint.** The homepage nebula now ships a real captured frame of its default
  seed (`public/nebula/home-poster.jpg`, 2464×939, ~119 kB) beneath the canvas. The engine
  reports `ready` after its first draw, and only then is the canvas faded in; a no-JS
  client, a slow first frame, a failed context, or a full-page capture sees the poster
  instead of an empty black rectangle. The offscreen loop is idled until the observer
  reports the canvas visible.
- **Catalogue.** `/projects` now has four hand-picked leads as irregular plates and the
  remaining entries as compact annotated rows, under Flagship work / Experiments /
  Archive. Technologies are inline `/`-separated mono text, not pills.
- **Records.** Articles keep a two-column project header (record + facts rail), set prose
  at `40rem`, and number sections with CSS counters (`01`, `02`, …) instead of typed
  numbers. Wide media breaks out to `1060px`.
- **Favicon.** A dark ink tile with three sienna rules, replacing the purple gradient
  glyph.

### Verification

- `npx tsc --noEmit` and `npm run build` succeed.
- `npm run validate` passes **1,755 checks, 0 failures** across all routes. The suite now
  also runs structural accessibility assertions on every generated page: `lang="en"`, a
  skip link to `#main`, one `<main>`, exactly one `<h1>`, `alt` on every image,
  `aria-label` on every canvas, no link without an accessible name, unique element ids,
  exactly one `aria-current` per inner route and none on `/`. Homepage checks cover at
  least five plates, a `data-span` on each, spans totalling a multiple of twelve, and a
  served poster under 400 kB. Transfer budgets hold entry CSS at or under 26 kB gzip and
  entry JS at or under 110 kB gzip.
- axe-core 4.10.2 (WCAG 2 A/AA and 2.1 A/AA) reports **zero violations** on `/`,
  `/projects`, `/projects/fpga`, `/lab/nebula`, `/about`, `/resume`, and `/blog`. The
  single earlier failure — the dimmed `/blog` placeholder row, whose date measured 2.49:1
  and description 3.6:1 — was fixed by dimming with colour tokens instead of `opacity:
  0.55`.
- Full-page browser captures at 1440, 1024, 768, and 390 px covered `/`, `/projects`,
  `/lab`, `/blog`, `/about`, `/resume`, `/projects/fpga`, and `/lab/nebula`; the plate
  grids, the reflowed captions, the counters, the diagrams, and the result blocks were
  checked in the Atlas palette. No route overflows horizontally at those widths. The
  nebula was confirmed to draw when scrolled into view and on `/lab/nebula`; with
  JavaScript disabled, or before the first draw, the captured poster is what shows.

### Known limits

- The benchmark figures carried over from §9 remain **unconfirmed and uncited**: 86% of
  peak / 4,403.6 GFLOPS HPL at SCC Connect 2026, 663 GFLOPS on Haydean (~47% of
  theoretical peak), and "1st place Winter Classical, 9 teams" versus the earlier "vs. 8
  U.S. colleges". The redesign did not change or promote any of them; they are recorded as
  supplied.
- The axe-core pass is run manually, not in CI. `npm run validate` guards the structural
  subset (landmarks, headings, alt text, labels, ids, current nav item) but cannot judge
  computed contrast.
- The poster is a captured frame of the current default seed and quality. If the default
  preset, palette, or camera changes, regenerate it with the same script and check that it
  still matches the live first frame.

### Files changed

`src/style.css` (full Atlas system, ~3,090 lines), `src/pages/home.ts`,
`src/pages/projects.ts`, `src/render.ts`, `src/nebula/renderer.ts`,
`src/nebula/engine/Renderer.ts`, `scripts/generate-site.ts` (plate Markdown rule),
`scripts/validate.mjs` (structural a11y, grid/poster, gzip budgets), `index.html` (font
link), `public/nebula/home-poster.jpg`, `public/favicon.svg`, `public/icons.svg`, the six
`public/projects/*.svg` marks, the ten recoloured `src/pages/*.ts` records, `STYLE.md`
(rewritten for Atlas), and this file.
