/* ------------------------------------------------------------------
   Shared GLSL: fullscreen vertex shader, hashes, tone mapping.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});
  const S = (Aurora.Shaders = Aurora.Shaders || {});

  S.vertex = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Fullscreen triangle: p is (0,0), (2,0), (0,2) so the triangle covers
  // the whole clip square. p itself is the interpolated 0..1 UV.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  S.prelude = `#version 300 es
precision highp float;
precision highp sampler3D;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// ACES filmic approximation (Narkowicz).  Keeps highlight colour while
// rolling off the bright curtain cores instead of clipping them.
vec3 acesTone(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 linearToSrgb(vec3 c) {
  return pow(max(c, 0.0), vec3(1.0 / 2.2));
}
`;
})();
