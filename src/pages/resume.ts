// Résumé page ("/resume") — a web-readable summary of the one-page PDF.
// The downloadable PDF lives in public/caleb-lin-resume.pdf.
import { email, githubProfileUrl, linkedinUrl, resumePdfUrl } from "./constants";
import type { Page } from "./types";

export const resumePage: Page = {
    title: "Résumé.",
    eyebrow: "Résumé",
    kind: "profile",
    section: "Résumé",
    description: "Caleb Lin's résumé: computer engineering and robotics at UC Santa Cruz, with FPGA, HPC, control, and software work.",
    keywords: ["Caleb Lin", "résumé", "computer engineering", "robotics", "FPGA", "HPC", "UC Santa Cruz"],
    content: `<article class="article resume">
<p class="kicker">Résumé</p>
<h1>Caleb Lin.</h1>
<p class="lede">Computer engineering and robotics student working across digital hardware, high-performance computing, and control systems.</p>
<div class="resume-contact">
<a href="mailto:${email}">${email}</a>
<a href="${linkedinUrl}">LinkedIn ↗</a>
<a href="${githubProfileUrl}">GitHub ↗</a>
<span>Santa Cruz, CA</span>
</div>
<div class="link-row"><a class="text-link" href="${resumePdfUrl}">Download PDF <span>↗</span></a><a class="text-link" href="/projects">Selected projects <span>↗</span></a></div>

<section class="resume-section">
<h2>Education</h2>
<div class="resume-entry">
<div><h3>University of California, Santa Cruz</h3><p class="resume-sub">B.S. Robotics Engineering and B.S. Computer Engineering (double major) · Minor in Electrical Engineering</p></div>
<div class="resume-date">Expected June 2027</div>
</div>
<p class="resume-note">GPA 3.95 / 4.00</p>
<p class="resume-note">Relevant coursework: Logic Design, Circuits, Signals and Systems, Feedback Control, Linear Dynamical Systems, VLSI, Stochastic Estimation and Control, Mechatronics, Microcontroller System Design, Sensing and Sensor Technologies.</p>
</section>

<section class="resume-section">
<h2>Research</h2>
<div class="resume-entry">
<div><h3>Undergraduate Researcher, Hardware Systems Collective</h3><p class="resume-sub">UC Santa Cruz</p></div>
<div class="resume-date">Sept 2025 – Present</div>
</div>
<ul class="article-list">
<li>Benchmarked and optimized ternary LLM inference on a Xilinx Alveo U250 FPGA and NVIDIA Jetson edge GPUs.</li>
<li>Enabled ONNX/TensorRT export of a matmul-free language model, working around CUDA Graph capture constraints and patching fused Triton kernels with pure-PyTorch equivalents.</li>
<li>Compared CUDA Graphs, ONNX-TensorRT, and baseline execution modes to characterize accelerator performance.</li>
</ul>

<div class="resume-entry">
<div><h3>Undergraduate Researcher, Smart Grids and Data Analytics Lab</h3><p class="resume-sub">UC Santa Cruz</p></div>
<div class="resume-date">Sept 2025 – Present</div>
</div>
<ul class="article-list">
<li>Built short-term data-center electricity load forecasting models reaching 3% MAPE, compared with 10% for traditional methods, on a decade of 10-minute-resolution data.</li>
<li>Applied time-series, linear algebra, and machine-learning methods to model and evaluate load against baselines.</li>
</ul>
</section>

<section class="resume-section">
<h2>Experience</h2>
<div class="resume-entry">
<div><h3>Resident Assistant, Porter College</h3><p class="resume-sub">UC Santa Cruz</p></div>
<div class="resume-date">Sept 2025 – Present</div>
</div>
<ul class="article-list">
<li>Serve as a trained peer leader for 30+ residents, handling conflict resolution and community support.</li>
<li>Plan and coordinate residential events across a range of living situations.</li>
</ul>

<div class="resume-entry">
<div><h3>Reader (Grader), Logic Design and Signals and Systems</h3><p class="resume-sub">UC Santa Cruz</p></div>
<div class="resume-date">Aug 2025 – Dec 2025</div>
</div>
<ul class="article-list">
<li>Graded about 40 assignments per week across two upper-division engineering courses.</li>
</ul>
</section>

<section class="resume-section">
<h2>Skills</h2>
<div class="skill-grid">
<div><span class="skill-label">Languages</span><p>Python, C, C++, Java, JavaScript, MATLAB, Bash, HTML, CSS</p></div>
<div><span class="skill-label">Hardware / RTL</span><p>Verilog, RISC-V assembly, FPGA design (Xilinx Alveo U250), Yosys, VGA and audio interfaces</p></div>
<div><span class="skill-label">HPC / Systems</span><p>Linux, Slurm, MPI, OpenMPI, OpenBLAS, NVIDIA H100, AMD EPYC, HPE Cray, cluster benchmarking</p></div>
<div><span class="skill-label">Robotics / Embedded</span><p>STM32, PIC32, ESP32-C3, embedded C, I2C/UART, sensors, PID and feedforward control, state estimation, CAD, soldering</p></div>
<div><span class="skill-label">ML / Modeling</span><p>Time-series forecasting, machine learning, linear algebra, state estimation, simulation, ONNX/TensorRT, CUDA Graphs</p></div>
<div><span class="skill-label">Tools</span><p>Git, GitHub, Make, CMake, VS Code, LaTeX</p></div>
</div>
</section>

<section class="resume-section">
<h2>Selected projects and honors</h2>
<ul class="article-list">
<li><strong>FPGA hardware multiplier</strong> — top design in a class of ~100, with 3× the class-average throughput (measured with Yosys). Also built a VGA display interface and music generator.</li>
<li><strong>Haydean 4-node cluster</strong> — administer Slurm (slurmdbd/MariaDB), NFS, and MPI; tuned HPL to ~663 GFLOPS (~47% of theoretical peak) with ~400 automated sweeps.</li>
<li><strong>HPC competitions</strong> — first place at the Winter Classical Invitational against 8 U.S. colleges; 10,000+ Slurm/MPI parameter sweeps in IndySCC; SCC Connect ’26 on 2× NVIDIA H100.</li>
<li><strong>Controls and estimation</strong> — EKF + RTS smoother from video, ballistic trajectory EKF, inverted pendulum simulation, and robust Sallen-Key filter design with Monte Carlo tolerance analysis.</li>
<li><strong>Robotics and embedded</strong> — PIC32 mecanum-drive robot, STM32 sensor integration, PIC32 I2C/UART drivers, FRC autonomous and closed-loop shooter control.</li>
</ul>
</section>
</article>`
};
