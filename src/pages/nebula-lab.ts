// Nebula laboratory ("/lab/nebula") — the full control surface for the
// procedural field used on the homepage. The renderer and shader are shared;
// this page supplies every parameter, the volume sampler, and the diagnostic
// channels. The homepage opens the same preset family with a smaller bar.
import { defaultParameters, nebulaControls } from "../nebula/controls";
import type { Page } from "./types";

const labNebula = defaultParameters("lab");

export const nebulaLabPage: Page = {
    title: "Nebula laboratory.",
    eyebrow: "Lab / Nebula",
    kind: "page",
    section: "Lab",
    updated: "2026-11-23",
    description:
        "An interactive procedural nebula laboratory: change the seed, structure, palette, and quality; compare the 2D field with a raymarched volume; and inspect the density, cloud, filament, shape, and mask channels separately.",
    keywords: ["procedural nebula", "WebGL2", "GLSL", "fractional Brownian motion", "domain warping", "raymarching", "generative art", "Caleb Lin"],
    content: `<article class="article">
<header class="project-header">
<p class="kicker">Lab / Nebula</p>
<h1>Nebula laboratory.</h1>
<p class="lede">The full surface behind the homepage field. One WebGL2 renderer draws a seeded density model as a screen-space field or raymarches the same model as a volume; this page exposes the seed, every structural parameter, six presets and palettes, quality, and the five diagnostic channels the shader already computes.</p>
<div class="link-row"><a class="text-link" href="/lab">Lab index <span>↗</span></a><a class="text-link" href="/projects/visualization">Visualization project <span>↗</span></a><a class="text-link" href="/blog/seeing-the-mandelbrot-set">Visualization note <span>↗</span></a></div>
</header>

<div class="nebula-frame nebula-lab" data-nebula data-nebula-variant="lab">
<div class="nebula-stage">
<canvas data-visualization="nebula" role="img" aria-label="A procedurally generated nebula: blue-teal clouds and filaments with a bright core, sparse stars, and a dark surround."></canvas>
<div class="nebula-hud" aria-hidden="true"><span>Field lab / density model</span><span data-nebula-hud>2D field / 6 octaves</span></div>
<p class="nebula-caption">Nebula <span>same renderer as the homepage / seed-reproducible</span></p>
<div class="nebula-fallback">This field needs WebGL2. The controls are unavailable in this browser; the model description and the rest of the page remain readable.</div>
</div>
${nebulaControls("lab", labNebula)}
<details class="nebula-notes" open>
<summary>Controls and state</summary>
<p>Every control writes its value into the page URL, and <em>Copy link</em> copies the complete address. Reopening that address restores the seed, preset, palette, every numeric parameter, the renderer, the inspection channel, and the quality mode. The seed input accepts an integer from 1 to 999999.</p>
<p>With <code>prefers-reduced-motion</code>, animation speed is held at zero and one still frame is drawn. The render loop also pauses when the canvas leaves the viewport or the tab is hidden. Without WebGL2, the canvas is replaced by a note, the controls are removed, and the model description and the rest of the page remain readable.</p>
</details>
</div>

<h2 id="model">The model</h2>
<p>The renderer keeps three concerns separate: <strong>structure</strong> (a scalar density field), <strong>light</strong> (emission derived from that field), and <strong>presentation</strong> (palette, tone mapping, bloom). Density never knows about RGB, and the color stage never samples noise directly. That split is what makes the look controllable: density changes shape, emission changes brightness, and palette changes color.</p>

<h3>Structure</h3>
<p>All noise is analytic and hash-based: quintic-interpolated gradient noise on an integer lattice, with no noise textures and no RNG state. Octave sums use a fixed rotation between bands to break axis alignment. Two levels of domain warp bend the coordinates, and large structure is sampled from the unwarped coordinate so cloud masses stay coherent. A soft threshold moves with the density control, so raising density thickens existing clouds instead of filling negative space. Crossing ridged fields carve dust lanes and a bright filament layer, and a low-frequency mask gates where clouds form.</p>

<h3>Light and presentation</h3>
<p>Density is never mapped directly to RGB as noise. A five-stop palette is converted from sRGB to linear on the CPU; emission and a hot-ionization term derive brightness from the cloud, filament, and density-squared terms; ACES filmic tone mapping compresses the top of the range; bloom is a bright extract plus two separable blurs at quarter resolution; a hashed star layer is absorbed by dense gas; vignette and ordered dither finish the frame. The 2D bloom profile uses a 0.32 threshold and 0.90 strength, while the volume uses 0.52 and 0.42 because its integration already builds a broad bright core.</p>

<h3>Two samplers, one parameter set</h3>
<p>The 2D field is evaluated per screen pixel. It has no camera, no depth buffer, and no parallax: apparent depth comes from the masks and the palette. The volume intersects each camera ray with a unit cube and integrates front to back, with 56 steps by default at 0.72× internal scale, empty-space skipping, and early termination. Both read the same parameters, so switching renderer changes how the model is sampled rather than which artwork is shown.</p>

<p>This is a designed visual model, not a physical simulation. <em>Density</em>, <em>scale</em>, and <em>warp</em> are aesthetic controls; they are not gas density, temperature, or distance, and nothing here is calibrated against an observation. Palettes are display ramps, not spectral measurements.</p>

<h2 id="views">What each inspection view isolates</h2>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>View</th><th>What is drawn</th><th>What it is useful for</th></tr></thead>
<tbody>
<tr><td>Final image</td><td>The complete model: density, palette, emission, bloom, stars, and vignette.</td><td>The result as it appears on the homepage.</td></tr>
<tr><td>Density</td><td>The final optical density field, white where the field is dense, before any palette lookup.</td><td>Seeing which regions survive the thresholds and erosion.</td></tr>
<tr><td>Cloud base</td><td>The billowy fBm component before filament carving and edge erosion.</td><td>Checking the large-scale cloud masses on their own.</td></tr>
<tr><td>Filaments</td><td>The ridged contribution: creases where the noise field crosses zero.</td><td>Seeing where dust lanes and bright tendrils come from.</td></tr>
<tr><td>Shape field</td><td>The signed pre-threshold field; mid-grey is zero.</td><td>Understanding how the density control moves the threshold.</td></tr>
<tr><td>Mask</td><td>The low-frequency spatial mask that gates where clouds can form.</td><td>Seeing the quiet regions the model reserves for negative space.</td></tr>
</tbody>
</table></div>
<p>Diagnostic views bypass the palette, bloom, stars, and vignette, and they force the 2D sampler so the channels stay readable. They are the same values the final shader consumes, not a separate debug renderer.</p>

<h2 id="presets">Presets, palettes, and quality</h2>
<p>Presets are complete parameter sets, each with its own seed and structure. They are reproducible starting points, not hidden shader modes.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Preset</th><th>Seed</th><th>Character</th></tr></thead>
<tbody>
<tr><td>Orion Deep</td><td>65521</td><td>Wide blue clouds with a cold cyan veil</td></tr>
<tr><td>Carina Core</td><td>23117</td><td>Dense warm core wrapped in dust</td></tr>
<tr><td>Veil Filaments</td><td>314159</td><td>Thin teal tendrils in negative space</td></tr>
<tr><td>Cold Drift</td><td>1187</td><td>Faint ice haze, very little light</td></tr>
<tr><td>Ember Bloom</td><td>65521</td><td>Hot ionized core inside dark dust</td></tr>
<tr><td>Violet Hollow</td><td>90210</td><td>Sparse magenta shells around a void</td></tr>
</tbody>
</table></div>
<p>Six five-stop palettes — Orion, Carina, Veil, Ember, Violet, and Ice — swap the ramp without touching structure. <em>Adaptive</em> quality solves for a render scale that reaches about 21 ms of GPU cost (or 22 ms of frame time when the GPU timer is unavailable), floored at 0.55×. <em>High</em> pins scale 1 and disables adaptation. <em>Low</em> starts at 0.6×. The volume additionally starts at 0.72× before adaptation because it is the expensive sampler.</p>
<p>The engine's benchmark harness measured, with adaptive quality off and the buffer at full resolution, a 2D draw cost of 33.1 ms per frame at 1920×1080 (about 30 fps) and 15.1 ms at 1280×720. The volume cost 133.1 ms at 1920×1080 (about 8 fps) and 60.4 ms at 1280×720. Those numbers are from one Intel integrated GPU (0xA7AC, ANGLE Direct3D11) on Windows Chromium; a discrete GPU has more headroom, and this page does not claim to predict another machine.</p>

<h2 id="state">State, sharing, and fallbacks</h2>
<p>The query string carries <code>seed</code>, <code>preset</code>, <code>palette</code>, every numeric parameter, <code>mode</code>, <code>debug</code>, and <code>quality</code>. Reopening a copied address restores the frame, including the volume renderer when it was selected. Links that still use the old <code>view=</code> key are ignored safely and open the final image. A seed fixes the structure on a given GPU; floating-point rounding can still change the last bits across vendors.</p>

<h2 id="limits">Limits</h2>
<p>The 2D field is screen-space and its motion is a slow drift, not a physical process. The volume adds depth but not physics: step count changes cost, and 56 steps is a display resolution rather than a measure of accuracy. Adaptive quality changes the drawing buffer, never the model, so a low-quality frame is the same field at fewer pixels. The diagnostic channels and the volume are mutually exclusive; selecting an inspection view returns the page to the 2D sampler. Nothing here exposes a temperature, a mass, or a distance, because the model does not have them.</p>

<div class="link-row project-footer-links"><a class="text-link" href="/lab">Lab index <span>↗</span></a><a class="text-link" href="/projects/visualization">Visualization project <span>↗</span></a><a class="text-link" href="/projects/mandelbrot">Mandelbrot drawer <span>↗</span></a><a class="text-link" href="/projects/boids">Boids <span>↗</span></a></div>
</article>`
};
