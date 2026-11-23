// A two-state (position, velocity) Kalman filter for a synthetic 1D track.
//
// The filter is deliberately ordinary: it is here to show the effect of process
// and measurement noise, not to claim anything about the robot's field data.
// Keeping the math separate from the canvas makes the demo testable on its own.

export type KalmanState = {
    position: number;
    velocity: number;
    /** Covariance matrix [[p00, p01], [p01, p11]]. */
    p00: number;
    p01: number;
    p11: number;
};

export type TrackSample = {
    truth: number;
    measured: number;
};

export type KalmanOptions = {
    /** White-noise acceleration spectral density. */
    processNoise: number;
    /** Measurement variance. */
    measurementNoise: number;
    /** Sample period in seconds. */
    dt: number;
};

function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

/** Box-Muller normal sample from a uniform generator. */
function normal(random: () => number): number {
    const u = Math.max(1e-12, random());
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * A deterministic synthetic track. The velocity changes once, mid-run, so the
 * constant-velocity model visibly lags instead of matching perfectly.
 */
export function createSyntheticTrack(count = 160, seed = 0x5eed1234): TrackSample[] {
    const random = mulberry32(seed);
    const dt = 0.2;
    const samples: TrackSample[] = [];
    let position = 0;
    let velocity = 1.15;

    for (let index = 0; index < count; index++) {
        if (index === 84) {
            velocity += 0.9;
        }
        velocity += 0.025 * Math.sin(index * 0.18);
        position += velocity * dt;
        samples.push({
            truth: position,
            measured: position + normal(random) * 2.5
        });
    }

    return samples;
}

export class KalmanFilter1D {
    private state: KalmanState;
    private readonly options: KalmanOptions;

    constructor(initialMeasurement: number, options: KalmanOptions) {
        this.options = options;
        this.state = {
            position: initialMeasurement,
            velocity: 0,
            p00: options.measurementNoise,
            p01: 0,
            p11: 4
        };
    }

    get position(): number {
        return this.state.position;
    }

    get velocity(): number {
        return this.state.velocity;
    }

    /** Standard deviation of the position estimate. */
    get positionSigma(): number {
        return Math.sqrt(Math.max(0, this.state.p00));
    }

    predict(): void {
        const { dt, processNoise } = this.options;
        const { position, velocity, p00, p01, p11 } = this.state;

        // x' = F x, with F = [[1, dt], [0, 1]].
        const predictedPosition = position + velocity * dt;
        const predictedVelocity = velocity;

        // P' = F P F^T + Q. Q models white-noise acceleration.
        const q00 = (processNoise * dt ** 4) / 4;
        const q01 = (processNoise * dt ** 3) / 2;
        const q11 = processNoise * dt ** 2;
        const fp00 = p00 + dt * p01;
        const fp01 = p01 + dt * p11;
        const fp11 = p11;
        const nextP00 = fp00 + dt * fp01 + q00;
        const nextP01 = fp01 + q01;
        const nextP11 = fp11 + q11;

        this.state = {
            position: predictedPosition,
            velocity: predictedVelocity,
            p00: nextP00,
            p01: nextP01,
            p11: nextP11
        };
    }

    update(measurement: number): void {
        const { measurementNoise } = this.options;
        const { position, velocity, p00, p01, p11 } = this.state;
        const innovation = measurement - position;
        const innovationVariance = p00 + measurementNoise;
        const gainPosition = p00 / innovationVariance;
        const gainVelocity = p01 / innovationVariance;

        const nextPosition = position + gainPosition * innovation;
        const nextVelocity = velocity + gainVelocity * innovation;

        // P = (I - K H) P, with H = [1, 0].
        const nextP00 = (1 - gainPosition) * p00;
        const nextP01 = (1 - gainPosition) * p01;
        const nextP11 = p11 - gainVelocity * p01;

        this.state = {
            position: nextPosition,
            velocity: nextVelocity,
            p00: Math.max(nextP00, 0),
            p01: nextP01,
            p11: Math.max(nextP11, 0)
        };
    }
}

export function rootMeanSquare(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }

    return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}
