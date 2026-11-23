// Nebula laboratory ("/lab/nebula") — the full control surface for the
// procedural field used on the homepage. The renderer and shader are shared;
// this page only supplies more controls and a longer explanation. Defaults on
// both pages reproduce the original frame.
import type { Page } from "./types";

export const nebulaLabPage: Page = {
    title: "Nebula laboratory.",
    eyebrow: "Lab / Nebula",
    kind: "page",
    section: "Lab",
    updated: "2026-11-23",
    description:
        "An interactive procedural nebula laboratory: change the seed, octave count, warp strength, palette, and quality, then inspect the base noise, warp field, octave bands, and color ramp separately.",
    keywords: ["procedural nebula", "WebGL2", "GLSL", "fractional Brownian motion", "domain warping", "generative art", "Caleb Lin"],
    content: `<article class="article">
<header class="project-header">
<p class="kicker">Lab / Nebula</p>
<h1>Nebula laboratory.</h1>
<p class="lede">A domain-warped fractional Brownian motion field with the lid off. The homepage uses the same shader with a smaller set of controls; this page exposes the octave count, warp strength, framed region, quality mode, and five ways of looking at one stage at a time.</p>
<div class="link-row"><a class="text-link" href="/lab">Lab index <span>↗</span></a><a class="text-link" href="/projects/visualization">Visualization project <span>↗</span></a><a class="text-link" href="/blog/seeing-the-mandelbrot-set">Visualization note <span>↗</span></a></div>
</header>

<div class="nebula-frame nebula-lab" data-nebula>
<div class="nebula-stage">
<canvas data-visualization="nebula" role="img" aria-label="A procedurally generated nebula: violet filaments and dust lanes with sparse stars."></canvas>
<div class="nebula-hud" aria-hidden="true"><span>Field lab / domain-warped fBm</span><span data-nebula-mode>Final field / 4 octaves</span></div>
<p class="nebula-caption">Nebula <span>pointer parallax / seed-reproducible</span></p>
<div class="nebula-fallback">This field needs WebGL2. The controls below still describe the model, and the rest of the page is unaffected.</div>
</div>

<div class="nebula-controls">
<label class="nebula-control">View <select data-nebula-view><option value="final">Final field</option><option value="base">Base noise</option><option value="warp">Warp field</option><option value="fractal">Octave bands</option><option value="color">Colour field</option></select></label>
<label class="nebula-control">Preset <select data-nebula-preset><option value="filament">Filament</option><option value="ice-drift">Ice drift</option><option value="ember-core">Ember core</option></select></label>
<label class="nebula-control">Palette <select data-nebula-palette><option value="violet">Violet</option><option value="ice">Ice</option><option value="ember">Ember</option></select></label>
<label class="nebula-control">Variant <select data-nebula-variant><option value="0">Framing 0</option><option value="1">Framing 1</option><option value="2">Framing 2</option><option value="3">Framing 3</option></select></label>
<label class="nebula-control">Density <input type="range" min="0" max="1" step="0.01" value="0.55" data-nebula-density><output data-nebula-density-value>0.55</output></label>
<label class="nebula-control">Scale <input type="range" min="0.4" max="2.2" step="0.01" value="1" data-nebula-scale><output data-nebula-scale-value>1.00</output></label>
<label class="nebula-control">Octaves <input type="range" min="1" max="6" step="1" value="4" data-nebula-octaves><output data-nebula-octaves-value>4</output></label>
<label class="nebula-control">Warp <input type="range" min="0" max="2" step="0.05" value="1" data-nebula-warp><output data-nebula-warp-value>1.00</output></label>
<label class="nebula-control">Quality <select data-nebula-quality><option value="adaptive">Adaptive</option><option value="high">High</option><option value="low">Low</option></select></label>
</div>

<div class="nebula-controls nebula-controls-actions">
<label class="nebula-control">Seed <input class="nebula-seed-input" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="8" value="1a2b3c4d" data-nebula-seed-input aria-label="Seed as eight hexadecimal digits"></label>
<span class="nebula-seed" data-nebula-seed aria-live="polite">seed 0x00000000</span>
<span class="nebula-seed-group"><a class="nebula-reseed" data-nebula-link href="?seed=1a2b3c4d">Link</a><button class="nebula-reseed" type="button" data-nebula-reseed>Reseed</button><button class="nebula-reseed" type="button" data-nebula-copy>Copy config</button><button class="nebula-reseed" type="button" data-nebula-fullscreen>Fullscreen</button></span>
</div>

<details class="nebula-notes" open>
<summary>How this field is generated</summary>
<p>The image is a fragment shader, not a video. A seeded offset selects a region of a value-noise field. Four octaves of fractional Brownian motion are sampled twice to build a warp field, and that warp displaces the coordinates of the final fBm sample. A radial falloff masks the frame, a three-stop ramp colors the body, core, and dust, and a low-frequency veil plus a hashed star field sit on top.</p>
<p>Octaves set how much fine structure the fBm keeps. Warp sets how far the displacement field bends the final sample; at zero, the filaments collapse back toward the underlying noise. Variant frames a different region of the same field rather than switching generators. Density and scale change the emission threshold and the framing scale. The palette swaps the three-stop ramp.</p>
<p>All of it is a two-dimensional model chosen for the look of filaments and dust lanes. It is not a physical simulation of a nebula, and the parameters do not correspond to gas density, temperature, or distance.</p>
</details>
</div>

<h2 id="views">What each view isolates</h2>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>View</th><th>What is drawn</th><th>What it is useful for</th></tr></thead>
<tbody>
<tr><td>Final field</td><td>The complete model: warp, fractal composition, color ramp, veil, and stars.</td><td>The result as it appears on the homepage.</td></tr>
<tr><td>Base noise</td><td>One octave of value noise, with no warp and no color mixing.</td><td>Seeing the lattice and the scale of the underlying field.</td></tr>
<tr><td>Warp field</td><td>The two components of the first warp in red and green, and the second warp's displacement magnitude in blue.</td><td>Seeing where the final image will be stretched or torn.</td></tr>
<tr><td>Octave bands</td><td>Three octaves of noise colored separately, coarse to fine.</td><td>Seeing which spatial scale carries the filaments.</td></tr>
<tr><td>Colour field</td><td>The three-stop ramp, dust, and emission before the veil and stars are added.</td><td>Tuning palette and density without the star layer.</td></tr>
</tbody>
</table></div>

<h2 id="state">State, sharing, and fallbacks</h2>
<p>Every control writes its value into the page URL, and <em>Copy config</em> copies the complete address. Reopening that address restores the seed, view, octave count, warp, variant, density, scale, palette, and quality mode. The seed input accepts up to eight hexadecimal digits, so a configuration can be named rather than only regenerated.</p>
<p>Rendering is adaptive by default: if frames run slow, the drawing buffer drops resolution before the animation stops. <em>High</em> pins the buffer at device resolution up to 2× and turns adaptation off; <em>Low</em> starts at 0.6×. With <code>prefers-reduced-motion</code>, the shader draws one still frame at a fixed time and pointer parallax is disabled. Without WebGL2, the text fallback remains and the controls stay readable.</p>

<h2 id="limits">Limits</h2>
<p>The shader is a 2D field. It has no volume, no lighting model, and no physical units. The apparent depth comes from the radial falloff and the dust mask, not from a simulation. Octave count changes detail and cost together; six octaves is roughly 50% more noise samples per pixel than the default four. The quality selector changes resolution, not the model, so a low-quality frame is the same field at fewer pixels.</p>

<div class="link-row project-footer-links"><a class="text-link" href="/lab">Lab index <span>↗</span></a><a class="text-link" href="/projects/visualization">Visualization project <span>↗</span></a><a class="text-link" href="/projects/mandelbrot">Mandelbrot drawer <span>↗</span></a><a class="text-link" href="/projects/boids">Boids <span>↗</span></a></div>
</article>`
};
