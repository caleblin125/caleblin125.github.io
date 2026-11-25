// Blog post: "A robot on a field with no map" — the ECE 118 mecanum robot,
// its beacon receiver, and the ten-millisecond match loop.
import { postById } from "../data/posts";
import type { Page } from "./types";

const post = postById("a-robot-on-a-field-with-no-map");

export const aRobotOnAFieldWithNoMapPage: Page = {
    title: post.title,
    eyebrow: post.eyebrow,
    kind: "post",
    section: "Blog",
    date: post.date,
    description: post.description,
    keywords: post.keywords,
    content: `<article class="article"><p class="kicker">${post.dateDisplay}</p><h1>${post.title}</h1><p class="lede">An autonomous mecanum robot that had to find a goal on a field it could barely see.</p>
<p>The ECE 118 final was a different kind of limit. Team 28 — Will Langton, Preet Karia, and me — built <em>Sluggers of the Lost Goal</em>: an 11-inch mecanum cube with a double flywheel shooter and room for about fifty balls. The field is 84 × 36 inches inside two-inch border tape, with a 56-inch center spine, three cross tapes, a start zone with no tape at all, and a shooting goal at a coordinate rather than a marking. Three of four lanes hold walls that emit 1.5 kHz and 2.5 kHz infrared; the opponent carries a 2.0 kHz beacon somewhere on the far half.</p>
<figure class="article-figure"><img src="/blog/sluggers-cad.png" alt="CAD render of the mecanum robot with its double flywheel shooter, storage box, and electronics layers." loading="lazy"><figcaption>The CAD model: mecanum base, two-layer electronics deck, angled double-flywheel shooter, and ball storage.</figcaption></figure>

<h2>Tape, not odometry</h2>
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

<h2>The gap between built and shipped</h2>
<p>The robot has a full particle filter, an opponent EKF, and A* planning in the repository, but the match code that ran used reactive tape logic and IR peak tracking instead. The general solution was built and simulated; the one that shipped was the one that could be verified on the actual field in the time available. The lesson is the same as in any physical build: a model is only as good as the measurement that confirms it, and the estimator never got its measurement on the real mat.</p>
<div class="link-row"><a class="text-link" href="/projects">Other projects <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a></div>
</article>`
};
