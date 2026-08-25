import { Mandelbrot } from "./mandelbrot";
import fragmentShaderSource from "./shaders/mandelbrot.glsl?raw";
import vertexShaderSource from "./shaders/vertex.glsl?raw";

export class ChaosRenderer {
    private static readonly seedColumns = 260;
    private static readonly seedRows = 170;
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private mandelbrot: Mandelbrot;
    private program: WebGLProgram;
    private seedCount = ChaosRenderer.seedColumns * ChaosRenderer.seedRows;
    private dragging = false;
    private lastPointer = { x: 0, y: 0 };
    private renderScheduled = false;

    constructor(
        canvas: HTMLCanvasElement,
        mandelbrot: Mandelbrot
    ) {
        this.canvas = canvas;
        this.mandelbrot = mandelbrot;

        const gl = canvas.getContext("webgl2");

        if (!gl) {
            throw new Error("WebGL2 is not supported");
        }

        this.gl = gl;
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    }

    start(): void {
        this.resize();

        window.addEventListener("resize", this.resize);
        this.canvas.addEventListener("pointerdown", this.onPointerDown);
        this.canvas.addEventListener("pointermove", this.onPointerMove);
        this.canvas.addEventListener("pointerup", this.onPointerUp);
        this.canvas.addEventListener("pointerleave", this.onPointerUp);
        this.canvas.addEventListener("wheel", this.onWheel, { passive: false });

        this.requestRender();
    }

    private resize = (): void => {
        const pixelRatio = window.devicePixelRatio || 1;

        this.canvas.width =
            Math.floor(this.canvas.clientWidth * pixelRatio);

        this.canvas.height =
            Math.floor(this.canvas.clientHeight * pixelRatio);

        this.gl.viewport(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        if (this.program) {
            this.updateUniforms();
        }

        this.requestRender();
    };

    private requestRender(): void {
        if (this.renderScheduled) return;

        this.renderScheduled = true;
        requestAnimationFrame(this.render);
    }

    private render = (): void => {
        this.renderScheduled = false;
        const { gl } = this;

        gl.clearColor(0.06, 0.03, 0.10, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.drawArraysInstanced(gl.POINTS, 0, this.seedCount, this.mandelbrot.iterations);
    };

    private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const { gl } = this;
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram();

        if (!program) {
            throw new Error("Unable to create WebGL program");
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link WebGL program");
        }

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        const seeds = new Float32Array(this.seedCount * 2);
        for (let row = 0; row < ChaosRenderer.seedRows; row++) {
            for (let column = 0; column < ChaosRenderer.seedColumns; column++) {
                const index = (row * ChaosRenderer.seedColumns + column) * 2;
                seeds[index] = (column / (ChaosRenderer.seedColumns - 1)) * 2 - 1;
                seeds[index + 1] = (row / (ChaosRenderer.seedRows - 1)) * 2 - 1;
            }
        }

        gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

        const seed = gl.getAttribLocation(program, "seed");
        gl.enableVertexAttribArray(seed);
        gl.vertexAttribPointer(seed, 2, gl.FLOAT, false, 0, 0);
        gl.useProgram(program);
        gl.uniform2f(gl.getUniformLocation(program, "resolution"), this.canvas.width, this.canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, "center"), this.mandelbrot.centerX, this.mandelbrot.centerY);
        gl.uniform1f(gl.getUniformLocation(program, "zoom"), this.mandelbrot.zoom);
        gl.uniform1i(gl.getUniformLocation(program, "iterations"), this.mandelbrot.iterations);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        return program;
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error("Unable to create WebGL shader");
        }

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(this.gl.getShaderInfoLog(shader) ?? "Unable to compile WebGL shader");
        }

        return shader;
    }

    private updateUniforms(): void {
        const { gl } = this;
        gl.uniform2f(gl.getUniformLocation(this.program, "resolution"), this.canvas.width, this.canvas.height);
        gl.uniform2f(gl.getUniformLocation(this.program, "center"), this.mandelbrot.centerX, this.mandelbrot.centerY);
        gl.uniform1f(gl.getUniformLocation(this.program, "zoom"), this.mandelbrot.zoom);
        gl.uniform1i(gl.getUniformLocation(this.program, "iterations"), this.mandelbrot.iterations);
    }

    private onPointerDown = (event: PointerEvent): void => {
        this.dragging = true;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        this.canvas.setPointerCapture(event.pointerId);
    };

    private onPointerMove = (event: PointerEvent): void => {
        if (!this.dragging) return;
        const scale = 2 / Math.min(this.canvas.clientWidth, this.canvas.clientHeight);
        this.mandelbrot.pan((event.clientX - this.lastPointer.x) * scale, (event.clientY - this.lastPointer.y) * scale);
        this.lastPointer = { x: event.clientX, y: event.clientY };
        this.updateUniforms();
        this.requestRender();
    };

    private onPointerUp = (): void => {
        this.dragging = false;
    };

    private onWheel = (event: WheelEvent): void => {
        event.preventDefault();
        const bounds = this.canvas.getBoundingClientRect();
        const scale = 2 / Math.min(this.canvas.clientWidth, this.canvas.clientHeight);
        const originX = (event.clientX - bounds.left - bounds.width / 2) * scale / this.mandelbrot.zoom + this.mandelbrot.centerX;
        const originY = -(event.clientY - bounds.top - bounds.height / 2) * scale / this.mandelbrot.zoom + this.mandelbrot.centerY;
        this.mandelbrot.scale(Math.exp(event.deltaY * 0.001), originX, originY);
        this.updateUniforms();
        this.requestRender();
    };
}