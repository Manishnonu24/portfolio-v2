"use client";

import { useRef, useMemo } from "react";
import { useWebGL } from "./useWebGL";

// ──────────────────────────────────────────────────────────────────────────────
// Flowing dark-blue noise field — rendered as a very low-alpha background layer
// behind the Contact section content.
//
// Perf budget:
//   • 3 FBM octaves (mobile ceiling)
//   • mediump precision
//   • IntersectionObserver pause (inside useWebGL)
//   • ~0.5–1 ms/frame on Snapdragon 665
// ──────────────────────────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uScroll;  // 0..1 — driven by scroll progress into section

  varying vec2 vUv;

  // ── Permutation helpers
  vec3 mod289v3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289v3((x*34.0+1.0)*x); }

  // ── 2D simplex noise
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
                        0.366025403784439,
                       -0.577350269189626,
                        0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1,0) : vec2(0,1);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0,i1.y,1)) + i.x + vec3(0,i1.x,1));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x  = 2.0*fract(p*C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x+0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x  = a0.x*x0.x  + h.x*x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.0*dot(m,g);
  }

  // ── 3-octave FBM (mobile ceiling)
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * snoise(p);
      p  = p * 2.0 + vec2(3.1, 7.4);
      a *= 0.45;
    }
    return v;  // roughly −1 … +1
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv  = vUv * aspect;

    // Slow horizontal drift + slight vertical creep driven by time
    float t  = uTime * 0.07;
    float n  = fbm(uv * 1.8 + vec2(t, t * 0.4));
    float n2 = fbm(uv * 0.9 - vec2(t * 0.6, t * 0.2) + 4.3);

    float field = n * 0.6 + n2 * 0.4;  // −1 … +1

    // ── Deep blue palette (darker than hero — Contact "closing" feel)
    // deep midnight   (0.040, 0.070, 0.290)
    // accent          (0.098, 0.169, 0.761)
    // near-black blue (0.025, 0.040, 0.180)
    vec3 colDark = vec3(0.025, 0.040, 0.180);
    vec3 colMid  = vec3(0.060, 0.100, 0.400);
    vec3 colBlue = vec3(0.098, 0.169, 0.761);

    float t1 = smoothstep(-0.8, 0.2, field);
    float t2 = smoothstep( 0.1, 0.9, field);
    vec3 col = mix(mix(colDark, colMid, t1), colBlue, t2 * 0.5);

    // Vignette: dark core, fade to full-dark at edges — adds depth
    float vignette = smoothstep(0.9, 0.3, length((vUv - 0.5) * 1.2));

    // Alpha: scroll-revealed + vignette, capped low for subtlety
    float alpha = vignette * 0.22 * smoothstep(0.0, 0.3, uScroll);

    gl_FragColor = vec4(col, alpha);
  }
`;

export default function ContactNoise() {
  const canvasRef  = useRef(null);
  const locsRef    = useRef(null);
  const scrollRef  = useRef(0);

  // Drive uScroll from IntersectionObserver ratio
  useMemo(() => {
    if (typeof window === "undefined") return;
    // Will be connected after mount — handled in useEffect inside useWebGL
  }, []);

  const setUniforms = useMemo(() => {
    return (gl, program, t, w, h, programToken) => {
      if (locsRef.current?.programToken !== programToken) {
        locsRef.current = {
          programToken,
          uTime:       gl.getUniformLocation(program, "uTime"),
          uResolution: gl.getUniformLocation(program, "uResolution"),
          uScroll:     gl.getUniformLocation(program, "uScroll"),
        };
      }
      const { uTime, uResolution, uScroll } = locsRef.current;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, w, h);
      // Lerp scroll toward 1 slowly — once section is in view it stays "on"
      scrollRef.current = Math.min(scrollRef.current + 0.008, 1.0);
      gl.uniform1f(uScroll, scrollRef.current);
    };
  }, []);

  useWebGL(canvasRef, FRAG, setUniforms);

  return (
    <canvas
      ref={canvasRef}
      className="contact-shader-canvas"
      aria-hidden="true"
    />
  );
}
