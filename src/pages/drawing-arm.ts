// Drawing arm project page ("/projects/drawing-arm").
//
// Facts and figures come from the drawing-arm repository: README.md,
// docs/DESIGN.md, docs/reports/strain_heart.md, and the figures in
// docs/images. Every number here is computed by the design tools; the arm has
// not been built, and the page says so.
import { projectById } from "../data/projects";
import { repos } from "./constants";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("drawing-arm");

export const drawingArmPage: Page = {
    title: "A drawing stored in cams.",
    eyebrow: "Project / Mechanism design",
    kind: "project",
    section: "Projects",
    updated: "2026-11-23",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / Mechanism design",
    "A drawing stored in cams.",
    "A shoulder–elbow–wrist arm with all three inputs at the shoulder, driven by one motor. The picture lives in the shape of the cams, so the software's job is to turn a drawing into geometry that can be printed.",
    [{ label: "GitHub repository", href: repos.drawingArm }]
)}

<h2 id="overview">Overview</h2>
<p>Eighteenth-century writing automata stored their text in stacks of cams: one shaft turns, followers read the cam edges, and linkages carry that motion to a hand. This project asks the same question with modern tools. Given any drawing, an SVG, or a photo, can software design the arm, plan a human-looking motion, and synthesize the cams that make one motor reproduce it?</p>
<p>The repository is the whole pipeline in Python: kinematics with human range-of-motion limits, a motion planner, cam and multi-turn drum synthesis, CadQuery parts exported as STL and STEP, a structural and pen-error check, and a tkinter simulator where you can draw with the mouse and watch every linkage move. I wrote all of it. Every parameter lives in one <code>params.toml</code>, so changing an arm length regenerates the plan, the cams, the parts, and the stress report together.</p>
<figure class="article-figure"><img src="/projects/drawing-arm.png" alt="Top and isometric views of the arm assembled at cam angle zero: the cam stack beside the shoulder, the upper arm and forearm, the parallelogram couplers that carry the elbow and wrist drives, and the hand." loading="lazy" decoding="async"><figcaption>The generated assembly at cam angle 0, top view and isometric. The cam stack sits beside the shoulder; the lavender and teal links are the parallelogram couplers that carry the elbow and wrist drives out from the shoulder.</figcaption></figure>
<p>This is a design and simulation project. The parts are generated and checked, but the arm has not been printed and run, so every result below is computed rather than measured.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 360" role="img" aria-labelledby="arm-arch-title arm-arch-desc">
<title id="arm-arch-title">Drawing arm pipeline from drawing to printable parts</title>
<desc id="arm-arch-desc">A drawing becomes strokes, the planner turns strokes into joint angles over time, cam synthesis turns the angles into cam profiles, and the part generator exports printable parts. A structural check and the simulator read the same plan.</desc>
<rect x="1" y="1" width="958" height="358" fill="#2a1e32" stroke="#51425a"/>
<text x="36" y="38" fill="#c59ad8" font-family="monospace" font-size="15" letter-spacing="2">DRAWING ARM / DRAWING TO PARTS</text>
<g fill="#1a1320" stroke="#51425a">
<rect x="36" y="68" width="190" height="92"/><rect x="262" y="68" width="190" height="92"/><rect x="488" y="68" width="190" height="92"/><rect x="714" y="68" width="210" height="92"/>
<rect x="262" y="214" width="190" height="80"/><rect x="488" y="214" width="190" height="80"/>
</g>
<g fill="#eee8f2" font-family="sans-serif" font-size="17">
<text x="52" y="96">DRAWING</text><text x="278" y="96">PLANNER</text><text x="504" y="96">CAM SYNTHESIS</text><text x="730" y="96">PARTS</text>
<text x="278" y="242">SIMULATOR</text><text x="504" y="242">STRUCTURAL</text>
</g>
<g fill="#9a8da0" font-family="monospace" font-size="11">
<text x="52" y="120">SVG · image · shape</text><text x="52" y="140">→ strokes on paper</text>
<text x="278" y="120">order · 2/3 power law</text><text x="278" y="140">min-energy hand angle</text>
<text x="504" y="120">re-timing · 35° limit</text><text x="504" y="140">cams or helical drum</text>
<text x="730" y="120">CadQuery → STL / STEP</text><text x="730" y="140">clearance + springs</text>
<text x="278" y="266">tkinter · margins</text><text x="278" y="284">motor torque · CSV</text>
<text x="504" y="266">stress · buckling</text><text x="504" y="284">Hertz contact · pen error</text>
</g>
<g stroke="#c59ad8" stroke-width="2" marker-end="url(#arm-arrow)" fill="none">
<line x1="226" y1="114" x2="256" y2="114"/><line x1="452" y1="114" x2="482" y2="114"/><line x1="678" y1="114" x2="708" y2="114"/>
<line x1="357" y1="160" x2="357" y2="208"/><line x1="583" y1="160" x2="583" y2="208"/>
</g>
<text x="36" y="334" fill="#9a8da0" font-family="monospace" font-size="12">One params.toml feeds every stage: change a link length and the plan, cams, parts, and report all follow.</text>
<defs><marker id="arm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#c59ad8"/></marker></defs>
</svg></div>
<p>The mechanism keeps every motor input at the shoulder. The upper arm is driven directly. The forearm is driven through a parallelogram across the upper arm, and the hand through two parallelograms in series joined by a free L-shaped bell-crank at the elbow. Because each input sets an absolute link angle, the kinematics decouple: turning the shoulder input alone moves the forearm and hand without rotating them, and inverse kinematics reduces to a two-link solve plus a choice of hand angle.</p>
<p>That choice is where the planner earns its keep, and the cams are where the drawing is stored. Each cam turns one shoulder hub through a 3:1 gear sector, a fourth cam lifts the pen through a cable, and one revolution of the camshaft is one drawing.</p>

<h2 id="implementation">Implementation</h2>

<h3>Moving like a person</h3>
<p>Joint limits come from typical adult range of motion: elbow flexion from 20° to 145°, which also keeps each parallelogram away from its dead point, and wrist flexion and extension limits for a palm-sideways pose. Inverse kinematics rejects poses outside those limits and adds a quartic discomfort cost that pulls joints toward mid-range. Pen-down motion follows the two-thirds power law, so the pen slows in tight curves the way a hand does; pen-up moves are minimum-jerk reaches with a Fitts-style duration.</p>
<p>The redundant hand angle is chosen by dynamic programming over the whole drawing, minimizing kinetic effort through the arm's mass matrix plus discomfort and a transmission-margin penalty. That cuts kinetic effort by 10–15% compared with greedy inverse kinematics. The dynamics are an exact planar rigid-body model with reflected motor inertia, and the self-test checks them with a power balance.</p>

<h3>Turning a plan into cams</h3>
<p>A camshaft turns at constant speed, so a cam is steep wherever the arm moves fast, and a steep cam has to be large to keep its pressure angle under 35°. The synthesis therefore re-times the plan with a time-optimal path parameterization: the arm keeps its path but slows where a follower's slope or curvature on the cam would exceed a budget. A groove-contact limit of 40 MPa rejects designs whose roller pressure would wear the groove, and torsion springs preload every hub so gear backlash and groove clearance never reach the pen.</p>
<figure class="article-figure"><img src="/projects/drawing-arm-cams.png" alt="Four groove cam profiles for the heart drawing: shoulder 142 mm, elbow 132 mm, wrist 55 mm and pen lift 155 mm outer diameter, each with its maximum pressure angle." loading="lazy" decoding="async"><figcaption>The re-timed cam stack for the heart: shoulder, elbow, wrist, and pen lift. The wrist cam is a plain circle because the planner held the hand angle steady, which leaves the wrist input idle for this drawing.</figcaption></figure>

<h3>When one revolution is not enough</h3>
<p>One revolution holds one or two closed shapes. For longer drawings the cams become a multi-turn drum: a vertical drum that turns several times per drawing and rises one lead per turn on a lead screw, with each follower reading a raised helical band. From the follower's fixed plane a band is a plate cam unrolled over N turns, so the same synthesis, re-timing, and contact limit apply. Bands interleave like a multi-start thread, and only a 3 mm finger enters the drum, so a follower never touches another band.</p>
<figure class="article-figure"><img src="/projects/drawing-arm-drum.png" alt="Two plots for the heart drum: the radial profile of each follower band over four turns, and the unrolled band layout rising 36 mm per turn." loading="lazy" decoding="async"><figcaption>The heart on a four-turn drum. Left, each follower's band profile; right, the bands unrolled, rising one 36 mm lead per turn. The drum is 67 mm across, against cams up to 155 mm.</figcaption></figure>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("Heart drawing", "8.6 s", "one camshaft revolution, computed")}
${resultRow("Largest cam", "155 mm", "re-timed heart, down from 187 mm")}
${resultRow("Planner effort", "10–15%", "less kinetic effort than greedy IK")}
</div>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Drawing</th><th>Cycle</th><th>Cams, uniform timing</th><th>Cams, re-timed</th><th>Drum</th></tr></thead>
<tbody>
<tr><td>Heart</td><td>8.6 s</td><td>153 / 187 / 165 / 156 mm</td><td>142 / 132 / 55 / 155 mm</td><td>4 turns, 67 × 190 mm</td></tr>
<tr><td>Flower</td><td>13.3 s</td><td>infeasible</td><td>208 / 182 / 165 / 155 mm</td><td>4 turns, 99 × 190 mm</td></tr>
<tr><td>14-stroke SVG</td><td>32 s</td><td>infeasible</td><td>infeasible</td><td>6 turns, 144 × 262 mm</td></tr>
</tbody>
</table></div>
<p>Cam outer diameters are listed as shoulder / elbow / wrist / pen lift, all within the 40 MPa groove-contact limit. Re-timing is what makes the flower possible on one revolution; the drum is what makes a multi-stroke drawing possible at all.</p>
<p>The structural check runs the heart in PLA. While drawing, every link stays under 0.4 MPa with a safety factor above 100, and pen error from bending is 0.6 mm with zero backlash. A 5 N push on the pen raises link stress to 4 MPa and moves the pen 7 mm elastically. The weakest point is the cam groove, at 38 MPa Hertz contact and a safety factor of about 1.2, which is why the design notes recommend PETG or nylon for cams. As a check on the model itself, the statics chain and the inverse dynamics agree on motor torque to 0.00013 N·m against a 0.081 N·m peak.</p>

<h2 id="analysis">Analysis</h2>
<p>Every number on this page comes from the design tools, not from a built arm. The frame, motor mount, worm gear, and pen-lift anchor are not modelled yet, and gravity, friction, and fatigue are left out of the dynamics, so the first print will surely find tolerances and friction losses the simulation does not. The follower pivots are also re-optimized for each drawing, so swapping only the cams for a new picture needs one more design pass to fix the shared hardware.</p>
<p>What the project does show is the trade-off at the heart of a programmable automaton. Cam size, drawing length, and contact stress pull against each other, and re-timing the motion is a cheap way to buy capacity before reaching for a more complex drum.</p>

${projectFooter([
    { label: "Robotics work", href: "/projects/robotics" },
    { label: "GitHub repository", href: repos.drawingArm }
])}
</article>`
};
