// Blog post: "Seeing the Mandelbrot set" ("/blog/seeing-the-mandelbrot-set")
// — engineering note with an interactive Mandelbrot canvas.
import { chaosEquationsUrl } from "./constants";
import type { Page } from "./types";

export const seeingTheMandelbrotSetPage: Page = {
    title: "Seeing the Mandelbrot set.",
    eyebrow: "Engineering notes / 01",
    content: `<article class="article"><p class="kicker">2026 / 08 / 20</p><h1>Seeing the Mandelbrot set.</h1><p class="lede">What changed when I stopped drawing the set and started drawing its paths.</p><div class="article-visual visual-frame"><canvas data-visualization="mandelbrot" aria-label="Interactive Mandelbrot set visualization"></canvas><div class="visual-label">Mandelbrot <span>drag to move / scroll to zoom</span></div></div><p>The usual Mandelbrot image asks whether $z_{n+1} = z_n^2 + c$ stays bounded. This version asks a second question: where does a stable sequence go before it settles down?</p><p>That is the part I kept from <a href="${chaosEquationsUrl}">Chaos-Equations</a>. The browser version draws each visited point and uses the angle of its next step to choose the hue.</p><h2>Why draw the paths?</h2><p>The filled set is a useful answer, but it hides the motion. The paths make the boundary feel less like a line and more like a record of many small decisions.</p></article>`
};
