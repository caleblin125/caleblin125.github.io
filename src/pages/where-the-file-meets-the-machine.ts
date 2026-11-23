// Blog post: "Where the file meets the machine" — a print-limit poster whose
// artwork is built around the printer's dot grid.
import type { Page } from "./types";

export const whereTheFileMeetsTheMachinePage: Page = {
    title: "Where the file meets the machine.",
    eyebrow: "Engineering notes / 02",
    description: "A 48 × 36 inch poster built around a printer's dot grid, its moiré limits, and the arithmetic behind every mark.",
    content: `<article class="article"><p class="kicker">2026 / 11 / 22</p><h1>Where the file meets the machine.</h1><p class="lede">A 48 × 36 inch poster built to break its printer, and the arithmetic behind every mark.</p>
<p>The CSE 185E assignment was to make a poster about the technical limits of printing, with original artwork that demonstrates them. The poster is called <em>The Resolution Limit</em>. The artwork is a single scalar field, warped so it reads as terrain, then cut into five terraces. Each terrace spends its area on a different printing layer, so the image changes depending on how close you stand.</p>
<figure class="article-figure"><img src="/blog/resolution-limit-poster.png" alt="Preview of the 48 by 36 inch Resolution Limit poster: a black and white warped contour artwork with colored moiré gratings." loading="lazy"><figcaption>The full poster layout. Thick index contours carry the shape at ten feet; the color and micro-patterns only show up close.</figcaption></figure>

<h2>The artwork is one scalar field</h2>
<p>Everything comes from one function: nine random sine waves, domain-warped by five more, plus three Gaussian bumps that become the centers of the zone plates. Change the seed and the composition changes; seed 7 always reproduces this one. The contour lines are its level sets, extracted with marching squares on a grid of 30 samples per inch.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Layer</th><th>How it is made</th><th>Visible from</th></tr></thead>
<tbody>
<tr><td>Macro</td><td>Domain-warped waves, thick contours at the five terrace edges</td><td>10 ft and beyond</td></tr>
<tr><td>Meso</td><td>240 thin contour lines, 0.3 pt each</td><td>3–6 ft</td></tr>
<tr><td>Micro</td><td>Two 0.6 mm gratings at 2°, 12 lpi halftone, zone plates down to 0.03 mm</td><td>under 1 ft</td></tr>
<tr><td>Color</td><td>Cyan, magenta, and yellow dot screens at 15°, 75°, and 0°</td><td>rosettes up close, smooth color far away</td></tr>
</tbody>
</table></div>

<h2>The arithmetic the artwork is built around</h2>
<p>BELS prints on an HP DesignJet Z9+, which addresses PDF content at 1200 dpi. That puts dots 0.0212 mm apart, so by the sampling theorem the finest period it can honestly reproduce is twice that: about 0.042 mm. The artwork is set against exactly that number.</p>
<ul class="article-list">
<li><strong>Zone plates</strong> shrink from a wide period at the center to 0.03 mm at the rim, past the 0.042 mm limit. The outer 29% of each plate cannot print as drawn. Because the rings are square waves, their third harmonic aliases even earlier, at roughly 1.0 inch from the center.</li>
<li><strong>Gratings:</strong> two 0.6 mm line families rotated 2° relative to each other. Two gratings of period <em>p</em> at angle θ beat into fringes of period <em>p</em> / (2 sin(θ/2)), which here is about 17.2 mm. At ten feet, that lands near three cycles per degree, where human contrast sensitivity peaks. The bands are visible across a room even though no individual line is.</li>
<li><strong>Contours:</strong> 0.3 pt is 0.106 mm, deliberately just above the 0.08 mm line width HP guarantees. Thinner lines risk breaking up.</li>
<li><strong>Halftone:</strong> a 12 lpi amplitude-modulated screen at 45°, which is newspaper-coarse on purpose. In the high terraces it becomes three color screens at the standard offset angles, so the rosettes on the poster are a deliberate, finely tuned moiré.</li>
</ul>
<figure class="article-figure"><img src="/blog/resolution-limit-detail.png" alt="Close crop of the poster showing black halftone dots, thin contour lines, and cyan and magenta line gratings crossing." loading="lazy"><figcaption>A detail crop: halftone dots, contour lines, and the two gratings whose crossings mix into blue and violet.</figcaption></figure>
<p>The file is all vector and about 10 MB, generated in roughly ten seconds with NumPy and pycairo. That matters because the printer, not the author, decides how each shape becomes dots. Handing it solid paths instead of a raster is the point of the exercise.</p>

<h2>What I can and cannot claim</h2>
<p>The test print is still pending as of this writing, so the poster argues from the file's geometry and the printer's published specs, not from a finished sheet. That distinction matters. The moiré comes from the two gratings in the file and would appear on any printer. The artifacts the printer adds are zone-plate aliasing and ink spread. And a phone camera adds a third grid on top of both, which is why photographing the poster often shows patterns that are not on the paper.</p>
<p>If the print disagrees with the prediction, that is a result, not a failure. "I predicted this, the printer did that, here is why" is the most useful thing to say at a poster session. Until the sheet exists, the poster is a prediction about a physical device, written in the device's own units.</p>
<div class="link-row"><a class="text-link" href="/projects">Other projects <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a></div>
</article>`
};
