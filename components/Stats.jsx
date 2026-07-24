"use client";

import { useEffect, useRef } from "react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { gsap } from "../lib/gsap";

if (typeof window !== "undefined") gsap.registerPlugin(DrawSVGPlugin);

const stats = [
  { number: 300, suffix: "+", label: "LeetCode Solved", max: 400 },
  { number: 5, suffix: "k+", label: "Records Processed", max: 10 },
  { number: 7, suffix: ".3", label: "AKGEC CGPA", max: 10 },
  { number: 2, suffix: "", label: "Software Internships", max: 4 },
];

export default function Stats() {
  const sectionRef = useRef(null);
  const itemsRef = useRef([]);
  const numbersRef = useRef([]);
  const ringsRef = useRef([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const anims = [];

    const validItems = itemsRef.current.filter(Boolean);
    if (validItems.length > 0) {
      anims.push(
        gsap.fromTo(
          validItems,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
          },
        ),
      );
    }

    // ── Ring starts fully undrawn; number counts up and the ring draws in lockstep,
    // capped at (number / max) so a ring never reads as "100% full" unless it
    // actually hit its ceiling (e.g. Client Satisfaction really is at its max).
    const fgCircles = ringsRef.current.map(
      (svg) => svg && svg.querySelector(".stat-ring-fg"),
    );
    fgCircles.forEach((fg) => {
      if (fg) gsap.set(fg, { drawSVG: "0%" });
    });

    numbersRef.current.forEach((el, i) => {
      if (!el) return;
      const stat = stats[i];
      const obj = { val: 0 };
      const fg = fgCircles[i];
      const pctOfMax = stat.number / stat.max;

      anims.push(
        gsap.to(obj, {
          val: stat.number,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
          onUpdate: () => {
            el.textContent = Math.round(obj.val) + stat.suffix;
            if (fg) {
              const drawn = (obj.val / stat.number) * pctOfMax * 100;
              gsap.set(fg, { drawSVG: `0% ${drawn}%` });
            }
          },
        }),
      );
    });

    return () => {
      anims.forEach((a) => a.kill());
    };
  }, []);

  const handleEnter = (i) => {
    const item = itemsRef.current[i];
    if (!item) return;
    gsap.to(item, { y: -6, duration: 0.4, ease: "power3.out" });
    gsap.to(itemsRef.current[i].querySelector(".stat-ring-fg"), {
      stroke: "var(--accent-bright)",
      duration: 0.3,
    });
  };
  const handleLeave = (i) => {
    const item = itemsRef.current[i];
    if (!item) return;
    gsap.to(item, { y: 0, duration: 0.5, ease: "power3.out" });
    gsap.to(itemsRef.current[i].querySelector(".stat-ring-fg"), {
      stroke: "var(--accent)",
      duration: 0.3,
    });
  };

  return (
    <section ref={sectionRef} className="stats-section">
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            ref={(el) => (itemsRef.current[i] = el)}
            className="stat-item"
            style={{ position: "relative" }}
            onMouseEnter={() => handleEnter(i)}
            onMouseLeave={() => handleLeave(i)}
          >
            {i !== 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  height: "60px",
                  width: "1px",
                  background: "rgba(255,255,255,0.08)",
                  transform: "translateY(-50%)",
                }}
              />
            )}

            <svg
              className="stat-ring"
              viewBox="0 0 120 120"
              width="120"
              height="120"
              ref={(el) => (ringsRef.current[i] = el)}
            >
              <circle className="stat-ring-bg" cx="60" cy="60" r="52" />
              <circle className="stat-ring-fg" cx="60" cy="60" r="52" />
            </svg>

            <span
              ref={(el) => (numbersRef.current[i] = el)}
              className="stat-number"
            >
              0{stat.suffix}
            </span>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
