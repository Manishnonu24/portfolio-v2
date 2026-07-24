"use client";

import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import Cursor from "../components/Cursor";
import Hero from "../components/Hero";
import MarqueeSection from "../components/Marquee";
import Work from "../components/Work";
import About from "../components/About";
import Services from "../components/Services";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";
import Contact from "../components/Contact";

export default function Home() {
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (!loaderDone) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, [loaderDone]);

  useEffect(() => {
    if (!loaderDone) return;

    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!supportsFinePointer || prefersReducedMotion) {
      return;
    }

    let disposed = false;
    let lenis;
    let ticker;
    let gsapInstance;
    let idleId;

    const initializeLenis = async () => {
      const [{ default: Lenis }, gsapModule, scrollTriggerModule] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

      if (disposed) return;

      gsapInstance = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;

      gsapInstance.registerPlugin(ScrollTrigger);

      lenis = new Lenis({
        duration: 1,
        orientation: "vertical",
        smoothWheel: true,
      });

      lenis.on("scroll", ScrollTrigger.update);

      ticker = (time) => {
        lenis?.raf(time * 1000);
      };

      gsapInstance.ticker.add(ticker);
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(initializeLenis, { timeout: 1500 });
    } else {
      idleId = window.setTimeout(initializeLenis, 500);
    }

    return () => {
      disposed = true;
      if ("cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
      lenis?.destroy();

      if (ticker && gsapInstance) {
        gsapInstance.ticker.remove(ticker);
      }
    };
  }, [loaderDone]);


  return (
    <>
      <Cursor />

      {!loaderDone && <Loader onComplete={() => setLoaderDone(true)} />}

      <div
        style={{
          opacity: loaderDone ? 1 : 0,
          transition: "opacity 0.6s ease",
          pointerEvents: loaderDone ? "auto" : "none",
        }}
      >
        <Navbar visible={loaderDone} />

        <main id="main-content">
          <Hero animateIn={loaderDone} />
          <MarqueeSection />
          <Work />
          <About />
          <Services />
          <Stats />
          <Testimonials />
          <Contact />
        </main>
      </div>
    </>
  );
}
