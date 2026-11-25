// Mandelbrot project page ("/projects/mandelbrot") — the math write-up with
// an interactive Mandelbrot canvas and KaTeX display equations.
import { projectById } from "../data/projects";
import type { Page } from "./types";

const project = projectById("mandelbrot");

export const mandelbrotPage: Page = {
    title: "Mandelbrot set.",
    eyebrow: "Project / Mandelbrot",
    kind: "project",
    section: "Projects",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article"><p class="kicker">Project</p><h1>Mandelbrot set.</h1><p class="lede">An old Java idea, brought into the browser: draw the paths of stable sequences instead of the set's outline.</p><div class="article-visual visual-frame" id="demo"><canvas data-visualization="mandelbrot" aria-label="Interactive Mandelbrot set visualization"></canvas><div class="visual-label">Mandelbrot <span>drag to move / scroll to zoom</span></div></div><p>For a complex number $c$, start at $z_0 = 0$ and repeat:</p><div class="math-display">$$z_{n+1} = z_n^2 + c$$</div><p>The set contains the values of $c$ whose sequence stays bounded:</p><div class="math-display">$$\\mathcal{M} = \\{c \\in \\mathbb{C} : |z_n| \\not\\to \\infty\\}$$</div><p>Every point in a stable sequence is drawn. Its color comes from the angle of the next step.</p><p>The canvas seeds a 260 × 170 grid over the current window, keeps the sequences that stay bounded for 140 iterations, and draws every point they visit in a single instanced draw call. Drag to pan and scroll to zoom; the grid is re-seeded over the new window. The idea comes from my earlier <a href="https://github.com/OppositeShark/Chaos-Equations.git">Chaos-Equations</a> project, and the note <a href="/blog/seeing-the-mandelbrot-set">Seeing the Mandelbrot set</a> explains why the paths are worth drawing.</p></article>`
};
