import katex from "katex";

// Render the small subset of TeX the site uses at build time. The client still
// uses KaTeX's auto-render in development; static pages arrive already typeset
// (with a MathML annotation) so no-JS readers get the equations too.
export function renderMath(html: string): string {
    return html.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (match, display: string | undefined, inline: string | undefined) => {
        const tex = display ?? inline ?? "";

        try {
            return katex.renderToString(tex, {
                displayMode: Boolean(display),
                throwOnError: false,
                strict: "ignore",
                output: "htmlAndMathml"
            });
        } catch {
            return match;
        }
    });
}
