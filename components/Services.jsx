"use client";


import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";



const services = [
  {
    number: "01",
    title: "Languages & DSA",
    desc: "Proficient in Python, JavaScript, and SQL with 300+ LeetCode DSA problems solved, alongside strong foundations in Object-Oriented Programming and DBMS.",
    tags: ["Python", "JavaScript", "SQL", "DSA", "DBMS", "OOP"],
    img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    color: "#4A72FF",
  },
  {
    number: "02",
    title: "Next.js & Frameworks",
    desc: "Developing high-performance, responsive web applications using Next.js, React, FastAPI, Node.js, and Tailwind CSS with dynamic API data rendering.",
    tags: ["Next.js", "FastAPI", "Node.js", "REST APIs", "Tailwind CSS"],
    img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    color: "#7C9CFF",
  },
  {
    number: "03",
    title: "Data & ETL Pipelines",
    desc: "Building ETL pipelines for text data ingestion, indexing, and retrieval. Experienced with Pandas, NumPy, Generative AI integration, and dataset processing.",
    tags: ["Pandas", "NumPy", "ETL Pipelines", "Generative AI", "Retrieval"],
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    color: "#3A5FE0",
  },
  {
    number: "04",
    title: "Tools & Infrastructure",
    desc: "Utilizing Git, Docker, Linux, WebSockets, and caching for asynchronous data processing, version control, and containerized system deployments.",
    tags: ["Git", "Docker", "Linux", "WebSockets", "Caching"],
    img: "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&q=80",
    color: "#2E4FD1",
  },
];

function ServiceRow({
  service,
  index,
  cursorImgRef,
  setPreviewImage,
}) {

  const rowRef = useRef(null);
  const numberRef = useRef(null);
  const titleRef = useRef(null);
  const lineRef = useRef(null);
  const tagsRef = useRef(null);

  useEffect(() => {
    if (!rowRef.current) return;

    gsap.fromTo(
      rowRef.current,
      { opacity: 0, rotationX: -90, z: -100 },
      {
        opacity: 1,
        rotationX: 0,
        z: 0,
        duration: 1.2,
        delay: index * 0.1,
        ease: "power4.out",
        transformOrigin: "top center",
        scrollTrigger: { trigger: rowRef.current, start: "top 90%" },
      },
    );

    if (lineRef.current) {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          delay: index * 0.07,
          ease: "power4.out",
          transformOrigin: "left center",
          scrollTrigger: { trigger: rowRef.current, start: "top 88%" },
        },
      );
    }
  }, [index]);

  const handleMouseEnter = (event) => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (!supportsFinePointer) return;

    if (rowRef.current) {
      gsap.to(rowRef.current, {
        z: 30,
        rotationX: 4,
        scale: 1.02,
        duration: 0.4,
        ease: "power3.out",
      });
    }

    if (!cursorImgRef?.current) return;

    const preview = cursorImgRef.current;
    const rowRect = rowRef.current.getBoundingClientRect();
    const gap = 24;
    const halfWidth = preview.offsetWidth / 2;
    const halfHeight = preview.offsetHeight / 2;
    const fitsOnRight = event.clientX + gap + halfWidth * 2 <= window.innerWidth;
    const previewX = fitsOnRight
      ? event.clientX + gap + halfWidth
      : event.clientX - gap - halfWidth;
    const previewY = Math.min(
      window.innerHeight - halfHeight - 12,
      Math.max(halfHeight + 12, rowRect.top + rowRect.height / 2),
    );

    gsap.killTweensOf(preview);
    gsap.set(preview, { x: previewX });
    gsap.fromTo(
      preview,
      { y: previewY + 24, opacity: 0, scale: 0.88 },
      {
        y: previewY,
        opacity: 1,
        scale: 1,
        duration: 0.48,
        ease: "power3.out",
      },
    );

    setPreviewImage(service.img);


    if (cursorImgRef.current) {
      cursorImgRef.current.style.borderColor = service.color;
    }

    gsap.to(titleRef.current, {
      x: 12,
      color: service.color,
      duration: 0.35,
      ease: "power2.out",
    });
    gsap.to(numberRef.current, {
      color: service.color,
      duration: 0.35,
      ease: "power2.out",
    });
    if (tagsRef.current) {
      gsap.to(tagsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power3.out",
      });
    }
  };

  const handleMouseLeave = () => {
    if (rowRef.current) {
      gsap.to(rowRef.current, {
        z: 0,
        rotationX: 0,
        scale: 1,
        duration: 0.4,
        ease: "power3.out",
      });
    }

    if (!cursorImgRef?.current) return;

    gsap.to(cursorImgRef.current, {
      opacity: 0,
      scale: 0.88,
      duration: 0.35,
      ease: "power3.in",
    });

    gsap.to(titleRef.current, {
      x: 0,
      color: "var(--white)",
      duration: 0.35,
      ease: "power2.out",
    });
    gsap.to(numberRef.current, {
      color: "rgba(240,236,227,0.18)",
      duration: 0.35,
      ease: "power2.out",
    });
    if (tagsRef.current) {
      gsap.to(tagsRef.current, {
        opacity: 0,
        y: 8,
        duration: 0.3,
        ease: "power2.in",
      });
    }
  };

  return (
    <div
      ref={rowRef}
      className="service-row"
      data-service-index={index}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ opacity: 0, transformStyle: "preserve-3d", position: "relative" }}
    >
      <div
        ref={lineRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "rgba(255,255,255,0.07)",
          transformOrigin: "left center",
        }}
      />

      <span ref={numberRef} className="service-row-number">
        {service.number}
      </span>
      <h3 ref={titleRef} className="service-row-title">
        {service.title}
      </h3>

      <div
        ref={tagsRef}
        className="service-row-tags"
        style={{ opacity: 0, transform: "translateY(8px)" }}
      >
        {service.tags.map((tag) => (
          <span key={tag} className="service-row-tag">
            {tag}
          </span>
        ))}
      </div>

      <span className="service-row-arrow">↗</span>
    </div>
  );
}


export default function Services() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cursorImgRef = useRef(null);
  const pointerPositionRef = useRef(null);

  const [previewImage, setPreviewImage] = useState(
    services[0].img,
  );

  const [canHover, setCanHover] = useState(false);


  useEffect(() => {
    const hoverQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const updateCanHover = (event) => setCanHover(event.matches);

    const initialUpdate = window.requestAnimationFrame(() => {
      setCanHover(hoverQuery.matches);
    });
    hoverQuery.addEventListener("change", updateCanHover);

    return () => {
      window.cancelAnimationFrame(initialUpdate);
      hoverQuery.removeEventListener("change", updateCanHover);
    };
  }, []);

  useEffect(() => {
    if (!titleRef.current) return;

    gsap.fromTo(
      titleRef.current,
      { y: 80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: titleRef.current, start: "top 88%" },
      },
    );
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const imgEl = cursorImgRef.current;
    if (!canHover || !section || !imgEl) return;

    const moveX = gsap.quickTo(imgEl, "x", {
      duration: 0.5,
      ease: "power2.out",
    });

    const positionPreview = (clientX, row = null) => {
      const gap = 24;
      const halfWidth = imgEl.offsetWidth / 2;
      const fitsOnRight = clientX + gap + halfWidth * 2 <= window.innerWidth;
      const nextX = fitsOnRight
        ? clientX + gap + halfWidth
        : clientX - gap - halfWidth;

      moveX(nextX);

      if (row) {
        const rect = row.getBoundingClientRect();
        const halfHeight = imgEl.offsetHeight / 2;
        const nextY = Math.min(
          window.innerHeight - halfHeight - 12,
          Math.max(halfHeight + 12, rect.top + rect.height / 2),
        );
        gsap.to(imgEl, {
          y: nextY,
          opacity: 1,
          scale: 1,
          duration: 0.28,
          overwrite: "auto",
          ease: "power2.out",
        });
      }
    };
    const onMove = (event) => {
      pointerPositionRef.current = { x: event.clientX, y: event.clientY };
      positionPreview(event.clientX);
    };
    const hidePreview = () => {
      gsap.to(imgEl, {
        opacity: 0,
        scale: 0.88,
        duration: 0.18,
        overwrite: true,
        ease: "power2.out",
      });
    };

    let scrollFrame = null;
    const syncPreviewToPointer = () => {
      scrollFrame = null;
      const pointer = pointerPositionRef.current;
      if (!pointer) {
        hidePreview();
        return;
      }

      const elementAtPointer = document.elementFromPoint(pointer.x, pointer.y);
      const row = elementAtPointer?.closest(".service-row");
      if (!row || !section.contains(row)) {
        hidePreview();
        return;
      }

      const serviceIndex = Number(row.dataset.serviceIndex);
      const service = services[serviceIndex];
      if (!service) {
        hidePreview();
        return;
      }

      setPreviewImage(service.img);
      imgEl.style.borderColor = service.color;
      positionPreview(pointer.x, row);
    };
    const onScroll = () => {
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(syncPreviewToPointer);
    };

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", hidePreview);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", hidePreview);

    return () => {
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", hidePreview);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", hidePreview);
      moveX.tween.kill();
    };
  }, [canHover]);

  return (
    <section ref={sectionRef} id="services" className="services-section-v2">
      {canHover && (
        <div ref={cursorImgRef} className="services-cursor-img">
          <Image
            src={previewImage}
            alt=""
            fill
            sizes="320px"
            quality={75}
          />
        </div>
      )}


      <div
        ref={titleRef}
        className="services-section-header"
        style={{ textAlign: "center", marginBottom: "80px", opacity: 0 }}
      >
        <span className="section-label">✦ Technical Stack</span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 8vw, 8rem)",
            lineHeight: 0.92,
            color: "var(--white)",
            letterSpacing: "-0.01em",
          }}
        >
          Technical{" "}
          <em
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            Skills
          </em>
        </h2>
      </div>

      <div
        className="services-list"
        style={{ perspective: "1500px" }}
      >
        {services.map((service, i) => (
          <ServiceRow
            key={service.number}
            service={service}
            index={i}
            cursorImgRef={cursorImgRef}
            setPreviewImage={setPreviewImage}
          />

        ))}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(255,255,255,0.07)",
          }}
        />
      </div>

      <div
        style={{ textAlign: "center", marginTop: 80 }}
        ref={(el) => {
          if (!el || el._a) return;
          el._a = true;
          gsap.fromTo(
            el,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%" },
            },
          );
        }}
      >
        <a
          href="#contact"
          className="btn-primary"
          style={{ display: "inline-flex" }}
        >
          <span>Start a Project</span>
          <span>→</span>
        </a>
      </div>
    </section>
  );
}
