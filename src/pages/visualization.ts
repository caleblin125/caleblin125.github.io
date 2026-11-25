// Visualization project page ("/projects/visualization") — the through-line
// behind the Mandelbrot drawer, Boids, the generated nebula, and the print study.
import { projectById } from "../data/projects";
import { projectFooter, projectHeader } from "./project-ui";
import type { Page } from "./types";

const project = projectById("visualization");

export const visualizationPage: Page = {
    title: "Computational visualization.",
    eyebrow: "Project / Visualization",
    kind: "project",
    section: "Projects",
    updated: "2026-11-22",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / Visualization",
    "Rules made visible.",
    "Four ways of exposing the rules behind an image: orbit points, steering forces, a seed-reproducible field, and a printer's dot grid.",
    [
        { label: "Mandelbrot drawer", href: "/projects/mandelbrot" },
        { label: "Boids", href: "/projects/boids" },
        { label: "Print note", href: "/blog/where-the-file-meets-the-machine" }
    ]
)}

<h2 id="overview">Overview</h2>
<p>I am interested in visualization as an instrument, not a decoration. A good computational image should let a viewer ask what rule produced it, what parameter changed, and where the representation stops being faithful. The four projects here share that test.</p>
<p>The Mandelbrot drawer exposes the orbit points inside stable sequences and colors each point by the direction of the next step. Boids exposes the three steering rules and the species constants that turn them into a flock. The nebula is a procedural field with a visible seed, density, scale, and palette control. The print study is the inverse case: the image is constrained by the physical dot grid of the printer, so the mark-making rule becomes the subject.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 410" role="img" aria-labelledby="vis-arch-title vis-arch-desc">
<title id="vis-arch-title">Computational visualization pipeline</title>
<desc id="vis-arch-desc">A rule or dataset feeds a simulation or field, which is projected into screen space, shaded, and drawn to pixels; controls expose parameters and the seed, while the page explains the mapping.</desc>
<rect x="1" y="1" width="958" height="408" fill="#10161a" stroke="#2b3439"/>
<g fill="#161d22" stroke="#2b3439">
<rect x="28" y="92" width="164" height="80"/><rect x="230" y="92" width="164" height="80"/>
<rect x="432" y="92" width="164" height="80"/><rect x="634" y="92" width="150" height="80"/>
<rect x="818" y="92" width="114" height="80"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="16" text-anchor="middle">
<text x="110" y="126">rule / data</text><text x="312" y="126">simulation</text><text x="514" y="126">projection</text><text x="709" y="126">shader / mark</text><text x="875" y="126">pixels</text>
</g>
<g fill="#99a09d" font-family="monospace" font-size="11" text-anchor="middle">
<text x="110" y="150">z² + c / steering</text><text x="312" y="150">orbits / agents</text><text x="514" y="150">complex → screen</text><text x="709" y="150">hue / trail / ink</text><text x="875" y="150">frame</text>
</g>
<g stroke="#d98a5f" stroke-width="2" marker-end="url(#vis-arrow)">
<line x1="192" y1="132" x2="224" y2="132"/><line x1="394" y1="132" x2="426" y2="132"/>
<line x1="596" y1="132" x2="628" y2="132"/><line x1="784" y1="132" x2="812" y2="132"/>
</g>
<g fill="#161d22" stroke="#2b3439">
<rect x="230" y="246" width="366" height="70"/><rect x="634" y="246" width="298" height="70"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="15" text-anchor="middle">
<text x="413" y="276">exposed parameters</text><text x="783" y="276">reproducible seed</text>
</g>
<g fill="#99a09d" font-family="monospace" font-size="11" text-anchor="middle">
<text x="413" y="300">pan / zoom / density / scale</text><text x="783" y="300">?seed=0x… / presets / reset</text>
</g>
<text x="28" y="52" fill="#d98a5f" font-family="monospace" font-size="15" letter-spacing="2">ONE PIPELINE, FOUR OUTPUTS</text>
<text x="28" y="380" fill="#99a09d" font-family="monospace" font-size="14">If a parameter cannot be changed and a result cannot be reproduced, the image is not yet inspectable.</text>
<defs><marker id="vis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#d98a5f"/></marker></defs>
</svg></div>
<p>The common architecture is a sequence of transformations, each of which can lose information. A complex orbit becomes a screen coordinate; a velocity becomes an angle; a density field becomes a color. Exposing the step where the mapping happens is the difference between a picture and a tool.</p>

<h2 id="implementation">Implementation</h2>
<h3>Mandelbrot drawer</h3>
<p>The drawer samples a 260 × 170 grid of seeds, tests each for stability, then draws every point visited by a stable orbit. The color comes from the angle of the next step, not from the escape time. Pan and zoom update the complex window; the shader does the per-point iteration on the GPU.</p>
<figure class="article-figure"><img src="/projects/mandelbrot.png" alt="Mandelbrot orbit points colored by the angle of each next step." loading="lazy"><figcaption>Orbit points from the same rules as the interactive canvas, colored by next-step angle.</figcaption></figure>

<h3>Boids</h3>
<p>The browser version keeps the original Java constants: 2 Big, 7 Predator, 450 Prey1, and 30 Prey2 boids, updated in 10 ms simulation steps. Separation, alignment, and cohesion are weighted per species, and a predator within 25 px of prey resets that prey to the world edge. The visible trails are the recent path, not a fixed vector field.</p>
<figure class="article-figure"><img src="/projects/boids.png" alt="A simulated flock of blue, green, red, and magenta chevrons leaving trails." loading="lazy"><figcaption>A still from the same steering rules the interactive canvas runs.</figcaption></figure>

<h3>Nebula</h3>
<p>The homepage field is a fragment shader built from domain-warped fractional Brownian motion and crossing ridged noise. Six presets and six five-stop palettes set the look; density, scale, and the seed change the structure. Every control writes into the URL, so a view can be reopened exactly, and reduced-motion visitors get a single still frame. The <a href="/lab/nebula">nebula laboratory</a> exposes every parameter, a raymarched volume renderer, and the shader's diagnostic channels.</p>

<h3>Print study</h3>
<p><em>The Resolution Limit</em> is a 48 × 36 inch poster built from one scalar field, warped into terrain and cut into five terraces. Each terrace spends its area on a different printing layer, so the artwork changes appearance at different viewing distances and exposes the printer's dot grid rather than hiding it. The arithmetic of the grid is in <a href="/blog/where-the-file-meets-the-machine">Where the file meets the machine</a>.</p>

<h2 id="results">Results</h2>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Work</th><th>Configured scale</th><th>What is exposed</th></tr></thead>
<tbody>
<tr><td>Mandelbrot drawer</td><td>44,200 orbit seeds (260 × 170)</td><td>Complex window, next-step angle (140 iterations, fixed)</td></tr>
<tr><td>Boids</td><td>489 agents (2 / 7 / 450 / 30)</td><td>Species constants, sense cone, steering weights (documented, not yet adjustable)</td></tr>
<tr><td>Nebula</td><td>6 presets, 6 palettes, 2D field or volume</td><td>Every structural parameter, seed, five diagnostic channels</td></tr>
<tr><td>Print study</td><td>48 × 36 in</td><td>Dot grid, halftone, viewing distance</td></tr>
</tbody>
</table></div>
<p>The nebula is the most complete of the four: every parameter can be changed and every frame reopened from its URL. The Mandelbrot drawer and Boids are still closer to viewers than instruments.</p>

<h2 id="analysis">Analysis</h2>
<p>Each piece has a limit worth knowing. The Mandelbrot image is a sampled rendering, not a proof about the set. The boids still is one frame from a stochastic simulation; the code is deterministic only if the initial state is fixed, which the browser version does not yet expose as a seed. The nebula is an aesthetic field, not a physical simulation, and the print study is a designed artifact rather than a measurement of a specific printer's resolution.</p>
<p>Next: a seed, reset, and weight controls for Boids; iteration count and color mapping beside the Mandelbrot canvas; and a photograph of the printed poster to set against the predictions in the print note.</p>
${projectFooter([
    { label: "Mandelbrot drawer", href: "/projects/mandelbrot" },
    { label: "Boids", href: "/projects/boids" }
])}
</article>`
};
