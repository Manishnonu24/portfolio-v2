"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "../lib/gsap";
import Image from "next/image";

export default function About() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const italicRef = useRef(null);
  const mainImgRef = useRef(null);
  const visualRef = useRef(null);
  const decorCirclesRef = useRef([]);

  useEffect(() => {
    if (!headingRef.current) return;

    const anims = [];
    const splits = [];

    const splitHeading = new SplitText(headingRef.current, {
      type: "lines",
      linesClass: "split-line",
    });
    splits.push(splitHeading);

    splitHeading.lines.forEach((line) => {
      const wrapper = document.createElement("div");
      wrapper.style.overflow = "hidden";
      wrapper.style.display = "block";
      line.parentNode.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    });

    anims.push(
      gsap.fromTo(
        splitHeading.lines,
        { y: "110%", opacity: 0 },
        {
          y: "0%",
          opacity: 1,
          duration: 1,
          stagger: 0.12,
          ease: "power4.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 80%" },
        },
      ),
    );

    if (contentRef.current) {
      anims.push(
        gsap.fromTo(
          contentRef.current,
          { z: -150, opacity: 0 },
          {
            z: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
          },
        ),
      );
    }

    if (bodyRef.current) {
      anims.push(
        gsap.fromTo(
          bodyRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: bodyRef.current, start: "top 82%" },
          },
        ),
      );
    }

    if (italicRef.current) {
      anims.push(
        gsap.fromTo(
          italicRef.current,
          { x: -30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: italicRef.current, start: "top 82%" },
          },
        ),
      );
    }

    decorCirclesRef.current.forEach((circle, index) => {
      if (!circle) return;

      anims.push(
        gsap.to(circle, {
          rotation: index === 0 ? 60 : -40,
          scale: index === 0 ? 1.2 : 1.1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        }),
      );
    });

    if (mainImgRef.current) {
      anims.push(
        gsap.fromTo(
          mainImgRef.current,
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 1.4,
            ease: "power4.out",
            scrollTrigger: { trigger: mainImgRef.current, start: "top 80%" },
          },
        ),
      );
    }

    return () => {
      splits.forEach((s) => s.revert());
      anims.forEach((a) => a.kill());
    };
  }, []);

  useEffect(() => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const section = sectionRef.current;
    const circles = decorCirclesRef.current;

    if (!supportsFinePointer || !section || !circles[0] || !circles[1]) return;

    const xToLarge = gsap.quickTo(circles[0], "x", {
      duration: 1.4,
      ease: "power3.out",
    });
    const yToLarge = gsap.quickTo(circles[0], "y", {
      duration: 1.4,
      ease: "power3.out",
    });
    const xToSmall = gsap.quickTo(circles[1], "x", {
      duration: 1.1,
      ease: "power3.out",
    });
    const yToSmall = gsap.quickTo(circles[1], "y", {
      duration: 1.1,
      ease: "power3.out",
    });

    const onMove = (event) => {
      const rect = section.getBoundingClientRect();
      const relX = (event.clientX - rect.left - rect.width / 2) / rect.width;
      const relY = (event.clientY - rect.top - rect.height / 2) / rect.height;

      xToLarge(relX * 30);
      yToLarge(relY * 30);
      xToSmall(relX * -50);
      yToSmall(relY * -50);
    };

    section.addEventListener("mousemove", onMove);
    return () => {
      section.removeEventListener("mousemove", onMove);
      gsap.killTweensOf(circles);
    };
  }, []);

  // ── NEW: mouse-tilt on the image once it's visible. quickTo keeps this cheap
  // since it fires on every mousemove.
  useEffect(() => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (!supportsFinePointer) return;

    const visual = visualRef.current;
    const img = mainImgRef.current;
    if (!visual || !img) return;

    const rotateX = gsap.quickTo(img, "rotationX", {
      duration: 0.6,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(img, "rotationY", {
      duration: 0.6,
      ease: "power3.out",
    });
    const scaleTo = gsap.quickTo(img, "scale", {
      duration: 0.4,
      ease: "power3.out",
    });

    const onMove = (e) => {
      const rect = visual.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const relY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      rotateY(relX * 6);
      rotateX(-relY * 6);
      scaleTo(1.02);
    };

    const onLeave = () => {
      rotateX(0);
      rotateY(0);
      scaleTo(1);
    };

    visual.addEventListener("mousemove", onMove);
    visual.addEventListener("mouseleave", onLeave);
    return () => {
      visual.removeEventListener("mousemove", onMove);
      visual.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section ref={sectionRef} id="about" className="about-section" style={{ perspective: '1200px' }}>

      <div className="about-grid" style={{ transformStyle: 'preserve-3d' }}>
        <div ref={contentRef} className="about-content" style={{ transformStyle: 'preserve-3d' }}>
          <div
            ref={(element) => (decorCirclesRef.current[0] = element)}
            className="about-decor-circle about-decor-circle-large"
            aria-hidden="true"
          />
          <div
            ref={(element) => (decorCirclesRef.current[1] = element)}
            className="about-decor-circle about-decor-circle-small"
            aria-hidden="true"
          />

          <span className="about-label">✦ About Manish Yadav</span>

          <h2 ref={headingRef} className="about-heading">
            Engineering Data & Building Software
          </h2>

          <p ref={bodyRef} className="about-body">
            I am a B.Tech Computer Science & Data Science student at Ajay Kumar Garg Engineering College (2022–2026, CGPA: 7.3). 
            As a Software Developer Intern at DIFM and former Software Engineer Intern at HashedBit Innovations, I specialize in Next.js web applications, 
            Python backend development, REST APIs, and scalable ETL data pipelines.
          </p>

          <blockquote ref={italicRef} className="about-italic">
            &ldquo;Transforming complex algorithms and datasets into intuitive, high-impact software systems.&rdquo;
          </blockquote>

          <p className="about-body" style={{ marginTop: 0 }}>
            ✦ <strong>300+ LeetCode</strong> problems solved focusing on Data Structures & Algorithms.<br />
            ✦ Experience processing <strong>5k+ record datasets</strong> and building real-time data streaming applications.<br />
            ✦ Certified in <strong>Data Science</strong> (CodeWithHarry) & <strong>Generative AI</strong> (Udemy).
          </p>

          <div style={{ marginTop: 40, marginBottom: 80 }}>
            <div className="magnetic-wrapper">
              <a href="#contact" className="btn-primary">
                <span>Get In Touch</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>

        <div
          ref={visualRef}
          className="about-visual-centered"
          style={{ width: "100%" }}
        >
          <Image
            ref={mainImgRef}
            src="/about-team.jpg"
            alt="Konnect team at work"
            className="about-img-main"
            width={1200}
            height={800}
            sizes="100vw"
            quality={80}
          />

        </div>
      </div>
    </section>
  );
}
