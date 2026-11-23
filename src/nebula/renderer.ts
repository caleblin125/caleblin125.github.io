import fragmentShaderSource from "./shaders/nebula.glsl?raw";
import vertexShaderSource from "./shaders/nebula.vert.glsl?raw";

type Palette = readonly [number, number, number];

type Uniforms = {
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    offset: WebGLUniformLocation | null;
    density: WebGLUniformLocation | null;
    scale: WebGLUniformLocation | null;
    pointer: WebGLUniformLocation | null;
    colorA: WebGLUniformLocation | null;
    colorB: WebGLUniformLocation | null;
    colorC: WebGLUniformLocation | null;
    octaves: WebGLUniformLocation | null;
    warp: WebGLUniformLocation | null;
    variant: WebGLUniformLocation | null;
    view: WebGLUniformLocation | null;
};

const PALETTES: Record<string, { a: Palette; b: Palette; c: Palette }> = {
    violet: { a: [0.80, 0.62, 0.90], b: [0.42, 0.28, 0.62], c: [0.18, 0.11, 0.28] },
    ice: { a: [0.56, 0.82, 0.94], b: [0.22, 0.42, 0.62], c: [0.08, 0.14, 0.22] },
    ember: { a: [0.94, 0.64, 0.42], b: [0.52, 0.28, 0.20], c: [0.20, 0.10, 0.09] }
};

// Named presets are ordinary combinations of the three continuous controls.
// They exist so a first-time visitor has a readable starting point and a
// reproducible name for a look, not because the shader has hidden modes.
const PRESETS: Record<string, { density: number; scale: number; palette: string }> = {
    filament: { density: 0.55, scale: 1, palette: "violet" },
    "ice-drift": { density: 0.72, scale: 1.35, palette: "ice" },
    "ember-core": { density: 0.42, scale: 0.82, palette: "ember" }
};

// View modes are labeled in the page, not derived from a hidden code path.
const VIEWS = ["final", "base", "warp", "fractal", "color"] as const;
export type ViewMode = (typeof VIEWS)[number];

const VIEW_LABELS: Record<ViewMode, string> = {
    final: "Final field",
    base: "Base noise",
    warp: "Warp field",
    fractal: "Octave bands",
    color: "Colour field"
};

const QUALITIES = ["adaptive", "high", "low"] as const;
type QualityMode = (typeof QUALITIES)[number];

// The first impression is a designed frame, not a random one. Passing ?seed=
// or pressing Reseed hands control back to the generator; every other seed is
// mapped to a decorrelated region of the noise field.
const DEFAULT_SEED = 0x1a2b3c4d;

function offsetForSeed(seed: number): [number, number] {
    if (seed === DEFAULT_SEED) {
        return [0, 0];
    }

    let x = (seed ^ 0x9e3779b9) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad) >>> 0;
    x = Math.imul(x ^ (x >>> 15), 0x735a2d97) >>> 0;
    x = (x ^ (x >>> 15)) >>> 0;

    let y = (x ^ 0x85ebca6b) >>> 0;
    y = Math.imul(y ^ (y >>> 13), 0xc2b2ae35) >>> 0;
    y = (y ^ (y >>> 16)) >>> 0;

    return [(x / 4294967296) * 256, (y / 4294967296) * 256];
}

function hexSeed(seed: number): string {
    return seed.toString(16).padStart(8, "0");
}

function paramNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number): number {
    const value = Number.parseFloat(params.get(key) ?? "");
    if (!Number.isFinite(value)) return fallback;
    return Math.min(Math.max(value, min), max);
}

function paramInt(params: URLSearchParams, key: string, fallback: number, min: number, max: number): number {
    const value = Number.parseInt(params.get(key) ?? "", 10);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(Math.max(value, min), max);
}

export class NebulaRenderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly frame: HTMLElement | null;
    private readonly gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private uniforms: Uniforms;
    private vao: WebGLVertexArrayObject;
    private readonly resizeObserver: ResizeObserver;
    private readonly intersectionObserver: IntersectionObserver;
    private readonly reducedMotionQuery: MediaQueryList;
    private renderHandle = 0;
    private running = false;
    private visible = true;
    private contextLost = false;
    private ready = false;
    private seed = DEFAULT_SEED;
    private offset: [number, number] = [0, 0];
    private pointer = { x: 0, y: 0 };
    private pointerTarget = { x: 0, y: 0 };
    private lastTime = 0;
    private elapsed = 0;
    private frameSamples: number[] = [];
    private quality = 1;
    private density = 0.55;
    private scale = 1;
    private palette = "violet";
    private octaves = 4;
    private warp = 1;
    private variant = 0;
    private view: ViewMode = "final";
    private qualityMode: QualityMode = "adaptive";
    private urlHandle = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.frame = canvas.closest<HTMLElement>("[data-nebula]");

        const gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false
        });

        if (!gl) {
            throw new Error("WebGL2 is not supported");
        }

        this.gl = gl;
        this.program = this.createProgram();
        this.uniforms = this.getUniforms();
        this.vao = this.createVertexArray();
        this.readState();
        this.offset = offsetForSeed(this.seed);
        this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        this.resizeObserver = new ResizeObserver(this.resize);
        this.intersectionObserver = new IntersectionObserver(this.onIntersection, { threshold: 0.02 });
    }

    start(): void {
        this.bindControls();
        this.resize();
        this.resizeObserver.observe(this.canvas);
        this.intersectionObserver.observe(this.canvas);
        window.addEventListener("resize", this.resize);
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        document.addEventListener("fullscreenchange", this.onFullscreenChange);
        this.canvas.addEventListener("pointermove", this.onPointerMove);
        this.canvas.addEventListener("pointerleave", this.onPointerLeave);
        this.canvas.addEventListener("webglcontextlost", this.onContextLost);
        this.canvas.addEventListener("webglcontextrestored", this.onContextRestored);
        this.reducedMotionQuery.addEventListener("change", this.onReducedMotionChange);

        if (this.reducedMotionQuery.matches) {
            this.draw();
        } else {
            this.startLoop();
        }
    }

    private readState(): void {
        const params = new URLSearchParams(window.location.search);
        const seed = params.get("seed");

        if (seed && /^[0-9a-f]{1,8}$/i.test(seed)) {
            this.seed = Number.parseInt(seed, 16) >>> 0;
        }

        this.density = paramNumber(params, "density", this.density, 0, 1);
        this.scale = paramNumber(params, "scale", this.scale, 0.4, 2.2);
        this.octaves = paramInt(params, "octaves", this.octaves, 1, 6);
        this.warp = paramNumber(params, "warp", this.warp, 0, 2);
        this.variant = paramInt(params, "variant", this.variant, 0, 3);

        const palette = params.get("palette");
        if (palette && PALETTES[palette]) {
            this.palette = palette;
        }

        const view = params.get("view");
        if (view && (VIEWS as readonly string[]).includes(view)) {
            this.view = view as ViewMode;
        }

        const quality = params.get("quality");
        if (quality && (QUALITIES as readonly string[]).includes(quality)) {
            this.qualityMode = quality as QualityMode;
        }

        if (this.qualityMode === "low") this.quality = 0.6;
        else this.quality = 1;
    }

    private bindControls(): void {
        const frame = this.frame;
        if (!frame) return;

        const density = frame.querySelector<HTMLInputElement>("[data-nebula-density]");
        const scale = frame.querySelector<HTMLInputElement>("[data-nebula-scale]");
        const octaves = frame.querySelector<HTMLInputElement>("[data-nebula-octaves]");
        const warp = frame.querySelector<HTMLInputElement>("[data-nebula-warp]");
        const palette = frame.querySelector<HTMLSelectElement>("[data-nebula-palette]");
        const preset = frame.querySelector<HTMLSelectElement>("[data-nebula-preset]");
        const variant = frame.querySelector<HTMLSelectElement>("[data-nebula-variant]");
        const view = frame.querySelector<HTMLSelectElement>("[data-nebula-view]");
        const quality = frame.querySelector<HTMLSelectElement>("[data-nebula-quality]");
        const seedInput = frame.querySelector<HTMLInputElement>("[data-nebula-seed-input]");
        const link = frame.querySelector<HTMLAnchorElement>("[data-nebula-link]");
        const reseed = frame.querySelector<HTMLButtonElement>("[data-nebula-reseed]");
        const copy = frame.querySelector<HTMLButtonElement>("[data-nebula-copy]");
        const fullscreen = frame.querySelector<HTMLButtonElement>("[data-nebula-fullscreen]");
        const densityValue = frame.querySelector<HTMLElement>("[data-nebula-density-value]");
        const scaleValue = frame.querySelector<HTMLElement>("[data-nebula-scale-value]");
        const octavesValue = frame.querySelector<HTMLElement>("[data-nebula-octaves-value]");
        const warpValue = frame.querySelector<HTMLElement>("[data-nebula-warp-value]");

        this.bindRange(density, () => this.density, (value) => (this.density = value), densityValue, (value) => value.toFixed(2));
        this.bindRange(scale, () => this.scale, (value) => (this.scale = value), scaleValue, (value) => value.toFixed(2));
        this.bindRange(octaves, () => this.octaves, (value) => (this.octaves = Math.round(value)), octavesValue, (value) => String(Math.round(value)));
        this.bindRange(warp, () => this.warp, (value) => (this.warp = value), warpValue, (value) => value.toFixed(2));

        if (preset) {
            preset.value =
                Object.entries(PRESETS).find(
                    ([, value]) => value.density === this.density && value.scale === this.scale && value.palette === this.palette
                )?.[0] ?? "";

            preset.addEventListener("change", () => {
                const selected = PRESETS[preset.value];
                if (!selected) return;

                this.density = selected.density;
                this.scale = selected.scale;
                this.palette = selected.palette;

                if (density) density.value = String(this.density);
                if (scale) scale.value = String(this.scale);
                if (palette) palette.value = this.palette;
                if (densityValue) densityValue.textContent = this.density.toFixed(2);
                if (scaleValue) scaleValue.textContent = this.scale.toFixed(2);
                this.commit();
            });
        }

        if (palette) {
            palette.value = this.palette;
            palette.addEventListener("change", () => {
                this.palette = PALETTES[palette.value] ? palette.value : "violet";
                this.syncPreset();
                this.commit();
            });
        }

        if (view) {
            view.value = this.view;
            view.addEventListener("change", () => {
                const chosen = view.value;
                if ((VIEWS as readonly string[]).includes(chosen)) {
                    this.view = chosen as ViewMode;
                    this.commit();
                }
            });
        }

        if (variant) {
            variant.value = String(this.variant);
            variant.addEventListener("change", () => {
                const value = Number.parseInt(variant.value, 10);
                this.variant = Number.isFinite(value) ? Math.min(3, Math.max(0, value)) : 0;
                this.commit();
            });
        }

        if (quality) {
            quality.value = this.qualityMode;
            quality.addEventListener("change", () => {
                const chosen = quality.value;
                if ((QUALITIES as readonly string[]).includes(chosen)) {
                    this.qualityMode = chosen as QualityMode;
                    this.frameSamples = [];
                    this.quality = this.qualityMode === "low" ? 0.6 : 1;
                    this.resize();
                    this.commit();
                }
            });
        }

        if (seedInput) {
            seedInput.value = hexSeed(this.seed);
            seedInput.addEventListener("change", () => {
                const raw = seedInput.value.trim().replace(/^0x/i, "");
                if (/^[0-9a-f]{1,8}$/i.test(raw)) {
                    this.seed = Number.parseInt(raw, 16) >>> 0;
                    this.offset = offsetForSeed(this.seed);
                    this.commit();
                } else {
                    seedInput.value = hexSeed(this.seed);
                }
            });
        }

        if (reseed) {
            reseed.addEventListener("click", () => {
                this.seed = this.randomSeed();
                this.offset = offsetForSeed(this.seed);
                this.commit();
            });
        }

        if (copy) {
            copy.addEventListener("click", () => {
                const complete = (label: string): void => {
                    copy.textContent = label;
                    window.setTimeout(() => {
                        copy.textContent = "Copy config";
                    }, 1600);
                };

                if (navigator.clipboard?.writeText) {
                    const url = new URL(this.permalink(), window.location.origin).href;
                    navigator.clipboard.writeText(url).then(
                        () => complete("Copied"),
                        () => complete("Copy failed")
                    );
                } else {
                    complete("Copy failed");
                }
            });
        }

        if (fullscreen) {
            fullscreen.addEventListener("click", () => {
                if (document.fullscreenElement) {
                    void document.exitFullscreen();
                } else if (frame.requestFullscreen) {
                    void frame.requestFullscreen().catch(() => undefined);
                }
            });
        }

        if (link) link.href = this.permalink();
        this.syncHeader();
        this.syncPreset();
    }

    private bindRange(
        input: HTMLInputElement | null,
        get: () => number,
        set: (value: number) => void,
        output: HTMLElement | null,
        format: (value: number) => string
    ): void {
        if (!input) return;

        input.value = String(get());
        if (output) output.textContent = format(get());

        input.addEventListener("input", () => {
            set(this.readNumber(input, get()));
            if (output) output.textContent = format(get());
            this.syncPreset();
            this.commit();
        });
    }

    private syncPreset(): void {
        const preset = this.frame?.querySelector<HTMLSelectElement>("[data-nebula-preset]");
        if (!preset) return;

        preset.value =
            Object.entries(PRESETS).find(
                ([, value]) => value.density === this.density && value.scale === this.scale && value.palette === this.palette
            )?.[0] ?? "";
    }

    private syncHeader(): void {
        const seed = this.frame?.querySelector<HTMLElement>("[data-nebula-seed]");
        const seedInput = this.frame?.querySelector<HTMLInputElement>("[data-nebula-seed-input]");
        const link = this.frame?.querySelector<HTMLAnchorElement>("[data-nebula-link]");
        const mode = this.frame?.querySelector<HTMLElement>("[data-nebula-mode]");

        if (seed) seed.textContent = `seed 0x${hexSeed(this.seed)}`;
        if (seedInput && document.activeElement !== seedInput) seedInput.value = hexSeed(this.seed);
        if (link) link.href = this.permalink();
        if (mode) mode.textContent = `${VIEW_LABELS[this.view]} / ${this.octaves} octaves`;
    }

    private commit(): void {
        this.syncHeader();
        this.writeStateToUrl();
        this.draw();
    }

    private permalink(): string {
        const url = new URL(window.location.href);
        const params = url.searchParams;

        params.set("seed", hexSeed(this.seed));
        params.set("view", this.view);
        params.set("octaves", String(this.octaves));
        params.set("warp", this.warp.toFixed(2));
        params.set("variant", String(this.variant));
        params.set("density", this.density.toFixed(2));
        params.set("scale", this.scale.toFixed(2));
        params.set("palette", this.palette);
        params.set("quality", this.qualityMode);

        return `${url.pathname}${url.search}`;
    }

    private writeStateToUrl(): void {
        if (this.urlHandle) window.clearTimeout(this.urlHandle);
        this.urlHandle = window.setTimeout(() => {
            window.history.replaceState(null, "", this.permalink());
        }, 80);
    }

    private readNumber(input: HTMLInputElement, fallback: number): number {
        const value = Number.parseFloat(input.value);
        if (!Number.isFinite(value)) return fallback;
        const min = Number.parseFloat(input.min);
        const max = Number.parseFloat(input.max);
        return Math.min(Math.max(value, Number.isFinite(min) ? min : value), Number.isFinite(max) ? max : value);
    }

    private randomSeed(): number {
        if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
            const values = new Uint32Array(1);
            crypto.getRandomValues(values);
            return values[0] ?? 0;
        }
        return Math.floor(Math.random() * 0xffffffff) >>> 0;
    }

    private startLoop(): void {
        if (this.running || this.contextLost) return;
        this.running = true;
        this.lastTime = 0;
        this.frameSamples = [];
        // Draw once before waiting for the next frame: a resize can clear the
        // drawing buffer, and a paused loop would otherwise leave it black.
        this.draw();
        this.renderHandle = requestAnimationFrame(this.render);
    }

    private stopLoop(): void {
        this.running = false;
        if (this.renderHandle) {
            cancelAnimationFrame(this.renderHandle);
            this.renderHandle = 0;
        }
    }

    private render = (time: number): void => {
        if (!this.running) return;

        const delta = this.lastTime === 0 ? 0 : Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        this.elapsed += delta;

        if (delta > 0) {
            this.frameSamples.push(delta);
            if (this.frameSamples.length >= 40) {
                this.adaptQuality();
            }
        }

        this.smoothPointer(delta);
        this.draw();
        this.renderHandle = requestAnimationFrame(this.render);
    };

    private adaptQuality(): void {
        if (this.qualityMode !== "adaptive") {
            this.frameSamples = [];
            return;
        }

        const average = this.frameSamples.reduce((sum, value) => sum + value, 0) / this.frameSamples.length;
        this.frameSamples = [];

        if (average > 0.024 && this.quality > 0.55) {
            this.quality = Math.max(0.55, this.quality * 0.82);
            this.resize();
        } else if (average < 0.014 && this.quality < 1) {
            this.quality = Math.min(1, this.quality * 1.12);
            this.resize();
        }
    }

    private smoothPointer(delta: number): void {
        const ease = Math.min(1, delta * 4);
        this.pointer.x += (this.pointerTarget.x - this.pointer.x) * ease;
        this.pointer.y += (this.pointerTarget.y - this.pointer.y) * ease;
    }

    private draw(): void {
        if (this.contextLost) return;
        const { gl } = this;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program);
        gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uniforms.time, this.reducedMotionQuery.matches ? 12 : this.elapsed);
        gl.uniform2f(this.uniforms.offset, this.offset[0], this.offset[1]);
        gl.uniform1f(this.uniforms.density, this.density);
        gl.uniform1f(this.uniforms.scale, this.scale);
        gl.uniform2f(this.uniforms.pointer, this.pointer.x, this.pointer.y);
        gl.uniform1f(this.uniforms.octaves, this.octaves);
        gl.uniform1f(this.uniforms.warp, this.warp);
        gl.uniform1f(this.uniforms.variant, this.variant);
        gl.uniform1f(this.uniforms.view, VIEWS.indexOf(this.view));

        const palette = PALETTES[this.palette] ?? PALETTES.violet;
        gl.uniform3f(this.uniforms.colorA, palette.a[0], palette.a[1], palette.a[2]);
        gl.uniform3f(this.uniforms.colorB, palette.b[0], palette.b[1], palette.b[2]);
        gl.uniform3f(this.uniforms.colorC, palette.c[0], palette.c[1], palette.c[2]);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);

        if (!this.ready) {
            this.ready = true;
            this.frame?.classList.add("is-live");
        }
    }

    private resize = (): void => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2) * this.quality;
        const width = Math.max(1, Math.floor(this.canvas.clientWidth * pixelRatio));
        const height = Math.max(1, Math.floor(this.canvas.clientHeight * pixelRatio));

        if (this.canvas.width === width && this.canvas.height === height) return;

        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        // Resizing the drawing buffer clears it; always repaint the new size.
        this.draw();
    };

    private onIntersection = (entries: IntersectionObserverEntry[]): void => {
        this.visible = entries[0]?.isIntersecting ?? false;
        if (this.visible && !this.reducedMotionQuery.matches) {
            this.startLoop();
        } else {
            this.stopLoop();
        }
    };

    private onVisibilityChange = (): void => {
        if (document.hidden) {
            this.stopLoop();
        } else if (this.visible && !this.reducedMotionQuery.matches) {
            this.startLoop();
        }
    };

    private onFullscreenChange = (): void => {
        window.setTimeout(this.resize, 60);
    };

    private onReducedMotionChange = (): void => {
        if (this.reducedMotionQuery.matches) {
            this.stopLoop();
            this.draw();
        } else if (this.visible) {
            this.startLoop();
        }
    };

    private onPointerMove = (event: PointerEvent): void => {
        if (this.reducedMotionQuery.matches) return;
        const bounds = this.canvas.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) return;
        this.pointerTarget = {
            x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            y: ((event.clientY - bounds.top) / bounds.height) * 2 - 1
        };
    };

    private onPointerLeave = (): void => {
        this.pointerTarget = { x: 0, y: 0 };
    };

    private onContextLost = (event: Event): void => {
        event.preventDefault();
        this.contextLost = true;
        this.stopLoop();
        this.frame?.classList.add("is-fallback");
    };

    private onContextRestored = (): void => {
        this.contextLost = false;
        this.program = this.createProgram();
        this.uniforms = this.getUniforms();
        this.vao = this.createVertexArray();
        this.frame?.classList.remove("is-fallback");
        this.draw();
        if (this.visible && !this.reducedMotionQuery.matches) {
            this.startLoop();
        }
    };

    private createProgram(): WebGLProgram {
        const { gl } = this;
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();

        if (!program) {
            throw new Error("Unable to create nebula program");
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link nebula program");
        }

        return program;
    }

    private compileShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error("Unable to create nebula shader");
        }

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader) ?? "Unable to compile nebula shader");
        }

        return shader;
    }

    private getUniforms(): Uniforms {
        const { gl } = this;
        return {
            resolution: gl.getUniformLocation(this.program, "u_resolution"),
            time: gl.getUniformLocation(this.program, "u_time"),
            offset: gl.getUniformLocation(this.program, "u_offset"),
            density: gl.getUniformLocation(this.program, "u_density"),
            scale: gl.getUniformLocation(this.program, "u_scale"),
            pointer: gl.getUniformLocation(this.program, "u_pointer"),
            colorA: gl.getUniformLocation(this.program, "u_colorA"),
            colorB: gl.getUniformLocation(this.program, "u_colorB"),
            colorC: gl.getUniformLocation(this.program, "u_colorC"),
            octaves: gl.getUniformLocation(this.program, "u_octaves"),
            warp: gl.getUniformLocation(this.program, "u_warp"),
            variant: gl.getUniformLocation(this.program, "u_variant"),
            view: gl.getUniformLocation(this.program, "u_view")
        };
    }

    private createVertexArray(): WebGLVertexArrayObject {
        const vao = this.gl.createVertexArray();
        if (!vao) {
            throw new Error("Unable to create nebula vertex array");
        }
        return vao;
    }
}
