"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import CardDisplace from "./shaders/CardDisplace";

const projects = [
  {
    id: 1,
    tag: "ETL & Retrieval System",
    title: "MentorAI",
    desc: "ETL pipelines for large-scale text data ingestion, transformation, and indexing to reduce query latency and improve retrieval performance.",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=65&fm=webp",
  },
  {
    id: 2,
    tag: "Real-Time Data Engine",
    title: "AutoLink",
    desc: "Geospatial matching system featuring real-time data streaming via WebSockets, caching, and asynchronous processing workflows.",
    img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&q=65&fm=webp",
  },
  {
    id: 3,
    tag: "Next.js / Beauty Platform",
    title: "Ninagashi",
    desc: "Luxury cosmetic tattoo & beauty platform built for Ninagashi (Scottsdale, AZ) using Next.js, JavaScript, and Tailwind CSS with custom media optimization.",
    img: "https://ninagashi.com/Image-04.jpg",
    link: "https://ninagashi.com",
  },
  {
    id: 4,
    tag: "Data Pipeline & SQL",
    title: "HashedBit Backend",
    desc: "Data-driven backend applications processing 5k+ record datasets using Python, REST APIs, and optimized SQL queries.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=65&fm=webp",
  },
];

export default function Work() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const [centeredCard, setCenteredCard] = useState(-1);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const anims = [];
    const cleanups = [];

    // ── Section title reveal
    if (titleRef.current) {
      anims.push(
        gsap.fromTo(
          titleRef.current,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
            scrollTrigger: {
              trigger: titleRef.current,
              start: "top 85%",
            },
          },
        ),
      );
    }

    // ── Horizontal scroll removed for accordion layout
    const track = trackRef.current;
    const section = sectionRef.current;

    // ── Global 3D tilt removed because it causes overlap in a gapless flex accordion

    return () => {
      anims.forEach((a) => a.kill());
      cleanups.forEach((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const isMobileLayout = window.matchMedia(
      "(max-width: 768px), (hover: none), (pointer: coarse)",
    ).matches;
    if (!isMobileLayout) return;

    let frameId = null;
    const updateCenteredCard = () => {
      frameId = null;
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = -1;
      let closestDistance = Infinity;

      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCenteredCard((current) =>
        current === closestIndex ? current : closestIndex,
      );
    };

    const scheduleUpdate = () => {
      if (frameId === null) frameId = requestAnimationFrame(updateCenteredCard);
    };

    updateCenteredCard();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section ref={sectionRef} id="work" className="work-section">
      <div className="section-header" ref={titleRef}>
        <span className="section-label">✦ Featured Projects</span>
        <h2 className="section-title">
          <span className="line">Featured Systems &</span>
          <span className="line">Web Platforms</span>
        </h2>
      </div>

      <div className="work-horizontal-wrapper">
        <div
          ref={trackRef}
          className="work-horizontal-track"
        >
          {projects.map((project, i) => {
            const num = (i + 1).toString().padStart(2, '0');
            return (
            <div
              key={project.id}
              ref={(el) => (cardsRef.current[i] = el)}
              className={`work-card${i === (hoveredCard ?? 0) ? " is-active" : ""}`}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => {
                if (project.link) {
                  window.open(project.link, "_blank", "noopener,noreferrer");
                }
              }}
              style={{ cursor: project.link ? "pointer" : "default" }}
            >
              <CardDisplace
                src={project.img}
                alt={project.title}
                className="work-card-img"
                mobileActive={centeredCard === i}
                desktopActive={i === (hoveredCard ?? 0)}
              />

              {/* Collapsed State */}
              <div className="work-card-collapsed">
                <span className="work-card-num">{num}</span>
                <div className="work-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="11" />
                    <line x1="12" y1="7" x2="12" y2="17" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                  </svg>
                </div>
              </div>

              {/* Expanded State */}
              <div className="work-card-overlay">
                <div className="work-card-content">
                  <span className="work-card-tag">{project.tag}</span>
                  <h3 className="work-card-title">{project.title}</h3>
                  <p className="work-card-desc">{project.desc}</p>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="work-card-link-btn"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 12,
                        padding: "6px 14px",
                        borderRadius: 20,
                        background: "var(--accent)",
                        color: "#0a0a0a",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Live Site ↗
                    </a>
                  )}
                </div>
                <div className="work-card-icon minus">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="11" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                  </svg>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* View All CTA */}
      <div
        style={{ textAlign: "center", marginTop: 80 }}
        ref={(el) => {
          if (!el || el._animated) return;
          el._animated = true;
          gsap.fromTo(
            el,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 90%" },
            },
          );
        }}
      >
        <a href="#" className="btn-primary" style={{ display: "inline-flex" }}>
          <span>View All Projects</span>
          <span>→</span>
        </a>
      </div>
    </section>
  );
}
