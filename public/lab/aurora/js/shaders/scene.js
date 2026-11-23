/* ------------------------------------------------------------------
   Final scene pass: night sky, stars, Milky Way, upscaled aurora,
   bloom, procedural mountain silhouettes and filmic grading.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});
  const S = (Aurora.Shaders = Aurora.Shaders || {});

  S.scene = `
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uAurora;
uniform sampler2D uBloomA;
uniform sampler2D uBloomB;
uniform sampler3D uNoise;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uTanHalf;
uniform float uAspect;
uniform float uTime;
uniform float uExposure;
uniform float uActivity;
uniform float uBloomStrength;
uniform float uBloomWide;

const float TAU = 6.28318530718;
const vec3 MW_AXIS = vec3(0.2626, 0.4021, 0.8774);

vec4 hash43(vec3 p) {
  vec4 p4 = fract(vec4(p.xyzx) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
  p4 += dot(p4, p4.wzxy + 33.33);
  return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec3 starLayer(vec3 rd, float scale, float threshold, float radius, float seed, float gain) {
  vec3 q = rd * scale;
  vec3 cell = floor(q);
  vec3 f = q - cell;
  vec4 h = hash43(cell + seed);
  if (h.x < threshold) return vec3(0.0);

  vec3 sp = vec3(0.3) + h.yzw * 0.4;
  float d = length(f - sp);
  float core = smoothstep(radius, 0.0, d);
  float halo = exp(-d * d * 220.0);
  float mag = pow(h.z, 2.6) * 1.05 + 0.09;
  float twinkle = 0.86 + 0.14 * sin(uTime * (0.6 + h.w * 2.1) + h.y * 43.0);
  vec3 tint = mix(vec3(0.62, 0.76, 1.0), vec3(1.0, 0.87, 0.72), h.y);
  return tint * (core + halo * 0.45) * mag * gain * twinkle;
}

/* One-dimensional ridged noise in azimuth.  Integer frequencies keep
   the silhouette seamless across the 360° wrap. */
float ridge(float u, float baseFreq, float seed, float sharp) {
  float sum = 0.0;
  float amp = 0.55;
  float norm = 0.0;
  float f = baseFreq;
  for (int i = 0; i < 4; i++) {
    float n = texture(uNoise, vec3(u * f + seed, 0.37 + float(i) * 0.13, 0.73)).r;
    n = 1.0 - abs(n * 2.0 - 1.0);
    sum += amp * pow(max(n, 0.0), sharp);
    norm += amp;
    amp *= 0.48;
    f *= 2.0;
  }
  return clamp(sum / norm, 0.0, 1.0);
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec3 rd = normalize(uFwd + uRight * (ndc.x * uTanHalf * uAspect) + uUp * (ndc.y * uTanHalf));
  float elev = asin(clamp(rd.y, -1.0, 1.0));

  /* ---------------- sky ---------------- */
  float upness = smoothstep(-0.015, 0.62, elev);
  vec3 col = mix(vec3(0.0120, 0.0190, 0.0300), vec3(0.0030, 0.0052, 0.0115), upness);

  /* faint airglow / atmospheric scatter above the northern horizon */
  float horizonGlow = exp(-abs(elev) * 13.0);
  col += vec3(0.0060, 0.0150, 0.0130) * horizonGlow * 0.7;
  float air = exp(-max(elev, 0.0) * 6.0) * smoothstep(-0.02, 0.06, elev);
  col += vec3(0.0080, 0.0240, 0.0180) * air * (0.25 + 0.75 * uActivity);

  /* ---------------- Milky Way ---------------- */
  float mwBand = dot(rd, MW_AXIS);
  float mwMask = exp(-pow(mwBand * 2.55, 2.0));
  if (mwMask > 0.004) {
    float n1 = texture(uNoise, rd * 2.7 + vec3(0.31, 0.13, 0.77)).r;
    float n2 = texture(uNoise, rd * 5.6 + vec3(0.83, 0.42, 0.11)).g;
    float dust = smoothstep(0.30, 0.86, n1) * 0.72 + n2 * 0.28;
    vec3 mw = mwMask * (0.20 + 0.80 * dust) * vec3(0.017, 0.023, 0.040);
    mw *= 0.35 + 0.65 * smoothstep(0.0, 0.35, elev);
    col += mw;
  }

  /* ---------------- stars ---------------- */
  float starVis = smoothstep(-0.01, 0.10, elev) * (1.0 - horizonGlow * 0.45);
  if (starVis > 0.01) {
    vec3 stars = vec3(0.0);
    stars += starLayer(rd, 212.0, 0.9875, 0.235, 3.1, 1.0);
    stars += starLayer(rd, 465.0, 0.9945, 0.185, 71.7, 0.55);
    col += stars * starVis;
  }

  /* ---------------- aurora + bloom ---------------- */
  vec3 aurora = texture(uAurora, vUv).rgb;
  col += aurora;

  vec2 bloomUv = vUv;
  vec3 bloom = texture(uBloomA, bloomUv).rgb * uBloomStrength;
  bloom += texture(uBloomB, bloomUv).rgb * uBloomWide;
  col += bloom;

  /* ---------------- mountains ---------------- */
  float az = atan(rd.x, rd.z);
  float u = az / TAU + 0.5;

  float farH = 0.0040 + 0.300 * pow(ridge(u, 6.0, 0.23, 1.05), 0.82);
  float nearH = 0.0030 + 0.195 * pow(ridge(u, 9.0, 0.71, 1.70), 0.95);

  float aa = 0.00055;
  float mFar = 1.0 - smoothstep(farH - aa, farH + aa, elev);
  float mNear = 1.0 - smoothstep(nearH - aa, nearH + aa, elev);

  if (mFar > 0.001) {
    float depth = clamp((farH - elev) / max(farH, 0.001), 0.0, 1.0);
    float rim = smoothstep(farH - 0.045, farH, elev) * smoothstep(-0.02, 0.01, elev);
    vec3 c = mix(vec3(0.0068, 0.0115, 0.0170), vec3(0.0024, 0.0044, 0.0072), depth);
    c += vec3(0.0070, 0.0210, 0.0165) * rim * (0.30 + 0.90 * uActivity) * 0.65;
    c += vec3(0.0035, 0.0055, 0.0080) * (1.0 - depth) * 0.5;
    col = mix(col, c, mFar);
  }

  if (mNear > 0.001) {
    float facet = texture(uNoise, vec3(u * 16.0, elev * 26.0 + 0.4, 0.21)).r;
    float facet2 = texture(uNoise, vec3(u * 41.0, elev * 70.0 + 0.9, 0.57)).g;
    float shade = 0.62 + 0.38 * facet + 0.16 * facet2;
    vec3 c = vec3(0.0035, 0.0062, 0.0090) * shade;
    float rimN = smoothstep(nearH - 0.030, nearH, elev) * smoothstep(-0.01, 0.005, elev);
    c += vec3(0.0070, 0.0210, 0.0165) * rimN * (0.25 + 0.75 * uActivity) * 0.55;
    float snowFace = smoothstep(0.56, 0.82, facet) * (0.30 + 0.70 * rimN);
    c += vec3(0.0075, 0.0150, 0.0165) * snowFace * (0.35 + 0.65 * uActivity);
    col = mix(col, c, mNear);
  }

  /* ground: snow banks and a frozen lake that mirrors the aurora */
  float lakeMask = 0.0;
  float mGround = 1.0 - smoothstep(-0.0012, 0.0012, elev);
  if (mGround > 0.001) {
    float snoise = texture(uNoise, vec3(u * 7.0, elev * 120.0 + 0.5, 0.33)).r;
    float snoise2 = texture(uNoise, vec3(u * 23.0, elev * 260.0 + 0.2, 0.81)).g;
    float snow = 0.55 + 0.45 * snoise * (0.6 + 0.4 * snoise2);

    vec3 g = vec3(0.0042, 0.0068, 0.0092) * (0.50 + 0.70 * snow);
    float lit = (1.0 - smoothstep(0.0, 0.06, elev)) * (0.35 + 0.65 * snow);
    g += vec3(0.0085, 0.0250, 0.0180) * lit * (0.25 + 0.75 * uActivity);

    /* Irregular shoreline, then a physically projected mirror image of the
       aurora buffer.  This is a screen-space reflection of the modelled sky,
       not a second render of the curtain volume.  Two noise scales shape the
       far bank so the shore is never a ruled horizontal line. */
    float bankN = texture(uNoise, vec3(u * 2.4, 0.31, 0.19)).g - 0.5;
    float wob = bankN * 0.058
              + (texture(uNoise, vec3(u * 7.5, 0.53, 0.29)).g - 0.5) * 0.030
              + (texture(uNoise, vec3(u * 23.0, 0.13, 0.67)).b - 0.5) * 0.016;
    float upperE = -0.058 + wob;
    float lowerE = -0.205 + wob * 0.35;
    /* soft banks: the water emerges gradually instead of starting at a seam */
    float lakeUpper = 1.0 - smoothstep(upperE - 0.045, upperE + 0.020, elev);
    float lakeLower = smoothstep(lowerE - 0.030, lowerE + 0.030, elev);
    float lake = lakeUpper * lakeLower;
    lakeMask = lake;

    if (lake > 0.002) {
      float rp = uTime * 0.55;
      /* Long, almost horizontal ripple bands with a slow vertical drift. */
      float r1 = sin(elev * 260.0 + bankN * 9.0 + rp * 0.9);
      float r2 = sin(elev * 95.0 - u * 26.0 - rp * 0.55);
      float r3 = sin(elev * 430.0 + u * 16.0 + rp * 1.6);
      vec2 rip = vec2(r1 * 0.55 + r2 * 0.30, r3 * 0.55 + r2 * 0.22);

      vec3 rr = vec3(rd.x, -rd.y, rd.z);
      float zf = dot(rr, uFwd);
      vec2 ndcR = vec2(
        dot(rr, uRight) / (zf * uTanHalf * uAspect),
        dot(rr, uUp) / (zf * uTanHalf) * 0.62
      );
      vec2 suv = clamp(ndcR * 0.5 + 0.5, 0.0, 1.0);
      suv += rip * 0.0035;

      vec3 refl = texture(uAurora, suv).rgb * 0.55;
      refl += texture(uBloomA, suv).rgb * uBloomStrength * 0.45;
      refl += texture(uBloomB, suv).rgb * uBloomWide * 0.45;
      /* Water both darkens and desaturates what it reflects. */
      float rl = dot(refl, vec3(0.2126, 0.7152, 0.0722));
      refl = mix(vec3(rl), refl, 0.78) * 0.72;

      float fres = 0.06 + 0.94 * pow(1.0 - abs(rd.y), 3.4);
      vec3 water = vec3(0.0016, 0.0028, 0.0044) + refl * fres * 0.72;

      /* A narrow band of lit snow on the far bank anchors the waterline. */
      float bank = smoothstep(upperE - 0.004, upperE + 0.016, elev)
                 * (1.0 - smoothstep(upperE + 0.016, upperE + 0.040, elev));
      water += vec3(0.0120, 0.0300, 0.0230) * bank * (0.30 + 0.70 * uActivity);

      /* thin frozen sheen at the shore */
      float shore = smoothstep(0.0, 0.30, lake) * (1.0 - smoothstep(0.45, 0.8, lake));
      water += vec3(0.0030, 0.0060, 0.0070) * shore;
      g = mix(g, water, smoothstep(0.0, 0.65, lake));
    }
    col = mix(col, g, mGround);
  }

  /* subtle horizon haze over the base of the terrain, but never over the
     near water, which would print a bright line across the lake */
  col += vec3(0.006, 0.011, 0.011) * exp(-abs(elev) * 42.0) * 0.35
       * (1.0 - lakeMask);

  /* ---------------- grade / output ---------------- */
  col *= uExposure;
  col = acesTone(col);

  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, 1.12);
  col = max(col, 0.0);

  /* cool shadow lift, warm highlight restraint */
  col = mix(col, col * vec3(0.91, 1.00, 1.10), 0.30 * (1.0 - luma));

  col = linearToSrgb(col);

  vec2 vq = (vUv - 0.5) * vec2(1.0, 0.92);
  float vig = 1.0 - smoothstep(0.28, 1.05, length(vq));
  col *= mix(0.72, 1.0, vig);

  float grain = hash12(gl_FragCoord.xy + fract(uTime) * 517.0) - 0.5;
  col += grain * 0.010;
  col += (hash12(gl_FragCoord.xy + 7.13) - 0.5) / 255.0;

  fragColor = vec4(col, 1.0);
}`;
})();
