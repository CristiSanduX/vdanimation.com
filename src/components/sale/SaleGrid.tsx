// SaleGrid.tsx — Fisher (NO blur anywhere), pure black, ultra-fast, no GSAP
// ✅ no blur, no shadows, no backdrop-filter, no animated bg blobs
// ✅ hairline grid + clean editorial text
// ✅ reveal via CSS keyframe stagger (GPU-friendly)
// ✅ video cold until hover (desktop), poster-only on mobile
// ✅ MAX 1 playing video, anti-download flags + block contextmenu on this page only

import React, { useEffect, useMemo, useRef, useState } from "react";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

/* =========================
   TYPES
========================= */
type SaleItem = {
  key: string;
  title: string;
  category: string; // subtitle (small mono)
  poster: string;
  mp4: string;
  buyUrl: string;
  cta: "FREE" | "BUY";
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

/* =========================
   VIDEO PLAYBACK LIMITER (MAX 1)
========================= */
type PlaybackController = {
  requestPlay: (v: HTMLVideoElement) => void;
  release: (v: HTMLVideoElement) => void;
  stopAll: () => void;
};

function ensureVideoSrc(v: HTMLVideoElement) {
  const anyV = v as HTMLVideoElement & { dataset: { src?: string } };
  if (!v.src) {
    const ds = anyV.dataset?.src;
    if (ds) v.src = ds;
  }
}

function createPlaybackLimiter(maxPlaying = 1): PlaybackController {
  const playing = new Set<HTMLVideoElement>();
  return {
    requestPlay(v) {
      ensureVideoSrc(v);

      if (!playing.has(v)) playing.add(v);

      while (playing.size > maxPlaying) {
        const first = playing.values().next().value as HTMLVideoElement | undefined;
        if (!first) break;
        try {
          first.pause();
        } catch {}
        playing.delete(first);
      }

      // only fetch when needed
      try {
        if (v.preload !== "metadata") v.preload = "metadata";
        if (v.readyState === 0) v.load();
      } catch {}

      v.play().catch(() => {});
    },
    release(v) {
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

/* =========================
   SALE CARD (NO BLUR, pure black)
========================= */
function SaleCard({
  item,
  active,
  isTouch,
  reducedMotion,
  onOpen,
  onHoverStart,
  onHoverEnd,
}: {
  item: SaleItem;
  active: boolean;
  isTouch: boolean;
  reducedMotion: boolean;
  onOpen: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // keep video cold until active (desktop)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = "none";
    try {
      (v as any).controls = false;
      (v as any).disablePictureInPicture = true;
      v.setAttribute("controlsList", "nodownload noremoteplayback");
    } catch {}
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (isTouch || reducedMotion) {
      playback.release(v);
      return;
    }

    if (active) playback.requestPlay(v);
    else playback.release(v);
  }, [active, isTouch, reducedMotion]);

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerEnter={() => {
        if (!isTouch) onHoverStart();
      }}
      onPointerLeave={() => {
        if (!isTouch) onHoverEnd();
      }}
      onContextMenuCapture={(e) => e.preventDefault()}
      className={[
        "group relative h-full w-full select-none overflow-hidden text-left outline-none",
        isTouch ? "cursor-pointer" : "cursor-zoom-in",
      ].join(" ")}
      aria-label={`Open ${item.title}`}
    >
      {/* MEDIA */}
      <img
        src={item.poster}
        alt={item.title}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "transition-opacity duration-200",
          active && !isTouch && !reducedMotion ? "opacity-0" : "opacity-100",
          "[transform:translateZ(0)] [backface-visibility:hidden]",
        ].join(" ")}
        draggable={false}
        decoding="async"
        loading="lazy"
      />

      <video
        ref={videoRef}
        data-src={item.mp4}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "transition-opacity duration-200",
          active && !isTouch && !reducedMotion ? "opacity-100" : "opacity-0",
          "[transform:translateZ(0)] [backface-visibility:hidden]",
        ].join(" ")}
        muted
        loop
        playsInline
        preload="none"
        poster={item.poster}
        controls={false}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
      />

      {/* HAIRLINE + READABILITY (NO BLUR) */}
      <div className="pointer-events-none absolute inset-0">
        {/* top rim (active only) */}
        <div
          className={[
            "absolute inset-x-0 top-0 h-px",
            "bg-white/25",
            "transition-opacity duration-200",
            active ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        {/* subtle bottom gradient for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      </div>

      {/* INFO */}
      <div
        className={[
          "absolute left-0 right-0 bottom-12 z-10 px-5",
          "transition-[opacity,transform] duration-200 ease-out",
          active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        ].join(" ")}
        style={{ willChange: "opacity, transform" }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.55em] text-white/40">
          {item.category}
        </div>
        <div className="mt-1 text-white text-lg font-black uppercase tracking-tight leading-none">
          {item.title}
        </div>
      </div>

      {/* CTA (NO blur, NO shadow) */}
      <div
        className={[
          "absolute bottom-5 left-1/2 -translate-x-1/2 z-10",
          "transition-[opacity,transform,border-color,background-color] duration-200",
          active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        ].join(" ")}
      >
        <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 hover:bg-white/15 hover:border-white/30">
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white">
            {item.cta}
          </span>
        </div>
      </div>

      {/* FRAME (NO SHADOW) */}
      <div className="pointer-events-none absolute inset-0 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]" />
    </button>
  );
}

/* =========================
   PAGE
========================= */
export default function SaleGrid() {
  const reducedMotion = usePrefersReducedMotion();
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  // ✅ Suggestive titles + subtitles (categories)
  const items: SaleItem[] = useMemo(
    () => [
      {
        key: "01",
        title: "WITCHER MOOD",
        category: "FANTASY / RPG",
        poster: "/media/sale/art-01.png",
        mp4: "/media/sale/art-01.mp4",
        buyUrl: "#",
        cta: "FREE",
      },
      {
        key: "02",
        title: "NOIR STUDY",
        category: "CINEMATIC / DRAMA",
        poster: "/media/sale/art-02.png",
        mp4: "/media/sale/art-02.mp4",
        buyUrl: "#",
        cta: "FREE",
      },
      {
        key: "03",
        title: "SPACE ICON",
        category: "SCI-FI / PIXAR",
        poster: "/media/sale/art-03.png",
        mp4: "/media/sale/art-03.mp4",
        buyUrl: "#",
        cta: "BUY",
      },
      {
        key: "04",
        title: "RED OPS",
        category: "TACTICAL / FPS",
        poster: "/media/sale/art-04.png",
        mp4: "/media/sale/art-04.mp4",
        buyUrl: "#",
        cta: "BUY",
      },
      {
        key: "05",
        title: "NEON RIDER",
        category: "SYNTHWAVE / 80s",
        poster: "/media/sale/art-05.png",
        mp4: "/media/sale/art-05.mp4",
        buyUrl: "#",
        cta: "BUY",
      },
      {
        key: "06",
        title: "MIAMI MASK",
        category: "RETRO / SUNSET",
        poster: "/media/sale/art-06.png",
        mp4: "/media/sale/art-06.mp4",
        buyUrl: "#",
        cta: "BUY",
      },
    ],
    []
  );

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // block right-click only while mounted (same approach as your AnimeGrid)
  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", block, { capture: true });
    return () => document.removeEventListener("contextmenu", block, { capture: true } as any);
  }, []);

  useEffect(() => {
    return () => playback.stopAll();
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden px-4 md:px-10 pt-8 pb-16">
      {/* (optional) super-light grain; NOT blur, just texture.
          If you want 0 texture, delete this div. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />

      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-baseline justify-between border-b border-white/10 pb-5">
          <div className="text-white/30 text-[10px] tracking-[0.8em] uppercase font-mono">
            AVAILABLE ASSETS
          </div>
          <div className="text-[10px] text-white/45 font-mono tracking-widest">
            {items.length} PROJECTS
          </div>
        </div>

        {/* Hairline Grid */}
        <div className="border-l border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const isA = active === i;
              const delayMs = Math.min(i * 26, 240);

              return (
                <div
                  key={item.key}
                  className={[
                    "relative aspect-[16/11] border-r border-b border-white/10 overflow-hidden",
                    reducedMotion ? "opacity-100" : "reveal-card",
                  ].join(" ")}
                  style={
                    reducedMotion
                      ? undefined
                      : ({ ["--d" as any]: `${delayMs}ms` } as React.CSSProperties)
                  }
                  onMouseEnter={() => {
                    if (!isTouch) setActive(i);
                  }}
                  onMouseLeave={() => {
                    if (!isTouch) setActive(null);
                  }}
                >
                  <SaleCard
                    item={item}
                    active={isA}
                    isTouch={isTouch}
                    reducedMotion={reducedMotion}
                    onOpen={() => setModalIndex(i)}
                    onHoverStart={() => setActive(i)}
                    onHoverEnd={() => setActive(null)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reveal (no JS timeline) */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .reveal-card {
            opacity: 0;
            transform: translate3d(0, 14px, 0);
            animation: revealIn 520ms cubic-bezier(0.2, 1, 0.2, 1) forwards;
            animation-delay: var(--d, 0ms);
            will-change: opacity, transform;
          }
          @keyframes revealIn {
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
        }
      `}</style>

      <FullscreenPreviewModal
        open={modalIndex !== null}
        title="" // you requested: no title displayed
        poster={modalIndex !== null ? items[modalIndex].poster : ""}
        mp4={modalIndex !== null ? items[modalIndex].mp4 : ""}
        onClose={() => setModalIndex(null)}
      />
    </div>
  );
}