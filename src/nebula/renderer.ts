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
};

const PALETTES: Record<string, { a: Palette; b: Palette; c: Palette }> = {
    violet: { a: [0.80, 0.62, 0.90], b: [0.42, 0.28, 0.62], c: [0.18, 0.11, 0.28] },
    ice: { a: [0.56, 0.82, 0.94], b: [0.22, 0.42, 0.62], c: [0.08, 0.14, 0.22] },
    ember: { a: [0.94, 0.64, 0.42], b: [0.52, 0.28, 0.20], c: [0.20, 0.10, 0.09] }
};

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

export class NebulaRenderer {
    private readonly canvas: HTMLCanvasElement;
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
    private seed = 0;
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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

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
        this.seed = this.readSeed();
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

    private bindControls(): void {
        const frame = this.canvas.closest<HTMLElement>("[data-nebula]");
        if (!frame) return;

        const density = frame.querySelector<HTMLInputElement>("[data-nebula-density]");
        const scale = frame.querySelector<HTMLInputElement>("[data-nebula-scale]");
        const palette = frame.querySelector<HTMLSelectElement>("[data-nebula-palette]");
        const seed = frame.querySelector<HTMLElement>("[data-nebula-seed]");
        const reseed = frame.querySelector<HTMLButtonElement>("[data-nebula-reseed]");

        if (density) {
            density.value = String(this.density);
            density.addEventListener("input", () => {
                this.density = this.readNumber(density, this.density);
                this.draw();
            });
        }

        if (scale) {
            scale.value = String(this.scale);
            scale.addEventListener("input", () => {
                this.scale = this.readNumber(scale, this.scale);
                this.draw();
            });
        }

        if (palette) {
            palette.value = this.palette;
            palette.addEventListener("change", () => {
                this.palette = palette.value;
                this.draw();
            });
        }

        if (seed) {
            seed.textContent = `seed 0x${this.seed.toString(16).padStart(8, "0")}`;
        }

        if (reseed) {
            reseed.addEventListener("click", () => {
                this.seed = this.randomSeed();
                this.offset = offsetForSeed(this.seed);
                if (seed) seed.textContent = `seed 0x${this.seed.toString(16).padStart(8, "0")}`;
                this.writeSeedToUrl();
                this.draw();
            });
        }
    }

    private writeSeedToUrl(): void {
        const url = new URL(window.location.href);
        url.searchParams.set("seed", this.seed.toString(16).padStart(8, "0"));
        window.history.replaceState(null, "", url);
    }

    private readNumber(input: HTMLInputElement, fallback: number): number {
        const value = Number.parseFloat(input.value);
        if (!Number.isFinite(value)) return fallback;
        const min = Number.parseFloat(input.min);
        const max = Number.parseFloat(input.max);
        return Math.min(Math.max(value, Number.isFinite(min) ? min : value), Number.isFinite(max) ? max : value);
    }

    private readSeed(): number {
        const fromUrl = new URLSearchParams(window.location.search).get("seed");
        if (fromUrl && /^[0-9a-f]{1,8}$/i.test(fromUrl)) {
            return Number.parseInt(fromUrl, 16) >>> 0;
        }
        return DEFAULT_SEED;
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

        const palette = PALETTES[this.palette] ?? PALETTES.violet;
        gl.uniform3f(this.uniforms.colorA, palette.a[0], palette.a[1], palette.a[2]);
        gl.uniform3f(this.uniforms.colorB, palette.b[0], palette.b[1], palette.b[2]);
        gl.uniform3f(this.uniforms.colorC, palette.c[0], palette.c[1], palette.c[2]);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);

        if (!this.ready) {
            this.ready = true;
            this.canvas.closest<HTMLElement>("[data-nebula]")?.classList.add("is-live");
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
        this.canvas.closest<HTMLElement>("[data-nebula]")?.classList.add("is-fallback");
    };

    private onContextRestored = (): void => {
        this.contextLost = false;
        this.program = this.createProgram();
        this.uniforms = this.getUniforms();
        this.vao = this.createVertexArray();
        this.canvas.closest<HTMLElement>("[data-nebula]")?.classList.remove("is-fallback");
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
            colorC: gl.getUniformLocation(this.program, "u_colorC")
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
