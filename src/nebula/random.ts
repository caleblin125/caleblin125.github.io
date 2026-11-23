/**
 * Deterministic seed utilities.
 *
 * The visual is derived from an integer seed that is hashed inside the shader.
 * This module only produces stable integers and keeps them in the range the
 * engine accepts.
 */

export const MAX_SEED = 999_999;

/** A fresh seed that is still readable enough to type back in. */
export function randomSeed(): number {
    const webCrypto = typeof crypto !== "undefined" ? crypto : undefined;
    if (webCrypto?.getRandomValues) {
        const buffer = new Uint32Array(1);
        webCrypto.getRandomValues(buffer);
        return (buffer[0] % MAX_SEED) + 1;
    }
    return Math.floor(Math.random() * MAX_SEED) + 1;
}

/** Clamp a seed into the valid integer range. */
export function normalizeSeed(seed: number): number {
    if (!Number.isFinite(seed)) return 1;
    const rounded = Math.round(seed);
    return Math.min(MAX_SEED, Math.max(1, Math.abs(rounded)));
}
