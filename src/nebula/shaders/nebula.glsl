#version 300 es

// Procedural nebula: a domain-warped fractional Brownian motion field.
// This is not a physical simulation. It is a reproducible 2D model — seed in,
// structure out — chosen because it produces convincing filaments and dust
// lanes at a fraction of the cost of ray-marching a volume.
//
// The laboratory page exposes the parts that were always in the model: how many
// octaves the fBm keeps, how hard the warp bends the field, which region of the
// noise field is framed, and an inspection view that shows one stage at a time.
// Every uniform's default reproduces the original homepage frame.

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_offset;
uniform float u_density;
uniform float u_scale;
uniform vec2 u_pointer;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform float u_octaves;
uniform float u_warp;
uniform float u_variant;
uniform float u_view;

out vec4 fragColor;

const vec3 PAGE_BG = vec3(0.0706, 0.0510, 0.0941); // #120d18

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 turn = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 6; i++) {
        if (float(i) >= u_octaves) break;
        value += amplitude * valueNoise(p);
        p = turn * p * 2.03;
        amplitude *= 0.5;
    }
    return value;
}

// The variant simply frames a different region of the same field. It is not a
// second generator; it is the seed's sibling.
vec2 variantOffset() {
    if (u_variant < 0.5) return vec2(0.0);
    if (u_variant < 1.5) return vec2(7.3, -4.9);
    if (u_variant < 2.5) return vec2(-11.7, 6.1);
    return vec2(3.9, 9.4);
}

// Sparse stars on a hashed grid. The seed fixes the sky; time only twinkles.
float starField(vec2 p, float rate, float seed, float radius) {
    vec2 cell = floor(p);
    float h = hash21(cell + seed);
    if (h > rate) return 0.0;
    vec2 local = fract(p);
    vec2 offset = vec2(hash21(cell + seed + 1.7), hash21(cell + seed + 3.1));
    float d = length(local - offset);
    float twinkle = 0.55 + 0.45 * sin(u_time * 1.6 + h * 60.0);
    return smoothstep(radius, 0.0, d) * twinkle * (0.25 + 0.75 * h);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.y = 1.0 - uv.y;

    // Aspect-correct coordinates, scaled and offset by the pointer for parallax.
    vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) * 2.0;
    p *= u_scale;
    p += u_pointer * 0.05;

    // Seed shifts the whole field; a fixed framing transform then keeps the
    // structure centered on the canvas at any aspect ratio.
    vec2 sp = p + u_offset + variantOffset() * 0.5;

    float t = u_time * 0.025;

    // View 1: the base noise, with no warp and no color ramp. One octave only,
    // so the lattice underneath the finished image is visible.
    if (u_view > 0.5 && u_view < 1.5) {
        float n = valueNoise(sp * 2.4);
        vec3 base = mix(PAGE_BG, u_colorA, smoothstep(0.08, 0.92, n) * 0.62);
        base += (hash21(gl_FragCoord.xy + u_offset) - 0.5) * 0.004;
        fragColor = vec4(base, 1.0);
        return;
    }

    // Two warps and a final sample: q bends the field, r tears it into filaments.
    vec2 q = vec2(fbm(sp + t), fbm(sp + vec2(5.2, 1.3) - t * 0.6));
    vec2 r = vec2(fbm(sp + u_warp * 4.0 * q + vec2(1.7, 9.2) + t * 0.35),
                  fbm(sp + u_warp * 4.0 * q + vec2(8.3, 2.8) - t * 0.25));
    float f = fbm(sp + u_warp * 4.0 * r);
    f = min(f * 1.16, 1.0);

    // View 2: the warp field itself. Red and green are the two components of
    // q; blue is the magnitude of r's displacement from its mean.
    if (u_view > 1.5 && u_view < 2.5) {
        vec3 warp = vec3(
            clamp((q.x - 0.18) * 2.6, 0.0, 1.0),
            clamp((q.y - 0.18) * 2.6, 0.0, 1.0),
            clamp(length(r - 0.5) * 3.4, 0.0, 1.0)
        );
        fragColor = vec4(mix(PAGE_BG, warp, 0.72), 1.0);
        return;
    }

    // View 3: three octave bands, colored separately. Coarse structure is the
    // background, fine detail is the highlight.
    if (u_view > 2.5 && u_view < 3.5) {
        mat2 turn = mat2(0.80, 0.60, -0.60, 0.80);
        vec2 bp = sp;
        float bandA = valueNoise(bp);
        bp = turn * bp * 2.03;
        float bandB = valueNoise(bp);
        bp = turn * bp * 2.03;
        float bandC = valueNoise(bp);
        vec3 bands = mix(PAGE_BG, u_colorC, smoothstep(0.18, 0.85, bandA));
        bands = mix(bands, u_colorB, smoothstep(0.20, 0.90, bandB) * 0.85);
        bands = mix(bands, u_colorA, smoothstep(0.24, 0.94, bandC) * 0.75);
        fragColor = vec4(bands, 1.0);
        return;
    }

    float radius = length(p * vec2(0.82, 1.0));
    float falloff = 1.0 - smoothstep(0.25, 1.45, radius);

    // Density raises the floor of the emission mask; the core stays brighter.
    float edge = mix(0.34, 0.18, u_density);
    float body = smoothstep(edge, edge + 0.44, f) * falloff;
    float core = smoothstep(edge + 0.18, edge + 0.54, f) * falloff;
    float dust = smoothstep(0.54, 0.92, fbm(sp * 1.9 + r * 2.4 + 11.0)) * falloff;

    vec3 color = PAGE_BG;
    color = mix(color, u_colorC, body * 0.62);
    color = mix(color, u_colorB, core * 0.62);
    color = mix(color, u_colorA, pow(core, 2.4) * 0.55);
    color *= 1.0 - dust * 0.45;
    color += u_colorA * pow(body, 6.0) * 0.18;

    // View 4: the color field before the veil and the stars, so the three-stop
    // ramp can be read on its own.
    if (u_view > 3.5) {
        fragColor = vec4(color, 1.0);
        return;
    }

    // A low-frequency veil keeps the frame from going pure black away from the
    // main filaments, without lifting the dark gaps inside them.
    float veil = smoothstep(0.30, 0.86, fbm(sp * 0.55 + r * 0.80 + 21.0)) * falloff;
    color += u_colorC * veil * 0.34;

    float s1 = starField(p * 42.0, 0.020, u_offset.x, 0.10);
    float s2 = starField(p * 78.0 + 13.0, 0.010, u_offset.y, 0.13);
    color += vec3(0.80, 0.84, 0.96) * (s1 + s2) * 0.85;

    // Small dither against banding in the dark gradients.
    color += (hash21(gl_FragCoord.xy + u_offset) - 0.5) * 0.003;

    fragColor = vec4(color, 1.0);
}
