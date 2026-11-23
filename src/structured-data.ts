// JSON-LD for the site. Kept out of the client bundle; the static build writes
// one @graph per page. Every entity is derived from the same page/project/post
// data the human pages use.
import { postEntries } from "./data/posts";
import { projectEntries } from "./data/projects";
import { githubProfileUrl, linkedinUrl } from "./pages/constants";
import type { Page } from "./pages/types";
import { AUTHOR_DESCRIPTION, SITE_DESCRIPTION, SITE_NAME, SITE_URL, canonicalUrl } from "./render";

const personId = `${SITE_URL}/#person`;
const websiteId = `${SITE_URL}/#website`;

function personEntity(): Record<string, unknown> {
    return {
        "@type": "Person",
        "@id": personId,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: AUTHOR_DESCRIPTION,
        jobTitle: "Undergraduate Researcher",
        affiliation: {
            "@type": "CollegeOrUniversity",
            name: "University of California, Santa Cruz"
        },
        sameAs: [githubProfileUrl, linkedinUrl],
        knowsAbout: [
            "FPGA design",
            "Verilog",
            "high-performance computing",
            "Slurm",
            "MPI",
            "control and estimation",
            "robotics",
            "WebGL",
            "computer engineering"
        ]
    };
}

function websiteEntity(): Record<string, unknown> {
    return {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        author: { "@id": personId },
        publisher: { "@id": personId }
    };
}

function breadcrumbEntity(page: Page, path: string, url: string): Record<string, unknown> | null {
    if (!page.section || path === "/projects" || path === "/blog") {
        return null;
    }

    const sectionPath = path.startsWith("/projects/") ? "/projects/" : path.startsWith("/blog/") ? "/blog/" : null;
    const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` }];

    if (sectionPath) {
        items.push({ "@type": "ListItem", position: 2, name: page.section, item: `${SITE_URL}${sectionPath}` });
        items.push({ "@type": "ListItem", position: 3, name: page.title, item: url });
    } else {
        items.push({ "@type": "ListItem", position: 2, name: page.section, item: url });
    }

    return {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: items
    };
}

export function buildJsonLd(page: Page, path: string, isNotFound: boolean): Record<string, unknown> | null {
    if (isNotFound) {
        return null;
    }

    const url = canonicalUrl(path);
    const pageType =
        path === "/about" ? "AboutPage" : path === "/resume" ? "ProfilePage" : path === "/projects" || path === "/blog" ? "CollectionPage" : "WebPage";

    const webpage: Record<string, unknown> = {
        "@type": pageType,
        "@id": `${url}#webpage`,
        url,
        name: page.title,
        description: page.description ?? SITE_DESCRIPTION,
        inLanguage: "en",
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
        ...(page.keywords ? { keywords: page.keywords.join(", ") } : {})
    };

    if (path === "/about" || path === "/resume") {
        webpage.mainEntity = { "@id": personId };
    }

    if (path === "/projects") {
        webpage.hasPart = projectEntries.map((project) => ({
            "@type": "CreativeWork",
            name: project.title,
            description: project.description,
            ...(project.path ? { url: canonicalUrl(project.path) } : project.titleHref ? { url: project.titleHref } : {})
        }));
    }

    if (path === "/blog") {
        webpage.hasPart = postEntries.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            url: canonicalUrl(post.path)
        }));
    }

    const graph: Record<string, unknown>[] = [personEntity(), websiteEntity(), webpage];
    const breadcrumb = breadcrumbEntity(page, path, url);

    if (breadcrumb) {
        graph.push(breadcrumb);
    }

    if (page.kind === "post") {
        graph.push({
            "@type": "BlogPosting",
            "@id": `${url}#article`,
            headline: page.title,
            description: page.description ?? SITE_DESCRIPTION,
            url,
            mainEntityOfPage: { "@id": `${url}#webpage` },
            author: { "@id": personId },
            publisher: { "@id": personId },
            articleSection: "Engineering notes",
            inLanguage: "en",
            isPartOf: { "@id": websiteId },
            ...(page.date ? { datePublished: page.date, dateModified: page.updated ?? page.date } : {}),
            ...(page.keywords ? { keywords: page.keywords.join(", ") } : {})
        });
    }

    if (page.kind === "project") {
        graph.push({
            "@type": "CreativeWork",
            "@id": `${url}#project`,
            name: page.title,
            description: page.description ?? SITE_DESCRIPTION,
            url,
            author: { "@id": personId },
            creator: { "@id": personId },
            inLanguage: "en",
            isPartOf: { "@id": websiteId },
            ...(page.keywords ? { keywords: page.keywords.join(", ") } : {})
        });
    }

    return {
        "@context": "https://schema.org",
        "@graph": graph
    };
}
