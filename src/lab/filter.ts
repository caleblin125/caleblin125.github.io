// Sallen-Key beacon filter response model.
//
// This is a model, not a swept measurement. Each second-order bandpass section
// is anchored at the published first-stage Monte Carlo result (f0 = 2000.33 Hz,
// Q = 20.3), and three identical sections stand in for the built sixth-order
// receiver. The page says so in the heading, the caption, and the note, because
// a clean curve is easy to mistake for measured data.
const F_MIN = 1000;
const F_MAX = 4000;
const DB_MAX = 6;
const DB_MIN = -72;
const MUTED = "#b9acbe";
const DIM = "#9a8da0";
const BORDER = "#51425a";
const ACCENT = "#c59ad8";
const GHOST = "#6f6078";

/** Normalized magnitude of one second-order bandpass section. */
function sectionGain(frequency: number, center: number, q: number): number {
    const ratio = frequency / center;
    const real = 1 - ratio * ratio;
    const imaginary = ratio / q;
    return imaginary / Math.sqrt(real * real + imaginary * imaginary);
}

function cascadeDb(frequency: number, center: number, q: number, stages: number): number {
    const gain = sectionGain(frequency, center, q);
    if (gain <= 0) return DB_MIN;
    return Math.max(DB_MIN, Math.min(DB_MAX, 20 * stages * Math.log10(gain)));
}

/** −3 dB bandwidth of the cascade, found by bisection from the center. */
function bandwidth(center: number, q: number, stages: number): number {
    const threshold = 1 / Math.SQRT2;
    const target = threshold ** (1 / stages);
    const solve = (direction: number): number => {
        let inside = center;
        let outside = direction > 0 ? center * 4 : center / 4;

        for (let i = 0; i < 60; i += 1) {
            const mid = (inside + outside) / 2;
            if (sectionGain(mid, center, q) > target) {
                inside = mid;
            } else {
                outside = mid;
            }
        }

        return outside;
    };

    return solve(1) - solve(-1);
}

export class FilterModel {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly frame: HTMLElement | null;
    private readonly f0Input: HTMLInputElement | null;
    private readonly qInput: HTMLInputElement | null;
    private readonly stagesInput: HTMLSelectElement | null;
    private readonly readout: HTMLElement | null;
    private readonly resizeObserver: ResizeObserver;
    private center = 2000.33;
    private q = 20.3;
    private stages = 3;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Canvas 2D is not supported");
        }

        this.canvas = canvas;
        this.context = context;
        this.frame = canvas.closest<HTMLElement>("[data-filter]");
        this.f0Input = this.frame?.querySelector<HTMLInputElement>("[data-filter-f0]") ?? null;
        this.qInput = this.frame?.querySelector<HTMLInputElement>("[data-filter-q]") ?? null;
        this.stagesInput = this.frame?.querySelector<HTMLSelectElement>("[data-filter-stages]") ?? null;
        this.readout = this.frame?.querySelector<HTMLElement>("[data-filter-readout]") ?? null;
        this.resizeObserver = new ResizeObserver(this.draw);
    }

    start(): void {
        this.bindControls();
        this.resizeObserver.observe(this.canvas);
        window.addEventListener("resize", this.draw);
        this.update();
    }

    private bindControls(): void {
        const f0Input = this.f0Input;
        const qInput = this.qInput;
        const stagesInput = this.stagesInput;

        if (f0Input) {
            f0Input.value = String(this.center);
            f0Input.addEventListener("input", () => {
                this.center = this.readNumber(f0Input, this.center);
                this.update();
            });
        }

        if (qInput) {
            qInput.value = String(this.q);
            qInput.addEventListener("input", () => {
                this.q = this.readNumber(qInput, this.q);
                this.update();
            });
        }

        if (stagesInput) {
            stagesInput.value = String(this.stages);
            stagesInput.addEventListener("change", () => {
                const value = Number.parseInt(stagesInput.value, 10);
                this.stages = Number.isFinite(value) ? Math.min(3, Math.max(1, value)) : 3;
                this.update();
            });
        }
    }

    private readNumber(input: HTMLInputElement, fallback: number): number {
        const value = Number.parseFloat(input.value);
        if (!Number.isFinite(value)) return fallback;
        const min = Number.parseFloat(input.min);
        const max = Number.parseFloat(input.max);
        return Math.min(Math.max(value, Number.isFinite(min) ? min : value), Number.isFinite(max) ? max : value);
    }

    private update(): void {
        const f0Value = this.frame?.querySelector<HTMLElement>("[data-filter-f0-value]");
        const qValue = this.frame?.querySelector<HTMLElement>("[data-filter-q-value]");

        if (f0Value) f0Value.textContent = `${this.center.toFixed(1)} Hz`;
        if (qValue) qValue.textContent = this.q.toFixed(1);

        // With one section there is no separate cascade curve, so the legend
        // must not claim two. The ghost entry is hidden and the solid label
        // changes to what is actually drawn.
        const single = this.stages === 1;
        this.frame?.classList.toggle("is-single", single);
        const modelLabel = this.frame?.querySelector<HTMLElement>("[data-filter-model-label]");
        if (modelLabel) modelLabel.textContent = single ? "single section" : "cascade model";

        const bw = bandwidth(this.center, this.q, this.stages);

        if (this.readout) {
            const low = cascadeDb(1500, this.center, this.q, this.stages);
            const high = cascadeDb(2500, this.center, this.q, this.stages);
            this.readout.textContent = `f0 ${this.center.toFixed(1)} Hz · Q ${this.q.toFixed(1)} · ${this.stages} stage${this.stages === 1 ? "" : "s"} · −3 dB bandwidth ${bw.toFixed(1)} Hz · 1.5 kHz ${low.toFixed(1)} dB · 2.5 kHz ${high.toFixed(1)} dB`;
        }

        this.canvas.setAttribute(
            "aria-label",
            `Modeled response of ${this.stages} cascaded second-order bandpass stage${this.stages === 1 ? "" : "s"} centered at ${this.center.toFixed(1)} hertz with Q ${this.q.toFixed(1)}. The model shows about ${bw.toFixed(0)} hertz of minus three decibel bandwidth and strong rejection at the 1.5 and 2.5 kilohertz beacon tones.`
        );
        this.draw();
    }

    private draw = (): void => {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        if (width < 80 || height < 120) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);
        }

        const context = this.context;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#120d18";
        context.fillRect(0, 0, width, height);

        const left = width < 520 ? 38 : 48;
        const right = 16;
        const top = 16;
        const bottom = 34;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;

        const xFor = (frequency: number): number =>
            left + (Math.log(frequency / F_MIN) / Math.log(F_MAX / F_MIN)) * plotWidth;
        const yFor = (db: number): number => top + ((DB_MAX - db) / (DB_MAX - DB_MIN)) * plotHeight;

        // Horizontal dB grid
        context.font = `${width < 520 ? 9 : 10}px "DM Mono", monospace`;
        context.textAlign = "right";
        context.textBaseline = "middle";

        for (let db = 0; db >= DB_MIN; db -= 10) {
            const y = yFor(db);
            context.strokeStyle = db === 0 || db === -3 ? "rgba(81, 66, 90, 0.85)" : "rgba(81, 66, 90, 0.35)";
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(left, Math.round(y) + 0.5);
            context.lineTo(width - right, Math.round(y) + 0.5);
            context.stroke();
            context.fillStyle = DIM;
            context.fillText(`${db}`, left - 7, y);
        }

        // Frequency grid
        const ticks = [1000, 1500, 2000, 2500, 3000, 4000];
        context.textAlign = "center";
        context.textBaseline = "top";

        for (const frequency of ticks) {
            const x = xFor(frequency);
            context.strokeStyle = "rgba(81, 66, 90, 0.35)";
            context.beginPath();
            context.moveTo(Math.round(x) + 0.5, top);
            context.lineTo(Math.round(x) + 0.5, height - bottom);
            context.stroke();
            context.fillStyle = DIM;
            context.fillText(frequency === 1000 ? "1 kHz" : `${frequency / 1000} kHz`, x, height - bottom + 7);
        }

        // Beacon tones
        context.setLineDash([4, 4]);
        for (const frequency of [1500, 2500]) {
            const x = xFor(frequency);
            context.strokeStyle = "rgba(197, 154, 216, 0.4)";
            context.beginPath();
            context.moveTo(Math.round(x) + 0.5, top);
            context.lineTo(Math.round(x) + 0.5, height - bottom);
            context.stroke();
        }
        context.setLineDash([]);

        const drawCurve = (stages: number, color: string, lineWidth: number, dash: number[]): void => {
            context.setLineDash(dash);
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.beginPath();

            const samples = Math.max(220, Math.round(plotWidth));
            for (let i = 0; i <= samples; i += 1) {
                const frequency = F_MIN * (F_MAX / F_MIN) ** (i / samples);
                const x = xFor(frequency);
                const y = yFor(cascadeDb(frequency, this.center, this.q, stages));
                if (i === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            }

            context.stroke();
            context.setLineDash([]);
        };

        if (this.stages > 1) {
            drawCurve(1, GHOST, 1, [5, 5]);
        }
        drawCurve(this.stages, ACCENT, 1.8, []);

        // −3 dB line and rejection markers
        const minusThree = yFor(-3);
        context.strokeStyle = "rgba(238, 232, 242, 0.28)";
        context.setLineDash([2, 5]);
        context.beginPath();
        context.moveTo(left, minusThree);
        context.lineTo(width - right, minusThree);
        context.stroke();
        context.setLineDash([]);

        for (const frequency of [1500, 2500]) {
            const x = xFor(frequency);
            const y = yFor(cascadeDb(frequency, this.center, this.q, this.stages));
            context.fillStyle = "#120d18";
            context.strokeStyle = ACCENT;
            context.lineWidth = 1.5;
            context.beginPath();
            context.arc(x, y, 3.2, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        }

        // Axis titles
        context.fillStyle = MUTED;
        context.font = `${width < 520 ? 9 : 10}px "DM Mono", monospace`;
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillText("dB, normalized", left, 0);
        context.textAlign = "right";
        context.fillText("frequency", width - right, height - bottom + 20);

        // Plot frame
        context.strokeStyle = BORDER;
        context.lineWidth = 1;
        context.strokeRect(left + 0.5, top + 0.5, plotWidth - 1, plotHeight - 1);
    };
}
