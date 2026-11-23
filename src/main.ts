import "./style.css";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import { ChaosRenderer } from "./chaos/renderer";
import { Mandelbrot } from "./chaos/mandelbrot";
import { BoidsRenderer } from "./boids/renderer";
import { NebulaRenderer } from "./nebula/renderer";
import { notFoundPage, pages } from "./pages";
import { email, githubProfileUrl, linkedinUrl } from "./pages/constants";
import type { Page } from "./pages/types";

const path = window.location.pathname.replace(/\/$/, "") || "/";
const knownPage = pages[path];
const page: Page = knownPage ?? notFoundPage;
const isNotFound = !knownPage;
const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
    throw new Error("App element not found");
}

const navItems: Record<string, string> = {
    "/projects": "Projects",
    "/resume": "Résumé",
    "/about": "About",
    "/blog": "Blog"
};

const nav = Object.entries(navItems)
    .map(([href, label]) => {
        const inSection = !isNotFound && (path === href || path.startsWith(`${href}/`));
        const current = inSection ? (path === href ? ' aria-current="page"' : ' aria-current="true"') : "";
        return `<a href="${href}"${inSection ? ` class="active"${current}` : ""}>${label}</a>`;
    })
    .join("");

const canonicalUrl = `https://caleblin125.github.io${path === "/" ? "/" : path}`;
const description = page.description ?? "Caleb Lin — engineering, research, and computational experiments.";

document.title = `Caleb Lin — ${page.title}`;
setMeta('meta[name="description"]', description);
setMeta('meta[property="og:title"]', `Caleb Lin — ${page.title}`);
setMeta('meta[property="og:description"]', description);
setMeta('meta[property="og:url"]', canonicalUrl);
setMeta('meta[name="twitter:title"]', `Caleb Lin — ${page.title}`);
setMeta('meta[name="twitter:description"]', description);
setMeta('meta[name="robots"]', isNotFound ? "noindex, nofollow" : "index, follow");

const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
if (canonical) {
    if (isNotFound) {
        canonical.remove();
    } else {
        canonical.href = canonicalUrl;
    }
}

app.innerHTML = `<header class="site-header"><a class="brand" href="/" aria-label="Caleb Lin, home">CL<span>/</span></a><nav aria-label="Primary">${nav}</nav><span class="header-note">${page.eyebrow}</span></header><main id="main" tabindex="-1">${page.content}</main><footer><span>© 2026 Caleb Lin</span><span class="footer-links"><a href="${githubProfileUrl}">GitHub ↗</a><a href="${linkedinUrl}">LinkedIn ↗</a><a href="/resume">Résumé ↗</a><a href="mailto:${email}">Say hello ↗</a></span></footer>`;

renderMathInElement(app, {
    delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
    ]
});

for (const canvas of document.querySelectorAll<HTMLCanvasElement>("canvas[data-visualization]")) {
    const kind = canvas.dataset.visualization;

    try {
        if (kind === "boids") {
            new BoidsRenderer(canvas).start();
        } else if (kind === "nebula") {
            new NebulaRenderer(canvas).start();
        } else {
            new ChaosRenderer(canvas, new Mandelbrot()).start();
        }
    } catch (error) {
        console.error(`Unable to start the ${kind ?? "canvas"} visualization`, error);
        canvas.closest<HTMLElement>(".visual-frame, .nebula-frame")?.classList.add("is-fallback");
    }
}

function setMeta(selector: string, content: string): void {
    const element = document.querySelector<HTMLMetaElement>(selector);
    if (element) {
        element.content = content;
    }
}
