// 404 page — used for any route not present in the `pages` record.
// scripts/generate-site.ts writes a real dist/404.html with noindex; this
// module supplies its content, and src/main.ts uses it on unknown dev routes.
import type { Page } from "./types";

export const notFoundPage: Page = {
    title: "Page not found.",
    eyebrow: "404",
    kind: "not-found",
    description: "The requested page does not exist on caleblin125.github.io.",
    content: `<section class="page-intro"><p class="kicker">404</p><h1>This route is not in the field.</h1><p class="lede">The page you asked for does not exist, or it moved. The rest of the site is still here.</p><p class="mono-note">Route / unresolved</p><div class="link-row"><a class="text-link" href="/">Home <span>↗</span></a><a class="text-link" href="/projects">Projects <span>↗</span></a><a class="text-link" href="/blog">Notes <span>↗</span></a></div></section>`
};
