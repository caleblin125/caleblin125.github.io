/* ------------------------------------------------------------------
   Bloom chain: threshold + separable Gaussian blur at two resolutions.
   Only the aurora feeds bloom, so the night sky and silhouettes stay
   clean while bright curtains gain a soft atmospheric halo.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  const Aurora = (window.Aurora = window.Aurora || {});
  const S = (Aurora.Shaders = Aurora.Shaders || {});

  S.bloomExtract = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uKnee;
uniform float uGain;

void main() {
  vec3 c = texture(uSrc, vUv + uTexel * vec2(-0.5, -0.5)).rgb;
  c += texture(uSrc, vUv + uTexel * vec2(0.5, -0.5)).rgb;
  c += texture(uSrc, vUv + uTexel * vec2(-0.5, 0.5)).rgb;
  c += texture(uSrc, vUv + uTexel * vec2(0.5, 0.5)).rgb;
  c *= 0.25;

  float br = max(max(c.r, c.g), c.b);
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-5);
  float contribution = max(soft, br - uThreshold) / max(br, 1e-5);

  fragColor = vec4(c * contribution * uGain, 1.0);
}`;

  S.blur = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform vec2 uDir;

void main() {
  vec2 d = uDir * uTexel;
  vec3 c = texture(uSrc, vUv).rgb * 0.227027;
  c += texture(uSrc, vUv + d * 1.384615).rgb * 0.3162162;
  c += texture(uSrc, vUv - d * 1.384615).rgb * 0.3162162;
  c += texture(uSrc, vUv + d * 3.230769).rgb * 0.0702703;
  c += texture(uSrc, vUv - d * 3.230769).rgb * 0.0702703;
  fragColor = vec4(c, 1.0);
}`;

  S.downsample = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
void main() {
  vec2 o = uTexel * 0.5;
  vec3 c = texture(uSrc, vUv + vec2(-o.x, -o.y)).rgb;
  c += texture(uSrc, vUv + vec2(o.x, -o.y)).rgb;
  c += texture(uSrc, vUv + vec2(-o.x, o.y)).rgb;
  c += texture(uSrc, vUv + vec2(o.x, o.y)).rgb;
  fragColor = vec4(c * 0.25, 1.0);
}`;
})();
