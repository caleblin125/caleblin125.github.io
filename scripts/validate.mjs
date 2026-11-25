// Validation for the generated static site.
//
// Serves dist/ as a plain static server (no JavaScript execution, no SPA
// fallback) and asserts that every page is independently retrievable as HTML,
// Markdown, and through the site-wide discovery files. Run after `npm run build`:
//
//   npm run validate
//
// The checks intentionally use raw HTTP responses, which is what a crawler or
// agent sees, rather than the DOM that the client bundle would build.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.resolve(fileURLToPath(new URL("../dist", import.meta.url)));
const origin = "https://caleblin125.github.io";

// Copied lab artifacts that are served as static HTML instead of being
// generated from a Page object. They have their own canonical URL and belong
// in the sitemap, but the generated-page assertions below do not apply.
const standaloneRoutes = new Set(["/lab/aurora"]);

const contentTypes = new Map([
    [".html", "text/html; charset=utf-8"],
    [".md", "text/markdown; charset=utf-8"],
    [".txt", "text/plain; charset=utf-8"],
    [".xml", "application/xml; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".svg", "image/svg+xml"],
    [".pdf", "application/pdf"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
    [".woff", "font/woff"],
    [".woff2", "font/woff2"]
]);

const failures = [];
let checks = 0;

function check(condition, message, detail) {
    checks += 1;

    if (!condition) {
        failures.push({ message, detail });
        console.error(`  FAIL  ${message}${detail ? `\n        ${detail}` : ""}`);
    }
}

function pass(message) {
    checks += 1;
    console.log(`  ok    ${message}`);
}

function decodeEntities(value) {
    return value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
}

function stripTags(html) {
    return decodeEntities(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
    );
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textOf(html, selector) {
    const tag = selector.replace(/^[a-z]*\[|\]$/g, "");
    const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? stripTags(match[1]) : "";
}

async function resolveFile(urlPath) {
    const decoded = decodeURIComponent(urlPath.split(/[?#]/, 1)[0]);
    const relative = decoded.replace(/^\/+/, "");

    if (relative.includes("..")) {
        return null;
    }

    const target = path.join(root, relative);
    const candidates = path.extname(target) ? [target] : [target, path.join(target, "index.html")];

    for (const candidate of candidates) {
        try {
            const info = await stat(candidate);

            if (info.isFile()) {
                return candidate;
            }

            if (info.isDirectory()) {
                const index = path.join(candidate, "index.html");

                if ((await stat(index)).isFile()) {
                    return index;
                }
            }
        } catch {
            // Try the next candidate; a missing route falls through to null.
        }
    }

    return null;
}

async function readRoute(urlPath) {
    const file = await resolveFile(urlPath);

    if (!file) {
        return null;
    }

    try {
        return { file, body: await readFile(file) };
    } catch {
        return null;
    }
}

const server = createServer(async (request, response) => {
    const requested = request.url ?? "/";
    const resolved = await resolveFile(requested);

    if (!resolved) {
        const fallback = await readRoute("/404.html");

        if (fallback) {
            response.writeHead(404, {
                "content-type": contentTypes.get(".html"),
                "x-robots-tag": "noindex"
            });
            response.end(fallback.body);
            return;
        }

        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
    }

    try {
        const body = await readFile(resolved);
        response.writeHead(200, {
            "content-type": contentTypes.get(path.extname(resolved)) ?? "application/octet-stream",
            "content-length": body.byteLength
        });
        response.end(body);
    } catch {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found");
    }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function get(urlPath) {
    const response = await fetch(`${base}${urlPath}`);
    return {
        status: response.status,
        type: response.headers.get("content-type") ?? "",
        text: await response.text()
    };
}

function parseJsonLd(html) {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);

    if (!match) {
        return null;
    }

    try {
        return JSON.parse(match[1]);
    } catch (error) {
        return { parseError: String(error) };
    }
}

function graphTypes(jsonLd) {
    const graph = jsonLd?.["@graph"];
    return Array.isArray(graph) ? graph.map((node) => node?.["@type"]).filter(Boolean) : [];
}

try {
    console.log(`Validating ${root}\n`);

    const routes = ["/"];
    const routePattern = /<loc>([\s\S]*?)<\/loc>/g;
    const sitemapLocs = [];

    const sitemap = await get("/sitemap.xml");
    check(sitemap.status === 200 && sitemap.type.startsWith("application/xml"), "sitemap.xml is served as XML");
    check(sitemap.text.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), "sitemap uses the sitemap 0.9 namespace");
    check(sitemap.text.trim().endsWith("</urlset>"), "sitemap.xml is a complete document");

    for (const match of sitemap.text.matchAll(routePattern)) {
        const loc = decodeEntities(match[1].trim());
        check(loc.startsWith(`${origin}/`), `sitemap loc is on the canonical origin: ${loc}`);
        check(loc === `${origin}/` || loc.endsWith("/"), `sitemap loc uses a trailing slash: ${loc}`);
        sitemapLocs.push(loc);

        if (loc.startsWith(`${origin}/`)) {
            const route = (loc.slice(origin.length) || "/").replace(/\/+$/, "") || "/";

            if (route !== "/" && !routes.includes(route)) {
                routes.push(route);
            }
        }
    }

    check(sitemapLocs.length === new Set(sitemapLocs).size, "sitemap has no duplicate URLs");
    check(routes.length >= 15, `sitemap lists every indexable route (${routes.length} found)`);

    const generatedRoutes = routes.filter((route) => !standaloneRoutes.has(route));

    const robots = await get("/robots.txt");
    check(robots.status === 200, "robots.txt is served");
    check(/User-agent:\s*\*/i.test(robots.text), "robots.txt allows crawlers explicitly");
    check(/Sitemap:\s*https:\/\/caleblin125\.github\.io\/sitemap\.xml/i.test(robots.text), "robots.txt points at the sitemap");
    check(/llms\.txt/i.test(robots.text), "robots.txt advertises llms.txt");

    const llms = await get("/llms.txt");
    check(llms.status === 200 && llms.type.startsWith("text/plain"), "llms.txt is served as plain text");
    check(llms.text.startsWith("# Caleb Lin"), "llms.txt starts with the site identity");
    check(llms.text.includes("## Projects"), "llms.txt has a projects section");
    check(llms.text.includes("## Writing"), "llms.txt has a writing section");
    check(llms.text.includes("https://caleblin125.github.io/llms-full.txt"), "llms.txt links the full corpus");

    const llmsFull = await get("/llms-full.txt");
    check(llmsFull.status === 200, "llms-full.txt is served");
    check(llmsFull.text.length > 20000, "llms-full.txt contains the full page corpus");

    const feed = await get("/feed.xml");
    check(feed.status === 200 && feed.type.startsWith("application/xml"), "feed.xml is served as XML");
    check(feed.text.includes('<feed xmlns="http://www.w3.org/2005/Atom">'), "feed.xml uses the Atom namespace");
    check((feed.text.match(/<entry>/g) ?? []).length === 5, "feed.xml lists every note");
    check(feed.text.includes('rel="self" type="application/atom+xml"'), "feed.xml identifies itself");
    check(feed.text.includes("A game with no framebuffer."), "feed.xml contains the newest note");
    check(feed.text.includes("https://caleblin125.github.io/blog/a-game-with-no-framebuffer/"), "feed.xml uses canonical note URLs");

    const projectsJson = await get("/projects.json");
    check(projectsJson.status === 200 && projectsJson.type.startsWith("application/json"), "projects.json is served as JSON");

    let projectData = null;

    try {
        projectData = JSON.parse(projectsJson.text);
    } catch {
        // The assertions below report the missing structure.
    }

    check(Boolean(projectData), "projects.json parses");
    check(Array.isArray(projectData?.projects) && projectData.projects.length === 14, "projects.json lists every project");
    check(projectData?.projects?.filter((project) => project.featured).length === 5, "projects.json marks five featured projects");

    for (const project of projectData?.projects ?? []) {
        check(Boolean(project.id && project.title && project.category), `projects.json entry has identity: ${project.id ?? "unknown"}`);
        check(Boolean(project.problem && project.contribution), `projects.json entry has problem and contribution: ${project.id ?? "unknown"}`);
        check(Array.isArray(project.technologies) && project.technologies.length > 0, `projects.json entry has technologies: ${project.id ?? "unknown"}`);
        check(Boolean(project.dates === null || typeof project.dates === "object"), `projects.json entry has a dates field: ${project.id ?? "unknown"}`);
        check(Boolean(project.image?.src?.startsWith(`${origin}/`)), `projects.json image is absolute: ${project.id ?? "unknown"}`);
    }

    for (const route of generatedRoutes) {
        const canonical = route === "/" ? `${origin}/` : `${origin}${route}/`;
        check(llmsFull.text.includes(`<!-- ${canonical} -->`), `llms-full.txt includes ${route}`);
        check(llms.text.includes(canonical), `llms.txt links ${route}`);
    }

    const titles = new Map();
    const descriptions = new Map();
    const expected = [
        ["/", ["I build hardware, clusters, and robots, then measure them.", "86% of peak", "the part that was mine", "TreeSim", "Data-center load forecasting", "Interactive lab", "Instrument", "Measure"]],
        ["/projects", ["Work and projects.", "Flagship work", "Experiments", "Archive", "TreeSim", "SCC Connect 2026", "FPGA and digital hardware", "HPC and cluster tuning", "Robotics and state estimation", "Data-center load forecasting", "Computational visualization"]],
        ["/lab", ["Interactive laboratory.", "Nebula generator", "HPC benchmark explorer", "Beacon filter response", "Kalman filter", "Measured", "Model", "Synthetic", "Live"]],
        ["/lab/nebula", ["Nebula laboratory.", "Density", "Cloud base", "Filaments", "Shape field", "Mask", "3D volume", "999999", "prefers-reduced-motion"]],
        ["/projects/treesim", ["A forest that grows itself.", "51,755", "10.65 m", "6.11 million", "UPGMA", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/scc-connect", ["One node, measured.", "4,403.6", "481.6", "249.9", "86.0%", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/fpga", ["Digital hardware, measured.", "Alveo U250", "Yosys", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/hpc", ["Clusters, benchmarks, and sweeps.", "663 GFLOPS", "HPL", "measured competition record", "4,403.6", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/robotics", ["Finding a goal without a map.", "2000.33 Hz", "10 ms", "synthetic", "Sallen-Key", "Model, not a measurement", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/forecasting", ["A decade of ten-minute load.", "3% MAPE", "10% MAPE", "Contribution and credit", "evaluation script", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/visualization", ["Rules made visible.", "44,200", "489", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/drawing-arm", ["A drawing stored in cams.", "8.6 s", "142 / 132 / 55 / 155 mm", "has not been printed", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/aurora", ["Northern lights, solved per ray.", "557.7 nm", "/lab/aurora/", "not a forecast", "Overview", "Architecture", "Implementation", "Results", "Analysis"]],
        ["/projects/mandelbrot", ["Mandelbrot set."]],
        ["/projects/boids", ["Boids.", "separation"]],
        ["/blog", ["Notes.", "A game with no framebuffer."]],
        ["/blog/a-game-with-no-framebuffer", ["A game with no framebuffer.", "59.52 Hz", "800"]],
        ["/blog/the-glove-is-the-controller", ["The glove is the controller.", "BNO055"]],
        ["/blog/a-robot-on-a-field-with-no-map", ["A robot on a field with no map.", "mecanum"]],
        ["/blog/where-the-file-meets-the-machine", ["Where the file meets the machine.", "moir"]],
        ["/blog/seeing-the-mandelbrot-set", ["Seeing the Mandelbrot set."]],
        ["/about", ["Caleb Lin", "Research Interests", "Selected Work", "Contact", "University of California, Santa Cruz"]],
        ["/resume", ["Caleb Lin", "Education", "Experience"]],
        ["/lab/aurora", ["AURORA", "Caleb Lin"]]
    ];

    const needlesByRoute = new Map(expected);

    for (const route of expected.map(([route]) => route)) {
        check(routes.includes(route), `sitemap includes ${route}`);
    }

    for (const route of routes) {
        check(needlesByRoute.has(route) || standaloneRoutes.has(route), `sitemap route is intentional: ${route}`);
    }

    for (const route of generatedRoutes) {
        const needles = needlesByRoute.get(route) ?? [];
        const page = await get(route);
        const label = route === "/" ? "/" : route;

        check(page.status === 200, `${label} returns 200`);
        check(page.type.startsWith("text/html"), `${label} is HTML`);
        check(/<html lang="en"/i.test(page.text), `${label} declares English`);
        check(!/name="robots" content="[^"]*noindex/i.test(page.text), `${label} is indexable`);

        check(page.text.includes('data-prerendered="true"'), `${label} is prerendered`);
        const dataRoute = page.text.match(/id="app"[^>]*data-route="([^"]*)"/)?.[1];
        check(dataRoute === route, `${label} records its route for hydration`, `found "${dataRoute}"`);
        check(/<main\b[^>]*>/.test(page.text), `${label} has a main landmark`);
        check(/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(page.text), `${label} has an h1`);

        const bodyText = stripTags(page.text.replace(/<header[\s\S]*?<\/header>/i, " "));
        check(bodyText.length > 500, `${label} has substantive server-rendered text`);

        const canonical = page.text.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? "";
        const expectedCanonical = route === "/" ? `${origin}/` : `${origin}${route}/`;
        check(canonical === expectedCanonical, `${label} canonical is ${expectedCanonical}`, `found "${canonical}"`);

        const title = textOf(page.text, "title") || page.text.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
        check(Boolean(title), `${label} has a title`);
        check(!titles.has(title), `${label} title is unique`, titles.get(title) ? `duplicate of ${titles.get(title)}` : "");
        titles.set(title, label);

        const description = page.text.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? "";
        check(description.length >= 60, `${label} has a descriptive meta description`);
        check(!descriptions.has(description), `${label} description is unique`, descriptions.get(description) ? `duplicate of ${descriptions.get(description)}` : "");
        descriptions.set(description, label);

        check(page.text.includes('property="og:title"'), `${label} has Open Graph title`);
        check(page.text.includes('property="og:description"'), `${label} has Open Graph description`);
        check(page.text.includes('property="og:url"'), `${label} has Open Graph URL`);
        check(page.text.includes('property="og:image"'), `${label} has Open Graph image`);
        check(page.text.includes('name="twitter:card" content="summary_large_image"'), `${label} uses a large Twitter card`);
        check(page.text.includes('name="twitter:image"'), `${label} has Twitter image`);
        check(page.text.includes('rel="me"'), `${label} links identity profiles with rel=me`);
        check(page.text.includes('href="/sitemap.xml"'), `${label} advertises the sitemap`);
        check(page.text.includes('href="/llms.txt"'), `${label} advertises llms.txt`);
        check(page.text.includes('type="application/atom+xml"'), `${label} advertises the Atom feed`);

        const jsonLd = parseJsonLd(page.text);
        check(Boolean(jsonLd), `${label} has JSON-LD`);
        check(!jsonLd?.parseError, `${label} JSON-LD parses`, jsonLd?.parseError);
        const types = graphTypes(jsonLd);
        check(types.includes("Person"), `${label} JSON-LD describes the Person`);
        check(types.includes("WebSite"), `${label} JSON-LD describes the WebSite`);
        check(types.some((type) => /Page$/.test(type)), `${label} JSON-LD describes the page`);

        const markdownHref = page.text.match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/i)?.[1] ?? "";
        check(Boolean(markdownHref), `${label} advertises a Markdown representation`);

        if (markdownHref) {
            const markdown = await get(markdownHref);
            check(markdown.status === 200, `${markdownHref} is served`);
            check(/^---\n/.test(markdown.text), `${markdownHref} has YAML front matter`);
            check(new RegExp(`^title: `, "m").test(markdown.text), `${markdownHref} has a title`);
            check(new RegExp(`^url: "${escapeRegExp(expectedCanonical)}"$`, "m").test(markdown.text), `${markdownHref} points at the canonical URL`);
            check(!/@@MATH\d+@@/.test(markdown.text), `${markdownHref} has no unresolved math tokens`);
            check(!/<\/?(?:div|span|section|article|figure|canvas|svg)\b/.test(markdown.text), `${markdownHref} contains no leftover HTML layout tags`);
        }

        for (const needle of needles) {
            check(bodyText.includes(needle) || page.text.includes(needle), `${label} contains "${needle}"`);
        }

        pass(label);
    }

    const homeHtml = await get("/");
    const homeTitle = textOf(homeHtml.text, "title");
    check(homeTitle === "Caleb Lin — Robotics & Computer Engineering at UCSC", "homepage title names Caleb Lin and the UCSC degree areas", `found "${homeTitle}"`);
    const homeBodyText = stripTags(homeHtml.text);
    check(homeBodyText.includes("Caleb Lin"), "homepage visible text names Caleb Lin");
    check(homeBodyText.includes("University of California, Santa Cruz"), "homepage visible text names the full UCSC affiliation");
    const homeJsonLd = parseJsonLd(homeHtml.text);
    const homePerson = homeJsonLd?.["@graph"]?.find((node) => node?.["@type"] === "Person");
    check(homePerson?.["@id"] === `${origin}/#person`, "homepage Person has the stable @id", homePerson?.["@id"] ?? "missing");
    check(homePerson?.name === "Caleb Lin", "homepage Person is named Caleb Lin");
    check(homePerson?.affiliation?.name === "University of California, Santa Cruz", "homepage Person names the full affiliation");
    check(
        Array.isArray(homePerson?.sameAs) &&
            homePerson.sameAs.includes("https://github.com/caleblin125") &&
            homePerson.sameAs.includes("https://www.linkedin.com/in/caleb-lin-5246b0324"),
        "homepage Person links GitHub and LinkedIn"
    );

    const aboutHtml = await get("/about");
    const aboutBodyText = stripTags(aboutHtml.text);
    check(textOf(aboutHtml.text, "h1") === "Caleb Lin", "About page H1 is Caleb Lin");
    for (const heading of ["About", "Research Interests", "Selected Work", "Contact"]) {
        check(new RegExp(`<h2[^>]*>${escapeRegExp(heading)}</h2>`, "i").test(aboutHtml.text), `About page has the "${heading}" section`);
    }
    check(aboutBodyText.includes("University of California, Santa Cruz"), "About page names the full UCSC affiliation");
    check(aboutHtml.text.includes('href="https://github.com/caleblin125"'), "About page links GitHub");
    check(aboutHtml.text.includes('href="https://www.linkedin.com/in/caleb-lin-5246b0324"'), "About page links LinkedIn");
    check(aboutHtml.text.includes('href="/"'), "About page links the homepage");
    const aboutJsonLd = parseJsonLd(aboutHtml.text);
    const aboutPageNode = aboutJsonLd?.["@graph"]?.find((node) => node?.["@id"]?.endsWith("#webpage"));
    check(aboutPageNode?.["@type"] === "ProfilePage", "About page JSON-LD is a ProfilePage", aboutPageNode?.["@type"] ?? "missing");
    check(aboutPageNode?.mainEntity?.["@id"] === `${origin}/#person`, "About ProfilePage points at the shared Person @id");
    const aboutPerson = aboutJsonLd?.["@graph"]?.find((node) => node?.["@type"] === "Person");
    check(aboutPerson?.["@id"] === `${origin}/#person`, "About Person uses the shared @id");
    check(
        Array.isArray(aboutPerson?.sameAs) &&
            aboutPerson.sameAs.includes("https://github.com/caleblin125") &&
            aboutPerson.sameAs.includes("https://www.linkedin.com/in/caleb-lin-5246b0324"),
        "About Person has the same profile links"
    );

    const socialImage = homeHtml.text.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] ?? "";
    check(socialImage === `${origin}/projects/aurora.jpg`, "homepage OG image is the existing aurora render", `found "${socialImage}"`);
    const socialImageResponse = await get(socialImage.replace(origin, ""));
    check(socialImageResponse.status === 200 && socialImageResponse.type.startsWith("image/"), "OG image is served as an image");

    const auroraHtml = await get("/lab/aurora/");
    check(auroraHtml.status === 200 && auroraHtml.type.startsWith("text/html"), "live aurora is served as HTML");
    check(!/name="robots" content="[^"]*noindex/i.test(auroraHtml.text), "live aurora is indexable");
    check(auroraHtml.text.includes('href="https://github.com/caleblin125"'), "live aurora links the GitHub profile");
    check(auroraHtml.text.includes('href="https://www.linkedin.com/in/caleb-lin-5246b0324"'), "live aurora links the LinkedIn profile");
    const auroraCanonical = auroraHtml.text.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? "";
    check(auroraCanonical === `${origin}/lab/aurora/`, "live aurora has a canonical URL", `found "${auroraCanonical}"`);
    check(auroraHtml.text.includes('property="og:image"'), "live aurora has an Open Graph image");

    for (const [route, needles] of expected) {
        const page = await get(route);

        for (const needle of needles) {
            check(page.text.includes(needle), `${route} raw HTML contains "${needle}"`);
        }
    }

    const internalLinks = new Set();

    for (const route of generatedRoutes) {
        const page = await get(route);

        for (const match of page.text.matchAll(/href="([^"]+)"/g)) {
            const href = decodeEntities(match[1]);

            if (!href.startsWith("/") || href.startsWith("//")) {
                continue;
            }

            const pathOnly = href.split(/[?#]/, 1)[0];

            if (pathOnly) {
                internalLinks.add(pathOnly);
            }
        }
    }

    for (const href of [...internalLinks].sort()) {
        const response = await get(href);
        check(response.status === 200, `internal link resolves: ${href}`, `status ${response.status}`);
    }

    // The static shell is generated separately from index.html, so assert the
    // head the deployed pages actually carry: Atlas fonts, ink theme colour,
    // and no leftovers from the previous palette.
    for (const route of generatedRoutes) {
        const page = await get(route);
        check(
            page.text.includes("family=IBM+Plex+Mono") && page.text.includes("family=Newsreader"),
            `${route} requests the Atlas font families`
        );
        check(!/(Space\+Grotesk|DM\+Mono)/.test(page.text), `${route} has no legacy font request`);
        check(
            /<meta name="theme-color" content="#0a0d10"/.test(page.text),
            `${route} theme-color matches the ink ground`
        );
    }

    // Structural accessibility: the cheap assertions a DOM audit starts with,
    // run against the raw HTML of every generated route.
    for (const route of generatedRoutes) {
        const page = await get(route);
        const html = page.text;

        check(/<html[^>]+lang="en"/i.test(html), `${route} declares the document language`);
        check(/<a class="skip-link" href="#main"/i.test(html) && /\sid="main"/.test(html), `${route} has a skip link to main`);
        check((html.match(/<main\b/gi) || []).length === 1, `${route} has exactly one main landmark`);

        const h1Count = (html.match(/<h1\b/gi) || []).length;
        check(h1Count === 1, `${route} has exactly one h1`, `${h1Count} found`);

        const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
        const missingAlt = images.filter((tag) => !/\balt=/.test(tag));
        check(missingAlt.length === 0, `${route} gives every image an alt attribute`, missingAlt.join(" "));

        const unlabelledCanvases = [...html.matchAll(/<canvas\b[^>]*>/gi)]
            .map((match) => match[0])
            .filter((tag) => !/aria-label="[^"]+"/.test(tag));
        check(unlabelledCanvases.length === 0, `${route} labels every canvas`, unlabelledCanvases.join(" "));

        const unnamedLinks = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].filter(([, attrs, inner]) => {
            if (/aria-label="/.test(attrs)) return false;
            if (/<img\b[^>]*alt="[^"]+"/i.test(inner)) return false;
            return stripTags(inner) === "";
        });
        check(unnamedLinks.length === 0, `${route} has no link without an accessible name`);

        const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
        const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        check(duplicateIds.length === 0, `${route} has unique element ids`, duplicateIds.join(", "));

        const current = (html.match(/aria-current="(?:page|true)"/g) || []).length;
        const expectedCurrent = route === "/" ? 0 : 1;
        check(
            current === expectedCurrent,
            route === "/" ? `${route} marks no nav item current` : `${route} marks exactly one current nav item`,
            `${current} found`
        );
    }

    const favicon = await get("/favicon.svg");
    check(favicon.status === 200 && favicon.type.startsWith("image/svg"), "favicon is served");

    const notFound = await get("/this-route-does-not-exist");
    check(notFound.status === 404, "unknown routes return a real 404", `status ${notFound.status}`);
    check(/noindex/i.test(notFound.text), "404 page is noindex");
    check(notFound.text.includes("This route is not in the field."), "404 page has its own content");

    const missingMarkdown = await get("/blog/not-a-post.md");
    check(missingMarkdown.status === 404, "missing Markdown representations return 404");

    const homeMarkdown = await get("/index.md");
    check(homeMarkdown.status === 200, "root Markdown is /index.md");
    check(homeMarkdown.text.includes("[Selected work]"), "root Markdown preserves the homepage navigation");
    check(homeMarkdown.text.includes("### [FPGA and digital hardware]"), "root Markdown renders selected work as readable rows");
    check(!homeMarkdown.text.includes("[01\n"), "root Markdown does not nest headings inside links");

    const aurora = await get("/lab/aurora/");
    check(aurora.status === 200 && aurora.text.includes("AURORA <em>BOREALIS</em>") && aurora.text.includes('href="/projects/aurora"'), "the live aurora is served at /lab/aurora/ with a link back to its write-up");

    const fpgaHtml = await get("/projects/fpga");
    check(fpgaHtml.text.includes('type="application/ld+json"'), "project pages carry structured data");
    check(fpgaHtml.text.includes('"@type":"CreativeWork"'), "project pages describe the work as CreativeWork");

    const fpgaJsonLd = parseJsonLd(fpgaHtml.text);
    const fpgaProject = fpgaJsonLd?.["@graph"]?.find((node) => node?.["@type"] === "CreativeWork");
    check(Boolean(fpgaProject?.image?.startsWith(`${origin}/`)), "project structured data includes an image", fpgaProject?.image ?? "missing");

    const postHtml = await get("/blog/a-game-with-no-framebuffer");
    check(postHtml.text.includes('"@type":"BlogPosting"'), "notes describe themselves as BlogPosting");
    check(postHtml.text.includes('"datePublished":"2026-11-22"'), "notes carry a publication date");
    const postJsonLd = parseJsonLd(postHtml.text);
    const postArticle = postJsonLd?.["@graph"]?.find((node) => node?.["@id"]?.endsWith("#article"));
    check(Boolean(postArticle?.image?.startsWith(`${origin}/`)), "note structured data includes its frame", postArticle?.image ?? "missing");

    const projectsHtml = await get("/projects");
    const projectImages = [...projectsHtml.text.matchAll(/<figure class="project-thumb"><img src="([^"]+)" alt="([^"]+)"/g)];
    check(projectImages.length === 14, `every project row has a thumbnail (${projectImages.length} found)`);

    const projectImageSources = new Set();

    for (const [, src, alt] of projectImages) {
        check(!projectImageSources.has(src), `project thumbnail is unique: ${src}`);
        projectImageSources.add(src);
        check(alt.length >= 30, `project thumbnail has descriptive alt text: ${src}`, `found "${alt}"`);

        const image = await get(src);
        check(image.status === 200, `project thumbnail is served: ${src}`, `status ${image.status}`);
        check(image.type.startsWith("image/"), `project thumbnail has an image content type: ${src}`, `found "${image.type}"`);
    }

    const homeImages = [...(await get("/")).text.matchAll(/<span class="work-thumb"><img src="([^"]+)"/g)];
    check(homeImages.length >= 5, `homepage shows at least five selected-work plates (${homeImages.length} found)`);

    for (const [, src] of homeImages) {
        const image = await get(src);
        check(image.status === 200 && image.type.startsWith("image/"), `homepage thumbnail is served: ${src}`, `status ${image.status}, type "${image.type}"`);
    }

    // The plate board closes every row: spans total a multiple of twelve, so a
    // changed number of featured projects still lays out without a gap.
    const homeText = (await get("/")).text;
    const plateSpans = [...homeText.matchAll(/class="plate" data-span="(\d+)"/g)].map((match) => Number(match[1]));
    check(plateSpans.length === homeImages.length, "every homepage plate declares its grid span", `${plateSpans.length} spans for ${homeImages.length} plates`);
    check(plateSpans.reduce((total, span) => total + span, 0) % 12 === 0, "homepage plate spans fill whole rows", `total ${plateSpans.reduce((total, span) => total + span, 0)}`);

    const poster = await get("/nebula/home-poster.jpg");
    check(poster.status === 200 && poster.type.startsWith("image/"), "homepage nebula poster is served", `status ${poster.status}, type "${poster.type}"`);
    check(homeText.includes('class="nebula-poster"'), "homepage nebula ships a static poster");
    const posterBytes = (await readFile(path.join(root, "nebula", "home-poster.jpg"))).length;
    check(posterBytes > 0 && posterBytes <= 400_000, `nebula poster stays under 400 kB (${Math.round(posterBytes / 1024)} kB)`);

    // Entry transfer budgets. GitHub Pages serves these gzipped; a jump past the
    // ceiling means a dependency or an asset joined the initial load.
    const entryAssets = [...homeText.matchAll(/(?:href|src)="(\/assets\/[^"]+\.(?:css|js))"/g)].map((match) => match[1]);
    let entryCss = 0;
    let entryJs = 0;

    for (const asset of new Set(entryAssets)) {
        const bytes = gzipSync(await readFile(path.join(root, asset))).length;

        if (asset.endsWith(".css")) entryCss += bytes;
        else entryJs += bytes;
    }

    check(entryCss > 0 && entryCss <= 26_000, `entry CSS stays under 26 kB gzip (${(entryCss / 1024).toFixed(1)} kB)`);
    check(entryJs > 0 && entryJs <= 110_000, `entry JS stays under 110 kB gzip (${(entryJs / 1024).toFixed(1)} kB)`);

    console.log(`\n${checks} checks, ${failures.length} failure${failures.length === 1 ? "" : "s"}`);

    if (failures.length > 0) {
        process.exitCode = 1;
    }
} finally {
    await new Promise((resolve) => server.close(resolve));
}
