"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

const ITEMS = [
  "KONNECT",
  "CREATIVE",
  "AGENCY",
  "MOTION",
  "DESIGN",
  "BRANDING",
  "WEB",
  "DIGITAL",
  "STUDIO",
  "CRAFT",
];

function MarqueeTrack({ items, direction = 1, speed = 60 }) {
  const trackRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // We have 3 copies of the array. The width of ONE copy is scrollWidth / 3.
    const totalWidth = track.scrollWidth / 3;

    if (direction > 0) {
      animRef.current = gsap.fromTo(track,
        { x: 0 },
        {
          x: -totalWidth,
          duration: totalWidth / speed,
          ease: "none",
          repeat: -1,
        }
      );
    } else {
      animRef.current = gsap.fromTo(track,
        { x: -totalWidth },
        {
          x: 0,
          duration: totalWidth / speed,
          ease: "none",
          repeat: -1,
        }
      );
    }

    // Speed up on scroll
    let currentVelocity = 1;
    const updateVelocity = () => {
      gsap.to(animRef.current, {
        timeScale: currentVelocity,
        duration: 0.5,
        ease: "power2.out",
      });
    };

    let lastScroll = window.scrollY;
    let rafId;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const delta = Math.abs(window.scrollY - lastScroll);
        lastScroll = window.scrollY;
        currentVelocity = 1 + delta * 0.1;
        updateVelocity();
        clearTimeout(window._marqueeReset);
        window._marqueeReset = setTimeout(() => {
          currentVelocity = 1;
          updateVelocity();
        }, 300);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (animRef.current) animRef.current.kill();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [direction, speed]);

  const doubled = [...items, ...items, ...items];

  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      <div ref={trackRef} className="marquee-track" style={{ display: "flex" }}>
        {doubled.map((item, i) => (
          <div key={i} className="marquee-item">
            <span className="marquee-text">{item}</span>
            <span className="marquee-dot">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="marquee-section">
      <MarqueeTrack items={ITEMS} direction={1} speed={55} />
    </div>
  );
}
