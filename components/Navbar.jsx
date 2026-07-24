"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";

const navLinks = [
  { number: "01", label: "Work", href: "#work" },
  { number: "02", label: "About", href: "#about" },
  { number: "03", label: "Services", href: "#services" },
  { number: "04", label: "Let's Talk", hoverLabel: "Contact", href: "#contact" },
];

export default function Navbar() {
  const menuToggleRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerPanelRef = useRef(null);
  const menuLinkRefs = useRef([]);
  const menuBarRefs = useRef([]);
  const drawerTimelineRef = useRef(null);
  const ctaLabelRef = useRef(null);
  const ctaTweenRef = useRef(null);
  const previousScrollStylesRef = useRef(null);
  const scrollLockedRef = useRef(false);
  const [active, setActive] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


  // active-section tracking via IntersectionObserver
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector(link.href))
      .filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            setActive(id);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const restoreScrollStyles = () => {
    if (!scrollLockedRef.current || !previousScrollStylesRef.current) return;

    const { root, body } = previousScrollStylesRef.current;
    document.documentElement.style.overflow = root.overflow;
    document.documentElement.style.overscrollBehavior = root.overscrollBehavior;
    document.body.style.overflow = body.overflow;
    document.body.style.overscrollBehavior = body.overscrollBehavior;
    previousScrollStylesRef.current = null;
    scrollLockedRef.current = false;
  };

  useEffect(() => {
    const drawer = drawerRef.current;
    const panel = drawerPanelRef.current;
    const menuLinks = menuLinkRefs.current.filter(Boolean);
    const menuBars = menuBarRefs.current.filter(Boolean);
    if (!drawer || !panel) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    drawerTimelineRef.current?.kill();

    if (isDrawerOpen) {
      if (!scrollLockedRef.current) {
        previousScrollStylesRef.current = {
          root: {
            overflow: document.documentElement.style.overflow,
            overscrollBehavior:
              document.documentElement.style.overscrollBehavior,
          },
          body: {
            overflow: document.body.style.overflow,
            overscrollBehavior: document.body.style.overscrollBehavior,
          },
        };
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.overscrollBehavior = "none";
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
        scrollLockedRef.current = true;
      }

      if (reducedMotion) {
        gsap.set(drawer, { autoAlpha: 1 });
        gsap.set(panel, { y: 0, opacity: 1 });
        gsap.set(menuLinks, { y: 0, opacity: 1 });
        gsap.set(menuBars, {
          y: (index) => (index === 0 ? 5 : -5),
          rotation: (index) => (index === 0 ? 45 : -45),
        });
        menuLinkRefs.current[0]?.focus();
        return;
      }

      const timeline = gsap.timeline({
        onComplete: () => menuLinkRefs.current[0]?.focus(),
      });
      drawerTimelineRef.current = timeline;
      gsap.set(drawer, { autoAlpha: 1 });
      timeline
        .set(panel, { y: 28, opacity: 0 })
        .set(menuLinks, { y: 18, opacity: 0 })
        .to(drawer, { opacity: 1, duration: 0.2, ease: "power1.out" })
        .to(
          panel,
          { y: 0, opacity: 1, duration: 0.45, ease: "power4.out" },
          "<",
        )
        .to(
          menuLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.38,
            stagger: 0.07,
            ease: "power3.out",
          },
          "-=0.18",
        );
      gsap.to(menuBars, {
        y: (index) => (index === 0 ? 5 : -5),
        rotation: (index) => (index === 0 ? 45 : -45),
        duration: 0.25,
        ease: "power2.out",
      });
      return;
    }

    if (reducedMotion) {
      restoreScrollStyles();
      gsap.set(menuBars, { y: 0, rotation: 0 });
      gsap.set(menuLinks, { y: 18, opacity: 0 });
      gsap.set(panel, { y: 28, opacity: 0 });
      gsap.set(drawer, { autoAlpha: 0 });
      return;
    }

    const timeline = gsap.timeline({
      onComplete: restoreScrollStyles,
    });
    drawerTimelineRef.current = timeline;
    timeline
      .to(menuLinks, {
        y: 12,
        opacity: 0,
        duration: 0.16,
        stagger: 0.035,
        ease: "power2.in",
      })
      .to(
        panel,
        { y: 28, opacity: 0, duration: 0.24, ease: "power2.in" },
        "<",
      )
      .to(drawer, {
        autoAlpha: 0,
        duration: 0.18,
        ease: "power1.in",
      });
    gsap.to(menuBars, {
      y: 0,
      rotation: 0,
      duration: 0.2,
      ease: "power2.out",
    });
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
        requestAnimationFrame(() => menuToggleRef.current?.focus());
        return;
      }

      if (event.key !== "Tab") return;

      const drawerFocusables = Array.from(
        drawerRef.current?.querySelectorAll(
          'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])',
        ) ?? [],
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );
      const focusables = [menuToggleRef.current, ...drawerFocusables].filter(
        Boolean,
      );
      if (focusables.length === 0) return;

      const currentIndex = focusables.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? focusables.length - 1
          : currentIndex - 1
        : currentIndex === -1 || currentIndex === focusables.length - 1
          ? 0
          : currentIndex + 1;

      event.preventDefault();
      focusables[nextIndex].focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  useEffect(
    () => () => {
      drawerTimelineRef.current?.kill();
      restoreScrollStyles();
    },
    [],
  );

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    requestAnimationFrame(() => menuToggleRef.current?.focus());
  };

  const handleDrawerLinkClick = (event, href) => {
    handleLinkClick(event, href);
    closeDrawer();
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((open) => !open);
  };

  const animateCtaLabel = (target) => {
    const label = ctaLabelRef.current;
    if (!label || label.textContent === target) return;

    ctaTweenRef.current?.kill();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      label.textContent = target;
      return;
    }

    ctaTweenRef.current = gsap
      .timeline({
        onComplete: () => {
          ctaTweenRef.current = null;
        },
      })
      .to(label, {
        yPercent: -60,
        autoAlpha: 0,
        duration: 0.16,
        ease: "power2.in",
      })
      .set(label, { textContent: target, yPercent: 60 })
      .to(label, {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.22,
        ease: "power3.out",
      });
  };

  useEffect(
    () => () => ctaTweenRef.current?.kill(),
    [],
  );

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="navbar-logo">MANISH YADAV</span>
            <span className="navbar-descriptor">Software & Data Science Engineer</span>
          </div>

          <Image
            className="navbar-mark"
            src="/konnect-mark.svg"
            alt=""
            width={1018}
            height={589}
            aria-hidden="true"
          />

          <button
            ref={menuToggleRef}
            type="button"
            className="mobile-menu-toggle"
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-menu-drawer"
            aria-label={
              isDrawerOpen ? "Close navigation menu" : "Open navigation menu"
            }
            onClick={toggleDrawer}
          >
            <span className="menu-toggle-label" aria-hidden="true">
              {isDrawerOpen ? "Close" : "Menu"}
            </span>
            <span className="menu-toggle-bars" aria-hidden="true">
              <span ref={(el) => (menuBarRefs.current[0] = el)} />
              <span ref={(el) => (menuBarRefs.current[1] = el)} />
            </span>
          </button>
        </div>
      </nav>

      <div
        ref={drawerRef}
        id="mobile-menu-drawer"
        className="mobile-menu-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        aria-hidden={!isDrawerOpen}
        onClick={closeDrawer}
      >
        <div ref={drawerPanelRef} className="mobile-menu-panel">
          <div
            className="mobile-menu-layout"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-menu-primary">
              <span className="mobile-menu-kicker">Navigate / Konnect</span>
              <ul className="mobile-menu-links">
                {navLinks.map((link, index) => {
                  const hasAnimatedLabel = Boolean(link.hoverLabel);

                  return (
                    <li key={link.href}>
                      <a
                        ref={(el) => (menuLinkRefs.current[index] = el)}
                        href={link.href}
                        className={`${hasAnimatedLabel ? "mobile-menu-cta" : ""}${active === link.href ? " is-active" : ""}`}
                        aria-current={active === link.href ? "location" : undefined}
                        aria-label={hasAnimatedLabel ? link.hoverLabel : undefined}
                        onMouseEnter={hasAnimatedLabel ? () => animateCtaLabel(link.hoverLabel) : undefined}
                                                onMouseLeave={hasAnimatedLabel ? () => animateCtaLabel(link.label) : undefined}
                                                onFocus={hasAnimatedLabel ? () => animateCtaLabel(link.hoverLabel) : undefined}
                                                onBlur={hasAnimatedLabel ? () => animateCtaLabel(link.label) : undefined}
                        onClick={(event) =>
                          handleDrawerLinkClick(event, link.href)
                        }
                      >
                        <span className="mobile-menu-number">{link.number}</span>
                        <span
                          ref={hasAnimatedLabel ? ctaLabelRef : undefined}
                          className={`mobile-menu-label${hasAnimatedLabel ? " decrypt-label" : ""}`}
                          aria-hidden={hasAnimatedLabel ? "true" : undefined}
                        >
                          {link.label}
                        </span>
                        <span className="mobile-menu-arrow" aria-hidden="true">↗</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="mobile-menu-secondary" aria-label="Studio details">
              <Image
                className="mobile-menu-watermark"
                src="/konnect-mark.svg"
                alt=""
                width={1018}
                height={589}
                aria-hidden="true"
              />
              <div className="mobile-menu-details">
                <div>
                  <span>Inquiries</span>
                  <a href="mailto:hello@konnect.studio">hello@konnect.studio</a>
                </div>
                <div>
                  <span>Based in</span>
                  <p>Mumbai, India</p>
                </div>
                <div>
                  <span>Available for</span>
                  <p>Global Projects</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
