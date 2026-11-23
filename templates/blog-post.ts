// ============================================================================
// BLOG POST PAGE — TypeScript template
// ============================================================================
// A drop-in starting point for a new blog article page (/blog/<slug>).
// This mirrors templates/blog-post.html, but in the exact TypeScript shape
// the site actually uses: every page lives in src/pages/ as a module exporting
// a `Page`-shaped object, and src/pages/index.ts maps routes to those modules.
//
//     type Page = {
//         title: string; eyebrow: string; description?: string;
//         content: string; kind?: "post"; date?: string; keywords?: string[];
//         section?: string;
//     };
//
// so a completed page module looks like:
//
//     // src/pages/my-new-post.ts
//     import { postById } from "../data/posts";
//     const post = postById("my-new-post");
//
//     export const myNewPostPage: Page = {
//         title: post.title,
//         eyebrow: post.eyebrow,
//         kind: "post",
//         section: "Blog",
//         date: post.date,
//         description: post.description,
//         keywords: post.keywords,
//         content: `<article class="article">…</article>`,
//     };
//
// ----------------------------------------------------------------------------
// HOW TO USE
//   1. Add a PostEntry to src/data/posts.ts (title, summary, date, keywords).
//   2. Copy this file into src/pages/<slug>.ts and replace every placeholder.
//   3. Register the export in src/pages/index.ts:
//
//          import { myNewPostPage } from "./my-new-post";
//          // in the `pages` record:
//          "/blog/my-new-post": myNewPostPage,
//
//      (templates/ as it ships is outside src/, so tsc/Vite ignore it —
//      copying the file into src/pages/ is the intended flow.)
//   4. The blog index row is generated from src/data/posts.ts. Do not add it by hand.
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

import type { Page } from "./types";

export const blogPostPage: Page = {
    // Shown in the browser tab and used for the <title>; end with a period.
    title: "My new post.",

    // Small mono label in the site header (see .header-note in style.css).
    eyebrow: "Blog",

    // Required for the static metadata, Markdown front matter, and JSON-LD.
    kind: "post",
    section: "Blog",
    date: "2026-08-21",
    description: "One sentence used for the meta description, Open Graph, and Markdown front matter.",
    keywords: ["topic", "method", "result"],

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
// BLOG INDEX ROW (generated — do not paste by hand)
// ----------------------------------------------------------------------------
// The "/blog" page builds its rows from src/data/posts.ts. Add the PostEntry
// there and the index, sitemap, llms.txt, and Markdown front matter follow.
// The generated row looks like:
//
//     <a class="post-row" href="/blog/my-new-post">
//         <span class="post-date">2026 / 08 / 21</span>
//         <span><h2>My new post.</h2>
//               <p>A sentence that makes someone want to click through.</p></span>
//         <span class="arrow">↗</span>
//     </a>
// ----------------------------------------------------------------------------
