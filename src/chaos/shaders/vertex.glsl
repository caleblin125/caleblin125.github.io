#version 300 es

precision highp float;

in vec2 seed;

uniform vec2 resolution;
uniform vec2 center;
uniform float zoom;
uniform int iterations;

out vec3 pointColor;
out float pointVisible;

vec3 hsvToRgb(vec3 hsv) {
    vec3 rgb = abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0;
    return hsv.z * mix(vec3(1.0), clamp(rgb, 0.0, 1.0), hsv.y);
}

void main() {
    vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
    vec2 initial = (seed * aspect) / zoom + center;
    vec2 current = vec2(0.0);
    vec2 previous = vec2(0.0);
    vec2 next = vec2(0.0);
    int step = gl_InstanceID + 1;
    bool stable = true;

    for (int index = 0; index < 1000; index++) {
        if (index >= iterations) break;
        next = vec2(current.x * current.x - current.y * current.y, 2.0 * current.x * current.y) + initial;
        current = next;

        if (dot(current, current) > 256.0 || any(isnan(current)) || any(isinf(current))) {
            stable = false;
            break;
        }
    }

    if (!stable) {
        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
        pointColor = vec3(0.0);
        pointVisible = 0.0;
        return;
    }

    current = vec2(0.0);
    for (int index = 0; index < 1000; index++) {
        if (index >= step) break;
        previous = current;
        next = vec2(current.x * current.x - current.y * current.y, 2.0 * current.x * current.y) + initial;
        current = next;
    }

    vec2 screenPosition = (current - center) * zoom / aspect;
    gl_Position = vec4(screenPosition, 0.0, 1.0);
    gl_PointSize = 1.4;
    float angle = atan(next.y - previous.y, next.x - previous.x);
    pointColor = hsvToRgb(vec3(fract(angle / (2.0 * 3.14159265) + 0.5), 1.0, 1.0));
    pointVisible = 1.0;
}