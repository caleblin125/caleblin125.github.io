# templates/ — how to use these files

This folder holds copy-paste starting points for the two recurring jobs on this
site: **adding a page** and **adding a shader**. They are reference templates,
not part of the build — nothing here is imported or compiled. Read `STYLE.md` in
the repo root for the full design system and canvas conventions these templates
follow.

## Files

| File | Use it for |
|---|---|
| `blog-post.ts` | **TypeScript** page entry for a blog article (`/blog/...`) — the exact `{ title, eyebrow, content }` shape used by `src/main.ts`'s `pages` record. |
| `project-page.ts` | **TypeScript** page entry for a project article (`/projects/...`) — same shape, with the canvas pattern, tables, and SVG diagram included. |
| `blog-post.html` | Human-readable HTML skeleton of a blog article + blog index row. |
| `project-page.html` | Human-readable HTML skeleton of a project article + project index row. |
| `shaders/fragment.glsl` | A new WebGL2 fragment shader. |
| `shaders/vertex.glsl` | A new WebGL2 vertex shader. |

> **Which one to use?** The `.ts` files are the practical templates — their exported
> objects are shape-compatible with the `pages` record in `src/main.ts`, so you can
> copy the object straight in (or import it if you keep the file inside `src/`).
> The `.html` files are the annotated reference versions of the same structure,
> useful when you want to see every section explained inline with the markup.

## Adding a page (blog or project) — step by step

1. **Create a page module** in `src/pages/` (e.g. `src/pages/my-post.ts`)
   exporting a `Page` object — the same `{ title, eyebrow, content }` shape
   used by every existing page file.
2. **Register it in `src/pages/index.ts`** under its route key, e.g.:
   ```ts
   "/blog/my-new-post": myPostPage,
   ```
   (or `"/projects/my-project": myProjectPage`). The shell and routing in
   `src/main.ts` need no changes.
   The `.ts` templates (`blog-post.ts`, `project-page.ts`) export ready-made
   objects — paste the object body into your new page file, or import it
   directly into the barrel:
   ```ts
   import { blogPostPage } from "../templates/blog-post";
   // in the pages record:
   "/blog/my-new-post": blogPostPage,
   ```
3. **Copy the `<article>` block** from the matching template into the `content`
   template literal, then replace the placeholder text.
4. **If the page needs a canvas**, keep the `.visual-frame` + `<canvas
   data-visualization="...">` + `.visual-label` block, and add a branch in the
   wiring loop in `src/main.ts`:
   ```ts
   for (const canvas of document.querySelectorAll("canvas[data-visualization]")) {
       if (canvas.dataset.visualization === "my-viz") {
           new MyRenderer(canvas).start();
       } else if (canvas.dataset.visualization === "boids") {
           new BoidsRenderer(canvas).start();
       } else {
           new ChaosRenderer(canvas, new Mandelbrot()).start();
       }
   }
   ```
   Note the loop currently treats anything that is not `"boids"` as mandelbrot —
   extend it explicitly once you add a third visualization.
5. **Index rows** (the `.post-row` / `.project-row` blocks at the top of each
   template) go into the `content` of `src/pages/blog.ts` / `src/pages/projects.ts`
   respectively, inside their existing `<section class="post-list">` /
   `.project-list`.
6. **Verify** at `http://localhost:5173/<route>` after `npm run dev`.

### Escape rules for `content` strings

Page content lives inside **template literals** (backticks), so:

- Escape backticks: `` ` `` → `` \` ``
- Escape `${`: `` ${ `` → `` \${ ``
- Double LaTeX backslashes: `\text` → `\\text` (KaTeX runs after the literal is
  evaluated, so it must receive a real backslash).
- `$...$` / `$$...$$` are KaTeX delimiters; keep `$` for math only.

## Adding a shader — step by step

1. **Create** `src/<viz>/shaders/<name>.glsl` (fragment) and/or
   `<name>.vert.glsl` (vertex) from the templates in `shaders/`.
2. **Import as raw strings** in the renderer:
   ```ts
   import fragmentSource from "./shaders/<name>.glsl?raw";
   import vertexSource from "./shaders/<name>.vert.glsl?raw";
   ```
   The `?raw` suffix is what makes Vite inline the file as a string.
3. **Compile + link** using the renderer's helpers (`createShader`,
   `createProgram` — see `src/boids/renderer.ts` lines 184–185 for the pattern).
4. **Match names exactly**: attribute/uniform names in the shader must equal the
   strings passed to `gl.getAttribLocation` / `gl.getUniformLocation`, and
   varyings must match between the vertex and fragment shader.
5. **Respect the version line**: all shaders start with `#version 300 es`
   (WebGL2). A missing or wrong version line will fail to compile.

## Rules of thumb from the existing code

- **Boids** (`src/boids/renderer.ts`): CPU flocking simulation; instanced
  `TRIANGLES` (6 vertices per chevron); a separate `fade` pass decays trails via
  a fullscreen triangle; context uses `{ preserveDrawingBuffer: true }` so the
  framebuffer persists between frames.
- **Chaos / Mandelbrot** (`src/chaos/renderer.ts`): instanced `POINTS`; the
  vertex shader iterates the orbit per instance (`gl_InstanceID`); the fragment
  shader turns each point into a circle with `discard`; the canvas is cleared
  every frame.
- **Staging** of a new visualization is always: page content with
  `data-visualization`, a renderer class, its shaders, and a branch in the
  wiring loop.
