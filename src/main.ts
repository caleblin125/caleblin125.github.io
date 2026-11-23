import "./style.css";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import { ChaosRenderer } from "./chaos/renderer";
import { Mandelbrot } from "./chaos/mandelbrot";
import { BoidsRenderer } from "./boids/renderer";
import { pages } from "./pages";
import { email, githubProfileUrl, linkedinUrl } from "./pages/constants";
import type { Page } from "./pages/types";

const fallback: Page = pages["/"];
const path = window.location.pathname.replace(/\/$/, "") || "/";
const page = pages[path] ?? fallback;
const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
    throw new Error("App element not found");
}

document.title = `Caleb Lin — ${page.title}`;
app.innerHTML = `<header class="site-header"><a class="brand" href="/">CL<span>/</span></a><nav>${Object.entries({ "/projects": "Projects", "/resume": "Résumé", "/about": "About", "/blog": "Blog" }).map(([href, label]) => `<a class="${path.startsWith(href) ? "active" : ""}" href="${href}">${label}</a>`).join("")}</nav><span class="header-note">${page.eyebrow}</span></header><main>${page.content}</main><footer><span>© 2026 Caleb Lin</span><span class="footer-links"><a href="${githubProfileUrl}">GitHub ↗</a><a href="${linkedinUrl}">LinkedIn ↗</a><a href="/resume">Résumé ↗</a><a href="mailto:${email}">Say hello ↗</a></span></footer>`;

renderMathInElement(app, {
    delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
    ]
});

for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-visualization]")) {
    if (canvas.dataset.visualization === "boids") {
        new BoidsRenderer(canvas).start();
    } else {
        const mandelbrot = new Mandelbrot();
        new ChaosRenderer(canvas, mandelbrot).start();
    }
}
