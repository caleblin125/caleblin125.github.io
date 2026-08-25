# templates/ — how to use these files

This folder holds copy-paste starting points for the two recurring jobs on this
site: **adding a page** and **adding a shader**. They are reference templates,
not part of the build — nothing here is imported or compiled. Read `STYLE.md` in
the repo root for the full design system and canvas conventions these templates
follow.

## Files

| File | Use it for |
|---|---|
| `blog-post.html` | A blog index row + a blog article page (`/blog/...`). |
| `project-page.html` | A project index row + a project article page (`/projects/...`). |
| `shaders/fragment.glsl` | A new WebGL2 fragment shader. |
| `shaders/vertex.glsl` | A new WebGL2 vertex shader. |

## Adding a page (blog or project) — step by step

1. **Open `src/main.ts`** and find the `pages` record (a plain object mapping
   routes to `{ title, eyebrow, content }`).
2. **Add a new entry**, e.g.:
   ```ts
   "/blog/my-new-post": {
       title: "My new post.",
       eyebrow: "Blog",
       content: `<article class="article">…</article>`,
   },
   ```
3. **Copy the `<article>` block** from the matching template into the `content`
   template literal, then replace the placeholder text.
4. **If the page needs a canvas**, keep the `.visual-frame` + `<canvas
   data-visualization="...">` + `.visual-label` block, and add a branch in the
   wiring loop at the bottom of `main.ts`:
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
   template) go into the `content` of `/blog` or `/projects` respectively,
   inside their existing `<section class="post-list">` / `.project-list`.
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
