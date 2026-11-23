// Blog index ("/blog") — list of posts. Add new posts as .post-row links
// (newest first), keeping the muted "Soon" placeholder at the bottom.
import type { Page } from "./types";

export const blogPage: Page = {
    title: "Notes.",
    eyebrow: "Blog",
    content: `<section class="page-intro"><p class="kicker">Notes</p><h1>Notes.</h1><p class="lede">Things I wrote down while trying to understand them.</p></section><section class="post-list"><a class="post-row" href="/blog/seeing-the-mandelbrot-set"><span class="post-date">2026 / 08 / 20</span><span><h2>Seeing the Mandelbrot set</h2><p>What changed when I stopped drawing the set and started drawing its paths.</p></span><span class="arrow">↗</span></a><div class="post-row muted"><span class="post-date">Soon</span><span><h2>Rendering points in a fragment shader</h2><p>A note about making the GPU do the repetitive part.</p></span></div></section>`
};
