// 404 page — rendered for any route not present in the `pages` record.
// The deploy workflow copies dist/index.html to dist/404.html so GitHub Pages
// serves the SPA for unknown paths; this module supplies the actual content.
import type { Page } from "./types";

export const notFoundPage: Page = {
    title: "Page not found.",
    eyebrow: "404",
    description: "The requested page does not exist on caleblin125.github.io.",
    content: `<section class="page-intro"><p class="kicker">404</p><h1>This route is not in the field.</h1><p class="lede">The page you asked for does not exist, or it moved. The rest of the site is still here.</p><p class="mono-note">Route / unresolved</p><div class="link-row"><a class="text-link" href="/">Home <span>↗</span></a><a class="text-link" href="/projects">Projects <span>↗</span></a><a class="text-link" href="/blog">Notes <span>↗</span></a></div></section>`
};
