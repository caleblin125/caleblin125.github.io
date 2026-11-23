// Mandelbrot project page ("/projects/mandelbrot") — the math write-up with
// an interactive Mandelbrot canvas and KaTeX display equations.
import type { Page } from "./types";

export const mandelbrotPage: Page = {
    title: "Mandelbrot set.",
    eyebrow: "Project / Mandelbrot",
    content: `<article class="article"><p class="kicker">Project</p><h1>Mandelbrot set.</h1><p class="lede">An old Java idea, brought into the browser.</p><div class="article-visual visual-frame"><canvas data-visualization="mandelbrot" aria-label="Interactive Mandelbrot set visualization"></canvas><div class="visual-label">Mandelbrot <span>drag to move / scroll to zoom</span></div></div><p>For a complex number $c$, start at $z_0 = 0$ and repeat:</p><div class="math-display">$$z_{n+1} = z_n^2 + c$$</div><p>The set contains the values of $c$ whose sequence stays bounded:</p><div class="math-display">$$\\mathcal{M} = \\{c \\in \\mathbb{C} : |z_n| \\not\\to \\infty\\}$$</div><p>Every point in a stable sequence is drawn. Its color comes from the angle of the next step.</p></article>`
};
