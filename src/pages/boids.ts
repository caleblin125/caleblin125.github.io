// Boids project page ("/projects/boids") — flocking write-up with the
// interactive boids canvas, the three-rules SVG diagram, KaTeX force
// equations, and the species constant / interaction tables.
import { boidsUrl } from "./constants";
import type { Page } from "./types";

export const boidsPage: Page = {
    title: "Boids.",
    eyebrow: "Project / Boids",
    description: "A browser reimplementation of a Java boids flocking simulation, with the three steering rules, species constants, and an interactive canvas.",
    content: `<article class="article"><p class="kicker">Project</p><h1>Boids.</h1><p class="lede">A flocking simulation from an old Java project, rewritten for the browser.</p><div class="article-visual visual-frame boids-frame"><canvas data-visualization="boids" aria-label="Interactive boids flocking simulation"></canvas><div class="visual-label">Boids </div></div><p>This is a reimplementation of <a href="${boidsUrl}">my original Boids project</a>. It uses 2 Big, 7 Predator, 450 Prey1, and 30 Prey2 boids, updated once per frame with the original pixel-space constants. The caret marks use the velocity angle, and the fading trails show their recent movement.</p>

<h2>The three rules</h2>
<p>Every boid builds a steering target once per 10&nbsp;ms simulation step. Three weighted forces are computed from the neighbours it can see, and the sum is clamped to the class's steering limit before it is applied as acceleration:</p>
<div class="math-display">$$\\text{separation} + \\text{alignment} + \\text{cohesion}$$</div>
<svg class="vector-diagram" viewBox="0 0 960 280" role="img" aria-label="Vector diagram of the three boid steering rules">
<defs>
<marker id="arrow-sep" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#ff6b6b"/></marker>
<marker id="arrow-coh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#5be584"/></marker>
<marker id="arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#eee8f2"/></marker>
</defs>
<g>
<text x="160" y="26" class="diagram-title" text-anchor="middle">Separation</text>
<circle cx="80" cy="90" r="9" fill="#4d8cff" opacity="0.8"/>
<circle cx="255" cy="100" r="9" fill="#4d8cff" opacity="0.8"/>
<circle cx="130" cy="225" r="9" fill="#4d8cff" opacity="0.8"/>
<circle cx="160" cy="160" r="11" fill="#4d8cff"/>
<line x1="160" y1="160" x2="186" y2="182" stroke="#ff6b6b" stroke-width="2.5" marker-end="url(#arrow-sep)"/>
<line x1="160" y1="160" x2="131" y2="178" stroke="#ff6b6b" stroke-width="2.5" marker-end="url(#arrow-sep)"/>
<line x1="160" y1="160" x2="174" y2="129" stroke="#ff6b6b" stroke-width="2.5" marker-end="url(#arrow-sep)"/>
<text x="160" y="262" class="diagram-caption" text-anchor="middle">push away from close neighbours</text>
</g>
<g transform="translate(320,0)">
<text x="160" y="26" class="diagram-title" text-anchor="middle">Alignment</text>
<circle cx="90" cy="150" r="9" fill="#4d8cff"/>
<line x1="90" y1="150" x2="128" y2="138" stroke="#eee8f2" stroke-width="2.5" marker-end="url(#arrow-head)"/>
<circle cx="160" cy="95" r="9" fill="#4d8cff"/>
<line x1="160" y1="95" x2="200" y2="95" stroke="#eee8f2" stroke-width="2.5" marker-end="url(#arrow-head)"/>
<circle cx="235" cy="150" r="9" fill="#4d8cff"/>
<line x1="235" y1="150" x2="271" y2="167" stroke="#eee8f2" stroke-width="2.5" marker-end="url(#arrow-head)"/>
<line x1="160" y1="210" x2="215" y2="210" stroke="#c59ad8" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#arrow-head)"/>
<text x="160" y="262" class="diagram-caption" text-anchor="middle">match the average heading</text>
</g>
<g transform="translate(640,0)">
<text x="160" y="26" class="diagram-title" text-anchor="middle">Cohesion</text>
<circle cx="85" cy="95" r="9" fill="#4d8cff" opacity="0.8"/>
<circle cx="245" cy="100" r="9" fill="#4d8cff" opacity="0.8"/>
<circle cx="90" cy="225" r="9" fill="#4d8cff" opacity="0.8"/>
<circle cx="240" cy="215" r="9" fill="#4d8cff" opacity="0.8"/>
<line x1="85" y1="95" x2="160" y2="160" stroke="#5be584" stroke-width="2.5" marker-end="url(#arrow-coh)"/>
<line x1="245" y1="100" x2="160" y2="160" stroke="#5be584" stroke-width="2.5" marker-end="url(#arrow-coh)"/>
<line x1="90" y1="225" x2="160" y2="160" stroke="#5be584" stroke-width="2.5" marker-end="url(#arrow-coh)"/>
<line x1="240" y1="215" x2="160" y2="160" stroke="#5be584" stroke-width="2.5" marker-end="url(#arrow-coh)"/>
<circle cx="160" cy="160" r="5" fill="#eee8f2"/>
<text x="160" y="262" class="diagram-caption" text-anchor="middle">steer toward the centre of mass</text>
</g>
</svg>
<h3>Separation — keep your distance</h3>
<p>For every neighbour closer than its <em>avoid distance</em>, the boid pushes directly away from it. The push is scaled by the separation weight for that neighbour's class, so a Prey1 pressed against a Predator feels a far stronger push than one beside another Prey1:</p>
<div class="math-display">$$\\mathbf{F}_{\\text{sep}} = \\sum_{j \\,:\\, d_{ij} < r_{\\text{avoid}}} s_{ij}\\,(\\mathbf{p}_i - \\mathbf{p}_j)$$</div>
<h3>Alignment — match the group heading</h3>
<p>The boid averages the velocity of every neighbour inside its vision cone, weighted by class, then subtracts its own velocity so the force is relative:</p>
<div class="math-display">$$\\mathbf{F}_{\\text{ali}} = \\frac{1}{n}\\sum_{j} a_{ij}\\,\\mathbf{v}_j - \\mathbf{v}_i$$</div>
<h3>Cohesion — stay with the flock</h3>
<p>For neighbours beyond the avoid distance, the boid is pulled toward their centre of mass:</p>
<div class="math-display">$$\\mathbf{F}_{\\text{coh}} = \\frac{1}{m}\\sum_{j \\,:\\, d_{ij} \\ge r_{\\text{avoid}}} c_{ij}\\,(\\mathbf{p}_j - \\mathbf{p}_i)$$</div>
<p>Two extra forces join the sum: a push back toward the centre of the world when a boid strays within 30&nbsp;px of an edge (flocking is skipped that step), and — for Predators only — a pull toward the pointer (<em>mouseFollow</em>). The total is clamped to the class's <em>acceleration</em> before being applied, and speed is governed separately: a <em>constantAcceleration</em> push keeps a boid moving when it is below <em>maxSpeed</em>, while <em>resistance</em> drags it back when it overshoots.</p>
<div class="math-display">$$\\mathbf{F}_{\\text{steer}} = \\text{clamp}\\left(\\mathbf{F}_{\\text{sep}} + \\mathbf{F}_{\\text{ali}} + \\mathbf{F}_{\\text{coh}} + \\mathbf{F}_{\\text{edge}} + \\mathbf{F}_{\\text{mouse}},\\; a_{\\text{max}}\\right)$$</div>

<h2>Vision</h2>
<p>Vision is a cone: a neighbour counts only if it is closer than the <em>sense range</em> and its direction from the boid is within the <em>sense angle</em> of the heading. Prey1 and Prey2 see the full 360°; Predator and Big see a 180° front cone but much farther. Each boid also tracks at most <em>max neighbours</em> per step — and since neighbours are scanned in creation order (2 Big, then 7 Predator, then 450 Prey1, then 30 Prey2), a Predator's cap of 10 is typically spent on the Big and other Predators listed before any Prey.</p>

<h2>Class constants</h2>
<p>Speeds and ranges are in world pixels (the world is 1150&nbsp;×&nbsp;650). <em>Steering</em> is the acceleration limit, <em>cruise</em> is the constant push below max speed, and <em>drag</em> is the resistance applied above it:</p>
<div class="table-wrap"><table class="spec-table">
<thead><tr><th>Class</th><th>Count</th><th>Max speed</th><th>Steering</th><th>Cruise</th><th>Drag</th><th>Sense range</th><th>Sense angle</th><th>Avoid distance</th><th>Max neighbours</th></tr></thead>
<tbody>
<tr><td>Prey1</td><td>450</td><td>100 px/s</td><td>700</td><td>100</td><td>−3</td><td>70 px</td><td>360°</td><td>30 px</td><td>20</td></tr>
<tr><td>Prey2</td><td>30</td><td>200 px/s</td><td>1000</td><td>300</td><td>−7</td><td>90 px</td><td>360°</td><td>10 px</td><td>20</td></tr>
<tr><td>Predator</td><td>7</td><td>50 px/s</td><td>600</td><td>300</td><td>−3</td><td>150 px</td><td>180°</td><td>40 px</td><td>10</td></tr>
<tr><td>Big</td><td>2</td><td>50 px/s</td><td>1000</td><td>400</td><td>−5</td><td>300 px</td><td>180°</td><td>70 px</td><td>30</td></tr>
</tbody>
</table></div>

<h2>Forces between classes</h2>
<p>The additional force between classes is a weight per pair, applied as the separation / alignment / cohesion coefficient when a boid senses a neighbour of that class. Reading a cell as (separation, alignment, cohesion): a negative separation means <em>attraction</em> rather than avoidance, so Predators chase Prey (separation −10/−20, cohesion +10) while Prey flee (separation 9999/2000, cohesion −9999). Prey2 are drawn strongly to Big (cohesion 1000), and Big avoid each other (separation 40, cohesion −40) while trailing Predators.</p>
<div class="table-wrap"><table class="spec-table">
<thead><tr><th>Sensing class ↓ / seen →</th><th>Prey1</th><th>Prey2</th><th>Predator</th><th>Big</th></tr></thead>
<tbody>
<tr><td>Prey1</td><td>35 / 2.5 / 2</td><td>1 / −0.5 / −1</td><td>9999 / 1 / −9999</td><td>1 / 1 / 0.3</td></tr>
<tr><td>Prey2</td><td>0 / 0 / −1</td><td>75 / 4.5 / 1</td><td>2000 / 1 / −9999</td><td>35 / 1 / 1000</td></tr>
<tr><td>Predator</td><td>−10 / 0 / 10</td><td>−20 / 0 / 10</td><td>30 / −1 / −5</td><td>9999 / 1 / −9999</td></tr>
<tr><td>Big</td><td>0 / 0 / 1</td><td>0 / 0 / 0</td><td>0 / 1 / 10</td><td>40 / −1 / −40</td></tr>
</tbody>
</table></div>
<p>One special interaction sits outside the weight table: a Predator within 25&nbsp;px of a Prey1 or Prey2 eats it, teleporting the prey to a random point on a circle around the world centre — the herd is replenished from the edges rather than lost.</p>

<p>The old Java program draws filled polygons. This version keeps the pointed shape, with thicker WebGL chevrons and longer trails.</p></article>`
};
