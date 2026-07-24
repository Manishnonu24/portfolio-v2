'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, SplitText } from '../lib/gsap';
import ContactNoise from './shaders/ContactNoise';

export default function Contact() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const taglineRef = useRef(null);
  const ctaRef = useRef(null);
  const infoRef = useRef(null);
  const bgTextRef = useRef(null);

  useEffect(() => {
    if (!headingRef.current) return;

    const anims = [];
    const splits = [];

    const split = new SplitText(headingRef.current, {
      type: 'chars',
      charsClass: 'char',
    });
    splits.push(split);

    anims.push(
      gsap.fromTo(
        split.chars,
        { y: '100%', opacity: 0, rotationX: -90 },
        {
          y: '0%',
          opacity: 1,
          rotationX: 0,
          duration: 1,
          stagger: 0.025,
          ease: 'power4.out',
          scrollTrigger: { trigger: headingRef.current, start: 'top 80%' },
        }
      )
    );

    if (taglineRef.current) {
      anims.push(
        gsap.fromTo(
          taglineRef.current,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: taglineRef.current, start: 'top 85%' },
          }
        )
      );
    }

    if (ctaRef.current) {
      anims.push(
        gsap.fromTo(
          ctaRef.current,
          { y: 20, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 88%' },
          }
        )
      );
    }

    if (infoRef.current && infoRef.current.children.length > 0) {
      anims.push(
        gsap.fromTo(
          Array.from(infoRef.current.children),
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: infoRef.current, start: 'top 88%' },
          }
        )
      );
    }

    if (bgTextRef.current && sectionRef.current) {
      anims.push(
        gsap.fromTo(bgTextRef.current, {
          clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
        }, {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: bgTextRef.current,
            start: 'top 95%',
            end: 'bottom 80%',
            scrub: 1.5,
          },
        })
      );
    }

    return () => {
      splits.forEach((s) => s.revert());
      anims.forEach((a) => a.kill());
    };
  }, []);

  return (
    <>
      <section ref={sectionRef} id="contact" className="contact-section">
        {/* WebGL ambient noise — deep blue atmospheric layer */}
        <ContactNoise />

        {/* Decorative bg text */}
        <div ref={bgTextRef} className="contact-bg-text">
          MANISH
        </div>

        <span className="section-label" style={{ marginBottom: 24, display: 'block' }}>
          ✦ Get In Touch
        </span>

        <h2 ref={headingRef} className="contact-heading">
          Let&apos;s Build<br />
          Something{' '}
          <em>Extraordinary</em>
        </h2>

        <p ref={taglineRef} className="contact-tagline">
          Open for Software Engineering, Full-Stack Development, and Data Science opportunities. 
          Reach out directly via email or call!
        </p>

        <div ref={ctaRef} className="magnetic-wrapper contact-cta-wrapper">
          <a
            href="mailto:manishnonu24@gmail.com"
            className="btn-primary contact-cta"
          >
            <span>Send An Email</span>
            <span style={{ fontSize: '1.3rem' }}>→</span>
          </a>
        </div>

        <div ref={infoRef} className="contact-info">
          <div className="contact-info-item">
            <span className="contact-info-label">Email</span>
            <a href="mailto:manishnonu24@gmail.com" className="contact-info-value">
              manishnonu24@gmail.com
            </a>
          </div>
          <div className="contact-info-item">
            <span className="contact-info-label">Phone</span>
            <a href="tel:+916386730347" className="contact-info-value">
              +91 6386730347
            </a>
          </div>
          <div className="contact-info-item">
            <span className="contact-info-label">Status</span>
            <span className="contact-info-value">Open to Work</span>
          </div>
          <div className="contact-info-item">
            <span className="contact-info-label">LinkedIn</span>
            <a
              href="https://linkedin.com/in/manish-yadav-11034a19b"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-info-value"
            >
              linkedin.com/in/manish-yadav-11034a19b
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="footer-logo">MANISH YADAV</span>
        <p className="footer-copy">© 2026 Manish Yadav. All rights reserved.</p>
        <div className="footer-socials">
          <a
            href="https://linkedin.com/in/manish-yadav-11034a19b"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            LinkedIn
          </a>
          <a
            href="https://portfolio-v2-5cp24nzgo-manish-s-projects-76c7bb38.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            Live Site (V2)
          </a>
          <a
            href="https://portfolio-two-rosy-12.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            Portfolio V1
          </a>
          <a
            href="mailto:manishnonu24@gmail.com"
            className="footer-social-link"
          >
            Email
          </a>
        </div>
      </footer>
    </>
  );
}
