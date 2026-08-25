#version 300 es

precision highp float;

out vec4 color;

void main() {
    // Trail decay: each frame the previous content is scaled by (1 - alpha),
    // so alpha = 0.02 gives roughly a 1 s trail at 60 fps
    // (time constant = 1 / (alpha * fps)).
    color = vec4(0.06, 0.03, 0.10, 0.10);
}