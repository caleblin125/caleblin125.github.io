// FPGA project page ("/projects/fpga") — Verilog work, from a class-leading
// hardware multiplier to accelerator benchmarking on a Xilinx Alveo U250.
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

export const fpgaPage: Page = {
    title: "FPGA and digital hardware.",
    eyebrow: "Project / FPGA",
    content: `<article class="article">
<p class="kicker">Project / FPGA</p>
<h1>Digital hardware, measured.</h1>
<p class="lede">Verilog work from a class-leading multiplier to ternary LLM inference on a Xilinx Alveo U250.</p>
<div class="link-row"><a class="text-link" href="${githubProfileUrl}">GitHub <span>↗</span></a><a class="text-link" href="/projects/hpc">HPC work <span>↗</span></a></div>
<p>My hardware work starts with a simple rule: a design is not finished until the synthesis report and the benchmark agree. That habit carried from a course multiplier to accelerator benchmarking in the Hardware Systems Collective.</p>

<h2>The multiplier</h2>
<p>The first project was a hardware multiplier in Verilog. The goal was throughput, not just correctness, so the design was synthesized with Yosys and compared against the rest of the class. It ended up as the top-performing design in a class of about 100, at roughly 3× the class-average throughput.</p>
<div class="table-wrap"><table class="spec-table">
<thead><tr><th>Metric</th><th>Result</th></tr></thead>
<tbody>
<tr><td>Class size</td><td>~100 designs</td></tr>
<tr><td>Relative throughput</td><td>3× class average</td></tr>
<tr><td>Synthesis / measurement</td><td>Yosys</td></tr>
</tbody>
</table></div>
<p>That project made the trade-offs concrete: pipeline depth, adder structure, and the cost of widening a datapath all show up in the synthesis result. It also made benchmarking a habit rather than an afterthought.</p>

<h2>Interfaces: VGA and audio</h2>
<p>The same FPGA work extended into interfaces: a VGA display interface and a music generator that produces audio from hardware. Those projects were less about a single metric and more about making a digital design meet a real external timing contract.</p>

<h2>Accelerator work</h2>
<p>In the Hardware Systems Collective, I benchmarked and optimized ternary LLM inference on a Xilinx Alveo U250 FPGA and on NVIDIA Jetson edge GPUs. The work included enabling ONNX/TensorRT export of a matmul-free language model, working around CUDA Graph capture constraints, and patching fused Triton kernels with pure-PyTorch equivalents.</p>
<p>On the FPGA side, the question was how an AI workload maps onto custom accelerator hardware; on the Jetson side, it was how the same model behaves on a power-constrained edge device. The useful output was not a single number but a comparison: CUDA Graphs, ONNX-TensorRT, and baseline execution, each with its own overheads and constraints. That is the same measurement loop as the multiplier, just at a larger scale.</p>

<h2>What I took from it</h2>
<p>Digital design is where the software stack becomes physical. A line of Verilog has a cost in area and timing; a kernel launch has a cost in synchronization; a benchmark only means something when the measurement is reproducible. I like working at that boundary.</p>
<p>See the <a href="/projects/hpc">HPC work</a> for the cluster side of the same performance story, or the <a href="/projects">project index</a> for everything else.</p>
</article>`
};
