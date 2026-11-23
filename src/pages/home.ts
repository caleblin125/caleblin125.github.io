// Home page ("/") — a compact intro, the procedural nebula centerpiece, a
// selected-work list with hard numbers, and a "home strip" pointing to About.
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

export const homePage: Page = {
    title: "Engineering and visual experiments.",
    eyebrow: "Caleb Lin",
    description: "Caleb Lin is a computer engineering and robotics student at UC Santa Cruz. He works on FPGA acceleration, HPC clusters, control and estimation, and visual systems that make technical results legible.",
    content: `
            <section class="hero-grid">
                <div class="hero-copy">
                    <p class="kicker">Engineering / visual systems</p>
                    <h1>I build systems, then make them legible.</h1>
                    <p class="lede">I’m Caleb Lin, a computer engineering and robotics student at UC Santa Cruz. I work on FPGA acceleration, HPC clusters, and control and estimation systems — and I build visual tools that make the results legible.</p>
                    <div class="link-row"><a class="text-link" href="#selected-work">Selected work <span>↓</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span>↗</span></a></div>
                </div>
                <div class="nebula-frame" data-nebula>
                    <div class="nebula-stage">
                        <canvas data-visualization="nebula" role="img" aria-label="A procedurally generated nebula: violet filaments and dust lanes with sparse stars."></canvas>
                        <div class="nebula-hud" aria-hidden="true"><span>Field 01 / domain-warped fBm</span><span>WebGL2 / fragment shader</span></div>
                        <p class="nebula-caption">Nebula <span>pointer parallax / seed-reproducible</span></p>
                        <div class="nebula-fallback">This field needs WebGL2. The rest of the page is unaffected.</div>
                    </div>
                    <div class="nebula-controls">
                        <label class="nebula-control">Density <input type="range" min="0" max="1" step="0.01" value="0.55" data-nebula-density></label>
                        <label class="nebula-control">Scale <input type="range" min="0.4" max="2.2" step="0.01" value="1" data-nebula-scale></label>
                        <label class="nebula-control">Palette <select data-nebula-palette><option value="violet">Violet</option><option value="ice">Ice</option><option value="ember">Ember</option></select></label>
                        <span class="nebula-seed-group"><span class="nebula-seed" data-nebula-seed aria-live="polite">seed 00000000</span><button class="nebula-reseed" type="button" data-nebula-reseed>Reseed</button></span>
                    </div>
                </div>
            </section>
            <section class="selected-work" id="selected-work">
                <div class="section-head"><p class="kicker">Selected work</p><a class="text-link" href="/projects">All projects <span>↗</span></a></div>
                <div class="work-list">
                    <a class="work-row" href="/projects/fpga"><span class="work-number">01</span><div><h2>FPGA and digital hardware</h2><p>A class-leading hardware multiplier and ternary LLM inference on a Xilinx Alveo U250.</p></div><span class="work-metric"><strong>3×</strong><span>class throughput</span></span></a>
                    <a class="work-row" href="/projects/hpc"><span class="work-number">02</span><div><h2>HPC and cluster tuning</h2><p>HPL sweeps on a 4-node lab cluster and competition workloads on a 2× H100 system.</p></div><span class="work-metric"><strong>663 GFLOPS</strong><span>47% of peak</span></span></a>
                    <a class="work-row" href="/blog/a-game-with-no-framebuffer"><span class="work-number">03</span><div><h2>A game with no framebuffer</h2><p>An endless runner in Verilog, drawn one pixel at a time by the counters that steer the beam.</p></div><span class="work-metric"><strong>59.52 Hz</strong><span>no framebuffer</span></span></a>
                </div>
            </section>
            <section class="home-strip">
                <p>At the moment</p>
                <div><strong>Benchmarking inference and tuning clusters</strong><span>Currently researching ternary LLM inference on an Alveo U250 and data-center load forecasting, while tuning competition workloads with UCSC’s HPC team.</span></div>
                <a class="text-link" href="/about">A little more <span>↗</span></a>
            </section>`
};
