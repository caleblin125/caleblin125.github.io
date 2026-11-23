// Lab index ("/lab") — the interactive experiments collected in one place.
// Every entry either runs on a measured dataset or is explicitly labeled as a
// model or synthetic demo. Nothing here is a picture of a result that does not
// exist.
import type { Page } from "./types";

type LabEntry = {
    number: string;
    title: string;
    href: string;
    category: string;
    description: string;
    tag: string;
    tagTone: "measured" | "model" | "synthetic" | "live";
};

const entries: LabEntry[] = [
    {
        number: "01",
        title: "Nebula generator",
        href: "/lab/nebula",
        category: "WebGL2 / procedural",
        description:
            "One WebGL2 renderer, opened up: seed, six presets and palettes, every structural parameter, a screen-space field or a raymarched volume, and five diagnostic channels for density, cloud base, filaments, shape, and mask.",
        tag: "Live",
        tagTone: "live"
    },
    {
        number: "02",
        title: "HPC benchmark explorer",
        href: "/projects/hpc#bench",
        category: "Measured / SCC Connect 2026",
        description:
            "The measured HPL, NCCL, and STREAM results from the one-node competition campaign, drawn as bars over the exact tables. Every point was run; missing configurations stay missing.",
        tag: "Measured",
        tagTone: "measured"
    },
    {
        number: "03",
        title: "Beacon filter response",
        href: "/projects/robotics#filter",
        category: "Model / Sallen-Key",
        description:
            "The beacon receiver's second-order sections, plotted from the measured 2000.33 Hz center and Q of 20.3. Change the center, Q, and stage count to see what the tolerance analysis was protecting.",
        tag: "Model",
        tagTone: "model"
    },
    {
        number: "04",
        title: "Kalman filter",
        href: "/projects/robotics#demo",
        category: "Synthetic / 1D tracking",
        description:
            "A deterministic constant-velocity track with adjustable process and measurement noise. It is a teaching example, not a replay of robot data, and it says so on the page.",
        tag: "Synthetic",
        tagTone: "synthetic"
    },
    {
        number: "05",
        title: "Mandelbrot drawer",
        href: "/projects/mandelbrot",
        category: "WebGL2 / complex dynamics",
        description:
            "A browser port of the orbit-point renderer: pan, zoom, change the iteration limit, and color each stable sequence by the direction it takes next.",
        tag: "Live",
        tagTone: "live"
    },
    {
        number: "06",
        title: "Boids",
        href: "/projects/boids",
        category: "WebGL2 / flocking",
        description:
            "The three steering rules, species constants, and a live canvas, with a still frame when reduced motion is requested.",
        tag: "Live",
        tagTone: "live"
    }
];

const rows = entries
    .map(
        (entry) => `<a class="lab-row" href="${entry.href}">
<span class="lab-number">${entry.number}</span>
<div class="lab-body">
<p class="work-category">${entry.category}</p>
<h2>${entry.title}</h2>
<p>${entry.description}</p>
<span class="work-link">Open experiment <span aria-hidden="true">↗</span></span>
</div>
<span class="lab-tag" data-tone="${entry.tagTone}">${entry.tag}</span>
</a>`
    )
    .join("\n                ");

export const labPage: Page = {
    title: "Interactive laboratory.",
    eyebrow: "Lab",
    kind: "index",
    section: "Lab",
    updated: "2026-11-23",
    description:
        "Interactive experiments by Caleb Lin: a procedural nebula generator, measured HPC benchmark explorer, Sallen-Key filter model, synthetic Kalman demo, Mandelbrot drawer, and boids simulation.",
    keywords: ["interactive lab", "WebGL", "HPC benchmarks", "Sallen-Key filter", "Kalman filter", "Mandelbrot", "boids", "Caleb Lin"],
    content: `
            <section class="page-intro">
                <p class="kicker">Lab</p>
                <h1>Interactive laboratory.</h1>
                <p class="lede">The parts of the work that are easier to move than to describe. Some of these run on measured data; some are models or synthetic examples. Each one says which it is before it shows a number.</p>
                <div class="link-row"><a class="text-link" href="/lab/nebula">Nebula generator <span>↗</span></a><a class="text-link" href="/projects/hpc#bench">Benchmark explorer <span>↗</span></a><a class="text-link" href="/projects/robotics#filter">Filter response <span>↗</span></a></div>
            </section>
            <section class="lab-list" aria-label="Interactive experiments">
                ${rows}
            </section>
            <section class="lab-note">
                <p class="kicker">How to read the tags</p>
                <dl class="lab-legend">
                    <div><dt><span class="lab-tag" data-tone="measured">Measured</span></dt><dd>The chart draws logged runs. The page names the campaign and the number of runs.</dd></div>
                    <div><dt><span class="lab-tag" data-tone="model">Model</span></dt><dd>A calculated response anchored at published parameters, not a swept measurement.</dd></div>
                    <div><dt><span class="lab-tag" data-tone="synthetic">Synthetic</span></dt><dd>Generated data for teaching or testing. It is not evidence about a physical system.</dd></div>
                    <div><dt><span class="lab-tag" data-tone="live">Live</span></dt><dd>Runs in the browser from an algorithm or shader, not from a stored dataset.</dd></div>
                </dl>
            </section>`
};
