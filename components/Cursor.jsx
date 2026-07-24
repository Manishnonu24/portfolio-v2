'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (!supportsFinePointer) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const setDotX = gsap.quickSetter(dot, 'x', 'px');
    const setDotY = gsap.quickSetter(dot, 'y', 'px');
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.2, ease: 'power2.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.2, ease: 'power2.out' });

    const onMove = (e) => {
      setDotX(e.clientX);
      setDotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    // Magnetic movement is reserved for true CTA elements.
    const magneticEls = document.querySelectorAll(
      '.btn-primary, [data-magnetic="true"]'
    );

    const onEnter = (e) => {
      dot.classList.add('is-hovering');
      ring.classList.add('is-hovering');

      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const magneticX = gsap.quickTo(el, 'x', {
        duration: 0.5,
        ease: 'power3.out',
      });
      const magneticY = gsap.quickTo(el, 'y', {
        duration: 0.5,
        ease: 'power3.out',
      });
      const moveMagnetic = (me) => {
        magneticX((me.clientX - cx) * 0.35);
        magneticY((me.clientY - cy) * 0.35);
      };

      el.addEventListener('mousemove', moveMagnetic);
      el._magneticHandler = moveMagnetic;
    };

    const onLeave = (e) => {
      dot.classList.remove('is-hovering');
      ring.classList.remove('is-hovering');

      const el = e.currentTarget;
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      if (el._magneticHandler) {
        el.removeEventListener('mousemove', el._magneticHandler);
        delete el._magneticHandler;
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    magneticEls.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.killTweensOf([dot, ring]);
      magneticEls.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        if (el._magneticHandler) {
          el.removeEventListener('mousemove', el._magneticHandler);
          delete el._magneticHandler;
        }
        gsap.killTweensOf(el);
        gsap.set(el, { x: 0, y: 0 });
      });
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
