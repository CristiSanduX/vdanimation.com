import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

export type VideoPaneItem = {
  key: string;
  title: string;
  poster: string;
  mp4: string;
  webm?: string;
};

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

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

function useInView<T extends HTMLElement>(threshold = 0.4) {
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

function createPlaybackLimiter(maxPlaying = 1) {
  const playing = new Set<HTMLVideoElement>();
  return {
    requestPlay(v: HTMLVideoElement) {
      if (playing.has(v)) return;
      playing.add(v);

      while (playing.size > maxPlaying) {
        const first = playing.values().next().value as HTMLVideoElement | undefined;
        if (!first) break;
        try {
          first.pause();
        } catch {}
        playing.delete(first);
      }

      v.play().catch(() => {});
    },
    stop(v: HTMLVideoElement) {
      try {
        v.pause();
      } catch {}
      playing.delete(v);
    },
    stopAll() {
      for (const v of playing) {
        try {
          v.pause();
        } catch {}
      }
      playing.clear();
    },
  };
}

const playback = createPlaybackLimiter(1);

export default function HeroTriSplit() {
  const items: VideoPaneItem[] = useMemo(
    () => [
      { key: "fantasy", title: "FANTASY", poster: "/media/fantasy-poster.png", mp4: "/media/fantasy.mp4" },
      { key: "cinematic", title: "CINEMATIC", poster: "/media/cinematic-poster.png", mp4: "/media/cinematic.mp4" },
      { key: "anime", title: "ANIME", poster: "/media/anime-poster.png", mp4: "/media/anime.mp4" },
    ],
    []
  );

  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Subtle flex expand (desktop only). No dark overlays; keep visuals clean.
  useEffect(() => {
    if (isTouch || reducedMotion) return;

    const panes = paneRefs.current.filter(Boolean) as HTMLDivElement[];
    panes.forEach((pane, i) => {
      const isFocused = activeIndex === i;
      const isAnyFocused = activeIndex !== null;

      const grow = !isAnyFocused ? 1 : isFocused ? 1.06 : 0.97; // smaller => less layout churn

      gsap.to(pane, {
        flexGrow: grow,
        duration: 0.4,
        ease: "power4.out",
        overwrite: "auto",
      });
    });
  }, [activeIndex, isTouch, reducedMotion]);

  useEffect(() => () => playback.stopAll(), []);

  const allowVideo = !isTouch && !reducedMotion;

  return (
    <div
      className="relative w-full h-[100svh] md:h-[100dvh] overflow-hidden bg-black select-none"
      onMouseLeave={() => {
        if (!isTouch) setActiveIndex(null);
      }}
    >
      {/* Removed global dark overlays (no extra dimming) */}

      <div className="relative z-0 flex w-full h-full flex-col md:flex-row">
        {items.map((item, i) => (
          <div
            key={item.key}
            ref={(el) => {
              paneRefs.current[i] = el;
            }}
            className="relative w-full flex-1 overflow-hidden cursor-pointer outline-none"
            tabIndex={0}
            role="link"
            aria-label={item.title}
            onMouseEnter={() => {
              if (allowVideo) setActiveIndex(i);
            }}
            onFocus={() => {
              if (allowVideo) setActiveIndex(i);
            }}
            onBlur={() => {
              if (allowVideo) setActiveIndex(null);
            }}
            onClick={(e) => {
              // keep your modal on Shift+Click
              if (e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                setModalIndex(i);
                return;
              }
              window.location.href = `/${item.key}`;
            }}
          >
            <VideoPane item={item} active={allowVideo ? activeIndex === i : false} isAnyActive={activeIndex !== null} />
          </div>
        ))}
      </div>

      <FullscreenPreviewModal
        open={modalIndex !== null}
        title={modalIndex !== null ? items[modalIndex].title : ""}
        poster={modalIndex !== null ? items[modalIndex].poster : ""}
        mp4={modalIndex !== null ? items[modalIndex].mp4 : ""}
        onClose={() => setModalIndex(null)}
      />
    </div>
  );
}

function VideoPane({ item, active, isAnyActive }: { item: VideoPaneItem; active: boolean; isAnyActive: boolean }) {
  const { ref: rootRef, inView } = useInView<HTMLDivElement>(0.5);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);

  const sourcesAttachedRef = useRef(false);
  const canPreview = active && inView;

  const ensureSourcesAttached = () => {
    const v = videoRef.current;
    if (!v || sourcesAttachedRef.current) return;

    if (item.webm) {
      const s = document.createElement("source");
      s.src = item.webm;
      s.type = "video/webm";
      v.appendChild(s);
    }
    const s2 = document.createElement("source");
    s2.src = item.mp4;
    s2.type = "video/mp4";
    v.appendChild(s2);

    // don't auto-fetch until needed
    v.preload = "none";
    sourcesAttachedRef.current = true;
  };

  useEffect(() => {
    const v = videoRef.current;
    const wrap = videoWrapRef.current;
    const text = textGroupRef.current;
    if (!wrap || !text) return;

    gsap.killTweensOf(wrap);
    gsap.killTweensOf(text);

    // minimal motion (cheap)
    gsap.to(text, {
      y: active ? -8 : 0,
      duration: 0.28,
      ease: "power4.out",
      overwrite: "auto",
    });

    if (!v) return;

    if (canPreview) {
      ensureSourcesAttached();

      v.preload = "metadata";
      try {
        if (v.readyState === 0) v.load();
      } catch {}

      playback.requestPlay(v);

      gsap.to(wrap, {
        opacity: 1,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    } else {
      playback.stop(v);

      gsap.to(wrap, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    return () => {
      gsap.killTweensOf(wrap);
      gsap.killTweensOf(text);
    };
  }, [active, canPreview]);

  return (
    <div ref={rootRef} className="relative h-full w-full bg-black">
      {/* MEDIA LAYER (no vignettes, no dark overlays, no filters) */}
      <div
        className={[
          "absolute inset-0",
          "transition-transform duration-700 ease-[cubic-bezier(0.2,0,0.2,1)]",
          active ? "scale-[1.01]" : "scale-100",
        ].join(" ")}
      >
        <img
          src={item.poster}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          decoding="async"
          loading="eager"
        />

        {/* optional: SUPER light dim on inactive (remove entirely if you want pure brightness) */}
        <div
          className={[
            "absolute inset-0 transition-opacity duration-200",
            !active && isAnyActive ? "opacity-15" : "opacity-0",
          ].join(" ")}
          style={{ background: "black" }}
        />

        <div ref={videoWrapRef} className="absolute inset-0 opacity-0 will-change-opacity">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline loop preload="none" />
        </div>
      </div>

      {/* TEXT (kept readable without dark overlays) */}
      <div
        ref={textGroupRef}
        className="absolute left-0 right-0 bottom-12 z-20 flex flex-col items-center pointer-events-none px-6 will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <h2
          className={[
            "hero-gotham font-black leading-none uppercase transition-all duration-200",
            "!tracking-[0em]",
            active ? "text-3xl md:text-[3.8vw]" : "text-3xl md:text-[3.65vw]",
          ].join(" ")}
          style={{
            // keep your hollow style but slightly stronger stroke for readability
            color: active ? "white" : "transparent",
            WebkitTextStroke: active ? "0px" : "1.25px rgba(255,255,255,0.75)",
            letterSpacing: "0em",
            textShadow: "0 10px 30px rgba(0,0,0,0.35)", // subtle, doesn't dim image
          }}
        >
          {item.title}
        </h2>

        <div className={`mt-4 h-[1px] bg-white transition-all duration-300 ${active ? "w-12 opacity-100" : "w-0 opacity-0"}`} />
      </div>
    </div>
  );
}