// Blog post: "A game with no framebuffer." — the CSE 100 VGA endless runner,
// its comparator renderer, and the Python pipeline that turns a GIF into Verilog.
import type { Page } from "./types";

export const aGameWithNoFramebufferPage: Page = {
    title: "A game with no framebuffer.",
    eyebrow: "Engineering notes / 05",
    content: `<article class="article"><p class="kicker">2026 / 11 / 22</p><h1>A game with no framebuffer.</h1><p class="lede">An endless runner in Verilog, drawn one pixel at a time by the same counters that steer the beam.</p>
<p>Lab 6 of CSE 100 was an endless runner on a Basys 3. Press button C and the world starts moving right to left: a yellow box jumps, a blue ball hangs in the air, and a hole opens in the ground. There is no processor in the design, no operating system, and no frame buffer. The image exists for one pixel clock at a time. The color of each pixel is computed by comparators at the moment the monitor asks for it.</p>
<p>That constraint is the whole project. A game usually keeps a world in memory and paints it onto a screen. Here the world is a set of counters, and the screen is a timing contract. The player is a rectangle at a fixed place; everything else moves past it. The sprite is pixel art converted by a Python script into a tree of multiplexers. The result uses no block RAM at all, and the picture is not stored anywhere.</p>

<h2>The beam is the clock</h2>
<p>VGA has no notion of a frame you can write. It has a beam that sweeps left to right and top to bottom, and it expects a color value at every pixel time. The design counts along with it: one counter for x, one for y, both reset at the end of the line and the end of the frame.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Segment</th><th>Horizontal (pixels)</th><th>Vertical (lines)</th></tr></thead>
<tbody>
<tr><td>Visible</td><td>640</td><td>480</td></tr>
<tr><td>Front porch</td><td>15</td><td>9</td></tr>
<tr><td>Sync pulse</td><td>96</td><td>2</td></tr>
<tr><td>Back porch</td><td>49</td><td>34</td></tr>
<tr><td>Total</td><td>800</td><td>525</td></tr>
</tbody>
</table></div>
<p>The pixel clock is 25.0 MHz, made from the board's 100 MHz oscillator with a 9.125 / 36.5 ratio. One frame is 800 × 525 = 420,000 pixel clocks, which is 16.8 ms, or 59.52 Hz. The <code>newFrame</code> pulse fires on the last pixel of the last line and gives every moving object exactly one update per frame.</p>
<p>Nothing in the video path reads a memory. Drawing is a comparison: a rectangle is a color where x is inside a span and y is inside a span, and zero everywhere else.</p>
<div class="code-block"><pre>wire shouldDraw = (px &gt;= x1) &amp;&amp; (px &lt; x2)
               &amp;&amp; (py &gt;= y1) &amp;&amp; (py &lt; y2);
assign rgb_o = {12{shouldDraw}} &amp; rgb;</pre></div>
<p>The player, the charge bar, the ball, the two gray layers of the ground, and the four magenta border strips all use that module. Composition is a second trick. The background is painted only where no object produced a nonzero color, which makes zero transparent without an alpha channel.</p>
<div class="code-block"><pre>assign O = A | ({12{~|A}} &amp; B);</pre></div>
<p>That line is the entire compositor. Color zero is the key; anything else wins. It also explains the limits: black cannot be drawn, and two game objects that overlap are bitwise-ORed rather than stacked in a defined order.</p>
<figure class="article-figure"><img src="/blog/vga-final-frame.png" alt="A 640 by 480 simulation frame with a magenta border, vertical blue, cyan, and green bands across the sky, a gray ground, a small yellow square at lower left, and a tiny green slug near the top left." loading="lazy"><figcaption>The final build, rendered by the testbench: magenta border, arithmetic background, gray ground, yellow player, and the 40 × 40 slug at (40, 40). This is a simulation frame written as a BMP, not a capture from the board.</figcaption></figure>

<h2>The world moves, the player does not</h2>
<p>A runner needs motion, and motion is cheaper if the camera is the player. The player's x span is fixed at 100 to 116. Its y position is 300 minus a jump counter, so the 16 × 16 rectangle sits on the ground at y 300 and rises as the counter rises. The hole, the ball, and the background move instead.</p>
<div class="table-wrap"><table class="spec-table wrap">
<thead><tr><th>Object</th><th>Geometry and motion</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Player</td><td>16 × 16 at x 100–116; y = 300 − pos</td><td>Yellow; flashes while dying</td></tr>
<tr><td>Hole</td><td>41–71 px gap, odd widths; 1 px per frame left</td><td>Two gray layers; freezes on death</td></tr>
<tr><td>Ball</td><td>8 × 8; 4 px per frame left</td><td>Blue; 180-frame hold after a grab</td></tr>
<tr><td>Charge bar</td><td>16 px wide, up to 64 px tall; fills 1 px per frame</td><td>Green; x 32–48, rising from y 96</td></tr>
<tr><td>Background</td><td>640 × 480; shifts 1 px per frame</td><td>Color = x + frameCount</td></tr>
</tbody>
</table></div>
<p>The hole is not a sprite. It is the gap between two pairs of gray rectangles: one pair from x 0 to the trailing edge, one pair from the leading edge to x 640. The leading edge moves left one pixel per frame. The width is 41 plus an even value from 0 to 30, so the gap is always an odd number of pixels between 41 and 71. Death is a coverage test, not a point test: the leading edge has to pass x 116 while the trailing edge is still before x 100, which means the player's entire width is over the gap. Switch 15 disables that test, which is the cheat mode.</p>
<p>The ball moves four pixels per frame, about 238 px/s. Its height is 192 plus six random bits with one bit forced low, giving 192 to 251. When the player's box overlaps it, the ball stops, turns white, and blinks while a counter runs to 180 frames — about 3.02 seconds. At the end of the hold, the point is added and the ball resets to x 640 with a new height.</p>
<p>The charge bar is the part I like most because it is not a bar in the usual sense. Holding up does not set a velocity. It increments a counter, one count per frame, up to 64. Releasing the button enters the jump state, and that same counter now drains at one count per frame while the player rises two pixels per frame. When it reaches zero, the player falls two pixels per frame until the position counter returns to zero. A full charge is 64 frames, about 1.08 s, and buys a 128-pixel apex and a 128-frame flight, about 2.15 s. The charge is both the budget and the duration.</p>
<p>Death is another state, not a subtraction. The player enters a falling state and drops 156 pixels over 78 frames, the hole pauses, the charge bar blanks, and the player flashes. The lives counter shifts right on the edge that enters that state. Pressing down while dead resets the game only if the lowest life bit is still set.</p>

<h2>The rules are counters</h2>
<p>Both entities with behavior are small finite state machines built from two or three flip-flops. The player has ground, jump, and falling states. The ball has flying and grabbed states. Everything else is a register with a load or an enable: position, height, width, charge, score, lives.</p>
<p>Randomness comes from an 8-bit LFSR that runs continuously. The hole samples five bits when it resets; the ball samples six bits when it resets. There is no seed input and no attempt to make the sequence reproducible across runs, which is fine for a game and awkward for a test. The LFSR is also free-running relative to the frame, so the values depend on when a reset happens, not just on how many frames have elapsed.</p>
<p>The score is an 8-bit counter displayed on the seven-segment digits. Lives are a 16-bit register shown on the LEDs, loaded from the switches before the game starts and shifted right on each death. The start signal is a latch: button C sets it once and nothing in the design clears it. That is enough for a lab demo, but it means there is no game-over state and no software restart. Once the last life is gone, pressing down does nothing, and the only way back is to reset the board.</p>

<h2>A sprite generated by Python</h2>
<p>The animated slug started as pixel art. A Python script turns a GIF, or a folder of PNG frames, into Verilog modules that answer one question: given a pixel coordinate inside the image, what color is there?</p>
<p>The pipeline is straightforward. Load the frames and resize them so the longest side is the requested size. Quantize each color channel to four bits, which leaves 16 levels per channel and 4,096 possible colors. Collect the unique colors across every frame. For the slug that is 131 colors, so an index needs eight bits. Then write one module per frame, plus the multiplexer modules those frames share.</p>
<div class="code-block"><pre># mux generator
def writeMux(bus, sel, folder):
    n = 2**sel
    name = f"mux{n}_{bus}bit"

# per-frame pixel loop
for x in range(size[0]):
    col = load[x, y]
    enc = colMap[col]
    inputs.append(f".in{x}({encLen}'b{enc})")</pre></div>
<p>Each frame module contains one 64-way, 8-bit multiplexer per row, selected by x. A second multiplexer selects the row by y, producing an 8-bit palette index. A third multiplexer turns that index into a 12-bit RGB value. The generated code is a wall of binary literals, but the structure is just three levels of selection.</p>
<div class="code-block"><pre>wire [7:0] row0;
mux64_8bit xmux0 (.in0(8'b00111100), ... , .sel(x), .o(row0));
wire [7:0] enc;
mux64_8bit ymux (..., .sel(y), .o(enc));
mux256_12bit encMux (.in0(12'hbc7), ... , .sel(enc), .o(rgb));</pre></div>
<figure class="article-figure"><img src="/blog/vga-slug-sheet.png" alt="A contact sheet of twenty 40 by 40 pixel-art frames of a green slug, rotating through different orientations, arranged in five columns and four rows." loading="lazy"><figcaption>All 20 frames of the 40 × 40 slug, scaled 3× with nearest-neighbor sampling. The palette has 131 colors, stored as 8-bit indices; the converter emits 26 Verilog files totaling 806,406 bytes.</figcaption></figure>
<p>The numbers are the interesting part. The source is 40 × 40 × 20 = 32,000 pixels, or 32 kB of 8-bit indices before the palette. The generated Verilog is 806 kB of text because every pixel index is written as a binary literal and the 131-entry palette multiplexer is repeated inside each frame module. In the placed design, the whole game uses 5,510 slice LUTs — 26.49% of the 20,800 available — with zero block RAM and zero DSP slices. The sprite lives in logic, not memory.</p>
<p>Timing is not the problem. At the 40 ns constraint, the worst setup slack is +17.621 ns, so the longest path uses about 22.4 ns and the design could close at roughly 44 MHz by subtraction. It runs at 25 MHz. Area is the cost, not speed.</p>
<p>There are two honest flaws. First, the checked-in <code>slug.v</code> advances every two <code>newFrame</code> pulses, so the 20-frame cycle takes about 0.67 s. The GIF says 200 ms per frame, which is a 4 s cycle, and the generator's own formula would count about twelve frame pulses per sprite frame. The module in the design is not what the generator would emit today. Second, the converter never carries alpha into Verilog. In this GIF the transparent pixels are black, so they become palette entry zero, and black is exactly the compositor's transparent key. The trick works for this sprite, but it is a coincidence of the palette rather than a real transparency channel.</p>
<p>The slug is also decoration, not the player. It sits at (40, 40) in the corner; the player stayed a yellow rectangle. The sprite was the test case for the pipeline, and putting it on screen proved that the generated modules elaborated, fit, and produced the right colors at the right coordinates.</p>

<h2>A picture is a test</h2>
<p>The course testbench drives the design for a fixed number of frames and writes each visible frame to a 24-bit BMP, 640 × 480, with the rows stored bottom-up. It also watches the sync signals and the RGB blanking, incrementing <code>SERRORS</code> or <code>RGBERRORS</code> when a timing check fails. The testbench is set to three frames; the final run took 8,206,999 ms of simulation CPU time — about 2.3 hours — for a few hundredths of a second of game time.</p>
<p>One bookkeeping note matters here. The final run wrote <code>frame_0.bmp</code> and <code>frame_1.bmp</code>; the <code>frame_2.bmp</code> in the same folder predates it and belongs to an earlier design. I am not treating that third file as part of the final run. The frame at the top of this post is <code>frame_1</code>.</p>
<p>What the frame proves is narrow but real. The counters produced the right visible region, the border landed on the right pixels, the background arithmetic produced the expected bands, the sprite mux returned the expected colors, and the player landed at the ground line. What it does not prove is the game. At frame 1 the hole and the ball have not entered the visible playfield, no button has been pressed, no collision has happened, and the sprite has had only one frame in which to advance. A single BMP is a snapshot of the renderer, not a test of the rules.</p>
<figure class="article-figure"><img src="/blog/vga-hole-early.png" alt="An earlier 640 by 480 simulation frame with a black sky, a gray ground, a black gap in the ground, and a small yellow player to the left of the gap." loading="lazy"><figcaption>An earlier simulation run, before the border and the arithmetic background. The hole is the black gap in the gray ground; the yellow player sits ahead of it. This is a different build and a different run from the frame above, not the final design.</figcaption></figure>
<p>The simulation is also not the hardware. It checks the logic against the timing model, not the monitor against the cable. The board adds its own questions: whether the clock wizard locks, whether the sync polarity matches the display, and whether the colors look the same on a real panel. The BMP is the cheap test; the monitor is the real one.</p>

<h2>What I would change</h2>
<p>The project works, but it is a prototype in ways that are visible in the source.</p>
<ul class="article-list">
<li><strong>Put the sprite in block RAM.</strong> The 32 kB of indices fit easily inside the 1.8 Mb of block RAM on the Artix-7, and a proper ROM would replace 806 kB of generated Verilog with a memory and a small palette. The current design uses 26.49% of the device's LUTs, and all of that is combinational logic rather than memory.</li>
<li><strong>Make the timing part of the conversion.</strong> The generator should emit the frame divider from the GIF's duration and the design should use that value directly. Hand-editing the divider to make the animation look right is the kind of change that quietly breaks when the asset changes.</li>
<li><strong>Derive the geometry from the assets.</strong> The player width, the hole edges, and the collision box are repeated literals. One parameter set would make the player 16 × 16 in the renderer, the physics, and the collision test at the same time.</li>
<li><strong>Test the rules separately from the picture.</strong> A state-machine testbench with assertions about charge, jump height, ball hold, and hole coverage would catch more than three BMPs can. The current test says the renderer works at one instant; it says little about whether the game is playable.</li>
<li><strong>Replace the arithmetic background.</strong> The bands are <code>x + frameCount</code>, which is a useful test pattern and a poor level. A tile map or a small palette-indexed background would give the runner a place to be.</li>
<li><strong>Add a game-over state.</strong> The start latch never clears, so the design cannot restart itself. A proper state machine would show the score, wait for a button, and reset the world without resetting the board.</li>
</ul>
<p>The part I keep thinking about is how little of the game is stored. There is no image of the world, only a rule for each pixel and a handful of counters that agree on where the world is. When the counters, the comparators, and the sprite mux line up, a slug appears in the corner and a box jumps over a hole. When they do not, the monitor shows exactly where the agreement failed. That is a good way to learn what a frame is: not a thing you draw, but a contract you keep 59.5 times a second.</p>
<div class="link-row"><a class="text-link" href="/projects/fpga">FPGA work <span>↗</span></a><a class="text-link" href="/projects">Other projects <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a></div>
</article>`
};
