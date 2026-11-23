// Blog post: "Where the file meets the machine" — a print-limit poster and a
// mecanum robot, tied together by measurement against a physical device.
import type { Page } from "./types";

export const whereTheFileMeetsTheMachinePage: Page = {
    title: "Where the file meets the machine.",
    eyebrow: "Engineering notes / 02",
    content: `<article class="article"><p class="kicker">2026 / 11 / 22</p><h1>Where the file meets the machine.</h1><p class="lede">A poster built to break its printer, and a robot that had to find a goal on a field it could barely see.</p>
<p>Two projects took up most of this term, and they look unrelated: a 48 × 36 inch generative poster about the limits of printing, and an autonomous mecanum robot that shoots ping-pong balls. Both are really the same exercise. Each one starts with a device that has a hard limit — a printer's dot grid, a field with no map — and asks what happens when you design right at that limit instead of pretending it is not there.</p>

<h2>Part one: a poster that plans to fail</h2>
<p>The CSE 185E assignment was to make a poster about the technical limits of printing, with original artwork that demonstrates them. The poster is called <em>The Resolution Limit</em>. The artwork is a single scalar field, warped so it reads as terrain, then cut into five terraces. Each terrace spends its area on a different printing layer, so the image changes depending on how close you stand.</p>
<figure class="article-figure"><img src="/blog/resolution-limit-poster.png" alt="Preview of the 48 by 36 inch Resolution Limit poster: a black and white warped contour artwork with colored moiré gratings." loading="lazy"><figcaption>The full poster layout. Thick index contours carry the shape at ten feet; the color and micro-patterns only show up close.</figcaption></figure>
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
<p>If the print disagrees with the prediction, that is a result, not a failure. "I predicted this, the printer did that, here is why" is the most useful thing to say at a poster session.</p>

<h2>Part two: a robot on a field with no map</h2>
<p>The ECE 118 final was a different kind of limit. Team 28 — Will Langton, Preet Karia, and me — built <em>Sluggers of the Lost Goal</em>: an 11-inch mecanum cube with a double flywheel shooter and room for about fifty balls. The field is 84 × 36 inches inside two-inch border tape, with a 56-inch center spine, three cross tapes, a start zone with no tape at all, and a shooting goal at a coordinate rather than a marking. Three of four lanes hold walls that emit 1.5 kHz and 2.5 kHz infrared; the opponent carries a 2.0 kHz beacon somewhere on the far half.</p>
<figure class="article-figure"><img src="/blog/sluggers-cad.png" alt="CAD render of the mecanum robot with its double flywheel shooter, storage box, and electronics layers." loading="lazy"><figcaption>The CAD model: mecanum base, two-layer electronics deck, angled double-flywheel shooter, and ball storage.</figcaption></figure>
<p>The robot cannot trust wheel odometry. Mecanum wheels slip, and an 11-inch chassis crossing a field of tape lines accumulates error quickly. So heading comes from a BNO055 IMU, position comes from tape, and the two are reconciled every time the front pair of tape sensors lands on the same line: both on, zero the yaw, and the field frame is restored. Six side tape sensors plus a back-middle sensor give a bitmask; four bumpers catch walls.</p>

<h2>A receiver that had to survive a gym</h2>
<p>The hardest analog problem was finding a 2 kHz beacon in a room full of noise. The detector chain was four phototransistors in parallel, a non-inverting amplifier with potentiometer gain, then three cascaded Sallen-Key bandpass stages — a sixth-order filter — then a peak detector with gain and a second peak detector to fix the decay path through the first stage's potentiometer.</p>
<p>The filter values were not guessed. A MATLAB script optimized each stage against a cost function: center frequency error, target gain, Q, and sensitivity of both f0 and Q to component tolerance. Capacitors were measured first, then those measured values went into the optimizer. The Monte Carlo result for the first stage was a center frequency of 2000.33 Hz with a standard deviation of 19.9 Hz and a Q of 20.3 ± 2.7, which is tight enough that a slightly off capacitor does not move the passband off the beacon.</p>
<p>At the output there was substantial 60 Hz noise, but its DC level and amplitude were stable. Rather than fight it in hardware, the firmware tracked a peak-to-peak envelope in software, averaged the maximum and minimum, and turned that into a 0–255 strength. Strength maps to range through a table measured on the bench, because a Sallen-Key response is not inverse-square and a formula would have been a lie.</p>

<h2>The ten-millisecond loop</h2>
<p>Everything above runs on a PIC32 in a course event-service framework. A timer posts the main service every 10 ms, which is the control period for feedback and timed states. Event checkers for tape, bumpers, IR, and the IMU run around it and post faster events. Tape is debounced over four samples, bumpers over five. If the loop overruns 50 ms, the tape checker falls back to the raw pin value rather than serving a stale reading.</p>
<p>The match state machine is deliberately plain:</p>
<ul class="article-list">
<li><strong>Calibrate</strong> — wait for the IMU gyro to report full calibration.</li>
<li><strong>Find the beacon</strong> — spin for ten seconds, remember the strongest IR reading and the yaw where it occurred, then rotate back to within five degrees of that heading.</li>
<li><strong>Line up</strong> — drive forward, hinging on whichever front tape sensor hits first, until both are on the line. Zero the yaw there.</li>
<li><strong>Find the left edge</strong> — strafe left to the mid tape sensor, holding heading with a PID loop.</li>
<li><strong>Seek the back</strong> — drive backward hugging the tape, and switch sides when a bumper reports a wall.</li>
<li><strong>Charge and shoot</strong> — sweep the aim between −16° and +16°, keep the yaw the PID holds steadiest at the peak IR reading, spin up the flywheels, open the feeder latch.</li>
</ul>
<p>Fifty balls mattered. The shooter's spread meant a single shot proved very little; a burst of them made the minimum specification something the robot could actually hit. It did: the final run met minspec.</p>

<h2>What broke</h2>
<p>Most of the real work was not in the state machine.</p>
<ul class="article-list">
<li><strong>Motor mounts sagged.</strong> The printed holders could not wrap fully around the motors given the clearance to the wheels, so the motors dragged and the robot drifted. Electrical tape and paper slings fixed it well enough that mecanum slip stopped being the dominant error.</li>
<li><strong>The flywheels browned out the board.</strong> Current draw during spin-up dropped the IMU, which had to be restarted mid-run. Two batteries in parallel fixed it.</li>
<li><strong>Tighter was worse.</strong> An earlier, tighter ball compression produced more spread and less consistent speed than the final 0.18 inch. The servo latch existed because the feeder motors could not unjam a ball at that compression.</li>
<li><strong>The bench scale did not match the field.</strong> Beacon readings on the bench peaked around 100–150, while the original detection threshold was 230. Thresholds had to come down to what the hardware actually produced.</li>
<li><strong>Tape sensors are analog devices with a digital output.</strong> They had to sit 3–5 mm off the floor and be potted individually, or white floor and black tape became the same reading.</li>
</ul>

<h2>The same loop, twice</h2>
<p>Both projects came down to the same habit: predict what the physical device will do, build something that tests the prediction, then measure. For the poster that meant deriving the Nyquist limit, the moiré period, and the aliasing radius before drawing anything. For the robot it meant serial CSV dumps, calibration tables, a simulation of the particle filter and motion profiles, and only then the match code.</p>
<p>The honest gap is worth naming. The robot has a full particle filter, an opponent EKF, and A* planning in the repository, but the match code that ran used reactive tape logic and IR peak tracking instead. The general solution was built and simulated; the one that shipped was the one that could be verified on the actual field in the time available. That is not a compromise I would hide. It is the same lesson as the pending test print: the model is only as good as the measurement that confirms it.</p>
<div class="link-row"><a class="text-link" href="/projects">Other projects <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a></div>
</article>`
};
