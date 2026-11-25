// Aurora project page ("/projects/aurora").
//
// Facts come from the aurora repository's README and js/config.js. The live
// simulation is a copy of that repository under public/lab/aurora/. It is an
// artistic model with physically ordered inputs, and the page says which parts
// are modelled and which are stylized.
import { projectById } from "../data/projects";
import { repos } from "./constants";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("aurora");

export const auroraPage: Page = {
    title: "Northern lights, solved per ray.",
    eyebrow: "Project / Computational visualization",
    kind: "project",
    section: "Projects",
    updated: "2026-11-23",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / Computational visualization",
    "Northern lights, solved per ray.",
    "A real-time aurora rendered entirely in WebGL 2 fragment shaders. A small space-weather model decides when the curtains brighten, and each curtain is integrated analytically instead of being sampled.",
    [
        { label: "Open the live aurora", href: "/lab/aurora/" },
        { label: "GitHub repository", href: repos.aurora }
    ]
)}

<h2 id="overview">Overview</h2>
<p>The scene is a ground-level view of the northern lights over mountains and a frozen lake. There are no textures, models, or video: the curtains, stars, Milky Way, terrain, snow, and water are all generated every frame. The simulation runs in the browser from a plain static page, and it is live in the lab.</p>
<figure class="article-figure"><a href="/lab/aurora/"><img src="/projects/aurora.jpg" alt="Green auroral curtains with faint red tops rise over a dark mountain ridge under a starfield and reflect in a rippled lake." loading="lazy" decoding="async"></a><figcaption>A reference render. The green body is 557.7 nm oxygen, the faint red tops are 630.0 nm oxygen, and the lake reflects the modelled aurora. Select the image to open the live version.</figcaption></figure>
<p>Two problems shaped the design. Auroral curtains are thin, bright, and finely structured, so a naive raymarch through them aliases into salt-and-pepper noise. And brightness that follows hand-animated curves looks arbitrary, so the motion is driven by a small model of how the solar wind loads and releases energy. I wrote the model, the renderer, the controls, and a headless capture harness for repeatable review shots.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 340" role="img" aria-labelledby="aurora-arch-title aurora-arch-desc">
<title id="aurora-arch-title">Aurora space-weather model and render pipeline</title>
<desc id="aurora-arch-desc">Solar wind drives a coupling proxy, which charges stored energy until a substorm releases it. Four signals, activity, slow activity, energy, and surge, drive the render passes: the aurora volume, bloom extract, two blur scales, and the scene composite.</desc>
<rect x="1" y="1" width="958" height="338" fill="#10161a" stroke="#2b3439"/>
<text x="36" y="38" fill="#d98a5f" font-family="monospace" font-size="15" letter-spacing="2">AURORA / MODEL TO PIXELS</text>
<g fill="#161d22" stroke="#2b3439">
<rect x="36" y="64" width="196" height="86"/><rect x="268" y="64" width="196" height="86"/><rect x="500" y="64" width="196" height="86"/><rect x="732" y="64" width="192" height="86"/>
<rect x="36" y="214" width="196" height="76"/><rect x="268" y="214" width="196" height="76"/><rect x="500" y="214" width="196" height="76"/><rect x="732" y="214" width="192" height="76"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="17">
<text x="52" y="92">SOLAR WIND</text><text x="284" y="92">COUPLING</text><text x="516" y="92">STORAGE</text><text x="748" y="92">SUBSTORM</text>
<text x="52" y="242">AURORA VOLUME</text><text x="284" y="242">BLOOM EXTRACT</text><text x="516" y="242">BLUR × 2</text><text x="748" y="242">SCENE</text>
</g>
<g fill="#99a09d" font-family="monospace" font-size="11">
<text x="52" y="116">speed · density · Bz</text><text x="52" y="136">slow sine periods</text>
<text x="284" y="116">southward Bz + speed</text><text x="284" y="136">raise the proxy</text>
<text x="516" y="116">energy builds in</text><text x="516" y="136">the growth phase</text>
<text x="748" y="116">quiet → growth →</text><text x="748" y="136">expansion → recovery</text>
<text x="52" y="266">4 sheets · RGBA16F</text><text x="52" y="282">0.34–0.9× canvas</text>
<text x="284" y="266">soft-knee threshold</text><text x="284" y="282">½ resolution</text>
<text x="516" y="266">½ and ¼ resolution</text><text x="516" y="282">separable Gaussian</text>
<text x="748" y="266">sky · terrain · lake</text><text x="748" y="282">ACES · grain</text>
</g>
<g stroke="#d98a5f" stroke-width="2" marker-end="url(#aurora-arrow)" fill="none">
<line x1="232" y1="107" x2="262" y2="107"/><line x1="464" y1="107" x2="494" y2="107"/><line x1="696" y1="107" x2="726" y2="107"/>
<line x1="828" y1="150" x2="134" y2="208"/>
<line x1="232" y1="252" x2="262" y2="252"/><line x1="464" y1="252" x2="494" y2="252"/><line x1="696" y1="252" x2="726" y2="252"/>
</g>
<text x="300" y="184" fill="#99a09d" font-family="monospace" font-size="11">activity · slow activity · energy · surge</text>
<text x="36" y="320" fill="#99a09d" font-family="monospace" font-size="12">One fullscreen triangle per pass, no per-frame allocations. Only the aurora feeds bloom.</text>
<defs><marker id="aurora-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#d98a5f"/></marker></defs>
</svg></div>
<p>The model hands the renderer four signals. <em>Activity</em> drives the fast green emission. <em>Slow activity</em> has a longer time constant and drives the 630.0 nm red layer, because that oxygen state takes far longer to radiate than the green one. <em>Energy</em> stands in for precipitation hardness and raises nitrogen blue and violet at the base of the curtain. <em>Surge</em> is the substorm envelope, and it also pulls the sheet stack in slightly to suggest the expanding auroral oval.</p>

<h2 id="implementation">Implementation</h2>

<h3>Solving the curtain instead of sampling it</h3>
<p>Each curtain is a warped, near-vertical sheet between about 82 and 500 km altitude, with its depth defined by a bow toward the frame edges, an altitude-dependent meander, animated folds, and a lean like a magnetic field line. Rather than stepping a ray through it, the shader solves for the point where the camera ray crosses the warped sheet, using three fixed-point iterations. All of the curtain's structure is then evaluated once, at that point.</p>
<p>Brightness comes from the analytic line integral of the sheet's Gaussian cross-section, √π times the width divided by how steeply the ray crosses it. Up to four sheets, at 430, 580, 730, and 880 km depth, are sorted and composited front to back with absorption, and a wider, optically thin Gaussian around each supplies the diffuse halo of the unresolved curtain. Because nothing is sampled, the image has essentially no step aliasing, and the quality setting controls detail rather than sample count.</p>

<h3>One noise volume for everything</h3>
<p>A tileable 64³ value-noise volume is built once on the CPU at startup. Each of its four channels uses a different lattice period, so a single filtered fetch returns large, medium, and fine scales at once. The same texture drives the curtain flow, the Milky Way dust, mountain facets, snow, and the ripples on the lake.</p>

<h3>Staying real-time</h3>
<p>The aurora renders at 34–90% of canvas resolution, where its soft detail survives upsampling and bloom; bloom runs at half and quarter resolution; and the canvas is capped near 3.7 megapixels. Adaptive quality lowers the aurora's resolution and detail when the frame rate drops below about 47 fps and restores it above about 58. If the browser drops the WebGL context, the page stops drawing and offers a reload instead of throwing an error every frame.</p>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("Render passes", "4", "volume, bloom extract, blur, composite")}
${resultRow("Curtain sheets", "up to 4", "82–500 km altitude, 430–880 km deep")}
${resultRow("Adaptive band", "47–58 fps", "lower detail below, restore above")}
</div>
<p>The repository's capture harness drives headless Chrome to place the model in a known state, such as quiet, growth, expansion, or recovery, and saves the canvas. Review captures covered all four substorm phases, high activity, alternate camera angles, all four quality tiers, and a 390 × 780 mobile viewport. Headless Chrome renders in software, so those captures say nothing about speed; frame rate depends on the visitor's GPU, which is what the adaptive band is for.</p>

<h2 id="analysis">Analysis</h2>
<p>The model puts the physics in the right order, but it is not a forecast. Solar-wind values follow illustrative sine periods rather than measured data, substorm timing is chosen for viewing, the emission colors are display colors rather than a spectral calculation, and no magnetohydrodynamics, particle tracing, or radiative transfer is solved. The lake reflects only the aurora buffer, not the stars or mountains, and the camera stays at one spot.</p>
<p>The useful idea is the per-ray solve. Replacing a sample loop with an intersection and an analytic integral removed the aliasing that would otherwise have needed many more samples, and it made performance predictable enough to scale smoothly from a phone to a desktop GPU.</p>

${projectFooter([
    { label: "Live aurora", href: "/lab/aurora/" },
    { label: "Computational visualization", href: "/projects/visualization" }
])}
</article>`
};
