// src/components/VideoPane.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

export type VideoPaneItem = {
  key: string;
  title: string;
  poster: string;
  mp4: string;
  webm?: string;
};

interface VideoPaneProps {
  item: VideoPaneItem;
  index: number;
  active: boolean;
  isAnyActive: boolean;
  showTitle?: boolean;
  focal?: "center" | "top";
}

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return navigator.maxTouchPoints > 0 || "ontouchstart" in window;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const obs = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export default function VideoPane({
  item,
  index,
  active,
  isAnyActive,
  showTitle = true,
  focal = "center",
}: VideoPaneProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);

  const { ref: rootRef, inView } = useInView<HTMLDivElement>(0.35);
  const reducedMotion = usePrefersReducedMotion();
  const touch = useMemo(() => isTouchDevice(), []);

  const objectPosClass = focal === "top" ? "object-[50%_15%]" : "object-center";

  // Attach sources only when needed (once)
  const ensureSourcesAttached = () => {
    const video = videoRef.current;
    if (!video) return;

    const hasAnySource = video.querySelector("source") !== null;
    if (hasAnySource) return;

    if (item.webm) {
      const s = document.createElement("source");
      s.src = item.webm;
      s.type = "video/webm";
      video.appendChild(s);
    }

    const s2 = document.createElement("source");
    s2.src = item.mp4;
    s2.type = "video/mp4";
    video.appendChild(s2);

    video.preload = "none";
  };

  const canPreview = active && inView && !touch && !reducedMotion;

  useEffect(() => {
    const video = videoRef.current;
    const wrap = videoWrapRef.current;
    const textGroup = textGroupRef.current;
    if (!wrap || !textGroup) return;

    gsap.killTweensOf(wrap);
    gsap.killTweensOf(textGroup);

    // Keep your "lift" but lighter for less motion cost
    gsap.to(textGroup, {
      y: active ? "-28vh" : "0vh",
      duration: active ? 0.9 : 0.75,
      ease: active ? "expo.out" : "power3.inOut",
      overwrite: "auto",
    });

    if (!video) return;

    if (canPreview) {
      ensureSourcesAttached();
      video.preload = "metadata";

      try {
        // @ts-ignore
        if (video.readyState === 0) video.load();
      } catch {}

      video.play().catch(() => {});
      gsap.to(wrap, { opacity: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
    } else {
      try {
        video.pause();
      } catch {}
      gsap.to(wrap, { opacity: 0, duration: 0.25, ease: "power2.out", overwrite: "auto" });
    }

    return () => {
      gsap.killTweensOf(wrap);
      gsap.killTweensOf(textGroup);
    };
  }, [active, canPreview]);

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-black">
      {/* MEDIA LAYER: minimal zoom */}
      <div
        className={[
          "absolute inset-0 transition-transform duration-[800ms] ease-[cubic-bezier(0.2,0,0.2,1)]",
          active ? "scale-[1.02]" : "scale-100",
        ].join(" ")}
      >
        <img
          src={item.poster}
          alt={item.title}
          className={`absolute inset-0 h-full w-full object-cover ${objectPosClass}`}
          draggable={false}
          decoding="async"
          loading="eager"
        />

        {/* VERY LIGHT de-emphasis (optional); remove entirely if you want 100% bright always */}
        <div
          className={[
            "absolute inset-0 transition-opacity duration-200",
            !active && isAnyActive ? "opacity-[0.18]" : "opacity-0",
          ].join(" ")}
          style={{ background: "black" }}
        />

        <div ref={videoWrapRef} className="absolute inset-0 opacity-0 will-change-opacity">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${objectPosClass}`}
            muted
            playsInline
            loop
            preload="none"
          />
        </div>
      </div>

      {/* LIGHT text assist only (NOT dark wash). If you want zero overlay, delete this div. */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

      {/* TEXT GROUP */}
      {showTitle && (
        <div
          ref={textGroupRef}
          className="absolute left-0 right-0 bottom-[15%] z-20 flex flex-col items-center px-6 pointer-events-none will-change-transform"
          style={{ transform: "translate3d(0,0,0)" }}
        >
          <span className="text-xs !tracking-[0em] font-mono text-white/55 mb-4 uppercase">
            0{index + 1}
          </span>

          <h2
            className={[
              "hero-gotham font-black leading-none uppercase transition-all duration-400",
              "!tracking-[0em]",
              active ? "text-4xl md:text-[5.2vw]" : "text-4xl md:text-[5.0vw]",
            ].join(" ")}
            style={{
              color: active ? "white" : "transparent",
              WebkitTextStroke: active ? "0px" : "1.3px rgba(255,255,255,0.8)",
              // shadow helps readability WITHOUT dimming the media
              textShadow: "0 12px 34px rgba(0,0,0,0.35)",
              letterSpacing: "0em",
            }}
          >
            {item.title}
          </h2>

          <div
            className={[
              "mt-7 h-[1px] bg-white/90 transition-all duration-500 ease-out",
              active ? "w-20 opacity-100" : "w-0 opacity-0",
            ].join(" ")}
          />
        </div>
      )}

      {/* Mobile-only label (0 letter spacing) */}
      <div className="absolute bottom-10 left-0 right-0 text-center md:hidden z-30 px-4 opacity-100 pointer-events-none">
        <h3 className="hero-gotham text-white text-2xl font-black uppercase !tracking-[0em]" style={{ letterSpacing: "0em" }}>
          {item.title}
        </h3>
      </div>
    </div>
  );
}