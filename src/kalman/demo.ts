// Canvas presentation for the synthetic Kalman demo. The filter lives in
// filter.ts; this file owns only controls, history, and drawing.
import { createSyntheticTrack, KalmanFilter1D, rootMeanSquare } from "./filter";
import type { TrackSample } from "./filter";

const TRACK_LENGTH = 160;
const SAMPLE_PERIOD = 0.2;

export class KalmanDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly frame: HTMLElement | null;
    private readonly samples: TrackSample[] = createSyntheticTrack(TRACK_LENGTH);
    private filter: KalmanFilter1D;
    private processNoise = 0.2;
    private measurementNoise = 8;
    private index = 0;
    private estimates: number[] = [];
    private sigmas: number[] = [];
    private errors: number[] = [];
    private measurementErrors: number[] = [];
    private running = false;
    private handle = 0;
    private lastTime = 0;
    private accumulator = 0;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Canvas 2D is not supported");
        }

        this.canvas = canvas;
        this.context = context;
        this.frame = canvas.closest<HTMLElement>("[data-kalman]");
        this.filter = this.createFilter();
        this.resetHistory();
    }

    start(): void {
        this.bindControls();
        this.resize();
        window.addEventListener("resize", this.resize);
        this.draw();
    }

    private createFilter(): KalmanFilter1D {
        return new KalmanFilter1D(this.samples[0]?.measured ?? 0, {
            processNoise: this.processNoise,
            measurementNoise: this.measurementNoise,
            dt: SAMPLE_PERIOD
        });
    }

    private resetHistory(): void {
        this.index = 0;
        this.estimates = [this.filter.position];
        this.sigmas = [this.filter.positionSigma];
        this.errors = [this.filter.position - (this.samples[0]?.truth ?? 0)];
        this.measurementErrors = [(this.samples[0]?.measured ?? 0) - (this.samples[0]?.truth ?? 0)];
    }

    private bindControls(): void {
        if (!this.frame) return;

        const q = this.frame.querySelector<HTMLInputElement>("[data-kalman-q]");
        const r = this.frame.querySelector<HTMLInputElement>("[data-kalman-r]");
        const run = this.frame.querySelector<HTMLButtonElement>("[data-kalman-run]");
        const reset = this.frame.querySelector<HTMLButtonElement>("[data-kalman-reset]");

        if (q) {
            q.value = String(this.processNoise);
            q.addEventListener("input", () => {
                this.processNoise = this.readNumber(q, this.processNoise);
                this.reset();
            });
        }

        if (r) {
            r.value = String(this.measurementNoise);
            r.addEventListener("input", () => {
                this.measurementNoise = this.readNumber(r, this.measurementNoise);
                this.reset();
            });
        }

        run?.addEventListener("click", () => {
            if (this.running) {
                this.pause();
            } else {
                this.run();
            }
        });

        reset?.addEventListener("click", () => this.reset());
    }

    private readNumber(input: HTMLInputElement, fallback: number): number {
        const value = Number.parseFloat(input.value);
        return Number.isFinite(value) ? value : fallback;
    }

    private reset(): void {
        this.pause();
        this.filter = this.createFilter();
        this.resetHistory();
        this.draw();
    }

    private run(): void {
        if (this.index >= this.samples.length - 1) {
            this.reset();
        }

        this.running = true;
        this.lastTime = 0;
        this.accumulator = 0;
        this.setRunLabel("Pause");
        this.handle = requestAnimationFrame(this.tick);
    }

    private pause(): void {
        this.running = false;
        if (this.handle) {
            cancelAnimationFrame(this.handle);
            this.handle = 0;
        }
        this.setRunLabel("Run");
    }

    private setRunLabel(label: string): void {
        const button = this.frame?.querySelector<HTMLButtonElement>("[data-kalman-run]");
        if (button) button.textContent = label;
    }

    private tick = (time: number): void => {
        if (!this.running) return;

        if (this.lastTime === 0) {
            this.lastTime = time;
        }

        this.accumulator += Math.min(time - this.lastTime, 100);
        this.lastTime = time;

        while (this.accumulator >= 90 && this.index < this.samples.length - 1) {
            this.advance();
            this.accumulator -= 90;
        }

        this.draw();

        if (this.index >= this.samples.length - 1) {
            this.pause();
        } else {
            this.handle = requestAnimationFrame(this.tick);
        }
    };

    private advance(): void {
        const sample = this.samples[this.index + 1];
        if (!sample) return;

        this.filter.predict();
        this.filter.update(sample.measured);
        this.index += 1;
        this.estimates.push(this.filter.position);
        this.sigmas.push(this.filter.positionSigma);
        this.errors.push(this.filter.position - sample.truth);
        this.measurementErrors.push(sample.measured - sample.truth);
    }

    private resize = (): void => {
        const pixelRatio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(this.canvas.clientWidth * pixelRatio));
        const height = Math.max(1, Math.floor(this.canvas.clientHeight * pixelRatio));

        if (this.canvas.width === width && this.canvas.height === height) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        this.draw();
    };

    private draw(): void {
        const context = this.context;
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        if (width < 2 || height < 2) return;

        context.clearRect(0, 0, width, height);
        context.fillStyle = "#120d18";
        context.fillRect(0, 0, width, height);

        const left = 54;
        const right = 18;
        const top = 18;
        const bottom = 36;
        const plotWidth = Math.max(1, width - left - right);
        const plotHeight = Math.max(1, height - top - bottom);
        const values = [
            ...this.samples.map((sample) => sample.truth),
            ...this.samples.map((sample) => sample.measured),
            ...this.estimates.map((estimate, index) => estimate + 2 * (this.sigmas[index] ?? 0)),
            ...this.estimates.map((estimate, index) => estimate - 2 * (this.sigmas[index] ?? 0))
        ];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = Math.max(1, (max - min) * 0.08);
        const low = min - padding;
        const high = max + padding;
        const xFor = (index: number): number => left + (index / (this.samples.length - 1)) * plotWidth;
        const yFor = (value: number): number => top + (1 - (value - low) / (high - low)) * plotHeight;

        context.strokeStyle = "#403248";
        context.lineWidth = 1;
        context.font = "11px 'DM Mono', monospace";
        context.fillStyle = "#9a8da0";
        context.textAlign = "right";
        context.textBaseline = "middle";

        for (let step = 0; step <= 4; step++) {
            const value = low + ((high - low) * step) / 4;
            const y = yFor(value);
            context.beginPath();
            context.moveTo(left, y);
            context.lineTo(width - right, y);
            context.stroke();
            context.fillText(value.toFixed(0), left - 8, y);
        }

        context.textAlign = "left";
        context.fillText("time →", left, height - 12);
        context.textAlign = "right";
        context.fillText("synthetic position", width - right, height - 12);

        // Full truth path, faint, so the current estimate has context.
        context.strokeStyle = "rgba(238, 232, 242, 0.26)";
        context.lineWidth = 1.5;
        context.beginPath();
        this.samples.forEach((sample, index) => {
            const x = xFor(index);
            const y = yFor(sample.truth);
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        });
        context.stroke();

        // ±2σ band around the estimate.
        const last = this.index;
        context.beginPath();
        for (let index = 0; index <= last; index++) {
            const x = xFor(index);
            const y = yFor((this.estimates[index] ?? 0) + 2 * (this.sigmas[index] ?? 0));
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        for (let index = last; index >= 0; index--) {
            context.lineTo(xFor(index), yFor((this.estimates[index] ?? 0) - 2 * (this.sigmas[index] ?? 0)));
        }
        context.closePath();
        context.fillStyle = "rgba(197, 154, 216, 0.13)";
        context.fill();

        // Measurements.
        context.fillStyle = "#d8c9df";
        for (let index = 0; index <= last; index++) {
            const sample = this.samples[index];
            context.beginPath();
            context.arc(xFor(index), yFor(sample.measured), 2, 0, Math.PI * 2);
            context.fill();
        }

        // Filtered estimate.
        context.strokeStyle = "#5be584";
        context.lineWidth = 2.2;
        context.beginPath();
        for (let index = 0; index <= last; index++) {
            const x = xFor(index);
            const y = yFor(this.estimates[index] ?? 0);
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }
        context.stroke();

        // Current state marker.
        context.fillStyle = "#f2ecf5";
        context.beginPath();
        context.arc(xFor(last), yFor(this.estimates[last] ?? 0), 4, 0, Math.PI * 2);
        context.fill();

        this.updateReadout();
    }

    private updateReadout(): void {
        const readout = this.frame?.querySelector<HTMLElement>("[data-kalman-readout]");
        if (!readout) return;

        const filterRmse = rootMeanSquare(this.errors);
        const measurementRmse = rootMeanSquare(this.measurementErrors);
        readout.textContent = `Step ${this.index} / ${this.samples.length - 1} · estimate ${this.filter.position.toFixed(2)} · velocity ${this.filter.velocity.toFixed(2)} · RMSE ${filterRmse.toFixed(2)} (raw ${measurementRmse.toFixed(2)})`;
    }
}
