"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useWebGL } from "./useWebGL";

// ──────────────────────────────────────────────────────────────────────────────
// Fragment shader: samples a pre-loaded image texture then displaces UVs
// with a cheap hash-based noise — no external texture fetch needed.
// On hover  → uStrength lerps up to 0.035
// On leave  → uStrength lerps back to 0
// On touch devices this component renders the plain <img> — zero shader cost.
// ──────────────────────────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
  precision mediump float;

  uniform sampler2D uTexture;
  uniform float     uStrength;
  uniform float     uTime;
  uniform vec2      uMouse;   // normalised 0..1
  uniform vec2      uResolution;
  uniform vec2      uImageRes;

  varying vec2 vUv;

  // Fast hash noise — no texture lookup required
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 43.21);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(
      mix(hash(i),           hash(i+vec2(1,0)), u.x),
      mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x),
      u.y
    );
  }

  void main() {
    // Object-fit: cover calculation
    vec2 ratio = vec2(
      min((uResolution.x / uResolution.y) / (uImageRes.x / uImageRes.y), 1.0),
      min((uResolution.y / uResolution.x) / (uImageRes.y / uImageRes.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Mouse proximity ripple (use vUv for screen space)
    vec2  diff     = vUv - uMouse;
    float dist     = length(diff);
    float ripple   = smoothstep(0.5, 0.0, dist) * sin(dist * 18.0 - uTime * 4.0) * 0.5;

    // Base noise displacement (use vUv for screen space consistency)
    float n  = noise(vUv * 5.0 + uTime * 0.4);
    float n2 = noise(vUv * 10.0 - uTime * 0.3) * 0.5;
    vec2  disp = vec2(n + n2 * 0.5, n2 + n * 0.3) * 2.0 - 1.0;

    // Add mouse ripple to displacement
    disp += diff * ripple * 0.6;

    // Apply displacement to the object-fit covered uv
    vec2 displaced = uv + disp * uStrength;
    gl_FragColor = texture2D(uTexture, displaced);
  }
`;

// Vertex shader (same quad as useWebGL's QUAD_VERT — duplicated to be self-contained)
const VERT = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  varying vec2 vPos;
  void main() {
    vUv  = aPos * 0.5 + 0.5;
    vPos = aPos;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

// Small hook: compile + run this shader on a canvas, driving it with an
// image texture and hover strength
function useDisplaceShader(canvasRef, imgSrc) {
  const locsRef     = useRef(null);
  const texRef      = useRef(null);
  const contextRef  = useRef(null);
  const imgResRef   = useRef({ w: 1, h: 1 });
  const strengthRef = useRef(0);    // current animated strength
  const targetRef   = useRef(0);   // target (0 or 0.035)
  const mouseRef    = useRef({ x: 0.5, y: 0.5 });

  // Expose setters for hover and mouse
  const handlers = useMemo(() => ({
    onEnter: () => { targetRef.current = 0.035; },
    onLeave: () => { targetRef.current = 0; },
    onMove:  (e, rect) => {
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1 - (e.clientY - rect.top) / rect.height, // flip Y for WebGL
      };
    },
  }), []);

  const setUniforms = useMemo(() => {
    return (gl, program, t, w, h, programToken) => {
      if (contextRef.current !== gl) {
        contextRef.current = gl;
        locsRef.current = null;
        texRef.current = null;
        imgResRef.current = { w: 1, h: 1 };
      }

      // Lazy-load texture
      if (!texRef.current && imgSrc) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // Placeholder 1×1 pixel while image loads
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
          new Uint8Array([0, 0, 0, 0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        texRef.current = tex;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          imgResRef.current = { w: img.width, h: img.height };
          // Do not generate mipmaps for NPOT textures
        };
        img.src = imgSrc;
      }

      if (locsRef.current?.programToken !== programToken) {
        locsRef.current = {
          programToken,
          uTexture:  gl.getUniformLocation(program, "uTexture"),
          uStrength: gl.getUniformLocation(program, "uStrength"),
          uTime:     gl.getUniformLocation(program, "uTime"),
          uMouse:    gl.getUniformLocation(program, "uMouse"),
          uResolution: gl.getUniformLocation(program, "uResolution"),
          uImageRes:   gl.getUniformLocation(program, "uImageRes"),
        };
      }

      // Smooth lerp toward target strength (ease-out feel)
      strengthRef.current += (targetRef.current - strengthRef.current) * 0.08;

      const { uTexture, uStrength, uTime, uMouse, uResolution, uImageRes } = locsRef.current;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texRef.current);
      gl.uniform1i(uTexture, 0);
      gl.uniform1f(uStrength, strengthRef.current);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform2f(uResolution, w, h);
      gl.uniform2f(uImageRes, imgResRef.current.w, imgResRef.current.h);
    };
  }, [imgSrc]);

  useWebGL(canvasRef, FRAG, setUniforms);

  return handlers;
}

function DisplaceCanvas({ src, className, active, interactive }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const handlers = useDisplaceShader(canvasRef, src);

  useEffect(() => {
    if (active) handlers.onEnter();
    else handlers.onLeave();
  }, [active, handlers]);

  const handleMouseMove = (event) => {
    if (interactive && wrapRef.current) {
      handlers.onMove(event, wrapRef.current.getBoundingClientRect());
    }
  };

  return (
    <div
      ref={wrapRef}
      className="card-displace-wrap"
      onMouseEnter={interactive ? handlers.onEnter : undefined}
      onMouseLeave={
        interactive
          ? active
            ? handlers.onEnter
            : handlers.onLeave
          : undefined
      }
      onMouseMove={interactive ? handleMouseMove : undefined}
    >
      <canvas
        ref={canvasRef}
        className={`card-displace-canvas ${className ?? ""}`}
        aria-hidden="true"
      />
    </div>
  );
}

// Public component: hover-driven on desktop, center-driven on touch layouts.
export default function CardDisplace({
  src,
  alt,
  className,
  mobileActive = false,
  desktopActive = false,
}) {
  const [isMobileLayout, setIsMobileLayout] = useState(null);

  useEffect(() => {
    const media = window.matchMedia(
      "(max-width: 768px), (hover: none), (pointer: coarse)",
    );
    const updateInputMode = () => setIsMobileLayout(media.matches);

    updateInputMode();
    media.addEventListener("change", updateInputMode);
    return () => media.removeEventListener("change", updateInputMode);
  }, []);

  const shouldRenderShader =
    isMobileLayout === false
      ? desktopActive
      : isMobileLayout === true && mobileActive;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
      />
      {shouldRenderShader && (
        <DisplaceCanvas
          src={src}
          className={className}
          active={isMobileLayout ? mobileActive : desktopActive}
          interactive={!isMobileLayout}
        />
      )}
    </>
  );
}
