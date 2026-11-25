// HPC benchmark explorer.
//
// A small horizontal bar chart over measured data. It is deliberately not a
// general charting library: four fixed datasets, one drawing routine, and no
// interpolation between measured points. The page around it carries the same
// numbers as an HTML table, so the canvas is an enhancement rather than the
// only way to read the result.
import { BENCH_DATASETS } from "./bench-data";

const TEXT = "#e6e2d8";
const MUTED = "#b3b8b3";
const DIM = "#858c89";
const BORDER = "#2b3439";

function niceStep(raw: number): number {
    if (!Number.isFinite(raw) || raw <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(raw));
    const n = raw / power;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * power;
}

function formatValue(value: number): string {
    return value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatTick(value: number): string {
    return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export class BenchExplorer {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly frame: HTMLElement | null;
    private readonly readout: HTMLElement | null;
    private readonly note: HTMLElement | null;
    private readonly buttons: HTMLButtonElement[];
    private readonly resizeObserver: ResizeObserver;
    private datasetIndex = 0;
    private hoverRow = -1;
    private hoverSeries = -1;
    private cssHeight = 320;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Canvas 2D is not supported");
        }

        this.canvas = canvas;
        this.context = context;
        this.frame = canvas.closest<HTMLElement>("[data-bench]");
        this.readout = this.frame?.querySelector<HTMLElement>("[data-bench-readout]") ?? null;
        this.note = this.frame?.querySelector<HTMLElement>("[data-bench-note]") ?? null;
        this.buttons = [...(this.frame?.querySelectorAll<HTMLButtonElement>("[data-bench-view]") ?? [])];
        this.resizeObserver = new ResizeObserver(this.draw);
    }

    start(): void {
        this.bindControls();
        this.resizeObserver.observe(this.canvas);
        window.addEventListener("resize", this.draw);
        this.canvas.addEventListener("pointermove", this.onPointerMove);
        this.canvas.addEventListener("pointerdown", this.onPointerMove);
        this.canvas.addEventListener("pointerleave", this.onPointerLeave);
        this.select(0);
    }

    private bindControls(): void {
        this.buttons.forEach((button, index) => {
            button.addEventListener("click", () => this.select(index));
        });
    }

    private select(index: number): void {
        const dataset = BENCH_DATASETS[index];
        if (!dataset) return;

        this.datasetIndex = index;
        this.hoverRow = -1;
        this.hoverSeries = -1;
        this.buttons.forEach((button, buttonIndex) => {
            button.setAttribute("aria-pressed", buttonIndex === index ? "true" : "false");
        });
        this.canvas.setAttribute(
            "aria-label",
            `${dataset.title}. ${dataset.subtitle} ${dataset.series.map((series) => series.name).join(", ")}. Values in ${dataset.unit}. The full data table is below the chart.`
        );
        this.setReadout(`${dataset.title} — ${dataset.subtitle}`);
        if (this.note) this.note.textContent = dataset.note;
        this.draw();
    }

    private setReadout(text: string): void {
        if (this.readout) this.readout.textContent = text;
    }

    private layout(): { width: number; left: number; right: number; top: number; bottom: number; rowHeight: number } | null {
        const width = this.canvas.clientWidth;
        if (width < 80) return null;

        const dataset = BENCH_DATASETS[this.datasetIndex];
        const narrow = width < 560;
        const left = narrow ? 96 : 150;
        const right = narrow ? 14 : 18;
        const top = 8;
        // Four legend entries do not fit on one line at phone widths; reserve a
        // second row rather than clipping the last series out of the key.
        const legendRows = dataset.series.length > 1 ? (narrow && dataset.series.length > 3 ? 2 : 1) : 0;
        const bottom = dataset.series.length > 1 ? 39 + legendRows * 13 : 34;
        const rowHeight = dataset.series.length > 1 ? dataset.series.length * 15 + 11 : 36;
        const height = Math.max(200, top + dataset.categories.length * rowHeight + bottom);

        this.cssHeight = height;
        this.canvas.style.height = `${height}px`;
        return { width, left, right, top, bottom, rowHeight };
    }

    private draw = (): void => {
        const layout = this.layout();
        const dataset = BENCH_DATASETS[this.datasetIndex];
        if (!layout) return;

        const { width, left, right, top, rowHeight } = layout;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const height = this.cssHeight;

        if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);
        }

        const context = this.context;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#10161a";
        context.fillRect(0, 0, width, height);

        const narrow = width < 560;
        const valueRoom = narrow ? 0 : 58;
        const plotWidth = Math.max(20, width - left - right - valueRoom);
        const scale = plotWidth / dataset.max;

        // Grid and ticks
        const step = niceStep(dataset.max / 4);
        context.font = `${narrow ? 9 : 10}px "IBM Plex Mono", monospace`;
        context.textBaseline = "top";

        for (let tick = 0; tick <= dataset.max + 0.001; tick += step) {
            const x = left + tick * scale;
            context.strokeStyle = tick === 0 ? BORDER : "rgba(43, 52, 57, 0.55)";
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(Math.round(x) + 0.5, top);
            context.lineTo(Math.round(x) + 0.5, height - 26);
            context.stroke();

            context.fillStyle = DIM;
            context.textAlign = tick === 0 ? "left" : "center";
            context.fillText(formatTick(tick), x, height - 22);
        }

        // On phones the last tick label reaches the right edge, so the unit would
        // collide with it. The readout above the chart names the unit instead.
        if (!narrow) {
            context.fillStyle = DIM;
            context.textAlign = "right";
            context.font = '10px "IBM Plex Mono", monospace';
            context.fillText(dataset.axisLabel, width - right, height - 22);
        }

        // Rows
        dataset.categories.forEach((category, row) => {
            const rowTop = top + row * rowHeight;

            if (row === this.hoverRow) {
                context.fillStyle = "rgba(217, 138, 95, 0.08)";
                context.fillRect(0, rowTop, width, rowHeight);
            }

            context.fillStyle = row === this.hoverRow ? TEXT : MUTED;
            context.font = `${narrow ? 9 : 11}px "IBM Plex Mono", monospace`;
            context.textAlign = "right";
            context.textBaseline = "middle";
            context.fillText(
                this.fitText(category, left - 12),
                left - 12,
                rowTop + rowHeight / 2
            );

            const barHeight = dataset.series.length > 1 ? 9 : 15;
            const seriesStep = dataset.series.length > 1 ? 15 : 0;
            const firstY = rowTop + (rowHeight - (dataset.series.length * seriesStep - 6)) / 2 - 1;

            dataset.series.forEach((series, seriesIndex) => {
                const value = series.values[row] ?? 0;
                const length = Math.max(1, value * scale);
                const y = firstY + seriesIndex * seriesStep;
                const active = row === this.hoverRow && seriesIndex === this.hoverSeries;

                context.fillStyle = series.color;
                context.globalAlpha = this.hoverRow === -1 || active ? 1 : 0.55;
                context.fillRect(left, y, length, barHeight);
                context.globalAlpha = 1;

                if (active) {
                    context.strokeStyle = TEXT;
                    context.lineWidth = 1;
                    context.strokeRect(left - 0.5, y - 0.5, length + 1, barHeight + 1);
                }

                const range = seriesIndex === 0 ? dataset.ranges?.[row] : undefined;

                if (range) {
                    const minX = left + range.min * scale;
                    const maxX = left + range.max * scale;

                    if (maxX - minX >= 1.5) {
                        const midY = y + barHeight / 2;
                        context.strokeStyle = "rgba(230, 226, 216, 0.75)";
                        context.lineWidth = 1;
                        context.beginPath();
                        context.moveTo(minX, midY);
                        context.lineTo(maxX, midY);
                        context.moveTo(minX, midY - 3);
                        context.lineTo(minX, midY + 3);
                        context.moveTo(maxX, midY - 3);
                        context.lineTo(maxX, midY + 3);
                        context.stroke();
                    }
                }

                if (!narrow) {
                    const text = formatValue(value);
                    const textX = Math.min(left + length + 6, width - right - 2);
                    context.fillStyle = active ? TEXT : MUTED;
                    context.font = '10px "IBM Plex Mono", monospace';
                    context.textAlign = "left";
                    context.textBaseline = "middle";
                    context.fillText(text, textX, y + barHeight / 2);
                }
            });
        });

        // Legend for multi-series datasets. Entries wrap to a second row at
        // phone widths so the last series is never clipped out of the key.
        if (dataset.series.length > 1) {
            context.textBaseline = "middle";
            context.font = `${narrow ? 8 : 9}px "IBM Plex Mono", monospace`;
            const legendRows = narrow && dataset.series.length > 3 ? 2 : 1;
            const firstLineY = height - 43 - (legendRows - 1) * 13;
            const gap = 26;
            let x = left;
            let line = 0;

            dataset.series.forEach((series) => {
                const entryWidth = 13 + context.measureText(series.name).width + gap;

                if (x + entryWidth > width - right && x > left) {
                    line += 1;
                    x = left;
                }

                const y = firstLineY + line * 13;
                context.fillStyle = series.color;
                context.fillRect(x, y - 2, 9, 4);
                context.fillStyle = MUTED;
                context.textAlign = "left";
                context.fillText(series.name, x + 13, y);
                x += entryWidth;
            });
        }

        // Plot edge
        context.strokeStyle = BORDER;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(left + 0.5, top - 3);
        context.lineTo(left + 0.5, height - 26);
        context.stroke();
    };

    private fitText(text: string, maxWidth: number): string {
        if (this.context.measureText(text).width <= maxWidth) return text;

        let cut = text;
        while (cut.length > 3 && this.context.measureText(`${cut}…`).width > maxWidth) {
            cut = cut.slice(0, -1);
        }
        return `${cut}…`;
    }

    private onPointerMove = (event: PointerEvent): void => {
        const layout = this.layout();
        const dataset = BENCH_DATASETS[this.datasetIndex];
        if (!layout) return;

        const bounds = this.canvas.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;

        if (x < 0 || y < layout.top || y > layout.top + dataset.categories.length * layout.rowHeight) {
            this.clearHover();
            return;
        }

        const row = Math.min(
            dataset.categories.length - 1,
            Math.max(0, Math.floor((y - layout.top) / layout.rowHeight))
        );
        const rowTop = layout.top + row * layout.rowHeight;
        const inner = y - rowTop;
        let seriesIndex = 0;

        if (dataset.series.length > 1) {
            const firstY = (layout.rowHeight - (dataset.series.length * 15 - 6)) / 2 - 1;
            seriesIndex = Math.min(
                dataset.series.length - 1,
                Math.max(0, Math.round((inner - firstY) / 15))
            );
        }

        if (row === this.hoverRow && seriesIndex === this.hoverSeries) return;

        this.hoverRow = row;
        this.hoverSeries = seriesIndex;
        const series = dataset.series[seriesIndex];
        this.setReadout(
            `${dataset.categories[row]} — ${series.name}: ${formatValue(series.values[row] ?? 0)} ${dataset.unit}`
        );
        this.draw();
    };

    private onPointerLeave = (): void => {
        this.clearHover();
    };

    private clearHover(): void {
        if (this.hoverRow === -1 && this.hoverSeries === -1) return;
        this.hoverRow = -1;
        this.hoverSeries = -1;
        const dataset = BENCH_DATASETS[this.datasetIndex];
        this.setReadout(`${dataset.title} — ${dataset.subtitle}`);
        this.draw();
    }
}
