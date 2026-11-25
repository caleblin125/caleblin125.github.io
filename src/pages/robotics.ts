// Robotics project page ("/projects/robotics") — the ECE 118 mecanum robot,
// its beacon receiver and 10 ms match loop, plus the ECE 167 glove controller
// as a second calibration-and-estimation problem.
import { projectById } from "../data/projects";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("robotics");

export const roboticsPage: Page = {
    title: "Robotics and state estimation.",
    eyebrow: "Project / Robotics",
    kind: "project",
    section: "Projects",
    updated: "2026-11-23",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / Robotics",
    "Finding a goal without a map.",
    "A mecanum robot on a tape field, a 2 kHz beacon in gym noise, and the calibration problem behind a hand controller.",
    [
        { label: "Robot note", href: "/blog/a-robot-on-a-field-with-no-map" },
        { label: "Glove note", href: "/blog/the-glove-is-the-controller" }
    ]
)}

<h2 id="overview">Overview</h2>
<p>ECE 118 ended with a field and no map. Team 28 — Will Langton, Preet Karia, and me — built <em>Sluggers of the Lost Goal</em>: an 11-inch mecanum cube with a double flywheel shooter and room for about fifty balls. The field is 84 × 36 inches inside two-inch border tape, with a 56-inch center spine, three cross tapes, a start zone with no tape at all, and a shooting goal at a coordinate rather than a marking. Three of four lanes hold walls that emit 1.5 kHz and 2.5 kHz infrared; the opponent carries a 2.0 kHz beacon somewhere on the far half.</p>
<figure class="article-figure"><img src="/blog/sluggers-cad.png" alt="CAD render of the mecanum robot with its double flywheel shooter, storage box, and electronics layers." loading="lazy"><figcaption>The CAD model: mecanum base, two-layer electronics deck, angled double-flywheel shooter, and ball storage.</figcaption></figure>
<p>The second half of the story is ECE 167: a pair of instrumented gloves that drive a browser game. It is not the same robot, but it asks the same question in a different body: what does the machine believe about its own pose, and how was that belief calibrated?</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 470" role="img" aria-labelledby="robot-arch-title robot-arch-desc">
<title id="robot-arch-title">Robot sensing and control architecture</title>
<desc id="robot-arch-desc">Tape sensors, bumpers, a BNO055 IMU, and a filtered 2 kHz beacon feed a PIC32 event loop every 10 milliseconds; the state machine drives mecanum motors and the flywheel shooter. A separate offline path contained a particle filter, opponent EKF, and A star planner that did not ship in the match code.</desc>
<rect x="1" y="1" width="958" height="468" fill="#10161a" stroke="#2b3439"/>
<text x="36" y="40" fill="#d98a5f" font-family="monospace" font-size="15" letter-spacing="2">SENSING</text>
<text x="470" y="40" fill="#d98a5f" font-family="monospace" font-size="15" letter-spacing="2">10 MS EVENT LOOP</text>
<text x="740" y="40" fill="#d98a5f" font-family="monospace" font-size="15" letter-spacing="2">ACTUATION</text>
<g fill="#161d22" stroke="#2b3439">
<rect x="30" y="58" width="250" height="58"/><rect x="30" y="132" width="250" height="58"/>
<rect x="30" y="206" width="250" height="58"/><rect x="30" y="280" width="250" height="58"/>
<rect x="390" y="96" width="230" height="84"/><rect x="390" y="206" width="230" height="84"/>
<rect x="390" y="316" width="230" height="84"/>
<rect x="720" y="76" width="206" height="74"/><rect x="720" y="174" width="206" height="74"/>
<rect x="720" y="272" width="206" height="74"/>
</g>
<g fill="#e6e2d8" font-family="sans-serif" font-size="17">
<text x="48" y="82">Tape sensors ×7</text><text x="48" y="156">Bumpers ×4</text>
<text x="48" y="230">BNO055 IMU</text><text x="48" y="304">2 kHz IR receiver</text>
<text x="408" y="128">event service</text><text x="408" y="152" font-family="monospace" font-size="12" fill="#99a09d">debounce / overrun fallback</text>
<text x="408" y="238">match state machine</text><text x="408" y="262" font-family="monospace" font-size="12" fill="#99a09d">yaw zero / heading PID</text>
<text x="408" y="348">offline estimator</text><text x="408" y="372" font-family="monospace" font-size="12" fill="#99a09d">PF / EKF / A* — not shipped</text>
<text x="738" y="104">mecanum drive</text><text x="738" y="202">flywheel shooter</text>
<text x="738" y="300">feeder servo</text>
</g>
<g stroke="#d98a5f" stroke-width="2" marker-end="url(#robot-arrow)">
<line x1="280" y1="87" x2="384" y2="126"/><line x1="280" y1="161" x2="384" y2="146"/>
<line x1="280" y1="235" x2="384" y2="164"/><line x1="280" y1="309" x2="384" y2="182"/>
<line x1="620" y1="138" x2="714" y2="110"/><line x1="620" y1="248" x2="714" y2="208"/>
<line x1="620" y1="358" x2="714" y2="306"/>
</g>
<line x1="390" y1="286" x2="620" y2="286" stroke="#2b3439" stroke-width="1.5" stroke-dasharray="7 7"/>
<text x="36" y="438" fill="#99a09d" font-family="sans-serif" font-size="16">The shipped match code used reactive tape logic and IR peak tracking. The general estimator stayed on the bench.</text>
<defs><marker id="robot-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#d98a5f"/></marker></defs>
</svg></div>
<p>The important architectural fact is the separation between the fast event loop and the deliberate state machine. Tape and bumpers are debounced at the event layer; the match service runs every 10 ms; the estimator that would generalize across the field was built offline but did not replace the reactive logic that could be verified on the actual mat.</p>

<h2 id="implementation">Implementation</h2>
<h3>A receiver that had to survive a gym</h3>
<p>The hardest analog problem was finding a 2 kHz beacon in a room full of noise. The detector chain was four phototransistors in parallel, a non-inverting amplifier with potentiometer gain, then three cascaded Sallen-Key bandpass stages — a sixth-order filter — then a peak detector with gain and a second peak detector to fix the decay path through the first stage's potentiometer.</p>
<p>The filter values were not guessed. A MATLAB script optimized each stage against a cost function: center frequency error, target gain, Q, and sensitivity of both f0 and Q to component tolerance. Capacitors were measured first, then those measured values went into the optimizer. The Monte Carlo result for the first stage was a center frequency of 2000.33 Hz with a standard deviation of 19.9 Hz and a Q of 20.3 ± 2.7.</p>
<p>At the output there was substantial 60 Hz noise, but its DC level and amplitude were stable. Rather than fight it in hardware, the firmware tracked a peak-to-peak envelope, averaged the maximum and minimum, and turned that into a 0–255 strength. Strength maps to range through a bench-measured table, because a Sallen-Key response is not inverse-square and a formula would have been a lie.</p>

<h3>The ten-millisecond loop</h3>
<p>Everything above runs on a PIC32 in a course event-service framework. A timer posts the main service every 10 ms, which is the control period for feedback and timed states. Event checkers for tape, bumpers, IR, and the IMU run around it and post faster events. Tape is debounced over four samples, bumpers over five. If the loop overruns 50 ms, the tape checker falls back to the raw pin value rather than serving a stale reading.</p>
<p>The match state machine is deliberately plain: calibrate the gyro, spin to find the strongest beacon heading, drive onto the front tape and zero yaw, strafe to the left edge, hug the tape while seeking the back, then sweep the aim and fire a burst. Fifty balls mattered: the shooter's spread meant a single shot proved very little, but a burst made the minimum specification something the robot could actually hit. It did: the final run met minspec.</p>

<h3>The glove: calibration is the controller</h3>
<p>ECE 167 used two STM32 Nucleo gloves with BNO055 IMUs, flex sensors, capacitive pads, and buttons. The firmware ran a 50 Hz Mahony-style complementary filter on a direction cosine matrix: the gyro predicts, the accelerometer and magnetometer correct, and the integral terms estimate gyro bias. A calibration gesture averages the rotation axis of a wrist twist and builds a transform that makes that axis the driver's steering axis.</p>
<p>The useful result was not that the car moved. It was that a hand-relative frame could be recovered and tested. The same idea sits underneath the robot: a pose is only meaningful relative to a frame, and the frame has to be established by a measurement.</p>
<div class="figure-pair">
<figure class="article-figure"><img src="/blog/glove-static-dynamic.png" alt="Four stacked time-series plots showing a motion score, Euler angles for both gloves, and flex counts over fifty seconds, with static and dynamic regions shaded." loading="lazy"><figcaption>Fifty seconds of two-glove data, segmented per column into static and dynamic stretches. The top trace is the summed rolling standard deviation; Euler angles sit in the middle, flex counts at the bottom.</figcaption></figure>
<figure class="article-figure"><img src="/blog/glove-usability-summary.png" alt="Bar chart of glove usability summary with stability scores for the two IMUs and normalized range scores for the two flex channels; smoothness bars are barely visible." loading="lazy"><figcaption>The harness summary. Stability comes from static variance, range is normalized to the widest flex channel, and smoothness is <code>1 / (1 + mean jerk)</code>. The smoothness bars are nearly invisible because jerk is still in raw units.</figcaption></figure>
</div>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("Beacon filter", "2000.33 Hz", "Monte Carlo center frequency")}
${resultRow("Filter spread", "±19.9 Hz", "first-stage standard deviation")}
${resultRow("Filter Q", "20.3 ± 2.7", "Monte Carlo tolerance result")}
${resultRow("Control period", "10 ms", "PIC32 main service")}
</div>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Subsystem</th><th>Measured or specified result</th><th>Basis</th></tr></thead>
<tbody>
<tr><td>IR receiver</td><td>2000.33 Hz ± 19.9 Hz, Q 20.3 ± 2.7</td><td>MATLAB Monte Carlo over measured capacitors</td></tr>
<tr><td>Match loop</td><td>10 ms service period</td><td>PIC32 timer / event framework</td></tr>
<tr><td>Shooter</td><td>Final run met minspec with a 50-ball burst</td><td>ECE 118 final run</td></tr>
<tr><td>Glove sampling</td><td>50 Hz, five serial lines per glove</td><td>STM32 firmware</td></tr>
</tbody>
</table></div>

<h2 id="filter">Interactive: the response the optimizer was shaping</h2>
<p>The built receiver is three cascaded Sallen-Key bandpass sections — a sixth-order filter. The model below applies the published first-stage result to each section: a center frequency of 2000.33 Hz and a Q of 20.3, both from a MATLAB Monte Carlo over measured capacitors. The curve is therefore an anchored model, not a swept transfer function. It shows the selectivity the optimizer was buying; it is not the measured total response of the assembled board.</p>
<div class="filter-model" data-filter>
<div class="demo-toolbar">
<label class="demo-control">Center f0 <input type="range" min="1600" max="2400" step="0.5" value="2000.33" data-filter-f0><output data-filter-f0-value>2000.3 Hz</output></label>
<label class="demo-control">Q <input type="range" min="4" max="40" step="0.1" value="20.3" data-filter-q><output data-filter-q-value>20.3</output></label>
<label class="demo-control">Stages <select data-filter-stages><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option></select></label>
</div>
<div class="filter-readout" data-filter-readout aria-live="polite">Adjust the center, Q, and stage count.</div>
<canvas data-visualization="filter" role="img" aria-label="Modeled bandpass response of three cascaded second-order sections centered at two kilohertz with Q 20.3."></canvas>
<div class="demo-legend"><span><i class="legend-line legend-model"></i><span data-filter-model-label>cascade model</span></span><span class="legend-ghost"><i class="legend-line legend-stage"></i>one section</span><span><i class="legend-line legend-beacon"></i>beacon tones</span></div>
<p class="demo-note">Model, not a measurement. Dashed vertical lines mark the 1.5 and 2.5 kHz wall tones at the edges and the 2.0 kHz opponent beacon at the center. The Monte Carlo samples are not published, only the mean and standard deviation, so no distribution is drawn. Missing from the public record: component values, the other two sections' individual results, a swept Bode plot, and the on-field signal-to-noise ratio.</p>
</div>

<h2 id="demo">Interactive: a synthetic Kalman filter</h2>
<p>The robot's shipped match code did not use a Kalman filter. This demo is a separate, clearly synthetic 1D constant-velocity example: it shows how process noise and measurement noise change the estimate and its uncertainty. It is not a replay of robot data. The logic lives in <code>src/kalman/filter.ts</code>; the canvas only draws the state.</p>
<div class="kalman-demo" data-kalman>
<div class="demo-toolbar">
<label class="demo-control">Process noise q <input type="range" min="0.01" max="2" step="0.01" value="0.2" data-kalman-q></label>
<label class="demo-control">Measurement noise r <input type="range" min="0.5" max="20" step="0.5" value="8" data-kalman-r></label>
<span class="demo-actions"><button class="demo-button" type="button" data-kalman-run>Run</button><button class="demo-button" type="button" data-kalman-reset>Reset</button></span>
</div>
<div class="kalman-readout" data-kalman-readout aria-live="polite">Step 0 / 160 · estimate —</div>
<canvas data-visualization="kalman" role="img" aria-label="A synthetic 1D constant-velocity Kalman filter: noisy position measurements, the filtered estimate, the true path, and a two-sigma uncertainty band."></canvas>
<div class="demo-legend"><span><i class="legend-dot legend-truth"></i>true path</span><span><i class="legend-dot legend-measurement"></i>measurement</span><span><i class="legend-dot legend-estimate"></i>estimate</span><span><i class="legend-band"></i>±2σ</span></div>
<p class="demo-note">Synthetic data, deterministic seed. The reported RMSE is computed from this run only and says nothing about the robot's field performance.</p>
</div>

<h2 id="analysis">Analysis</h2>
<p>The honest gap is worth naming. The robot has a full particle filter, an opponent EKF, and A* planning in the repository, but the match code that ran used reactive tape logic and IR peak tracking instead. The general solution was built and simulated; the one that shipped was the one that could be verified on the actual field in the time available.</p>
<p>The analog receiver is the part I trust most, because its tolerance was measured. The navigation stack is the part I would rebuild first, because the field rewarded a state machine over a model that had not been validated against the field. The glove study has its own limit: it is one 50-second recording from one person, not a user study, and some of its metrics were in incompatible units. The next version needs held-out gestures, several users, wrap-aware angles, and a task-level measure. No video of the final run is published here, so the minspec claim rests on the team's recorded result rather than a replayable artifact.</p>
${projectFooter([
    { label: "Robot note", href: "/blog/a-robot-on-a-field-with-no-map" },
    { label: "Glove note", href: "/blog/the-glove-is-the-controller" }
])}
</article>`
};
