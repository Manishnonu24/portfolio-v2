"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "../lib/gsap";
import HeroGradient from "./shaders/HeroGradient";


export default function Hero({ animateIn = false }) {
  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const actionsRef = useRef(null);
  const scrollIndicatorRef = useRef(null);

  const glowRef = useRef(null);
  const hasAnimated = useRef(false);
  const orbitsContainerRef = useRef(null);

  // ── Scroll parallax (unchanged behavior)
  useEffect(() => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (!supportsFinePointer) return;

    if (!sectionRef.current || !titleRef.current) return;

    const anims = [];



    anims.push(
      gsap.to(titleRef.current, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      }),
    );

    return () => {
      anims.forEach((a) => a.kill());
    };
  }, []);

  // ── NEW: mouse-parallax so the hero has motion before the user scrolls at all.
  // Uses quickTo (a cached, GPU-cheap tween setter) instead of gsap.to() per move
  // event, since this fires on every mousemove.
  useEffect(() => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hasLimitedHardware =
      navigator.hardwareConcurrency <= 4 ||
      ("deviceMemory" in navigator && navigator.deviceMemory <= 4);

    if (!supportsFinePointer || prefersReducedMotion || hasLimitedHardware) return;

    const section = sectionRef.current;
    if (!section || !glowRef.current) return;

    const xToGlow = gsap.quickTo(glowRef.current, "x", {
      duration: 0.9,
      ease: "power3.out",
    });
    const yToGlow = gsap.quickTo(glowRef.current, "y", {
      duration: 0.9,
      ease: "power3.out",
    });

    const xToOrbits =
      orbitsContainerRef.current &&
      gsap.quickTo(orbitsContainerRef.current, "x", {
        duration: 2.5,
        ease: "power3.out",
      });
    const yToOrbits =
      orbitsContainerRef.current &&
      gsap.quickTo(orbitsContainerRef.current, "y", {
        duration: 2.5,
        ease: "power3.out",
      });

    const onMove = (e) => {
      const rect = section.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;

      xToGlow(e.clientX - rect.left - 210);
      yToGlow(e.clientY - rect.top - 210);

      if (xToOrbits) {
        xToOrbits(relX * -30);
        yToOrbits(relY * -30);
      }
    };

    section.addEventListener("mousemove", onMove);
    return () => section.removeEventListener("mousemove", onMove);
  }, []);



  // ── Entrance animation (unchanged)
  useEffect(() => {
    if (!animateIn || hasAnimated.current) return;
    if (!titleRef.current) return;
    hasAnimated.current = true;

    const anims = [];
    const splits = [];

    const split = new SplitText(titleRef.current, {
      type: "chars,words",
      charsClass: "char",
      wordsClass: "word",
    });
    splits.push(split);

    const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power4.out" } });
    anims.push(tl);

    tl.fromTo(
      eyebrowRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      0,
    );
    tl.fromTo(
      split.chars,
      { y: "110%", rotation: 4, opacity: 0 },
      { y: "0%", rotation: 0, opacity: 1, duration: 1, stagger: 0.025 },
      0.1,
    );
    tl.fromTo(
      subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 },
      0.35,
    );
    tl.fromTo(
      actionsRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      0.55,
    );

    if (scrollIndicatorRef.current) {
      tl.fromTo(
        scrollIndicatorRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.85,
      );
    }

    return () => {
      splits.forEach((s) => s.revert());
      anims.forEach((a) => a.kill());
    };
  }, [animateIn]);

  return (
    <section ref={sectionRef} id="hero" className="hero">
      <div className="hero-bg">
        {/* WebGL organic gradient mesh — Awwwards-level shader, zero bundle cost */}
        <HeroGradient />



        {/* Revolving Worlds */}
        <div ref={orbitsContainerRef} className="hero-orbits-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`hero-orbit-ring orbit-${i}`}>
              <div className={`hero-planet planet-${i}`} />
            </div>
          ))}
        </div>

        <div className="hero-glow" />
        <div ref={glowRef} className="hero-mouse-glow" />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <p ref={eyebrowRef} className="hero-eyebrow" style={{ opacity: 0 }}>
          ✦ Software Developer & Data Science Engineer
        </p>

        <h1
          ref={titleRef}
          className="hero-title"
        >
          Building <span className="accent">Scalable AI</span> & Data Systems
        </h1>

        <p ref={subtitleRef} className="hero-subtitle" style={{ opacity: 0 }}>
          Software Developer Intern specializing in Next.js, Python, REST APIs, and ETL Data Pipelines. 
          B.Tech in Computer Science & Data Science from AKGEC.
        </p>

        <div ref={actionsRef} className="hero-actions" style={{ opacity: 0 }}>
          <div className="magnetic-wrapper">
            <a href="#work" className="btn-primary">
              <span>View My Projects</span>
              <span>→</span>
            </a>
          </div>
          <a href="#about" className="btn-secondary">
            About Me →
          </a>
        </div>
      </div>

      <div
        ref={scrollIndicatorRef}
        className="hero-scroll-indicator"
        style={{ opacity: 0 }}
      >
        <div className="scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  );
}
