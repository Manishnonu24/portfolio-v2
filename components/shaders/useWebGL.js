"use client";

import { useEffect, useRef } from "react";

/**
 * Compile a GLSL shader. Returns null and logs error on failure.
 */
function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[useWebGL] Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Link a WebGL program from vertex + fragment source strings.
 */
function createProgram(gl, vertSrc, fragSrc) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[useWebGL] Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/**
 * Standard fullscreen-quad vertex shader.
 * Provides `vUv` (0..1) and `vPos` (-1..1) to fragment shaders.
 */
export const QUAD_VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  varying vec2 vPos;
  void main() {
    vUv  = aPos * 0.5 + 0.5;
    vPos = aPos;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

/**
 * useWebGL — reusable hook that manages a raw WebGL canvas.
 *
 * @param {React.RefObject} canvasRef  — ref to the <canvas> element
 * @param {string}          fragSrc   — GLSL fragment shader source
 * @param {Function}        setUniforms(gl, program, t, w, h) — called every frame
 *                            use gl.uniform* calls inside to drive your shader.
 *
 * Performance rules baked-in:
 *  • powerPreference: 'low-power'      → efficient GPU on mobile
 *  • antialias: false                  → not needed for fullscreen quads
 *  • IntersectionObserver             → pauses RAF when off-screen
 *  • document.hidden check            → pauses when tab is hidden
 *  • devicePixelRatio capped at 1.5   → halves fill-rate on 3× phones
 */
export function useWebGL(canvasRef, fragSrc, setUniforms) {
  const rafRef = useRef(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Context
    const gl = canvas.getContext("webgl", {
      powerPreference: "low-power",
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      console.warn("[useWebGL] WebGL not supported");
      return;
    }

    // ── Program
    const program = createProgram(gl, QUAD_VERT, fragSrc);
    if (!program) return;
    const programToken = Symbol("webgl-program");

    // ── Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosLoc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    // ── Resize
    const useLowResolution = window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768;
    const dpr = useLowResolution ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Render loop
    const startTime = performance.now();
    const frameInterval = 1000 / 30;
    let lastFrameTime = 0;
    let isIntersecting = true;
    let isRunning = false;

    const draw = (now) => {
      const t = (now - startTime) * 0.001;
      const w = canvas.width;
      const h = canvas.height;

      gl.useProgram(program);

      // Enable alpha blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Caller sets their uniforms
      setUniforms(gl, program, t, w, h, programToken);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const render = (now) => {
      if (!isRunning) return;
      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now;
        draw(now);
      }
      rafRef.current = requestAnimationFrame(render);
    };

    const stopRendering = () => {
      isRunning = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const startRendering = () => {
      if (isRunning || prefersReducedMotion || document.hidden || !isIntersecting) return;
      isRunning = true;
      rafRef.current = requestAnimationFrame(render);
    };

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const nextWidth = Math.round(width * dpr);
      const nextHeight = Math.round(height * dpr);
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (isIntersecting) draw(performance.now());
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Intersection observer — pause when off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        visibleRef.current = isIntersecting;
        if (isIntersecting) {
          draw(performance.now());
          startRendering();
        } else {
          stopRendering();
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    if (prefersReducedMotion) {
      draw(performance.now());
    } else {
      startRendering();
    }

    // ── Page visibility
    const onVisChange = () => {
      if (document.hidden) stopRendering();
      else if (isIntersecting) startRendering();
    };
    document.addEventListener("visibilitychange", onVisChange);

    // ── Cleanup
    return () => {
      stopRendering();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
