import { createServer } from "vite";

const mode = process.argv[2] === "html" ? "html" : "docs";

const server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error"
});

try {
    const { run } = await server.ssrLoadModule("/scripts/generate-site.ts");
    await run(mode);
} finally {
    await server.close();
}
