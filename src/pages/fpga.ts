// FPGA project page ("/projects/fpga") — Verilog work, from a class-leading
// hardware multiplier to accelerator benchmarking on a Xilinx Alveo U250.
import { projectById } from "../data/projects";
import { githubProfileUrl } from "./constants";
import { projectFooter, projectHeader, resultRow } from "./project-ui";
import type { Page } from "./types";

const project = projectById("fpga");

export const fpgaPage: Page = {
    title: "FPGA and digital hardware.",
    eyebrow: "Project / FPGA",
    kind: "project",
    section: "Projects",
    updated: "2026-11-22",
    description: project.description,
    keywords: project.keywords,
    content: `<article class="article project-article">
${projectHeader(
    project,
    "Project / FPGA",
    "Digital hardware, measured.",
    "Verilog work from a class-leading multiplier to ternary LLM inference on a Xilinx Alveo U250.",
    [
        { label: "GitHub", href: githubProfileUrl },
        { label: "VGA note", href: "/blog/a-game-with-no-framebuffer" }
    ]
)}

<h2 id="overview">Overview</h2>
<p>My hardware work starts with a simple rule: a design is not finished until the synthesis report and the benchmark agree. That habit carried from a course multiplier to accelerator benchmarking in the Hardware Systems Collective.</p>
<p>The work falls into two lanes. In coursework, the constraint was a small FPGA, a fixed board, and a timing contract: build arithmetic and interfaces that fit and run. In the collective, the constraint was larger and less stable: measure an AI workload across an FPGA and a power-limited edge GPU, where the useful result is a comparison rather than a single number.</p>

<h2 id="architecture">Architecture</h2>
<div class="diagram-scroll"><svg class="vector-diagram" viewBox="0 0 960 430" role="img" aria-labelledby="fpga-arch-title fpga-arch-desc">
<title id="fpga-arch-title">FPGA work architecture</title>
<desc id="fpga-arch-desc">Two lanes: course hardware with a multiplier, VGA timing, and audio generator; and accelerator work with an Alveo U250 and Jetson path, both compared through measurement.</desc>
<rect x="1" y="1" width="958" height="428" fill="#2a1e32" stroke="#51425a"/>
<text x="36" y="44" fill="#c59ad8" font-family="monospace" font-size="16" letter-spacing="2">COURSE HARDWARE</text>
<g fill="#1a1320" stroke="#51425a">
<rect x="36" y="70" width="230" height="86"/>
<rect x="306" y="70" width="230" height="86"/>
<rect x="576" y="70" width="230" height="86"/>
</g>
<g fill="#eee8f2" font-family="sans-serif" font-size="20" text-anchor="middle">
<text x="151" y="108">Multiplier</text><text x="421" y="108">VGA timing</text><text x="691" y="108">Audio generator</text>
</g>
<g fill="#9a8da0" font-family="monospace" font-size="14" text-anchor="middle">
<text x="151" y="134">pipeline / area / throughput</text><text x="421" y="134">counters, sync, sprite ROM</text><text x="691" y="134">frequency dividers</text>
</g>
<g stroke="#c59ad8" stroke-width="2" marker-end="url(#fpga-arrow)">
<line x1="266" y1="113" x2="300" y2="113"/><line x1="536" y1="113" x2="570" y2="113"/>
</g>
<text x="36" y="212" fill="#c59ad8" font-family="monospace" font-size="16" letter-spacing="2">ACCELERATOR WORK</text>
<g fill="#1a1320" stroke="#51425a">
<rect x="36" y="238" width="250" height="78"/>
<rect x="346" y="238" width="250" height="78"/>
<rect x="656" y="238" width="268" height="78"/>
</g>
<g fill="#eee8f2" font-family="sans-serif" font-size="18" text-anchor="middle">
<text x="161" y="270">Ternary model</text><text x="471" y="270">Alveo U250</text><text x="790" y="270">Jetson edge GPU</text>
</g>
<g fill="#9a8da0" font-family="monospace" font-size="13" text-anchor="middle">
<text x="161" y="296">ONNX / TensorRT export</text><text x="471" y="296">custom accelerator path</text><text x="790" y="296">CUDA Graphs / Triton</text>
</g>
<g stroke="#c59ad8" stroke-width="2">
<line x1="286" y1="277" x2="340" y2="277"/><line x1="596" y1="277" x2="650" y2="277"/>
</g>
<text x="36" y="376" fill="#b9acbe" font-family="monospace" font-size="15">Both lanes end at the same artifact: a reproducible measurement and the synthesis or runtime report behind it.</text>
<defs><marker id="fpga-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#c59ad8"/></marker></defs>
</svg></div>
<p>The course lane is a conventional RTL pipeline: arithmetic in fabric, display timing generated from counters, and audio produced from divided clocks. The accelerator lane is a toolchain problem as much as a hardware problem. The same model has to survive export, graph capture, kernel replacement, and two very different execution targets.</p>

<h2 id="implementation">Implementation</h2>
<h3>The multiplier</h3>
<p>The first project was a hardware multiplier in Verilog. The goal was throughput, not just correctness, so the design was synthesized with Yosys and compared against the rest of the class. It ended up as the top-performing design in a class of about 100, at roughly 3× the class-average throughput.</p>
<p>That project made the trade-offs concrete: pipeline depth, adder structure, and the cost of widening a datapath all show up in the synthesis result. It also made benchmarking a habit rather than an afterthought.</p>

<h3>Interfaces: VGA and audio</h3>
<p>The same FPGA work extended into interfaces: a VGA display interface and a music generator that produces audio from hardware. Those projects were less about a single metric and more about making a digital design meet a real external timing contract. The VGA game from that lab is written up in <a href="/blog/a-game-with-no-framebuffer">A game with no framebuffer</a>.</p>

<h3>Accelerator work</h3>
<p>In the Hardware Systems Collective, I benchmarked and optimized ternary LLM inference on a Xilinx Alveo U250 FPGA and on NVIDIA Jetson edge GPUs. The work included enabling ONNX/TensorRT export of a matmul-free language model, working around CUDA Graph capture constraints, and patching fused Triton kernels with pure-PyTorch equivalents.</p>
<p>On the FPGA side, the question was how an AI workload maps onto custom accelerator hardware; on the Jetson side, it was how the same model behaves on a power-constrained edge device. The useful output was not a single number but a comparison: CUDA Graphs, ONNX-TensorRT, and baseline execution, each with its own overheads and constraints.</p>

<h2 id="results">Results</h2>
<div class="result-grid">
${resultRow("Multiplier", "3×", "class-average throughput, Yosys comparison")}
${resultRow("Class size", "~100", "designs compared in the course")}
${resultRow("VGA game", "59.52 Hz", "frame rate with no framebuffer")}
</div>
<div class="table-wrap"><table class="spec-table">
<thead><tr><th>Metric</th><th>Result</th><th>Basis</th></tr></thead>
<tbody>
<tr><td>Multiplier throughput</td><td>3× class average</td><td>Course synthesis comparison</td></tr>
<tr><td>VGA frame rate</td><td>59.52 Hz</td><td>Testbench / display timing</td></tr>
<tr><td>Accelerator comparison</td><td>FPGA vs. edge GPU</td><td>CUDA Graphs, ONNX-TensorRT, baseline</td></tr>
</tbody>
</table></div>

<h2 id="analysis">Analysis</h2>
<p>The 3× multiplier figure is a class comparison, not a portable benchmark; it depends on the synthesis settings and the workloads used in the course. The accelerator work is a comparison across FPGA and edge-GPU paths, not a production deployment, and the useful numbers move with the model, batch size, and toolchain version. The VGA game stores its sprite in logic rather than block RAM, so area is the constraint, and the checked-in sprite divider does not match the GIF’s intended timing.</p>
<p>Digital design is where the software stack becomes physical. A line of Verilog has a cost in area and timing; a kernel launch has a cost in synchronization; a benchmark only means something when the measurement is reproducible. I like working at that boundary.</p>
${projectFooter([{ label: "HPC work", href: "/projects/hpc" }])}
</article>`
};
