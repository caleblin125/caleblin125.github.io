// Blog post: "A game with no framebuffer." — the CSE 100 VGA endless runner,
// its comparator renderer, and the Python pipeline that turns a GIF into Verilog.
import type { Page } from "./types";

export const aGameWithNoFramebufferPage: Page = {
    title: "A game with no framebuffer.",
    eyebrow: "Engineering notes / 05",
    content: `<article class="article"><p class="kicker">2026 / 11 / 22</p><h1>A game with no framebuffer.</h1><p class="lede">An endless runner in Verilog, drawn one pixel at a time by the counters that steer the beam.</p>
<p>Lab 6 of CSE 100 put an endless runner on a Basys 3. Button C starts the world moving right to left; a yellow box jumps, a blue ball waits, a hole opens in the ground. No processor, no operating system, no frame buffer. Each pixel exists for one clock. Comparators compute its color when the monitor asks.</p>
<p>The constraint is the design. A game normally stores a world and paints it; here the world is counters and the screen is a timing contract. The player is a rectangle at a fixed x; the world moves past it. The sprite is pixel art turned into a multiplexer tree by Python. No block RAM, no stored picture.</p>

<h2>The beam is the clock</h2>
<p>VGA has no writable frame. A beam sweeps left to right, top to bottom, demanding a color at every pixel. Two counters track it; x resets at the line end, y at the frame end.</p>
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
<p>The pixel clock is 25.0 MHz, derived from the board's 100 MHz oscillator by 9.125 / 36.5. A frame is 800 × 525 = 420,000 clocks: 16.8 ms, 59.52 Hz. <code>newFrame</code> fires on the last pixel of the last line and advances every moving object once.</p>
<p>The video path reads no memory. A rectangle is a comparison: color where x and y fall inside two spans, zero elsewhere.</p>
<div class="code-block"><pre>wire shouldDraw = (px &gt;= x1) &amp;&amp; (px &lt; x2)
               &amp;&amp; (py &gt;= y1) &amp;&amp; (py &lt; y2);
assign rgb_o = {12{shouldDraw}} &amp; rgb;</pre></div>
<p>One module draws everything: player, charge bar, ball, both ground layers, four border strips. Composition is the second trick. The background fills only where no object produced color, so zero is transparent without alpha.</p>
<div class="code-block"><pre>assign O = A | ({12{~|A}} &amp; B);</pre></div>
<p>One line is the compositor. Zero is the key; any other color wins. Hence the limits: black cannot be drawn, and overlapping game objects OR their bits instead of stacking in order.</p>
<figure class="article-figure"><img src="/blog/vga-final-frame.png" alt="A 640 by 480 simulation frame with a magenta border, vertical blue, cyan, and green bands across the sky, a gray ground, a small yellow square at lower left, and a tiny green slug near the top left." loading="lazy"><figcaption>Final build, testbench-rendered: magenta border, arithmetic background, gray ground, yellow player, 40 × 40 slug at (40, 40). A simulation BMP, not a board capture.</figcaption></figure>

<h2>The world moves, the player does not</h2>
<p>A runner needs motion; fixing the camera to the player makes it cheap. The player occupies x 100–116 and y = 300 − pos, so the 16 × 16 rectangle rests at y 300 and rises with the counter. The hole, ball, and background move instead.</p>
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
<p>The hole is a gap between two pairs of gray rectangles: ground from x 0 to the gap's left edge, and from its right edge to x 640. It moves left one pixel per frame. Width is 41 plus an even 0–30, so the gap is odd, 41–71 px. Death tests coverage, not a point: the gap must span the player, right edge at or past x 116, left edge before x 100. Switch 15 disables the test.</p>
<p>The ball moves 4 px per frame, 238 px/s. Height is 192 plus six random bits with one forced low: 192–251. On overlap it stops and flashes white for 180 frames — 3.02 s — then scores and respawns at x 640, a new height.</p>
<p>The charge bar is not a bar. Holding up increments a counter, one per frame, to 64; releasing enters the jump, and the same counter drains one per frame while the player rises 2 px per frame. At zero, the player falls 2 px per frame until the position counter reaches zero. Full charge: 64 frames to fill, 1.08 s; 128 px up, 128 px down, 2.15 s in the air. Charge is both budget and duration.</p>
<p>Death is a state. The player drops 156 px over 78 frames; the hole pauses, the charge bar blanks, the player flashes. The lives register shifts right on entry. Down resets during death, if the lowest life bit is set.</p>

<h2>The rules are counters</h2>
<p>Only two entities have behavior, each a state machine of two or three flip-flops: the player (ground, jump, falling) and the ball (flying, grabbed). Everything else is a register with a load or enable — position, height, width, charge, score, lives.</p>
<p>An 8-bit LFSR runs free, seeded only by the board reset. The hole samples five bits when it reloads, the ball six when it respawns; the value is whatever the LFSR holds at that moment. Fine for a game, awkward for a test: no level can be requested.</p>
<p>Score is an 8-bit counter on the seven-segment digits. Lives are a 16-bit register on the LEDs, loaded from switches before start and shifted right on each death. Start is a latch: button C sets it, only a board reset clears it. No game-over state, no software restart; at zero lives, down does nothing.</p>

<h2>A sprite generated by Python</h2>
<p>The slug began as pixel art. A Python script turns a GIF or a folder of PNGs into Verilog modules answering one question: at this pixel coordinate, what color?</p>
<p>The pipeline: load and resize frames to the requested longest side; quantize each channel to four bits, 16 levels, 4,096 colors; collect unique colors across all frames. The slug uses 131, so an index needs eight bits. Then write one module per frame plus shared multiplexers.</p>
<div class="code-block"><pre># mux generator
def writeMux(bus, sel, folder):
    n = 2**sel
    name = f"mux{n}_{bus}bit"

# per-frame pixel loop
for x in range(size[0]):
    col = load[x, y]
    enc = colMap[col]
    inputs.append(f".in{x}({encLen}'b{enc})")</pre></div>
<p>Each frame module has one 64-way, 8-bit multiplexer per row, selected by x; a second selects the row by y, yielding an 8-bit palette index; a third maps that index to 12-bit RGB. A wall of binary literals, three levels of selection.</p>
<div class="code-block"><pre>wire [7:0] row0;
mux64_8bit xmux0 (.in0(8'b00111100), ... , .sel(x), .o(row0));
wire [7:0] enc;
mux64_8bit ymux (..., .sel(y), .o(enc));
mux256_12bit encMux (.in0(12'hbc7), ... , .sel(enc), .o(rgb));</pre></div>
<figure class="article-figure"><img src="/blog/vga-slug-sheet.png" alt="A contact sheet of twenty 40 by 40 pixel-art frames of a green slug, rotating through different orientations, arranged in five columns and four rows." loading="lazy"><figcaption>All 20 frames, 40 × 40, scaled 3× nearest-neighbor. 131 colors, 8-bit indices; 26 Verilog files, 806,406 bytes.</figcaption></figure>
<p>Source: 40 × 40 × 20 = 32,000 pixels, 32 kB of 8-bit indices before palette. Generated Verilog: 806 kB, because every index is a binary literal and the 131-entry palette mux repeats in each frame module. Placed design: 5,510 slice LUTs, 26.49% of 20,800; zero block RAM, zero DSP. The sprite lives in logic.</p>
<p>Timing is not the constraint. At 40 ns, worst setup slack is +17.621 ns: longest path 22.4 ns, about 44 MHz; it runs at 25. Area is the cost.</p>
<p>Two flaws. The checked-in <code>slug.v</code> advances every two <code>newFrame</code> pulses: 0.67 s for 20 frames. The GIF specifies 200 ms per frame, 4 s, and the generator's formula would count about twelve pulses per sprite frame; the module does not match the generator's own formula. Second, alpha never reaches Verilog. In this GIF transparent pixels are black, palette entry zero, and black is the compositor's key. It works by palette coincidence, not a transparency channel.</p>
<p>The slug is decoration, not the player: parked at (40, 40); the player stayed a yellow rectangle. It was the pipeline's test case. On screen, it proved the generated modules elaborated, fit, and colored the right pixels.</p>

<h2>A picture is a test</h2>
<p>The testbench runs a fixed frame count and writes each visible frame to a 24-bit, 640 × 480 BMP, rows bottom-up. It compares both sync signals against expected timing and checks that RGB stays dark outside the visible region, incrementing <code>SERRORS</code> or <code>RGBERRORS</code> on a mismatch. Three frames; 8,206,999 ms of CPU — 2.3 hours — for a few hundredths of a second of game time.</p>
<p>Bookkeeping: the final run wrote <code>frame_0.bmp</code> and <code>frame_1.bmp</code>. <code>frame_2.bmp</code> predates it, belongs to an earlier design, and is not part of this run. The frame above is <code>frame_1</code>.</p>
<p>The frame proves the renderer: correct visible region, border pixels, background bands, sprite colors, player ground line. It does not prove the game. At frame 1 the hole and ball have not entered the playfield, no button has fired, no collision has occurred, and the sprite has advanced at most one frame. A BMP is the renderer at an instant, not a test of rules.</p>
<figure class="article-figure"><img src="/blog/vga-hole-early.png" alt="An earlier 640 by 480 simulation frame with a black sky, a gray ground, a black gap in the ground, and a small yellow player to the left of the gap." loading="lazy"><figcaption>Earlier run, before the border and arithmetic background. The hole is the black gap; the player sits ahead of it. A different build and run, not the final design.</figcaption></figure>
<p>Simulation is not hardware. It checks logic against a timing model, not the monitor against a cable. The board adds its own questions: clock lock, sync polarity, color on a real panel. The BMP is the cheap test; the monitor is the real one.</p>

<h2>What I would change</h2>
<p>The project works; the source still reads as a prototype.</p>
<ul class="article-list">
<li><strong>Put the sprite in block RAM.</strong> 32 kB of indices fit in the Artix-7's 1.8 Mb; a ROM plus a small palette replaces 806 kB of generated Verilog. The design uses 26.49% of its LUTs, all combinational, no memory.</li>
<li><strong>Make timing part of conversion.</strong> The generator should emit the frame divider from the GIF duration; the design should use it directly. A hand-edited divider quietly breaks when the asset changes.</li>
<li><strong>Derive geometry from assets.</strong> Player width, hole edges, and collision box are repeated literals; one parameter set would keep renderer, physics, and collision at 16 × 16 together.</li>
<li><strong>Test rules apart from the picture.</strong> Assertions on charge, jump height, ball hold, and hole coverage catch more than three BMPs. The current test shows the renderer at one instant; it says little about play.</li>
<li><strong>Replace the arithmetic background.</strong> <code>x + frameCount</code> is a test pattern, not a level. A tile map or palette-indexed background would give the runner a place.</li>
<li><strong>Add game-over.</strong> The start latch never clears, so the design cannot restart itself. A state machine would show the score, wait for a button, reset the world without the board.</li>
</ul>
<p>What stays with me is how little the game stores. No image of the world; a rule per pixel and a handful of counters agreeing on where the world is. When counters, comparators, and sprite mux align, a slug appears in the corner and a box jumps a hole. When they do not, the monitor shows where the agreement failed. A frame is not a thing you draw; it is a contract kept 59.5 times a second.</p>
<div class="link-row"><a class="text-link" href="/projects/fpga">FPGA work <span>↗</span></a><a class="text-link" href="/projects">Other projects <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a></div>
</article>`
};
