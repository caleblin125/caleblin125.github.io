/**
 * Control markup for the nebula surfaces.
 *
 * The renderer binds to `data-nebula-*` hooks rather than to specific labels or
 * order, so the homepage and the laboratory can share one adapter and different
 * subsets of the parameter schema. Markup is generated from `parameters.ts` and
 * `presets.ts` so a control cannot drift from the model it edits.
 */

import {
    ADVANCED_CONTROLS,
    DEFAULT_PARAMETERS,
    PALETTES,
    PRIMARY_CONTROLS,
    formatParameter,
    type NebulaParameters,
    type PaletteId,
    type RangeControl,
} from "./parameters";
import { PRESETS, applyPreset, detectPreset, presetById } from "./presets";

export type NebulaControlsVariant = "home" | "lab";

const HOME_RANGE_KEYS = new Set(["density", "scale"]);
const LAB_ADVANCED_KEYS = [
    "detail",
    "rotation",
    "lacunarity",
    "persistence",
    "exposure",
    "starDensity",
    "vignette",
    "volumeSteps",
];

function selected(current: string, value: string): string {
    return current === value ? " selected" : "";
}

function rangeMarkup(control: RangeControl, parameters: NebulaParameters): string {
    const value = parameters[control.key];
    const precision = control.digits === 0 ? "1" : String(control.step);
    return `<label class="nebula-control">${control.label}<input type="range" min="${control.min}" max="${control.max}" step="${precision}" value="${value}" data-nebula-param="${control.key}"><output data-nebula-output="${control.key}">${formatParameter(control, value)}</output></label>`;
}

function presetMarkup(parameters: NebulaParameters): string {
    const active = detectPreset(parameters);
    const options = PRESETS.map(
        (preset) => `<option value="${preset.id}"${selected(active, preset.id)}>${preset.label}</option>`,
    ).join("");
    return `<label class="nebula-control">Preset<select data-nebula-preset>${options}<option value="custom" disabled${selected(active, "custom")}>Custom</option></select></label>`;
}

function paletteMarkup(parameters: NebulaParameters): string {
    const options = (Object.keys(PALETTES) as PaletteId[])
        .map((id) => `<option value="${id}"${selected(parameters.palette, id)}>${PALETTES[id].label}</option>`)
        .join("");
    return `<label class="nebula-control">Palette<select data-nebula-palette>${options}</select></label>`;
}

function modeMarkup(parameters: NebulaParameters): string {
    return `<label class="nebula-control">Renderer<select data-nebula-mode><option value="2d"${selected(parameters.mode, "2d")}>2D field</option><option value="volume"${selected(parameters.mode, "volume")}>3D volume</option></select></label>`;
}

function debugMarkup(): string {
    return `<label class="nebula-control">Inspect<select data-nebula-debug><option value="final">Final image</option><option value="density">Density</option><option value="cloud">Cloud base</option><option value="filament">Filaments</option><option value="shape">Shape field</option><option value="mask">Mask</option></select></label>`;
}

function qualityMarkup(): string {
    return `<label class="nebula-control">Quality<select data-nebula-quality><option value="adaptive">Adaptive</option><option value="high">High</option><option value="low">Low</option></select></label>`;
}

function seedMarkup(parameters: NebulaParameters, withCopy: boolean): string {
    const copy = withCopy ? '<button class="nebula-reseed" type="button" data-nebula-copy>Copy link</button>' : "";
    return `<span class="nebula-seed-group"><span class="nebula-seed" data-nebula-seed aria-live="polite">seed ${parameters.seed}</span><a class="nebula-reseed" data-nebula-link href="?seed=${parameters.seed}">Link</a><button class="nebula-reseed" type="button" data-nebula-reseed>Reseed</button>${copy}</span>`;
}

/** Resolve the look a page opens with when the URL carries no state. */
export function defaultParameters(variant: NebulaControlsVariant): NebulaParameters {
    const preset = presetById(variant === "home" ? "violet-hollow" : "orion-deep");
    return preset ? applyPreset(DEFAULT_PARAMETERS, preset) : { ...DEFAULT_PARAMETERS };
}

/**
 * Control bar for one page. The homepage keeps the look controls; the lab adds
 * renderer, inspection, quality, motion, and the advanced structural values.
 */
export function nebulaControls(
    variant: NebulaControlsVariant,
    parameters: NebulaParameters = defaultParameters(variant),
): string {
    if (variant === "home") {
        const ranges = PRIMARY_CONTROLS.filter((control) => HOME_RANGE_KEYS.has(control.key))
            .map((control) => rangeMarkup(control, parameters))
            .join("");
        return `<div class="nebula-controls">${presetMarkup(parameters)}${ranges}${paletteMarkup(parameters)}${seedMarkup(parameters, false)}</div>`;
    }

    const ranges = PRIMARY_CONTROLS.map((control) => rangeMarkup(control, parameters)).join("");
    const advancedRanges = LAB_ADVANCED_KEYS.map((key) =>
        ADVANCED_CONTROLS.find((control) => control.key === key),
    )
        .filter((control): control is RangeControl => Boolean(control))
        .map((control) => rangeMarkup(control, parameters))
        .join("");

    return `<div class="nebula-controls">${presetMarkup(parameters)}${paletteMarkup(parameters)}${modeMarkup(parameters)}${debugMarkup()}${qualityMarkup()}${ranges}</div>
<details class="nebula-advanced">
<summary>Advanced parameters</summary>
<div class="nebula-controls nebula-controls-advanced">${advancedRanges}</div>
</details>
<div class="nebula-controls nebula-controls-actions">
<label class="nebula-control">Seed<input class="nebula-seed-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="6" value="${parameters.seed}" data-nebula-seed-input aria-label="Seed, an integer from 1 to 999999"></label>
<span class="nebula-seed" data-nebula-seed aria-live="polite">seed ${parameters.seed}</span>
<span class="nebula-seed-group"><a class="nebula-reseed" data-nebula-link href="?seed=${parameters.seed}">Link</a><button class="nebula-reseed" type="button" data-nebula-reseed>Reseed</button><button class="nebula-reseed" type="button" data-nebula-copy>Copy link</button><button class="nebula-reseed" type="button" data-nebula-fullscreen>Fullscreen</button></span>
</div>`;
}
