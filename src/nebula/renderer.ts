/**
 * Site adapter for the nebula engine.
 *
 * The engine (`engine/Renderer.ts`) only knows parameters, GL state and a
 * clock. This module owns everything a page needs around it: URL state, the
 * `data-nebula-*` control contract, seeding, reduced motion, and pausing the
 * loop when the canvas is offscreen or the tab is hidden.
 */

import { defaultParameters } from "./controls";
import { Renderer } from "./engine/Renderer";
import {
    ADVANCED_CONTROLS,
    DEFAULT_PARAMETERS,
    PRIMARY_CONTROLS,
    clampParameter,
    formatParameter,
    isPaletteId,
    modeLabel,
    type NebulaParameters,
    type NumericParameter,
    type RangeControl,
} from "./parameters";
import { applyPreset, detectPreset, presetById } from "./presets";
import { normalizeSeed, randomSeed } from "./random";

type DebugId = "final" | "density" | "cloud" | "filament" | "shape" | "mask";
type QualityMode = "adaptive" | "high" | "low";

const DEBUG_VIEWS: ReadonlyArray<{ id: DebugId; label: string; value: number }> = [
    { id: "final", label: "Final image", value: 0 },
    { id: "density", label: "Density", value: 1 },
    { id: "cloud", label: "Cloud base", value: 2 },
    { id: "filament", label: "Filaments", value: 3 },
    { id: "shape", label: "Shape field", value: 4 },
    { id: "mask", label: "Mask", value: 5 },
];

/** Structure and light values written to the URL, one key each. */
const NUMERIC_KEYS = [
    "density",
    "scale",
    "warp",
    "octaves",
    "detail",
    "lacunarity",
    "persistence",
    "rotation",
    "emission",
    "exposure",
    "starDensity",
    "vignette",
    "animationSpeed",
] as const satisfies readonly NumericParameter[];

const CONTROL_BY_KEY = new Map<string, RangeControl>(
    [...PRIMARY_CONTROLS, ...ADVANCED_CONTROLS].map((control) => [control.key, control]),
);

const QUALITY_SETTINGS: Record<QualityMode, { adaptiveQuality: boolean; renderScale: number }> = {
    adaptive: { adaptiveQuality: true, renderScale: 1 },
    high: { adaptiveQuality: false, renderScale: 1 },
    low: { adaptiveQuality: false, renderScale: 0.6 },
};

function isQualityMode(value: string | null): value is QualityMode {
    return value === "adaptive" || value === "high" || value === "low";
}

function isDebugId(value: string | null): value is DebugId {
    return DEBUG_VIEWS.some((view) => view.id === value);
}

function debugValue(id: DebugId): number {
    return DEBUG_VIEWS.find((view) => view.id === id)?.value ?? 0;
}

function parseSeed(raw: string | null): number {
    if (!raw) return 1;
    const text = raw.trim();
    if (/^0x[0-9a-f]+$/i.test(text)) {
        return normalizeSeed(Number.parseInt(text.slice(2), 16));
    }
    return normalizeSeed(Number.parseInt(text, 10));
}

function setNumeric(parameters: NebulaParameters, key: NumericParameter, value: number): void {
    (parameters as unknown as Record<string, number>)[key] = value;
}

function formatNumber(value: number): string {
    return String(Number(value.toFixed(3)));
}

function applyQuality(parameters: NebulaParameters, quality: QualityMode): void {
    const settings = QUALITY_SETTINGS[quality];
    parameters.adaptiveQuality = settings.adaptiveQuality;
    parameters.renderScale = settings.renderScale;
}

export class NebulaRenderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly frame: HTMLElement | null;
    private readonly defaults: NebulaParameters;
    private readonly reducedMotion: MediaQueryList;
    private readonly intersectionObserver: IntersectionObserver | null;

    private renderer: Renderer | null = null;
    private parameters: NebulaParameters;
    private debugId: DebugId = "final";
    private quality: QualityMode = "adaptive";
    private inView = false;
    private failed = false;
    private urlTimer = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.frame = canvas.closest<HTMLElement>("[data-nebula]");

        const variant = this.frame?.dataset.nebulaVariant === "home" ? "home" : "lab";
        this.defaults = defaultParameters(variant);

        this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        this.parameters = this.readState();

        this.intersectionObserver =
            typeof IntersectionObserver === "undefined"
                ? null
                : new IntersectionObserver(this.onIntersection, { threshold: 0.01 });
    }

    start(): void {
        try {
            this.renderer = new Renderer(this.canvas, this.runtimeParameters(), {
                onStatus: (status) => {
                    if (status === "context-lost") this.setFallback(true, false);
                    if (status === "restored") this.setFallback(false, true);
                },
                onError: (message) => console.warn(message),
            });
        } catch (error) {
            this.fail(error);
            return;
        }

        if (!this.renderer.volumeAvailable) {
            this.parameters.mode = "2d";
            this.frame
                ?.querySelector<HTMLOptionElement>('[data-nebula-mode] option[value="volume"]')
                ?.setAttribute("disabled", "");
        }

        this.bindControls();
        this.syncControls();
        this.applyParameters();

        this.intersectionObserver?.observe(this.canvas);
        window.addEventListener("resize", this.onLayoutChange);
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        document.addEventListener("fullscreenchange", this.onFullscreenChange);
        this.reducedMotion.addEventListener("change", this.onReducedMotionChange);

        // The renderer queues its first frame in the constructor; marking the
        // canvas live on the next frame gives it a painted image to reveal.
        requestAnimationFrame(() => {
            if (this.failed) return;
            if (this.frame?.classList.contains("is-fallback")) return;
            this.setLive(true);
        });
    }

    // -------------------------------------------------------------------------
    // state
    // -------------------------------------------------------------------------

    private readState(): NebulaParameters {
        const params = new URLSearchParams(window.location.search);
        const preset = presetById(params.get("preset") ?? "");
        const next = preset ? applyPreset(DEFAULT_PARAMETERS, preset) : { ...this.defaults };

        const palette = params.get("palette");
        if (isPaletteId(palette)) next.palette = palette;

        for (const key of NUMERIC_KEYS) {
            const raw = params.get(key);
            if (raw === null) continue;
            const value = Number.parseFloat(raw);
            if (Number.isFinite(value)) setNumeric(next, key, clampParameter(key, value));
        }

        const volumeSteps = Number.parseInt(params.get("volumeSteps") ?? "", 10);
        if (Number.isFinite(volumeSteps)) {
            next.volumeSteps = clampParameter("volumeSteps", volumeSteps);
        }

        if (params.has("seed")) next.seed = parseSeed(params.get("seed"));

        const quality = params.get("quality");
        this.quality = isQualityMode(quality) ? quality : "adaptive";
        applyQuality(next, this.quality);

        if (params.get("mode") === "volume") next.mode = "volume";

        const debug = params.get("debug");
        this.debugId = isDebugId(debug) ? debug : "final";

        // Inspection views belong to the 2D sampler, and a volume frame is the
        // expensive mode, so opening a debug link starts in the 2D field.
        if (this.debugId !== "final") next.mode = "2d";

        return next;
    }

    private runtimeParameters(): NebulaParameters {
        return {
            ...this.parameters,
            animationSpeed: this.reducedMotion.matches ? 0 : this.parameters.animationSpeed,
        };
    }

    private applyParameters(): void {
        if (!this.renderer) return;
        this.renderer.setParameters(this.runtimeParameters());
        this.renderer.setDebugView(debugValue(this.debugId));
        this.renderer.requestRender();
    }

    private commit(): void {
        this.syncControls();
        this.applyParameters();
        this.writeUrl();
    }

    private permalink(): string {
        const params = new URLSearchParams();
        params.set("seed", String(this.parameters.seed));

        const preset = detectPreset(this.parameters);
        if (preset !== "custom") params.set("preset", preset);

        params.set("palette", this.parameters.palette);
        for (const key of NUMERIC_KEYS) params.set(key, formatNumber(this.parameters[key]));

        if (this.parameters.volumeSteps !== DEFAULT_PARAMETERS.volumeSteps) {
            params.set("volumeSteps", String(this.parameters.volumeSteps));
        }
        if (this.parameters.mode === "volume") params.set("mode", "volume");
        if (this.debugId !== "final") params.set("debug", this.debugId);
        if (this.quality !== "adaptive") params.set("quality", this.quality);

        return `${window.location.pathname}?${params.toString()}`;
    }

    private writeUrl(): void {
        if (this.urlTimer) window.clearTimeout(this.urlTimer);
        this.urlTimer = window.setTimeout(() => {
            window.history.replaceState(null, "", this.permalink());
        }, 140);
    }

    // -------------------------------------------------------------------------
    // controls
    // -------------------------------------------------------------------------

    private bindControls(): void {
        const root = this.frame;
        if (!root) return;

        const preset = root.querySelector<HTMLSelectElement>("[data-nebula-preset]");
        preset?.addEventListener("change", () => {
            const next = presetById(preset.value);
            if (!next) return;
            this.parameters = applyPreset(this.parameters, next);
            this.commit();
        });

        const palette = root.querySelector<HTMLSelectElement>("[data-nebula-palette]");
        palette?.addEventListener("change", () => {
            if (isPaletteId(palette.value)) this.parameters.palette = palette.value;
            this.commit();
        });

        const mode = root.querySelector<HTMLSelectElement>("[data-nebula-mode]");
        mode?.addEventListener("change", () => {
            this.parameters.mode = mode.value === "volume" && this.renderer?.volumeAvailable ? "volume" : "2d";
            if (this.parameters.mode === "volume") this.debugId = "final";
            this.commit();
        });

        const debug = root.querySelector<HTMLSelectElement>("[data-nebula-debug]");
        debug?.addEventListener("change", () => {
            this.debugId = isDebugId(debug.value) ? debug.value : "final";
            if (this.debugId !== "final") this.parameters.mode = "2d";
            this.commit();
        });

        const quality = root.querySelector<HTMLSelectElement>("[data-nebula-quality]");
        quality?.addEventListener("change", () => {
            this.quality = isQualityMode(quality.value) ? quality.value : "adaptive";
            applyQuality(this.parameters, this.quality);
            this.commit();
        });

        for (const input of root.querySelectorAll<HTMLInputElement>("[data-nebula-param]")) {
            const key = input.dataset.nebulaParam as NumericParameter | undefined;
            if (!key || !CONTROL_BY_KEY.has(key)) continue;

            input.addEventListener("input", () => {
                const value = Number.parseFloat(input.value);
                if (!Number.isFinite(value)) return;
                setNumeric(this.parameters, key, clampParameter(key, value));
                this.commit();
            });
        }

        const seedInput = root.querySelector<HTMLInputElement>("[data-nebula-seed-input]");
        seedInput?.addEventListener("change", () => {
            const value = Number.parseInt(seedInput.value.trim(), 10);
            if (Number.isFinite(value)) {
                this.parameters.seed = normalizeSeed(value);
            }
            this.commit();
        });

        root.querySelector<HTMLButtonElement>("[data-nebula-reseed]")?.addEventListener("click", () => {
            this.parameters.seed = randomSeed();
            this.commit();
        });

        root.querySelector<HTMLButtonElement>("[data-nebula-copy]")?.addEventListener("click", (event) => {
            const button = event.currentTarget as HTMLButtonElement;
            const label = button.textContent;
            const complete = (next: string): void => {
                button.textContent = next;
                window.setTimeout(() => {
                    button.textContent = label;
                }, 1600);
            };

            if (!navigator.clipboard?.writeText) {
                complete("Copy failed");
                return;
            }

            const url = new URL(this.permalink(), window.location.href).href;
            navigator.clipboard.writeText(url).then(
                () => complete("Copied"),
                () => complete("Copy failed"),
            );
        });

        root.querySelector<HTMLButtonElement>("[data-nebula-fullscreen]")?.addEventListener("click", () => {
            if (document.fullscreenElement) {
                void document.exitFullscreen();
            } else if (root.requestFullscreen) {
                void root.requestFullscreen().catch(() => undefined);
            }
        });
    }

    private syncControls(): void {
        const root = this.frame;
        if (!root) return;

        const preset = root.querySelector<HTMLSelectElement>("[data-nebula-preset]");
        if (preset) preset.value = detectPreset(this.parameters);

        const palette = root.querySelector<HTMLSelectElement>("[data-nebula-palette]");
        if (palette) palette.value = this.parameters.palette;

        const mode = root.querySelector<HTMLSelectElement>("[data-nebula-mode]");
        if (mode) mode.value = this.parameters.mode;

        const debug = root.querySelector<HTMLSelectElement>("[data-nebula-debug]");
        if (debug) debug.value = this.debugId;

        const quality = root.querySelector<HTMLSelectElement>("[data-nebula-quality]");
        if (quality) quality.value = this.quality;

        for (const input of root.querySelectorAll<HTMLInputElement>("[data-nebula-param]")) {
            const key = input.dataset.nebulaParam as NumericParameter | undefined;
            const control = key ? CONTROL_BY_KEY.get(key) : undefined;
            if (!key || !control) continue;

            const value = this.parameters[key];
            input.value = String(value);
            const output = root.querySelector<HTMLOutputElement>(`[data-nebula-output="${key}"]`);
            if (output) output.textContent = formatParameter(control, value);
        }

        const seed = root.querySelector<HTMLElement>("[data-nebula-seed]");
        if (seed) {
            const label = `seed ${this.parameters.seed}`;
            if (seed.textContent !== label) seed.textContent = label;
        }

        const seedInput = root.querySelector<HTMLInputElement>("[data-nebula-seed-input]");
        if (seedInput) seedInput.value = String(this.parameters.seed);

        const link = root.querySelector<HTMLAnchorElement>("[data-nebula-link]");
        if (link) link.href = this.permalink();

        const hud = root.querySelector<HTMLElement>("[data-nebula-hud]");
        if (hud) {
            if (this.debugId !== "final") {
                const view = DEBUG_VIEWS.find((entry) => entry.id === this.debugId);
                hud.textContent = `${view?.label ?? "Inspection"} / diagnostic`;
            } else if (this.parameters.mode === "volume") {
                hud.textContent = `3D volume / ${this.parameters.volumeSteps} steps`;
            } else {
                hud.textContent = `${modeLabel("2d")} / ${this.parameters.octaves} octaves`;
            }
        }
    }

    private setLive(live: boolean): void {
        if (!this.frame) return;
        this.frame.classList.toggle("is-live", live);
        this.frame.classList.toggle("is-fallback", !live && this.failed);
    }

    private setFallback(fallback: boolean, live: boolean): void {
        if (!this.frame) return;
        this.frame.classList.toggle("is-fallback", fallback);
        this.frame.classList.toggle("is-live", live);
    }

    private fail(error: unknown): void {
        this.failed = true;
        console.error("Unable to start the nebula", error);
        this.frame?.classList.remove("is-live");
        this.frame?.classList.add("is-fallback");
    }

    // -------------------------------------------------------------------------
    // environment
    // -------------------------------------------------------------------------

    private updateActive(): void {
        this.renderer?.setActive(this.inView && !document.hidden);
    }

    private onIntersection = (entries: IntersectionObserverEntry[]): void => {
        this.inView = entries.some((entry) => entry.isIntersecting);
        this.updateActive();
    };

    private onVisibilityChange = (): void => {
        this.updateActive();
    };

    private onLayoutChange = (): void => {
        this.renderer?.requestRender();
    };

    private onFullscreenChange = (): void => {
        const button = this.frame?.querySelector<HTMLButtonElement>("[data-nebula-fullscreen]");
        if (button) button.textContent = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
        this.renderer?.requestRender();
    };

    private onReducedMotionChange = (): void => {
        this.applyParameters();
    };
}
