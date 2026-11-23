import "./style.css";
import "katex/dist/katex.min.css";
import { BoidsRenderer } from "./boids/renderer";
import { ChaosRenderer } from "./chaos/renderer";
import { Mandelbrot } from "./chaos/mandelbrot";
import { NebulaRenderer } from "./nebula/renderer";
import { notFoundPage, pages } from "./pages";
import type { Page } from "./pages/types";
import { normalizePath, pageMeta, renderPage } from "./render";

const path = normalizePath(window.location.pathname);
const knownPage = pages[path];
const page: Page = knownPage ?? notFoundPage;
const isNotFound = !knownPage;
const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
    throw new Error("App element not found");
}

const meta = pageMeta(page, path, isNotFound);
// A static host may serve a directory index through an SPA fallback. Compare
// the route as well as the flag so a mismatched fallback page is re-rendered
// instead of showing another route's content.
const prerendered = app.dataset.prerendered === "true" && app.dataset.route === path;

// Static pages arrive with the shell and content already in #app. Only the dev
// server (and any mismatched or unmarked page) needs the client renderer.
if (!prerendered) {
    app.innerHTML = renderPage(page, path, isNotFound);
}

document.title = meta.title;
setMeta('meta[name="description"]', meta.description);
setMeta('meta[property="og:title"]', meta.title);
setMeta('meta[property="og:description"]', meta.description);
setMeta('meta[property="og:type"]', meta.ogType);
setMeta('meta[name="twitter:title"]', meta.title);
setMeta('meta[name="twitter:description"]', meta.description);
setMeta('meta[name="robots"]', meta.robots);

if (isNotFound) {
    document.querySelector('meta[property="og:url"]')?.remove();
} else {
    setMeta('meta[property="og:url"]', meta.canonical);
}

const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
if (canonical) {
    if (isNotFound) {
        canonical.remove();
    } else {
        canonical.href = meta.canonical;
    }
}

const markdownLink = document.querySelector<HTMLLinkElement>('link[rel="alternate"][type="text/markdown"]');
if (markdownLink) {
    if (isNotFound) {
        markdownLink.remove();
    } else {
        markdownLink.href = meta.markdown;
    }
}

if (meta.publishedTime) {
    let published = document.querySelector<HTMLMetaElement>('meta[property="article:published_time"]');

    if (!published) {
        published = document.createElement("meta");
        published.setAttribute("property", "article:published_time");
        document.head.appendChild(published);
    }

    published.content = meta.publishedTime;
}

if (!prerendered) {
    // Static pages arrive with KaTeX already typeset, so the dev client (and a
    // page that had to re-render) is the only place that needs the renderer.
    // Keep it in a separate chunk instead of shipping KaTeX to every visitor.
    void import("katex/contrib/auto-render").then(({ default: renderMathInElement }) => {
        renderMathInElement(app, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false }
            ]
        });
    });
}

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
