// @ts-nocheck
// Build-time static renderer and machine-readable content generator.
//
// The human pages and these outputs both read from src/pages, src/data,
// src/render.ts, and src/structured-data.ts. Run it through scripts/generate.mjs
// so Vite can load the TypeScript modules:
//   node scripts/generate.mjs docs   -> public/ (dev server)
//   node scripts/generate.mjs html   -> dist/ (after `vite build`)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { postEntries } from "../src/data/posts";
import { projectEntries } from "../src/data/projects";
import { renderMath } from "../src/math";
import { notFoundPage, pages } from "../src/pages";
import type { Page } from "../src/pages/types";
import {
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_UPDATED,
    SITE_URL,
    canonicalUrl,
    markdownPath,
    pageMeta,
    renderPage
} from "../src/render";
import type { PageMeta } from "../src/render";
import { buildJsonLd } from "../src/structured-data";

const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*"
});

turndown.use(gfm);

turndown.addRule("canvas", {
    filter: "canvas",
    replacement: (_content, node) => `\n\n[Interactive visualization: ${node.getAttribute("aria-label") ?? "canvas"}]\n\n`
});

turndown.addRule("svg", {
    filter: "svg",
    replacement: (_content, node) => `\n\n[Diagram: ${node.getAttribute("aria-label") ?? "diagram"}]\n\n`
});

turndown.addRule("fencedCodeBlock", {
    filter: "pre",
    replacement: (_content, node) => {
        const fence = "```";
        return `\n\n${fence}\n${(node.textContent ?? "").replace(/\n$/, "")}\n${fence}\n\n`;
    }
});

turndown.addRule("mathDisplay", {
    filter: (node) => node.nodeName === "DIV" && node.classList.contains("math-display"),
    replacement: (_content, node) => `\n\n${(node.textContent ?? "").trim()}\n\n`
});

turndown.addRule("linkRow", {
    filter: (node) => node.nodeName === "DIV" && node.classList.contains("link-row"),
    replacement: (content) => `\n\n${content.trim().replace(/\)\[/g, ") [")}\n\n`
});

turndown.addRule("figure", {
    filter: "figure",
    replacement: (content) => `\n\n${content.trim()}\n\n`
});

turndown.addRule("figcaption", {
    filter: "figcaption",
    replacement: (content) => `\n\n*${content.trim()}*\n\n`
});

turndown.addRule("image", {
    filter: "img",
    replacement: (_content, node) => {
        const alt = node.getAttribute("alt") ?? "";
        const src = node.getAttribute("src") ?? "";
        return `\n\n![${alt}](${absoluteUrl(src)})\n\n`;
    }
});

turndown.addRule("link", {
    filter: (node) => node.nodeName === "A" && Boolean(node.getAttribute("href")),
    replacement: (content, node) => {
        const href = node.getAttribute("href") ?? "";
        const title = node.getAttribute("title");
        const label = content.replace(/\s*[↗↓→←]\s*$/, "").trim();
        return `[${label}](${absoluteUrl(href)}${title ? ` "${title}"` : ""})`;
    }
});

// Homepage selected-work rows are links that contain their own heading,
// description, and metric. Unwrap them into a readable block instead of
// letting Turndown nest an H2 inside a Markdown link.
turndown.addRule("workRow", {
    filter: (node) => node.nodeName === "A" && node.classList.contains("work-row"),
    replacement: (_content, node) => {
        const href = node.getAttribute("href") ?? "";
        const title = node.querySelector("h2")?.textContent?.trim() ?? "";
        const description = node.querySelector("p")?.textContent?.trim() ?? "";
        const metric = node.querySelector(".work-metric strong")?.textContent?.trim() ?? "";
        const metricLabel = node.querySelector(".work-metric span")?.textContent?.trim() ?? "";
        const metricLine = metric ? `\n\n**${metric}**${metricLabel ? ` ${metricLabel}` : ""}` : "";
        return `\n\n### [${title}](${absoluteUrl(href)})\n\n${description}${metricLine}\n\n`;
    }
});

// Interface chrome that only exists to drive the canvas. It stays in the HTML
// for the human page but would be noise in the Markdown representation.
turndown.addRule("canvasChrome", {
    filter: (node) =>
        node.nodeName === "DIV" &&
        ["nebula-hud", "nebula-fallback", "nebula-controls"].some((name) => node.classList.contains(name)),
    replacement: () => ""
});

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeXml(value: string): string {
    return escapeHtml(value).replace(/'/g, "&apos;");
}

function yamlString(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function absoluteUrl(href: string): string {
    if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
        return href;
    }

    const url = new URL(href, `${SITE_URL}/`);

    if (url.origin === SITE_URL && !path.extname(url.pathname) && !url.pathname.endsWith("/")) {
        url.pathname += "/";
    }

    return url.href;
}

function frontMatter(page: Page, meta: PageMeta): string {
    const lines = [
        "---",
        `title: ${yamlString(page.title)}`,
        `description: ${yamlString(meta.description)}`,
        `url: ${yamlString(meta.canonical)}`,
        `type: ${yamlString(page.kind ?? "page")}`
    ];

    if (page.section) {
        lines.push(`section: ${yamlString(page.section)}`);
    }

    if (page.date) {
        lines.push(`date: ${yamlString(page.date)}`);
    }

    if (page.keywords?.length) {
        lines.push(`keywords: [${page.keywords.map(yamlString).join(", ")}]`);
    }

    lines.push("---");
    return lines.join("\n");
}

function markdownFor(route: string, page: Page): string {
    const meta = pageMeta(page, route, false);
    const math: string[] = [];
    const protectedHtml = page.content.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (match) => {
        const token = `@@MATH${math.length}@@`;
        math.push(match);
        return token;
    });
    const body = turndown
        .turndown(protectedHtml)
        .replace(/@@MATH(\d+)@@/g, (_match, index) => math[Number(index)] ?? "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    return `${frontMatter(page, meta)}\n\n${body}\n`;
}

function buildLlmsTxt(): string {
    const about = pages["/about"];
    const resume = pages["/resume"];
    const projects = pages["/projects"];
    const blog = pages["/blog"];

    return [
        "# Caleb Lin",
        "",
        `> ${SITE_DESCRIPTION}`,
        "",
        `Canonical site: ${SITE_URL}/`,
        `Full content: ${SITE_URL}/llms-full.txt`,
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        "",
        "## Projects",
        "",
        ...projectEntries.map((project) => {
            const href = project.path ? canonicalUrl(project.path) : project.titleHref ?? canonicalUrl("/projects");
            return `- [${project.title}](${href}): ${project.description}`;
        }),
        "",
        "## Writing",
        "",
        ...postEntries.map((post) => `- [${post.title}](${canonicalUrl(post.path)}): ${post.description}`),
        "",
        "## Pages",
        "",
        `- [About Caleb Lin](${canonicalUrl("/about")}): ${about?.description ?? ""}`,
        `- [Résumé](${canonicalUrl("/resume")}): ${resume?.description ?? ""}`,
        `- [Projects index](${canonicalUrl("/projects")}): ${projects?.description ?? ""}`,
        `- [Notes index](${canonicalUrl("/blog")}): ${blog?.description ?? ""}`,
        "",
        "## Markdown",
        "",
        ...Object.entries(pages).map(([route, page]) => `- [${page.title}](${SITE_URL}${markdownPath(route)}): ${page.description ?? ""}`),
        "",
        "## Machine-readable",
        "",
        `- [Full site content](${SITE_URL}/llms-full.txt): every page as Markdown in one file.`,
        `- [Sitemap](${SITE_URL}/sitemap.xml): canonical URLs and last-modified dates.`,
        ""
    ].join("\n");
}

function buildLlmsFull(markdownPages: Array<{ path: string; page: Page; markdown: string }>): string {
    const order = [
        "/",
        "/projects",
        "/projects/fpga",
        "/projects/hpc",
        "/projects/mandelbrot",
        "/projects/boids",
        "/blog",
        ...postEntries.map((post) => post.path),
        "/about",
        "/resume"
    ];
    const byPath = new Map(markdownPages.map((item) => [item.path, item]));
    const blocks = order
        .map((route) => byPath.get(route))
        .filter(Boolean)
        .map((item) => `<!-- ${canonicalUrl(item.path)} -->\n\n${item.markdown}`);

    return `# Caleb Lin — full site content\n\n> ${SITE_DESCRIPTION}\n\nThis file concatenates every indexable page as Markdown. Each section starts with its canonical URL and YAML front matter.\n\n---\n\n${blocks.join("\n\n---\n\n")}\n`;
}

function buildSitemap(): string {
    const entries = Object.entries(pages).map(([route, page]) => {
        const lastmod = page.updated ?? page.date ?? SITE_UPDATED;
        const changefreq = route === "/" || route === "/projects" || route === "/blog" ? "weekly" : "monthly";
        const priority =
            route === "/" ? "1.0" : route === "/projects" || route === "/blog" ? "0.8" : route.startsWith("/projects/") ? "0.8" : route.startsWith("/blog/") ? "0.7" : "0.6";

        return `  <url>\n    <loc>${escapeXml(canonicalUrl(route))}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

function buildRobots(): string {
    return `# Agent-friendly content: ${SITE_URL}/llms.txt\nUser-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

function docsFiles(): Record<string, string> {
    const files: Record<string, string> = {};
    const markdownPages = Object.entries(pages).map(([route, page]) => ({
        path: route,
        page,
        markdown: markdownFor(route, page)
    }));

    for (const item of markdownPages) {
        files[markdownPath(item.path).replace(/^\//, "")] = item.markdown;
    }

    files["llms.txt"] = buildLlmsTxt();
    files["llms-full.txt"] = buildLlmsFull(markdownPages);
    files["sitemap.xml"] = buildSitemap();
    files["robots.txt"] = buildRobots();
    return files;
}

async function writeDocs(outDir: string): Promise<void> {
    const files = docsFiles();
    await mkdir(outDir, { recursive: true });

    for (const [name, content] of Object.entries(files)) {
        const target = path.join(outDir, name);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, content, "utf8");
    }
}

function extractAssetTags(html: string): string {
    const matches = [
        ...html.matchAll(/<script[^>]+type="module"[^>]*><\/script>|<link[^>]+rel="stylesheet"[^>]*href="\/assets\/[^"]*"[^>]*>/g)
    ];

    if (matches.length === 0) {
        throw new Error("Could not find the built module and stylesheet tags in dist/index.html");
    }

    return matches.map((match) => `    ${match[0]}`).join("\n");
}

function pageBody(page: Page, route: string, isNotFound: boolean): string {
    return renderPage({ ...page, content: renderMath(page.content) }, route, isNotFound);
}

function renderDocument(page: Page, route: string, isNotFound: boolean, body: string, assetTags: string): string {
    const meta = pageMeta(page, route, isNotFound);
    const jsonLd = buildJsonLd(page, route, isNotFound);
    const canonical = isNotFound ? "" : `    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />\n`;
    const markdown = isNotFound ? "" : `    <link rel="alternate" type="text/markdown" href="${escapeHtml(markdownPath(route))}" />\n`;
    const ogUrl = isNotFound ? "" : `    <meta property="og:url" content="${escapeHtml(meta.canonical)}" />\n`;
    const published = meta.publishedTime ? `    <meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />\n` : "";
    const jsonLdTag = jsonLd ? `    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>\n` : "";

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#120d18" />
    <meta name="author" content="${SITE_NAME}" />
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="robots" content="${meta.robots}" />
${canonical}    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
${markdown}    <meta property="og:type" content="${meta.ogType}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
${ogUrl}    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
${published}    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>${escapeHtml(meta.title)}</title>
${jsonLdTag}${assetTags}
</head>
<body>
    <a class="skip-link" href="#main">Skip to content</a>
    <div id="app" data-prerendered="true" data-route="${escapeHtml(route)}">${body}</div>
    <noscript>
      <p>This page is readable without JavaScript. The interactive canvas visualizations need JavaScript; the résumé is available as a <a href="/caleb-lin-resume.pdf">PDF</a>.</p>
    </noscript>
</body>
</html>
`;
}

async function writeHtml(distDir: string): Promise<void> {
    let template: string;

    try {
        template = await readFile(path.join(distDir, "index.html"), "utf8");
    } catch {
        throw new Error("dist/index.html is missing. Run `vite build` before `npm run generate:html`.");
    }

    const assetTags = extractAssetTags(template);

    for (const [route, page] of Object.entries(pages)) {
        const body = pageBody(page, route, false);
        const html = renderDocument(page, route, false, body, assetTags);
        const target = route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.slice(1), "index.html");
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, html, "utf8");
    }

    const notFoundBody = pageBody(notFoundPage, "/404", true);
    const notFoundHtml = renderDocument(notFoundPage, "/404", true, notFoundBody, assetTags);
    await writeFile(path.join(distDir, "404.html"), notFoundHtml, "utf8");
    await writeFile(path.join(distDir, ".nojekyll"), "", "utf8");
    await writeDocs(distDir);
}

export async function run(mode: "docs" | "html" = "docs"): Promise<void> {
    if (mode === "html") {
        await writeHtml("dist");
        console.log("Generated static pages, Markdown, llms.txt, sitemap.xml, and robots.txt in dist/");
    } else {
        await writeDocs("public");
        console.log("Generated Markdown, llms.txt, sitemap.xml, and robots.txt in public/");
    }
}
