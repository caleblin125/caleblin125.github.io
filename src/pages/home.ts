// Home page ("/") — a compact intro, the procedural nebula centerpiece, five
// selected projects with problem / contribution / technology / result, and a
// "home strip" pointing to About. All project text comes from src/data so the
// previews cannot drift from the project pages.
import { featuredProjects } from "../data/projects";
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

const projects = featuredProjects();

if (projects.length !== 5) {
    throw new Error(`The homepage needs exactly five featured projects; found ${projects.length}`);
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const workRows = projects
    .map((project) => {
        const href = project.path ?? project.titleHref ?? "/projects";
        const technologies = project.technologies.map((technology) => `<li>${escapeHtml(technology)}</li>`).join("");

        return `<a class="work-row" href="${escapeHtml(href)}">
<span class="work-number">${escapeHtml(project.number)}</span>
<span class="work-thumb"><img src="${escapeHtml(project.image.src)}" alt="${escapeHtml(project.image.alt)}" loading="lazy" decoding="async"></span>
<div class="work-body">
<p class="work-category">${escapeHtml(project.category)}${project.demo ? ' <span class="demo-badge">Interactive</span>' : ""}</p>
<h2>${escapeHtml(project.title)}</h2>
<p class="work-problem"><strong>Problem.</strong> ${escapeHtml(project.problem)}</p>
<p class="work-contribution"><strong>Contribution.</strong> ${escapeHtml(project.contribution)}</p>
<ul class="work-tech" aria-label="Technologies">${technologies}</ul>
<span class="work-link">Full project <span aria-hidden="true">↗</span></span>
</div>
<span class="work-metric"><strong>${escapeHtml(project.metric ?? "")}</strong><span>${escapeHtml(project.metricLabel ?? "")}</span></span>
</a>`;
    })
    .join("");

export const homePage: Page = {
    title: "Engineering and visual experiments.",
    eyebrow: "Caleb Lin",
    kind: "home",
    updated: "2026-11-23",
    description:
        "Caleb Lin is a computer engineering and robotics student at UC Santa Cruz. He works on FPGA acceleration, HPC clusters, machine learning, control and estimation, and computational visualization systems that make technical results legible.",
    keywords: ["Caleb Lin", "computer engineering", "robotics", "FPGA", "HPC", "machine learning", "WebGL", "UC Santa Cruz"],
    content: `
            <section class="hero-grid">
                <div class="hero-copy">
                    <p class="kicker">Computer engineering / robotics / HPC / ML / visualization</p>
                    <h1>I build systems, then make them legible.</h1>
                    <p class="lede">I’m Caleb Lin, a computer engineering and robotics student at UC Santa Cruz. I work across digital hardware and FPGA acceleration, high-performance computing, machine learning, robotics and state estimation, and computational visualization. The through-line is instrumentation: build the system, measure it, then give someone a way to see what it is doing.</p>
                    <div class="link-row"><a class="text-link" href="#selected-work">Selected work <span>↓</span></a><a class="text-link" href="/lab">Interactive lab <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span>↗</span></a></div>
                </div>
                <div class="nebula-frame" data-nebula>
                    <div class="nebula-stage">
                        <canvas data-visualization="nebula" role="img" aria-label="A procedurally generated nebula: violet filaments and dust lanes with sparse stars."></canvas>
                        <div class="nebula-hud" aria-hidden="true"><span>Field 01 / domain-warped fBm</span><span>WebGL2 / fragment shader</span></div>
                        <p class="nebula-caption">Nebula <span>pointer parallax / seed-reproducible</span></p>
                        <div class="nebula-fallback">This field needs WebGL2. The rest of the page is unaffected.</div>
                    </div>
                    <div class="nebula-controls">
                        <label class="nebula-control">Preset <select data-nebula-preset><option value="filament">Filament</option><option value="ice-drift">Ice drift</option><option value="ember-core">Ember core</option></select></label>
                        <label class="nebula-control">Density <input type="range" min="0" max="1" step="0.01" value="0.55" data-nebula-density></label>
                        <label class="nebula-control">Scale <input type="range" min="0.4" max="2.2" step="0.01" value="1" data-nebula-scale></label>
                        <label class="nebula-control">Palette <select data-nebula-palette><option value="violet">Violet</option><option value="ice">Ice</option><option value="ember">Ember</option></select></label>
                        <span class="nebula-seed-group"><span class="nebula-seed" data-nebula-seed aria-live="polite">seed 0x00000000</span><a class="nebula-reseed" data-nebula-link href="?seed=00000000">Link</a><button class="nebula-reseed" type="button" data-nebula-reseed>Reseed</button></span>
                    </div>
                    <details class="nebula-notes">
                        <summary>How this field is generated</summary>
                        <p>The image is a fragment shader, not a video. Three octaves of fractional Brownian motion are domain-warped by a slower noise field; the seed selects the offset. Density and scale change the field, and the palette swaps the three-stop color ramp. The browser writes the seed into the URL, so the same frame can be reopened.</p>
                        <p>Rendering is adaptive: if frames run slow, the drawing buffer drops resolution before it stops animating. With <code>prefers-reduced-motion</code>, the shader draws one still frame at a fixed time and pointer parallax is disabled. Without WebGL2, the text fallback remains and the rest of the page is unaffected.</p>
                    </details>
                </div>
            </section>
            <section class="method-strip" aria-label="How I work">
                <div class="method-head"><p class="kicker">Method / 04</p><p class="method-note">The same loop runs through the hardware, the clusters, and the visual work.</p></div>
                <ol class="method-steps">
                    <li><span>01</span><strong>Build</strong><p>Make the system real enough to misbehave.</p></li>
                    <li><span>02</span><strong>Instrument</strong><p>Give it a way to report what it is doing.</p></li>
                    <li><span>03</span><strong>Measure</strong><p>Run it against a baseline and keep the raw numbers.</p></li>
                    <li><span>04</span><strong>Understand</strong><p>Explain the result, including what it cannot support.</p></li>
                </ol>
            </section>
            <section class="selected-work" id="selected-work">
                <div class="section-head"><p class="kicker">Selected work / 05</p><a class="text-link" href="/projects">All projects <span>↗</span></a></div>
                <div class="work-list">${workRows}</div>
            </section>
            <section class="home-strip">
                <p>At the moment</p>
                <div><strong>Benchmarking inference, tuning clusters, and forecasting load</strong><span>Currently researching ternary LLM inference on an Alveo U250, forecasting data-center electricity load, and tuning competition workloads with UCSC’s HPC team.</span></div>
                <a class="text-link" href="/about">A little more <span>↗</span></a>
            </section>`
};
