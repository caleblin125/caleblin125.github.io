// ============================================================================
// FRAGMENT SHADER TEMPLATE — WebGL2 / GLSL ES 3.00
// ============================================================================
// Copy this file into src/<viz>/shaders/<name>.glsl and import it from the
// renderer as a raw string so Vite inlines it at build time:
//
//     import fragmentSource from "./shaders/<name>.glsl?raw";
//
// Then compile it with the renderer's shader helper, e.g.:
//
//     const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
//
// Existing fragment shaders to use as references:
//   • src/boids/shaders/boids.glsl         — flat-color chevron, alpha 0.88
//   • src/boids/shaders/fade.glsl          — trail-decay pass (background + alpha)
//   • src/chaos/shaders/mandelbrot.glsl    — point sprites with discard()
// ============================================================================

// GLSL ES 3.00 is REQUIRED — the whole site targets WebGL2 (the renderers call
// canvas.getContext("webgl2")). Never drop this line.
#version 300 es

// Fragment shaders must declare a default precision for `float` (and `int` if
// you use it). highp is the site-wide choice.
precision highp float;

// ----------------------------------------------------------------------------
// Inputs (varyings) from the vertex shader
// ----------------------------------------------------------------------------
// Anything the vertex shader wrote to an `out` variable must be declared here
// with a matching name and `in`. Example from boids.glsl:
//     in vec3 color;
// Add as many as the vertex shader provides:
// in vec3 pointColor;
// in float pointVisible;

// ----------------------------------------------------------------------------
// Uniforms (constant for the whole draw call)
// ----------------------------------------------------------------------------
// Per-draw values set from TypeScript via gl.uniform*(). Declare them here with
// the same name the renderer uses, e.g.:
//     uniform float time;
//     uniform vec2 resolution;
//     uniform sampler2D texture;

// ----------------------------------------------------------------------------
// Output
// ----------------------------------------------------------------------------
// GLSL ES 3.00 requires an explicit fragment output. The renderer blends with
// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA), so the alpha channel
// matters: it controls how the fragment composites over the framebuffer.
out vec4 fragmentColor;

void main() {
    // ------------------------------------------------------------------------
    // Optional: discard() to skip a fragment entirely.
    // mandelbrot.glsl discards outside the point-sprite circle:
    //     vec2 point = gl_PointCoord - 0.5;
    //     if (dot(point, point) > 0.25) discard;
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Emit the fragment color. The RGB is the base color; the alpha (last
    // component) determines blending — e.g. 0.88 for near-opaque boids,
    // 0.02 for the slow trail-decay pass, 0.32 for translucent orbit points.
    // ------------------------------------------------------------------------
    fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);

    // Example using a varying + uniform:
    //     fragmentColor = vec4(color, alpha);
}
