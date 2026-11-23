// ============================================================================
// PROJECT SUBPAGE — TypeScript template
// ============================================================================
// A drop-in starting point for a new project article page (/projects/<slug>).
// This mirrors templates/project-page.html, but in the exact TypeScript shape
// the site actually uses: every page lives in src/pages/ as a module exporting
// a `Page`-shaped object, and src/pages/index.ts maps routes to those modules.
//
//     type Page = { title: string; eyebrow: string; content: string };
//
// so a completed page module looks like:
//
//     // src/pages/my-project.ts
//     export const myProjectPage = {
//         title: "My project.",
//         eyebrow: "Project / My project",
//         content: `<article class="article">…</article>`,
//     };
//
// ----------------------------------------------------------------------------
// HOW TO USE
//   1. Copy this file into src/pages/<slug>.ts and replace every placeholder.
//   2. Register the export in src/pages/index.ts:
//
//          import { myProjectPage } from "./my-project";
//          // in the `pages` record:
//          "/projects/my-project": myProjectPage,
//
//      (templates/ as it ships is outside src/, so tsc/Vite ignore it —
//      copying the file into src/pages/ is the intended flow.)
//   3. Add a matching `.project-row` link to the "/projects" page's
//      `.project-list` (src/pages/projects.ts — see the commented snippet at
//      the bottom of this file).
//   4. If the page has a new visualization, add a branch in the canvas wiring
//      loop in src/main.ts:
//
//          if (canvas.dataset.visualization === "my-viz") {
//              new MyRenderer(canvas).start();
//          }
//
// ESCAPING (why the doubled backslashes)
//   The content value is a JS *template literal* (backticks), so:
//     • Backticks inside the string must be escaped: `  →  \`
//     • ${ inside the string must be escaped:        ${ →  \${  (none used)
//     • LaTeX backslashes are doubled: \\text renders as \text for KaTeX.
//     • $...$ / $$...$$ are KaTeX delimiters — reserve $ for math only.
//
// STYLING REFERENCE: STYLE.md §2 (page anatomy), §3 (canvas elements),
// and §4 (content components).
// ============================================================================

export const projectPage = {
    // Shown in the browser tab and used for the <title>; end with a period.
    title: "My project.",

    // Small mono label in the site header (see .header-note in style.css).
    eyebrow: "Project / My project",

    // The whole page body. One <article class="article"> so the shared
    // article typography (max-width 820px, h1/h2/h3, .lede, .math-display)
    // applies. HTML comments inside the string are harmless (browsers ignore
    // them) and mark each section.
    content: `<article class="article">
<!-- 1. Header: kicker + title + one-line lede -->
<p class="kicker">Project / My project</p>
<h1>My project.</h1>
<p class="lede">One sentence describing the project.</p>

<!-- 2. Canvas visualization — THE canvas pattern (STYLE.md §3).
     Requirements:
       • .article-visual visual-frame  (add a custom frame class to override
         the background, e.g. .boids-frame)
       • <canvas data-visualization="..."> — main.ts wires this up; add a
         matching branch in the wiring loop at the bottom of main.ts
       • aria-label for accessibility
       • .visual-label with the viz name + usage hint in <span> -->
<div class="article-visual visual-frame">
<canvas data-visualization="my-viz" aria-label="Interactive visualization"></canvas>
<div class="visual-label">My viz <span>interaction hint</span></div>
</div>

<!-- 3. Introduction paragraphs — plain <p>; inline $...$ math works -->
<p>An introductory paragraph. Describe what the project is and why it exists.
Inline math like $x^2$ is fine here.</p>

<!-- 4. Sections — <h2> for major sections -->
<h2>The idea</h2>
<p>Body text explaining the core concept.</p>

<!-- 5. Display math — wrap $$...$$ in <div class="math-display">;
     note the doubled backslashes required by the template literal -->
<div class="math-display">$$\\text{key} = \\text{formula}$$</div>

<!-- 6. Sub-sections — <h3> under an <h2> -->
<h3>Implementation detail</h3>
<p>More body text.</p>

<!-- 7. Tables — always wrap in .table-wrap (mobile scroll) and use .spec-table -->
<div class="table-wrap">
<table class="spec-table">
<thead><tr><th>Setting</th><th>Value</th></tr></thead>
<tbody><tr><td>Constant</td><td>value</td></tr></tbody>
</table>
</div>

<!-- 8. SVG vector diagram (optional) — .vector-diagram for the panel style,
     .diagram-title / .diagram-caption for text, markers defined in <defs> -->
<svg class="vector-diagram" viewBox="0 0 960 280" role="img" aria-label="Diagram of the concept">
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#c59ad8"/></marker>
</defs>
<text x="160" y="26" class="diagram-title" text-anchor="middle">Title</text>
<line x1="60" y1="140" x2="260" y2="140" stroke="#c59ad8" stroke-width="2" marker-end="url(#arrow)"/>
<text x="160" y="262" class="diagram-caption" text-anchor="middle">caption</text>
</svg>

<!-- 9. Closing -->
<p>A closing paragraph that ties the project together.</p>
</article>`,
};

// ----------------------------------------------------------------------------
// PROJECT INDEX ROW (optional second part)
// ----------------------------------------------------------------------------
// Add one of these inside the "/projects" page's `<section class="project-list">`.
// Keep the numbering sequential (mandelbrot is 01, boids is 02, next is 03).
// This is HTML, pasted into the "/projects" entry's content string, not code:
//
//     <article class="project-row">
//         <div class="project-number">03</div>
//         <div><h2><a href="/projects/my-project">My project</a></h2>
//              <p>A short description of what the project does.</p>
//              <div class="project-links"><a href="https://github.com/...">Repository</a></div>
//              <span class="tag">WebGL / TypeScript</span></div>
//         <div class="project-status">Building</div>
//     </article>
// ----------------------------------------------------------------------------
