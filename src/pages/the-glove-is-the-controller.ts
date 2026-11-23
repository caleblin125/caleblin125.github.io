// Blog post: "The glove is the controller." — two instrumented gloves driving
// Slow Roads, plus the calibration gesture and usability harness behind them.
import { postById } from "../data/posts";
import type { Page } from "./types";

const post = postById("the-glove-is-the-controller");

export const theGloveIsTheControllerPage: Page = {
    title: post.title,
    eyebrow: post.eyebrow,
    kind: "post",
    section: "Blog",
    date: post.date,
    description: post.description,
    keywords: post.keywords,
    content: `<article class="article"><p class="kicker">${post.dateDisplay}</p><h1>${post.title}</h1><p class="lede">Two instrumented gloves, a 50 Hz attitude filter, and the calibration that decides which way is forward.</p>
<p>ECE 167 ends with an open project. I built a pair of gloves that drive Slow Roads, a browser driving game: roll your hands to steer, curl an index finger to accelerate or brake, tap a thumb to put the car back on the road. The game is the demo. The actual work is the agreement between the hand and the machine — what the sensors measure, what the filter believes, and what the user thinks they are doing.</p>

<h2>Two gloves, five signals</h2>
<p>Each glove is an STM32 Nucleo with a BNO055 IMU on I2C, two flex sensors on ADC channels, a capacitive touch pad, four buttons, and a small OLED. The firmware runs a 50 Hz loop with a 20 ms period and prints five lines over USART2 at 115200 baud: raw accelerometer counts, flex resistance, capacitive state, filtered Euler angles, and the raw capacitive reading. Python opens one serial port per glove and parses those lines in a background thread.</p>
<p>The flex sensors are a voltage divider against a 47 kΩ pull-up. The firmware converts each ADC reading back to resistance with <code>R = 47k * V / (3.3 - V)</code>, which is the quantity that actually changes when a finger bends. The conversion is not linear in joint angle, and the two gloves do not share endpoints, so every threshold in the controller is empirical.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Signal</th><th>Source</th><th>Used for</th></tr></thead>
<tbody>
<tr><td>Accel x, y, z</td><td>BNO055 raw counts</td><td>Steering on Z, 3D hand view</td></tr>
<tr><td>Gyro x, y, z</td><td>BNO055 raw counts</td><td>Attitude prediction</td></tr>
<tr><td>Mag x, y, z</td><td>BNO055, calibrated</td><td>Yaw correction</td></tr>
<tr><td>Index flex</td><td>ADC through the 47 kΩ divider</td><td>Throttle and brake</td></tr>
<tr><td>Middle flex</td><td>ADC through the 47 kΩ divider</td><td>Autodrive and boost</td></tr>
<tr><td>Capacitive touch</td><td>CAPTOUCH pad</td><td>Reset, camera, calibration gesture</td></tr>
<tr><td>Button 4</td><td>Nucleo user button</td><td>Capture a new inertial reference</td></tr>
</tbody>
</table></div>
<p>One failure mode is worth calling out. If the BNO055 returns all zeros, the firmware treats it as a disconnected sensor, prints an error, draws the problem on the OLED, and re-initializes the IMU. A missing sensor is a state, not a zero.</p>

<h2>The filter runs on the glove</h2>
<p>Orientation is computed on the STM32, not in Python. That keeps the serial link simple: the host receives yaw, pitch, and roll that are already solved, and the control loop does not depend on when a laptop gets around to reading a line.</p>
<p>The filter is a Mahony-style complementary filter on a direction cosine matrix. The gyro predicts the rotation; the accelerometer and magnetometer correct it. Each correction is a cross product between the measured vector and the same vector rotated into the body frame by the current estimate. The cross product is zero when they agree, and its direction is the axis to rotate about when they do not.</p>
<p>Four gains set the balance: 10.0 and 0.2 for the accelerometer proportional and integral terms, 5.0 and 0.1 for the magnetometer. The integral terms estimate gyro bias, so a stationary glove does not slowly drift. The rotation update uses the matrix exponential of the angular-rate skew matrix, with a Taylor series for small angles. At 20 ms per step, that is cheap enough to run on the Nucleo without drama.</p>
<p>The raw vectors are not used directly. A previous lab produced spherical calibration matrices for the accelerometer and magnetometer, plus a rotation that aligns the magnetometer frame to the accelerometer frame. Those matrices are compiled into the firmware. Without them, the filter would chase a tilted gravity vector and a distorted magnetic field.</p>
<p>Button 4 is the escape hatch. It blocks the main loop for ten seconds while it averages the accelerometer and magnetometer, then adopts that average as the new inertial reference and zeroes the bias estimate. That defines the current pose as level without re-running the full calibration. The tradeoff is real: there is no state machine keeping the game alive during those ten seconds, so the controller simply stops. The firmware also ships with compiled-in default reference vectors, so the filter can run before button 4 is ever pressed.</p>

<h2>The calibration is a gesture</h2>
<p>The harder problem is that a hand is not a steering wheel. The glove can report its orientation in a fixed world frame, but "steer right" depends on how the user is holding their hand. A glove that is comfortable with the palm down is not the same as one held like a bike grip.</p>
<p>The fix is a calibration gesture. The user holds the capacitive pad and twists their wrist left and right for a few seconds. The Python reader compares each orientation with the one from ten samples earlier, computes the rotation axis of that short arc, and averages the axes. When calibration ends, it builds a rotation that carries +X onto the average axis, then stores the transpose, which carries the average axis onto +X. That matrix is <code>straighten</code>. Every incoming DCM is multiplied by it before it becomes Euler angles.</p>
<p>The effect is that the wrist twist becomes the X axis in the driver's frame, regardless of how the hand is posed. The 3D hand on screen then rotates the way the user expects, and the same gesture means the same thing each time the gloves are calibrated.</p>
<p>Two details make it work. The axis is normalized per sample, so a fast twist does not outvote a slow one. And the sign of each new axis is flipped if it disagrees with the running sum, so back-and-forth twisting reinforces one direction instead of cancelling to zero.</p>

<h2>From orientation to the game</h2>
<p>Slow Roads does not expose a controller API. It is a browser game with a keyboard and a pointer, and the Python side has to speak both.</p>
<p>The Python controller samples both gloves at 50 Hz, computes four controls, and puts them on a queue. A Selenium thread drives Firefox: it opens slowroads.io, clicks through the splash screen, waits for the loader to disappear, opens the settings panel, flips the pointer-steering option, and closes it again. From then on, steering is a mouse position. Each frame, the script moves the pointer along the game's steering slider by an offset proportional to right minus left. That channel is genuinely analog, because the game reads the pointer's position rather than a key state.</p>
<p>Throttle and brake are not. Those are keyboard channels, and the only way to send a partial value is to turn it into a duty cycle. A small PWM helper decides, on every frame, whether the up or down arrow should currently be held. The PWM frequency is 10 Hz, so each key has a 100 ms period and the duty cycle is the fraction of that period it is held.</p>
<p>At 10% duty the game sees a 10 ms press every 100 ms; at 80% it sees an 80 ms press. The game integrates over its own frames, so the car gets something that behaves like partial throttle even though the interface is binary. Ten hertz is a compromise: fast enough that the car does not lurch, slow enough that the browser is not flooded with synthetic key events.</p>
<p>The mapping is deliberately small:</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Input</th><th>Action</th><th>Range</th></tr></thead>
<tbody>
<tr><td>Right index flex</td><td>Accelerate (Up arrow)</td><td>−30,000 to −17,000</td></tr>
<tr><td>Left index flex</td><td>Brake (Down arrow)</td><td>−65,000 to −25,000</td></tr>
<tr><td>Both gloves' accel Z, differential</td><td>Steer (pointer position)</td><td>350 to 800 counts</td></tr>
<tr><td>Right middle flex past 70%</td><td>Autodrive (F)</td><td>Binary</td></tr>
<tr><td>Left middle flex past 70%</td><td>Boost (Shift)</td><td>Binary</td></tr>
<tr><td>Right capacitive touch</td><td>Return to road (R)</td><td>Binary</td></tr>
<tr><td>Left capacitive touch</td><td>Camera (C)</td><td>Binary</td></tr>
</tbody>
</table></div>
<p>Each analog channel goes through the same <code>getControl</code> function: below a threshold it returns zero, above a saturation point it returns one, and in between it returns a linear ramp. The thresholds are not universal. The right and left index fingers use different endpoints because the gloves' flex resistors differ by roughly a factor of two. The steering deadzone is 350 raw accelerometer counts and saturation is 800. Those numbers came from watching the monitor and moving a hand, not from a datasheet.</p>
<p>Steering is a differential measurement. The two gloves' Z readings enter with opposite signs, so the controller sees a signed sum rather than two separate tilts. A wrist roll that raises one glove's Z and lowers the other produces a clean left or right value. That is the same reason a steering wheel uses two hands: the pair gives a direction, not just a magnitude.</p>

<h2>Making the hand visible</h2>
<p>Two Tk windows run beside the game. The monitor shows every field the controller sees and has a button that starts and stops the calibration gesture. The overlay draws two glove outlines, fills each finger according to flex, marks the capacitive pad, and shows a 3D hand.</p>
<p>The 3D view is a separate render thread. The main loop writes the latest glove data into a shared dictionary; the render thread only reads it. That separation matters because the renderer is the slowest part of the stack. If it blocked on serial reads, the controller would stutter; if serial reads blocked on rendering, the game would lag.</p>
<p>The hand model can be a rigged glTF asset or a procedural fallback. Euler angles drive the wrist; one flex value per finger drives the proximal, middle, and distal joints. Forward kinematics applies the parent rotation first, then the child, and skinning moves the mesh. The result is not a medically accurate hand, but it is accurate enough to answer the only question that matters during calibration: does the hand on screen do what my hand is doing?</p>

<h2>Measuring whether it is usable</h2>
<p>Once the controller ran, the next question was whether it was any good. "It feels okay" is not a measurement. I recorded 50 seconds of normal use to a CSV at 50 Hz: four flex channels, six Euler channels, and two raw capacitive channels.</p>
<figure class="article-figure"><img src="/blog/glove-static-dynamic.png" alt="Four stacked time-series plots showing a motion score, Euler angles for both gloves, and flex counts over fifty seconds, with static and dynamic regions shaded." loading="lazy"><figcaption>Fifty seconds of two-glove data, segmented per column into static and dynamic stretches. The top trace is the summed rolling standard deviation; Euler angles sit in the middle, flex counts at the bottom.</figcaption></figure>
<p>The analysis script segments each column into static and dynamic stretches. It computes a rolling standard deviation over 15 samples, takes the 40th percentile as a threshold, and labels everything below it static. Each column gets its own segmentation, because the flex sensors and the IMUs do not move at the same times. The combined motion signal breaks into 39 static and 40 dynamic regions; the per-column labels leave 708 static and 1,650 dynamic samples in a typical column.</p>
<p>Three quantities come out of that:</p>
<ul class="article-list">
<li><strong>Static variance</strong> — how much a signal moves when the hand is supposed to be still. Lower is better. The first glove's z axis had a mean static variance of 0.784 square degrees, while its y axis was 0.181; the second glove's z axis was 0.333. The noise is axis-dependent, not just glove-dependent.</li>
<li><strong>Dynamic range</strong> — the span between the minimum and maximum during motion. The first glove's index flex spanned about 40,100 counts; the second glove's index flex spanned about 64,100. That matches the different resistor endpoints.</li>
<li><strong>Smoothness</strong> — mean absolute jerk, the second derivative of the signal, over dynamic regions, converted to a 0-to-1 score with <code>1 / (1 + jerk)</code>. Higher is smoother. There is also a consistency score from the standard deviation of the first difference.</li>
</ul>
<figure class="article-figure"><img src="/blog/glove-usability-summary.png" alt="Bar chart of glove usability summary with stability scores for the two IMUs and normalized range scores for the two flex channels; smoothness bars are barely visible." loading="lazy"><figcaption>The harness summary. Stability comes from static variance, range is normalized to the widest flex channel, and smoothness is <code>1 / (1 + mean jerk)</code>. The smoothness bars are nearly invisible because jerk is still in raw units.</figcaption></figure>
<p>Some of the numbers are more useful than others. The static variance for flex is in raw counts squared, so it is only comparable within the same channel. The Euler dynamic range is not usable: several axes report nearly 360 degrees because the angle wraps at plus or minus 180, and the min-max span across regions counts the wrap as motion. And the smoothness score is computed in raw units, so jerk is on the order of a million for flex and a few thousand for Euler. In the summary chart, the pink smoothness bars are effectively zero. That is a units bug, not a statement about the gloves.</p>
<p>The summary chart is still worth showing because it makes the shape of the problem visible. Stability is only meaningful for the IMUs, range is only meaningful for the flex channels, and smoothness is not yet comparable across either. A metric that cannot compare two signals is not a metric yet.</p>
<p>None of this is a user study. It is one 50-second recording from one person, segmented by a percentile rule that labels roughly the lowest 40% of every column static whether or not the hand ever rested. The thresholds were chosen by looking at the data. The next version needs held-out gestures, several users, wrap-aware angle differences, and a task-level measure such as lap time or number of off-road excursions. Signal statistics are a proxy; the game is the actual test.</p>

<h2>What I would change</h2>
<p>Three things, in order:</p>
<ul class="article-list">
<li><strong>Use the filtered, calibrated orientation for steering.</strong> The current game loop reads raw accelerometer Z, which is simple and drift-free but ignores the <code>straighten</code> transform. The filter and the calibration gesture are doing real work for the 3D view; they should also be doing it for the car.</li>
<li><strong>Calibrate the flex endpoints automatically.</strong> A short squeeze-and-release at startup would replace the two hand-tuned ranges and make the gloves interchangeable.</li>
<li><strong>Normalize the metrics before trusting them.</strong> Divide jerk by the signal's dynamic range and by the sample rate, unwrap angles before taking differences, and report per-channel scores instead of a single bar chart with incompatible units.</li>
</ul>
<p>The project runs end to end: two gloves, one browser, a car that steers when you roll your wrists. The part I keep thinking about is not the game. It is how much of the work went into agreeing on a frame. Forward is not a property of the glove. It is a property of the calibration, the filter, and the person wearing it, and all three have to be measured before the controller feels obvious.</p>
<div class="link-row"><a class="text-link" href="/projects">Other projects <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a></div>
</article>`
};
