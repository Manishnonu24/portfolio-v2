"use client";

import { useEffect, useRef, useState } from "react";
import { Draggable } from "gsap/Draggable";
import Image from "next/image";
import { gsap } from "../lib/gsap";

if (typeof window !== "undefined") gsap.registerPlugin(Draggable);

const testimonials = [
  {
    quote:
      "Developed and maintained the Ninagashi platform (ninagashi.com) using Next.js, JavaScript, and Tailwind CSS. Built reusable UI components, integrated scheduling APIs, and optimized website performance using Next.js routing.",
    name: "Software Developer Intern",
    role: "DIFM — On-site (Jun 2026 – Present)",
    avatar:
      "https://ninagashi.com/Image-04.jpg",
    link: "https://ninagashi.com",
  },
  {
    quote:
      "Developed data-driven applications using Python and REST APIs, handling structured datasets efficiently. Processed 5k+ records for scalable backend systems and optimized SQL queries.",
    name: "Software Engineer Intern",
    role: "HashedBit Innovations — Remote (Sep 2025 – Nov 2025)",
    avatar:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=100&h=100&q=80&fit=crop",
  },
  {
    quote:
      "Data Science Certification (CodeWithHarry) & Generative AI Course (Udemy). Solved 300+ LeetCode problems in Data Structures & Algorithms and built scalable backend systems.",
    name: "Certifications & Credentials",
    role: "CodeWithHarry | Udemy | LeetCode",
    avatar:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&q=80&fit=crop",
  },
];

const AUTOPLAY_MS = 5500;

export default function Testimonials() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const sliderRef = useRef(null);
  const progressFillRef = useRef(null);
  const [active, setActive] = useState(0);
  const itemsRef = useRef([]);
  const isAnimating = useRef(false);
  const activeRef = useRef(0);
  const progressTweenRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: titleRef.current, start: "top 85%" },
        },
      );

      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, { opacity: i === 0 ? 1 : 0, z: i === 0 ? 0 : -300, rotationX: i === 0 ? 0 : 20 });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const goTo = (index) => {
    if (isAnimating.current || index === activeRef.current) return;
    isAnimating.current = true;

    const currentEl = itemsRef.current[activeRef.current];
    const nextEl = itemsRef.current[index];

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating.current = false;
        setActive(index);
      },
    });

    tl.to(currentEl, { opacity: 0, z: -300, rotationX: 20, duration: 0.5, ease: "power3.in" })
      .set(nextEl, { opacity: 0, z: -500, rotationX: -20 })
      .to(nextEl, { opacity: 1, z: 0, rotationX: 0, duration: 0.7, ease: "power3.out" });
  };

  const prev = () =>
    goTo((activeRef.current - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((activeRef.current + 1) % testimonials.length);

  // ── NEW: autoplay driven by a single progress-bar tween. Restarts whenever the
  // active slide changes (manually or automatically) and pauses on hover/drag.
  useEffect(() => {
    const runCycle = () => {
      if (progressTweenRef.current) progressTweenRef.current.kill();
      gsap.set(progressFillRef.current, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      progressTweenRef.current = gsap.to(progressFillRef.current, {
        scaleX: 1,
        duration: AUTOPLAY_MS / 1000,
        ease: "none",
        paused: pausedRef.current || document.hidden,
        onComplete: next,
      });

    };
    runCycle();
    return () => progressTweenRef.current && progressTweenRef.current.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const setPaused = (val) => {
    pausedRef.current = val;
    if (progressTweenRef.current) {
      if (val) progressTweenRef.current.pause();
      else progressTweenRef.current.resume();
    }
  };

  // ── NEW: swipe/drag support. Draggable was imported in lib/gsap.js but never
  // actually used anywhere — this is the first real use of it.
  useEffect(() => {
    if (!sliderRef.current) return;

    const proxy = document.createElement("div");
    const draggable = Draggable.create(proxy, {
      type: "x",
      trigger: sliderRef.current,
      onDragStart: () => setPaused(true),
      onDragEnd: function () {
        const threshold = 60;
        if (this.x < -threshold) next();
        else if (this.x > threshold) prev();
        setPaused(false);
        gsap.set(proxy, { x: 0 });
      },
    })[0];

    return () => draggable && draggable.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={sectionRef} className="testimonials-section">
      <div
        ref={titleRef}
        className="section-header"
        style={{ padding: 0, marginBottom: 0 }}
      >
        <span className="section-label">✦ Career & Experience</span>
        <h2 className="section-title">
          <span className="line">Professional Journey</span>
        </h2>
      </div>

      <div
        ref={sliderRef}
        className="testimonials-slider"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ perspective: "1500px" }}
      >
        {testimonials.map((t, i) => (
          <div
            key={i}
            ref={(el) => (itemsRef.current[i] = el)}
            className={`testimonial-item ${i === active ? "active" : ""}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            <p className="testimonial-quote">{t.quote}</p>
            <div className="testimonial-author">
              <Image
                src={t.avatar}
                alt={t.name}
                className="testimonial-avatar"
                width={100}
                height={100}
                sizes="100px"
                quality={75}
              />

              <div>
                <p className="testimonial-name">{t.name}</p>
                <p className="testimonial-role">{t.role}</p>
                {t.link && (
                  <a
                    href={t.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 8,
                      fontSize: 12,
                      color: "var(--accent)",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Visit Live Site ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="testimonial-nav">
        <button onClick={prev} className="testimonial-btn">
          ←
        </button>
        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`testimonial-dot ${i === active ? "active" : ""}`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
        <button onClick={next} className="testimonial-btn">
          →
        </button>
      </div>

      <div className="testimonial-progress-track">
        <div ref={progressFillRef} className="testimonial-progress-fill" />
      </div>
      <p className="testimonial-drag-hint">Drag to browse</p>
    </section>
  );
}
