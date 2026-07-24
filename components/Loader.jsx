"use client";

import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

const clampProgress = (progress) => Math.max(0, Math.min(1, progress));

export default function Loader({ onComplete }) {
  const loaderRef = useRef(null);
  const logoStageRef = useRef(null);
  const leftLoopRouteRef = useRef(null);
  const leftLoopCompleteRef = useRef(null);
  const blueConnectorRouteRef = useRef(null);
  const blueConnectorCompleteRef = useRef(null);
  const darkConnectorRouteRef = useRef(null);
  const darkConnectorCompleteRef = useRef(null);
  const rightLoopRouteRef = useRef(null);
  const rightLoopCompleteRef = useRef(null);
  const counterRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    document.body.style.overflow = "hidden";
    const statuses = [
      "Booting studio",
      "Loading type",
      "Compiling motion",
      "Almost there",
    ];

    const ctx = gsap.context(() => {
      const exitTl = gsap.timeline({
        paused: true,
        onComplete: () => {
          document.body.style.overflow = "";
          if (onComplete) onComplete();
        },
      });

      exitTl.to(
        [logoStageRef.current, counterRef.current, statusRef.current],
        {
          y: -18,
          scale: 0.98,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.65,
          ease: "power3.in",
        },
      );
      exitTl.to(
        loader,
        {
          opacity: 0,
          duration: 0.35,
          ease: "linear",
          pointerEvents: "none",
        },
        "-=0.15",
      );
      exitTl.set(loader, { display: "none" });

      const progressObj = { val: 0 };
      const updateMask = (route, completion, localProgress) => {
        if (route) route.setAttribute("stroke-dashoffset", 1 - localProgress);
        if (completion) {
          completion.setAttribute("opacity", localProgress >= 1 ? 1 : 0);
        }
      };
      const updateUI = () => {
        const p = progressObj.val;
        const progress = Math.max(0, Math.min(100, p)) / 100;
        const leftLoopProgress = Math.min(1, progress * 3);
        const connectorProgress = clampProgress(progress * 3 - 1);
        const rightLoopProgress = clampProgress(progress * 3 - 2);

        updateMask(
          leftLoopRouteRef.current,
          leftLoopCompleteRef.current,
          leftLoopProgress,
        );
        updateMask(
          blueConnectorRouteRef.current,
          blueConnectorCompleteRef.current,
          connectorProgress,
        );
        updateMask(
          darkConnectorRouteRef.current,
          darkConnectorCompleteRef.current,
          connectorProgress,
        );
        updateMask(
          rightLoopRouteRef.current,
          rightLoopCompleteRef.current,
          rightLoopProgress,
        );
        if (counterRef.current) {
          counterRef.current.innerText = Math.round(p) + "%";
        }
        if (statusRef.current) {
          statusRef.current.innerText =
            statuses[Math.min(3, Math.floor(p / 26))];
        }
      };

      const dummyTween = gsap.to(progressObj, {
        val: 85,
        duration: 4,
        ease: "power2.out",
        onUpdate: updateUI,
      });

      let minTimePassed = false;
      let assetsLoaded = false;

      setTimeout(() => {
        minTimePassed = true;
        checkComplete();
      }, 1500);

      const loadAssets = async () => {
        try {
          await document.fonts.ready;
          const images = Array.from(document.images);
          const imagePromises = images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            });
          });
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(resolve, 2000),
          );
          await Promise.race([Promise.all(imagePromises), timeoutPromise]);
        } catch (err) {
          console.error(err);
        }
        assetsLoaded = true;
        checkComplete();
      };

      const checkComplete = () => {
        if (minTimePassed && assetsLoaded) {
          dummyTween.kill();
          gsap.to(progressObj, {
            val: 100,
            duration: 0.4,
            ease: "power2.out",
            onUpdate: updateUI,
            onComplete: () => exitTl.play(),
          });
        }
      };

      loadAssets();
    }, loaderRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  return (
    <div ref={loaderRef} className="loader">
      <div className="loader-corner loader-corner-tl">
        Konnect<sup>™</sup> — <span ref={statusRef}>Booting studio</span>
      </div>

      <div
        ref={counterRef}
        className="loader-corner loader-corner-tr"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        0%
      </div>

      <div ref={logoStageRef} className="loader-logo-stage">
        <svg
          className="loader-logo"
          viewBox="0 0 1018.23 588.75"
          role="img"
          aria-label="Konnect"
        >
          <defs>
            <linearGradient
              id="loader-g1"
              x1="209.54"
              y1="204.21"
              x2="973.83"
              y2="204.21"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".37" stopColor="#162234" />
              <stop offset=".67" stopColor="#1e3d73" />
            </linearGradient>
            <linearGradient
              id="loader-g2"
              x1="536.75"
              y1="341.37"
              x2="1018.23"
              y2="341.37"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#11203c" />
              <stop offset="1" stopColor="#0f1d37" />
            </linearGradient>
            <linearGradient
              id="loader-g3"
              x1="0"
              y1="246.44"
              x2="474.05"
              y2="246.44"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#4267b1" />
              <stop offset="1" stopColor="#466bb3" />
            </linearGradient>
            <linearGradient
              id="loader-g4"
              x1="37.84"
              y1="383.5"
              x2="800.29"
              y2="383.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".41" stopColor="#3f65af" />
              <stop offset=".75" stopColor="#4369b2" />
            </linearGradient>
            <mask
              id="loader-left-loop-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1018.23"
              height="588.75"
            >
              <rect width="1018.23" height="588.75" fill="black" />
              <path
                ref={leftLoopRouteRef}
                d="M430 90 C350 18 245 -12 158 48 C72 107 32 190 55 285 C70 370 104 455 205 490 C250 506 292 510 330 505"
                pathLength="1"
                stroke="white"
                strokeWidth="230"
                strokeDasharray="1"
                strokeDashoffset="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect
                ref={leftLoopCompleteRef}
                width="1018.23"
                height="588.75"
                fill="white"
                opacity="0"
              />
            </mask>
            <mask
              id="loader-blue-connector-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1018.23"
              height="588.75"
            >
              <rect width="1018.23" height="588.75" fill="black" />
              <path
                ref={blueConnectorRouteRef}
                d="M62 570 C205 570 315 548 405 484 C478 432 528 360 588 296 C652 228 716 176 790 120"
                pathLength="1"
                stroke="white"
                strokeWidth="235"
                strokeDasharray="1"
                strokeDashoffset="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect
                ref={blueConnectorCompleteRef}
                width="1018.23"
                height="588.75"
                fill="white"
                opacity="0"
              />
            </mask>
            <mask
              id="loader-dark-connector-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1018.23"
              height="588.75"
            >
              <rect width="1018.23" height="588.75" fill="black" />
              <path
                ref={darkConnectorRouteRef}
                d="M220 455 C330 408 402 330 476 250 C548 172 606 104 686 65 C770 24 868 26 978 18"
                pathLength="1"
                stroke="white"
                strokeWidth="225"
                strokeDasharray="1"
                strokeDashoffset="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect
                ref={darkConnectorCompleteRef}
                width="1018.23"
                height="588.75"
                fill="white"
                opacity="0"
              />
            </mask>
            <mask
              id="loader-right-loop-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1018.23"
              height="588.75"
            >
              <rect width="1018.23" height="588.75" fill="black" />
              <path
                ref={rightLoopRouteRef}
                d="M790 65 C900 68 975 125 990 205 C1008 300 975 403 900 472 C830 535 728 555 620 520"
                pathLength="1"
                stroke="white"
                strokeWidth="230"
                strokeDasharray="1"
                strokeDashoffset="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect
                ref={rightLoopCompleteRef}
                width="1018.23"
                height="588.75"
                fill="white"
                opacity="0"
              />
            </mask>
          </defs>
          <g className="loader-logo-track" aria-hidden="true">
            <path d="M588.99,170.94c-74.41,79.16-148.82,158.32-223.23,237.47h-156.22c102.53-107.53,205.07-215.06,307.6-322.59C574.43,26.5,651.68,1.35,731.51,1.48c80.77-.49,161.55-.98,242.32-1.48-46.29,48.66-92.57,97.33-138.86,145.99-13.61-9.73-57.06-38.13-117.95-35.11-72.77,3.61-118.1,49.49-128.04,60.07Z" />
            <path d="M619.71,429.52c8.94,9.05,23.4,21.62,43.86,31.26,63.9,30.14,125.63,3.24,133.72-.44,37.3-16.98,57.95-43.73,66.36-54.89,11.69-15.52,42.41-61.32,38.7-125.64-3.1-53.63-28.44-90.47-38.98-104.21,26.47-27.2,52.93-54.4,79.4-81.6,15.05,15.85,36.06,41.71,52.17,78.38,26.26,59.78,23.87,112.7,22.64,134.44-1.45,25.56-8.35,121.5-84.92,198.65-96.56,97.3-223.19,83.4-237.87,81.53-81.87-10.43-136.65-54.53-158.03-73.81,27.65-27.89,55.31-55.78,82.96-83.67Z" />
            <path d="M474.05,72.74C457.44,58.13,386.02-1.36,279.33,1.48c-113.83,3.02-184.64,74.78-198.89,89.88C61.68,111.23,11.24,170.3,1.58,261.94c-13.32,126.38,61.47,214.93,74.24,229.55,25.41-26.81,50.83-53.62,76.24-80.43-10.51-16.83-21.02-33.66-31.53-50.49-5.32-13.74-23.89-66.46-2.87-127.98,20.83-60.97,67.08-91.15,87.38-102.15,11.9-6.45,39.11-20.79,76.57-21.14,44.33-.41,77.36,19.01,90.58,27.01,9.71,5.87,17.26,11.65,22.36,15.85,26.5-26.47,53-52.95,79.5-79.42Z" />
            <path d="M800.29,178.25h-153.35c-30.24,31.02-60.48,62.03-90.72,93.05-40.68,40.85-72.48,73.8-92.44,94.67-62.49,65.32-77.08,83.36-111.5,96.72-43.77,16.99-84.07,12.65-99.46,10.27-35.38-5.46-61.63-19.41-76.52-28.86-46.15,47.39-92.3,94.78-138.45,142.17,28.04,1.08,56.69,1.84,85.93,2.25,26.1.36,38.26.24,89.49.1,120.56-.33,127.39.15,145.77-4.73,41.53-11.03,70.55-30.46,88.7-42.82,13.52-9.21,28.67-22.4,98.03-92.17,23.59-23.73,42.22-43.67,53.89-56.36,66.88-71.43,133.76-142.86,200.65-214.29Z" />
          </g>
          <g
            className="loader-logo-fill loader-logo-fill-blue"
            mask="url(#loader-left-loop-mask)"
            aria-hidden="true"
          >
            <path fill="url(#loader-g3)" d="M474.05,72.74C457.44,58.13,386.02-1.36,279.33,1.48c-113.83,3.02-184.64,74.78-198.89,89.88C61.68,111.23,11.24,170.3,1.58,261.94c-13.32,126.38,61.47,214.93,74.24,229.55,25.41-26.81,50.83-53.62,76.24-80.43-10.51-16.83-21.02-33.66-31.53-50.49-5.32-13.74-23.89-66.46-2.87-127.98,20.83-60.97,67.08-91.15,87.38-102.15,11.9-6.45,39.11-20.79,76.57-21.14,44.33-.41,77.36,19.01,90.58,27.01,9.71,5.87,17.26,11.65,22.36,15.85,26.5-26.47,53-52.95,79.5-79.42Z" />
          </g>
          <g
            className="loader-logo-fill loader-logo-fill-blue"
            mask="url(#loader-blue-connector-mask)"
            aria-hidden="true"
          >
            <path fill="url(#loader-g4)" d="M800.29,178.25h-153.35c-30.24,31.02-60.48,62.03-90.72,93.05-40.68,40.85-72.48,73.8-92.44,94.67-62.49,65.32-77.08,83.36-111.5,96.72-43.77,16.99-84.07,12.65-99.46,10.27-35.38-5.46-61.63-19.41-76.52-28.86-46.15,47.39-92.3,94.78-138.45,142.17,28.04,1.08,56.69,1.84,85.93,2.25,26.1.36,38.26.24,89.49.1,120.56-.33,127.39.15,145.77-4.73,41.53-11.03,70.55-30.46,88.7-42.82,13.52-9.21,28.67-22.4,98.03-92.17,23.59-23.73,42.22-43.67,53.89-56.36,66.88-71.43,133.76-142.86,200.65-214.29Z" />
          </g>
          <g
            className="loader-logo-fill loader-logo-fill-dark"
            mask="url(#loader-dark-connector-mask)"
            aria-hidden="true"
          >
            <path fill="url(#loader-g1)" d="M588.99,170.94c-74.41,79.16-148.82,158.32-223.23,237.47h-156.22c102.53-107.53,205.07-215.06,307.6-322.59C574.43,26.5,651.68,1.35,731.51,1.48c80.77-.49,161.55-.98,242.32-1.48-46.29,48.66-92.57,97.33-138.86,145.99-13.61-9.73-57.06-38.13-117.95-35.11-72.77,3.61-118.1,49.49-128.04,60.07Z" />
          </g>
          <g
            className="loader-logo-fill loader-logo-fill-dark"
            mask="url(#loader-right-loop-mask)"
            aria-hidden="true"
          >
            <path fill="url(#loader-g2)" d="M619.71,429.52c8.94,9.05,23.4,21.62,43.86,31.26,63.9,30.14,125.63,3.24,133.72-.44,37.3-16.98,57.95-43.73,66.36-54.89,11.69-15.52,42.41-61.32,38.7-125.64-3.1-53.63-28.44-90.47-38.98-104.21,26.47-27.2,52.93-54.4,79.4-81.6,15.05,15.85,36.06,41.71,52.17,78.38,26.26,59.78,23.87,112.7,22.64,134.44-1.45,25.56-8.35,121.5-84.92,198.65-96.56,97.3-223.19,83.4-237.87,81.53-81.87-10.43-136.65-54.53-158.03-73.81,27.65-27.89,55.31-55.78,82.96-83.67Z" />
          </g>
        </svg>
      </div>
    </div>
  );
}
