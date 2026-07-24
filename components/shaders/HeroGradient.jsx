"use client";

import { useRef, useMemo } from "react";
import { useWebGL, QUAD_VERT } from "./useWebGL";

// ──────────────────────────────────────────────────────────────────────────────
// Minimal Simplex-style gradient noise (no texture lookup required).
// Based on Stefan Gustavson's public-domain simplex noise — stripped to 2D only
// for the smallest possible instruction count.
// ──────────────────────────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec2  uResolution;

  varying vec2 vUv;

  // ── Permutation helpers (no texture needed)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289((x*34.0+1.0)*x); }

  // ── 2D simplex noise — returns [-1, 1]
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
                        0.366025403784439,
                       -0.577350269189626,
                        0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy  -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                             + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // ── 2-octave FBM — max 2 octaves for mobile perf
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2  s = vec2(1.0);
    for (int i = 0; i < 2; i++) {
      v += a * snoise(p * s);
      s *= 2.0;
      a *= 0.45;
    }
    return v;
  }

  void main() {
    // Aspect-corrected UVs centred at 0
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = (vUv - 0.5) * aspect;

    float t = uTime * 0.12;

    // Three overlapping noise fields at different scales / speeds
    float n1 = fbm(uv * 1.4 + vec2(t * 0.7, t * 0.4));
    float n2 = fbm(uv * 0.9 + vec2(-t * 0.5, t * 0.3) + 3.7);
    float n3 = fbm(uv * 2.2 + vec2(t * 0.3, -t * 0.6) + 7.1);

    float blend = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;  // −1 … +1 range

    // ── Konnect palette
    // --accent       #192bc2  (0.098, 0.169, 0.761)
    // --accent-bright #3c52e8 (0.235, 0.322, 0.910)
    // --black (cream) #faf6f0 (0.980, 0.965, 0.941)
    // --accent-dim   #13229b  (0.075, 0.133, 0.608)
    vec3 colA = vec3(0.098, 0.169, 0.761);  // accent blue
    vec3 colB = vec3(0.235, 0.322, 0.910);  // accent bright
    vec3 colC = vec3(0.075, 0.133, 0.608);  // accent dim / deep

    // Smooth three-way mix driven by noise
    float t1 = smoothstep(-0.6, 0.6, blend);
    float t2 = smoothstep( 0.0, 1.0, blend);
    vec3 col = mix(mix(colC, colA, t1), colB, t2 * 0.6);

    // ── Radial vignette — feather to cream at edges
    float vignette = 1.0 - smoothstep(0.35, 1.1, length(uv * 0.95));

    // Very low alpha so the shader sits as an atmospheric layer
    // behind the existing CSS orbits, glow, and text
    gl_FragColor = vec4(col, vignette * 0.18);
  }
`;

export default function HeroGradient() {
  const canvasRef = useRef(null);

  // Cache the uniform locations after program is created
  const locsRef = useRef(null);

  const setUniforms = useMemo(() => {
    return (gl, program, t, w, h, programToken) => {
      if (locsRef.current?.programToken !== programToken) {
        locsRef.current = {
          programToken,
          uTime:       gl.getUniformLocation(program, "uTime"),
          uResolution: gl.getUniformLocation(program, "uResolution"),
        };
      }
      const { uTime, uResolution } = locsRef.current;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, w, h);
    };
  }, []);

  useWebGL(canvasRef, FRAG, setUniforms);

  return (
    <canvas
      ref={canvasRef}
      className="hero-shader-canvas"
      aria-hidden="true"
    />
  );
}
