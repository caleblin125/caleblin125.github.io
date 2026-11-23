// Generates the raster project thumbnails that depict what each project does.
//
//   node scripts/generate-thumbnails.mjs
//
// Mandelbrot and Boids are rendered from the same rules as the in-browser
// canvases, so the thumbnails are actual output rather than decorative art.
// The remaining projects use hand-authored SVGs in public/projects/.
import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const WIDTH = 480;
const HEIGHT = 320;
const BACKGROUND = [15, 8, 25];

/* ------------------------------------------------------------------ */
/* Minimal PNG writer                                                  */
/* ------------------------------------------------------------------ */

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c >>> 0;
}

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const name = Buffer.from(type, "ascii");
    const body = Buffer.concat([name, data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8; // bit depth
    header[9] = 6; // RGBA
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (width * 4 + 1)] = 0;
        rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        pngChunk("IHDR", header),
        pngChunk("IDAT", deflateSync(raw, { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0))
    ]);
}

function createCanvas(width, height, background) {
    const rgba = Buffer.alloc(width * height * 4);
    for (let index = 0; index < width * height; index++) {
        rgba[index * 4] = background[0];
        rgba[index * 4 + 1] = background[1];
        rgba[index * 4 + 2] = background[2];
        rgba[index * 4 + 3] = 255;
    }
    return { width, height, rgba };
}

function blendPixel(canvas, x, y, color, alpha) {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height || alpha <= 0) return;
    const index = (y * canvas.width + x) * 4;
    const effect = Math.min(1, alpha);
    canvas.rgba[index] += (color[0] - canvas.rgba[index]) * effect;
    canvas.rgba[index + 1] += (color[1] - canvas.rgba[index + 1]) * effect;
    canvas.rgba[index + 2] += (color[2] - canvas.rgba[index + 2]) * effect;
}

function drawLine(canvas, x0, y0, x1, y1, color, alpha) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        blendPixel(canvas, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color, alpha);
    }
}

function fillTriangle(canvas, points, color, alpha) {
    const [a, b, c] = points;
    const minX = Math.floor(Math.min(a[0], b[0], c[0]));
    const maxX = Math.ceil(Math.max(a[0], b[0], c[0]));
    const minY = Math.floor(Math.min(a[1], b[1], c[1]));
    const maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
    const edge = (p, q, x, y) => (x - p[0]) * (q[1] - p[1]) - (y - p[1]) * (q[0] - p[0]);
    const area = edge(a, b, c[0], c[1]);
    if (area === 0) return;
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const w0 = edge(a, b, x + 0.5, y + 0.5) / area;
            const w1 = edge(b, c, x + 0.5, y + 0.5) / area;
            const w2 = edge(c, a, x + 0.5, y + 0.5) / area;
            if (w0 >= 0 && w1 >= 0 && w2 >= 0) blendPixel(canvas, x, y, color, alpha);
        }
    }
}

function downsample(canvas, width, height) {
    const out = createCanvas(width, height, BACKGROUND);
    const scaleX = canvas.width / width;
    const scaleY = canvas.height / height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const sum = [0, 0, 0];
            let count = 0;
            for (let sy = Math.floor(y * scaleY); sy < Math.min(canvas.height, (y + 1) * scaleY); sy++) {
                for (let sx = Math.floor(x * scaleX); sx < Math.min(canvas.width, (x + 1) * scaleX); sx++) {
                    const index = (sy * canvas.width + sx) * 4;
                    sum[0] += canvas.rgba[index];
                    sum[1] += canvas.rgba[index + 1];
                    sum[2] += canvas.rgba[index + 2];
                    count++;
                }
            }
            const index = (y * width + x) * 4;
            out.rgba[index] = sum[0] / count;
            out.rgba[index + 1] = sum[1] / count;
            out.rgba[index + 2] = sum[2] / count;
        }
    }
    return out;
}

/* ------------------------------------------------------------------ */
/* Mandelbrot — the same seeded orbit points and angle hue as           */
/* src/chaos/shaders/vertex.glsl                                        */
/* ------------------------------------------------------------------ */

function hsvToRgb(hue, saturation, value) {
    const channel = (offset) => {
        const k = (offset + hue * 6) % 6;
        return value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return [channel(5) * 255, channel(3) * 255, channel(1) * 255];
}

function renderMandelbrot() {
    const render = createCanvas(720, 480, BACKGROUND);
    const columns = 260;
    const rows = 170;
    const iterations = 140;
    const centerX = -0.5;
    const centerY = 0;
    const zoom = 1;
    const aspect = render.width / render.height;

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const seedX = (column / (columns - 1)) * 2 - 1;
            const seedY = (row / (rows - 1)) * 2 - 1;
            const initialX = (seedX * aspect) / zoom + centerX;
            const initialY = seedY / zoom + centerY;
            let currentX = 0;
            let currentY = 0;
            let stable = true;

            for (let step = 0; step < iterations; step++) {
                const nextX = currentX * currentX - currentY * currentY + initialX;
                const nextY = 2 * currentX * currentY + initialY;
                currentX = nextX;
                currentY = nextY;
                if (currentX * currentX + currentY * currentY > 256 || !Number.isFinite(currentX) || !Number.isFinite(currentY)) {
                    stable = false;
                    break;
                }
            }

            if (!stable) continue;

            currentX = 0;
            currentY = 0;
            for (let step = 1; step <= iterations; step++) {
                const previousX = currentX;
                const previousY = currentY;
                const nextX = currentX * currentX - currentY * currentY + initialX;
                const nextY = 2 * currentX * currentY + initialY;
                currentX = nextX;
                currentY = nextY;

                const screenX = ((currentX - centerX) * zoom) / aspect;
                const screenY = ((currentY - centerY) * zoom) / 1;
                const pixelX = (screenX + 1) * 0.5 * render.width;
                const pixelY = (1 - screenY) * 0.5 * render.height;
                const angle = Math.atan2(nextY - previousY, nextX - previousX);
                const hue = ((angle / (2 * Math.PI) + 0.5) % 1 + 1) % 1;
                const color = hsvToRgb(hue, 1, 1);
                blendPixel(render, Math.round(pixelX), Math.round(pixelY), color, 0.58);
                blendPixel(render, Math.round(pixelX) + 1, Math.round(pixelY), color, 0.2);
                blendPixel(render, Math.round(pixelX), Math.round(pixelY) + 1, color, 0.2);
                blendPixel(render, Math.round(pixelX) - 1, Math.round(pixelY), color, 0.12);
                blendPixel(render, Math.round(pixelX), Math.round(pixelY) - 1, color, 0.12);
            }
        }
    }

    return downsample(render, WIDTH, HEIGHT);
}

/* ------------------------------------------------------------------ */
/* Boids — the same species constants and steering update as           */
/* src/boids/renderer.ts, simulated for seven seconds                  */
/* ------------------------------------------------------------------ */

function mulberry32(seed) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

const WORLD_WIDTH = 1150;
const WORLD_HEIGHT = 650;
const MARGIN = 30;
const SPECIES = {
    prey1: { color: [77, 140, 255], scale: 0.5, separation: [35, 1, 9999, 1], alignment: [2.5, -0.5, 1, 1], cohesion: [2, -1, -9999, 0.3], maxSpeed: 100, acceleration: 700, constantAcceleration: 100, resistance: -3, senseRange: 70, senseAngle: Math.PI, avoidDistance: 30, maxSee: 20 },
    prey2: { color: [26, 255, 64], scale: 0.5, separation: [0, 75, 2000, 35], alignment: [0, 4.5, 1, 1], cohesion: [-1, 1, -9999, 1000], maxSpeed: 200, acceleration: 1000, constantAcceleration: 300, resistance: -7, senseRange: 90, senseAngle: Math.PI, avoidDistance: 10, maxSee: 20 },
    predator: { color: [255, 26, 26], scale: 1.5, separation: [-10, -20, 30, 9999], alignment: [0, 0, -1, 1], cohesion: [10, 10, -5, -9999], maxSpeed: 50, acceleration: 600, constantAcceleration: 300, resistance: -3, senseRange: 150, senseAngle: Math.PI / 2, avoidDistance: 40, maxSee: 10 },
    big: { color: [255, 26, 204], scale: 2.5, separation: [0, 0, 0, 40], alignment: [0, 0, 1, -1], cohesion: [1, 0, 10, -40], maxSpeed: 50, acceleration: 1000, constantAcceleration: 400, resistance: -5, senseRange: 300, senseAngle: Math.PI / 2, avoidDistance: 70, maxSee: 30 }
};
const SPECIES_INDEX = { prey1: 0, prey2: 1, predator: 2, big: 3 };
const VERTICES = [
    [-0.022, 0.016], [0.026, 0], [-0.022, 0.005],
    [-0.022, -0.016], [-0.022, -0.005], [0.026, 0]
];

function clampVector(vector, maximum) {
    const magnitude = Math.hypot(vector.x, vector.y);
    return magnitude === 0 || magnitude <= maximum ? vector : { x: (vector.x / magnitude) * maximum, y: (vector.y / magnitude) * maximum };
}

function renderBoids() {
    const random = mulberry32(0x5eedc0de);
    const boids = [];
    const createBoid = (species) => {
        const angle = random() * Math.PI * 2;
        const speed = species === "prey2" ? 200 : species === "prey1" ? 100 : 50;
        return { species, x: random() * WORLD_WIDTH, y: random() * WORLD_HEIGHT, velocityX: Math.cos(angle) * speed, velocityY: Math.sin(angle) * speed };
    };
    for (let index = 0; index < 2; index++) boids.push(createBoid("big"));
    for (let index = 0; index < 7; index++) boids.push(createBoid("predator"));
    for (let index = 0; index < 450; index++) boids.push(createBoid("prey1"));
    for (let index = 0; index < 30; index++) boids.push(createBoid("prey2"));

    const scale = Math.min(WIDTH / WORLD_WIDTH, HEIGHT / WORLD_HEIGHT);
    const offsetX = (WIDTH - WORLD_WIDTH * scale) / 2;
    const offsetY = (HEIGHT - WORLD_HEIGHT * scale) / 2;
    const canvas = createCanvas(WIDTH, HEIGHT, BACKGROUND);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const glow = Math.max(0, 1 - Math.hypot(x - WIDTH * 0.52, y - HEIGHT * 0.48) / (WIDTH * 0.62));
            const index = (y * WIDTH + x) * 4;
            canvas.rgba[index] += glow * 9;
            canvas.rgba[index + 1] += glow * 4;
            canvas.rgba[index + 2] += glow * 14;
        }
    }

    const update = (boid, deltaTime) => {
        const rules = SPECIES[boid.species];
        const speed = Math.hypot(boid.velocityX, boid.velocityY);
        const previousX = boid.x;
        const previousY = boid.y;
        boid.x += boid.velocityX * deltaTime;
        boid.y += boid.velocityY * deltaTime;
        const accelerate = (acceleration) => {
            boid.velocityX += acceleration.x * deltaTime;
            boid.velocityY += acceleration.y * deltaTime;
        };
        if (speed > rules.maxSpeed) {
            accelerate({ x: boid.velocityX * (1 - rules.maxSpeed / speed) * rules.resistance, y: boid.velocityY * (1 - rules.maxSpeed / speed) * rules.resistance });
        } else if (speed > 0) {
            accelerate({ x: (boid.velocityX / speed) * rules.constantAcceleration, y: (boid.velocityY / speed) * rules.constantAcceleration });
        }
        if (previousX > WORLD_WIDTH - MARGIN || previousX < MARGIN || previousY > WORLD_HEIGHT - MARGIN || previousY < MARGIN) {
            accelerate(clampVector({ x: WORLD_WIDTH / 2 - previousX, y: WORLD_HEIGHT / 2 - previousY }, rules.acceleration));
            return;
        }

        const target = { x: 0, y: 0 };
        const center = { x: 0, y: 0 };
        const averageVelocity = { x: 0, y: 0 };
        const away = { x: 0, y: 0 };
        let seen = 0;
        let farSeen = 0;
        let closeSeen = 0;

        for (const other of boids) {
            if (seen >= rules.maxSee) break;
            if (other === boid) continue;
            const relativeX = other.x - boid.x;
            const relativeY = other.y - boid.y;
            const distance = Math.hypot(relativeX, relativeY);
            const direction = speed === 0 || distance === 0 ? Math.PI : Math.acos((relativeX * boid.velocityX + relativeY * boid.velocityY) / distance / speed);
            if (distance >= rules.senseRange || direction >= rules.senseAngle) continue;
            const index = SPECIES_INDEX[other.species];
            seen++;
            averageVelocity.x += other.velocityX * rules.alignment[index];
            averageVelocity.y += other.velocityY * rules.alignment[index];
            if (distance < rules.avoidDistance && distance !== 0) {
                away.x -= relativeX * rules.separation[index];
                away.y -= relativeY * rules.separation[index];
                closeSeen++;
            } else {
                center.x += relativeX * rules.cohesion[index];
                center.y += relativeY * rules.cohesion[index];
                farSeen++;
            }
            if (boid.species === "predator" && (other.species === "prey1" || other.species === "prey2") && distance < 25) {
                const angle = random() * Math.PI * 2;
                const radius = Math.hypot(WORLD_WIDTH, WORLD_HEIGHT) / 2;
                other.x = WORLD_WIDTH / 2 + Math.cos(angle) * radius;
                other.y = WORLD_HEIGHT / 2 + Math.sin(angle) * radius;
            }
        }

        averageVelocity.x -= boid.velocityX;
        averageVelocity.y -= boid.velocityY;
        if (farSeen > 0) {
            target.x += center.x / farSeen;
            target.y += center.y / farSeen;
        }
        if (seen > 0) {
            target.x += averageVelocity.x / seen;
            target.y += averageVelocity.y / seen;
        }
        if (closeSeen > 0) {
            target.x += away.x / closeSeen;
            target.y += away.y / closeSeen;
        }
        accelerate(clampVector(target, rules.acceleration));
    };

    for (let step = 0; step < 1100; step++) {
        for (const boid of boids) {
            const previousX = boid.x;
            const previousY = boid.y;
            update(boid, 0.01);
            const rules = SPECIES[boid.species];
            // A prey reset teleports to the edge; do not draw that jump as a trail.
            if (Math.hypot(boid.x - previousX, boid.y - previousY) < 40) {
                drawLine(
                    canvas,
                    offsetX + previousX * scale,
                    offsetY + previousY * scale,
                    offsetX + boid.x * scale,
                    offsetY + boid.y * scale,
                    rules.color,
                    boid.species === "prey1" ? 0.09 : 0.16
                );
            }
        }
        if (step % 10 === 0) {
            for (let index = 0; index < canvas.rgba.length; index += 4) {
                canvas.rgba[index] = BACKGROUND[0] + (canvas.rgba[index] - BACKGROUND[0]) * 0.94;
                canvas.rgba[index + 1] = BACKGROUND[1] + (canvas.rgba[index + 1] - BACKGROUND[1]) * 0.94;
                canvas.rgba[index + 2] = BACKGROUND[2] + (canvas.rgba[index + 2] - BACKGROUND[2]) * 0.94;
            }
        }
    }

    for (const boid of boids) {
        const rules = SPECIES[boid.species];
        const angle = Math.atan2(-boid.velocityY, boid.velocityX);
        const sine = Math.sin(angle);
        const cosine = Math.cos(angle);
        const centerX = offsetX + boid.x * scale;
        const centerY = offsetY + boid.y * scale;
        const points = VERTICES.map(([x, y]) => {
            const rotatedX = (x * cosine - y * sine) * rules.scale;
            const rotatedY = (x * sine + y * cosine) * rules.scale;
            return [centerX + rotatedX * WIDTH / 2 * 1.0, centerY - rotatedY * HEIGHT / 2 * 1.0];
        });
        fillTriangle(canvas, [points[0], points[1], points[2]], rules.color, 0.96);
        fillTriangle(canvas, [points[3], points[4], points[5]], rules.color, 0.96);
    }

    return canvas;
}

/* ------------------------------------------------------------------ */

const outputDir = "public/projects";
await mkdir(outputDir, { recursive: true });

await writeFile(`${outputDir}/mandelbrot.png`, encodePng(WIDTH, HEIGHT, renderMandelbrot().rgba));
await writeFile(`${outputDir}/boids.png`, encodePng(WIDTH, HEIGHT, renderBoids().rgba));

console.log("Generated public/projects/mandelbrot.png and public/projects/boids.png");
