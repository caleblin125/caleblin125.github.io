// ============================================================================
// BLOG POST PAGE — TypeScript template
// ============================================================================
// A drop-in starting point for a new blog article page (/blog/<slug>).
// This mirrors templates/blog-post.html, but in the exact TypeScript shape
// the site actually uses: every page lives in src/pages/ as a module exporting
// a `Page`-shaped object, and src/pages/index.ts maps routes to those modules.
//
//     type Page = { title: string; eyebrow: string; content: string };
//
// so a completed page module looks like:
//
//     // src/pages/my-new-post.ts
//     export const myNewPostPage = {
//         title: "My new post.",
//         eyebrow: "Blog",
//         content: `<article class="article">…</article>`,
//     };
//
// ----------------------------------------------------------------------------
// HOW TO USE
//   1. Copy this file into src/pages/<slug>.ts and replace every placeholder.
//   2. Register the export in src/pages/index.ts:
//
//          import { myNewPostPage } from "./my-new-post";
//          // in the `pages` record:
//          "/blog/my-new-post": myNewPostPage,
//
//      (templates/ as it ships is outside src/, so tsc/Vite ignore it —
//      copying the file into src/pages/ is the intended flow.)
//   3. Add a matching `.post-row` link to the "/blog" page's `.post-list`
//      (src/pages/blog.ts — see the commented snippet at the bottom of this file).
//
// ESCAPING (why the doubled backslashes)
//   The content value is a JS *template literal* (backticks), so:
//     • Backticks inside the string must be escaped: `  →  \`
//     • ${ inside the string must be escaped:        ${ →  \${  (none used)
//     • LaTeX backslashes are doubled: \\text renders as \text for KaTeX.
//     • $...$ / $$...$$ are KaTeX delimiters — reserve $ for math only.
//
// STYLING REFERENCE: STYLE.md §2 (page anatomy) and §4 (content components).
// ============================================================================

export const blogPostPage = {
    // Shown in the browser tab and used for the <title>; end with a period.
    title: "My new post.",

    // Small mono label in the site header (see .header-note in style.css).
    eyebrow: "Blog",

    // The whole page body. One <article class="article"> so the shared
    // article typography (max-width 820px, h1/h2/h3, .lede, .math-display)
    // applies. HTML comments inside the string are harmless (browsers ignore
    // them) and mark each section.
    content: `<article class="article">
<!-- 1. Header: kicker (date or section) + title + one-line lede -->
<p class="kicker">2026 / 08 / 21</p>
<h1>My new post.</h1>
<p class="lede">One sentence explaining what this note is about.</p>

<!-- 2. Optional canvas visualization — delete this block for a text-only post.
     The canvas MUST carry data-visualization and aria-label; main.ts wires it
     up in the querySelectorAll loop at the bottom of the file (STYLE.md §3). -->
<div class="article-visual visual-frame">
<canvas data-visualization="mandelbrot" aria-label="Interactive Mandelbrot set visualization"></canvas>
<div class="visual-label">Mandelbrot <span>drag to move / scroll to zoom</span></div>
</div>

<!-- 3. Body paragraphs — plain <p>; inline $...$ math works inside text -->
<p>The first paragraph of the post. Inline math like $z_{n+1} = z_n^2 + c$ works here.</p>

<!-- 4. Sections — <h2> for major sections, <h3> for sub-sections -->
<h2>Section heading</h2>
<p>Body text under the section heading.</p>

<!-- 5. Display math — wrap $$...$$ in <div class="math-display">;
     note the doubled backslashes required by the template literal -->
<div class="math-display">$$\\text{example} + \\text{formula}$$</div>

<h3>Sub-section heading</h3>
<p>More body text.</p>

<!-- 6. Tables — always wrap in .table-wrap (mobile scroll) and use .spec-table -->
<div class="table-wrap">
<table class="spec-table">
<thead><tr><th>Column A</th><th>Column B</th></tr></thead>
<tbody><tr><td>value</td><td>value</td></tr></tbody>
</table>
</div>

<!-- 7. Closing -->
<p>A closing thought that wraps up the post.</p>
</article>`,
};

// ----------------------------------------------------------------------------
// BLOG INDEX ROW (optional second part)
// ----------------------------------------------------------------------------
// Add one of these inside the "/blog" page's `<section class="post-list">`,
// AFTER the most recent post so the list stays newest first. This is HTML,
// pasted into the "/blog" entry's content string, not code:
//
//     <a class="post-row" href="/blog/my-new-post">
//         <span class="post-date">2026 / 08 / 21</span>
//         <span><h2>My new post.</h2>
//               <p>A sentence that makes someone want to click through.</p></span>
//         <span class="arrow">↗</span>
//     </a>
// ----------------------------------------------------------------------------
