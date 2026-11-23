// Home page ("/") — hero section with the Mandelbrot canvas and a
// "home strip" pointing to the about page.
import { githubProfileUrl } from "./constants";
import type { Page } from "./types";

export const homePage: Page = {
    title: "Engineering and visual experiments.",
    eyebrow: "Caleb Lin",
    content: `
            <section class="hero-grid">
                <div class="hero-copy">
                    <p class="kicker">Hello</p>
                    <h1>I build tools, simulations, and visual systems.</h1>
                    <p class="lede">I’m Caleb Lin, a computer engineering and robotics student at UC Santa Cruz. I work on FPGA acceleration, HPC clusters, and control and estimation systems — and I build visual tools that make the results legible.</p>
                    <div class="link-row"><a class="text-link" href="/projects">Things I’ve made <span>↗</span></a><a class="text-link" href="/resume">Résumé <span>↗</span></a><a class="text-link" href="${githubProfileUrl}">GitHub <span>↗</span></a></div>
                </div>
                <div class="visual-frame">
                    <canvas data-visualization="mandelbrot" aria-label="Interactive Mandelbrot set visualization"></canvas>
                    <div class="visual-label">Mandelbrot <span>drag to move / scroll to zoom</span></div>
                </div>
            </section>
            <section class="home-strip">
                <p>At the moment</p>
                <div><strong>Benchmarking inference and tuning clusters</strong><span>Currently researching ternary LLM inference on an Alveo U250 and data-center load forecasting, while tuning competition workloads with UCSC’s HPC team.</span></div>
                <a class="text-link" href="/about">A little more <span>↗</span></a>
            </section>`
};
