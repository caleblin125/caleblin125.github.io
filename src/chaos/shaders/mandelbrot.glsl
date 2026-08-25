#version 300 es

precision highp float;

out vec4 color;

in vec3 pointColor;
in float pointVisible;

void main() {
    if (pointVisible < 0.5) discard;

    vec2 point = gl_PointCoord - 0.5;
    float distanceFromCenter = dot(point, point);
    if (distanceFromCenter > 0.25) discard;

    color = vec4(pointColor, 0.32);
}