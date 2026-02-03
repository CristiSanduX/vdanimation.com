// AnimeGrid.tsx — clean gallery (NO cards/borders/rounding) + "ghost backdrop" to unify PNG cutouts
// ✅ 4 columns on desktop (lg)
// ✅ NO zoom anywhere
// ✅ Poster ↔ video crossfade (CSS hover)
// ✅ Performance: NO eager prewarm, lazy attach src only when needed
// ✅ Mobile: IntersectionObserver autoplay + limited concurrency
// ✅ Ghost backdrop: same poster blurred cover behind (makes cutout PNGs look intentional)

import React, { useEffect, useRef, useState } from "react";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";
import type { AnimeWork } from "../../data/animeWorks";

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

type PlaybackController = {
  requestPlay: (v: HTMLVideoElement) => void;
  release: (v: HTMLVideoElement) => void;
};

function ensureVideoSrc(v: HTMLVideoElement) {
  // Attach src lazily (prevents the browser from downloading ALL MP4s at first load)
  const anyV = v as HTMLVideoElement & { dataset: { src?: string } };
  if (!v.src) {
    const ds = anyV.dataset?.src;
    if (ds) v.src = ds;
  }
}

function AnimeItem({
  item,
  onOpen,
  isTouch,
  controller,
}: {
  item: AnimeWork;
  onOpen: (item: AnimeWork) => void;
  isTouch: boolean;
  controller: PlaybackController;
}) {
  const wrapRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ✅ Lightweight init (no load(), no currentTime seek) — avoids 20-40 video decodes at once
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      // Important: keep it light. We'll attach src only when needed.
      v.preload = "metadata";
    } catch {}
  }, []);

  // Desktop hover: play/pause only (src attaches on first hover)
  useEffect(() => {
    if (isTouch) return;

    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const onEnter = () => controller.requestPlay(v);
    const onLeave = () => controller.release(v);

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [isTouch, controller]);

  // Mobile autoplay when visible (src attaches only when card becomes visible)
  useEffect(() => {
    if (!isTouch) return;

    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          controller.requestPlay(v);
        } else {
          controller.release(v);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] }
    );

    obs.observe(el);
    return () => {
      obs.disconnect();
      controller.release(v);
    };
  }, [isTouch, controller]);

  return (
    <button
      ref={wrapRef}
      type="button"
      onClick={() => onOpen(item)}
      className={[
        "group relative block w-full outline-none",
        "overflow-hidden", // keeps the blur backdrop clean
        isTouch ? "cursor-pointer" : "cursor-zoom-in",
      ].join(" ")}
      aria-label={`Open ${item.title}`}
    >
      {/* Stage: no borders/rounding, but consistent frame */}
      <div className="relative w-full aspect-[4/5] bg-black overflow-hidden">
        {/* ✅ Ghost backdrop (same image) */}
        <img
          src={item.poster}
          alt=""
          aria-hidden="true"
          className={[
            "absolute inset-0 h-full w-full",
            "object-cover",
            "scale-[1.08]",
            "blur-xl",
            "opacity-35",
            "[transform:translateZ(0)] [backface-visibility:hidden]",
          ].join(" ")}
          draggable={false}
          loading="lazy"
          decoding="async"
        />
        {/* darken + unify */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Foreground poster (no crop) */}
        <img
          src={item.poster}
          alt={item.title}
          className={[
            "absolute inset-0 h-full w-full select-none",
            "object-contain", // ✅ NO CROP
            "opacity-100 transition-opacity duration-200",
            isTouch ? "" : "group-hover:opacity-0",
            "[transform:translateZ(0)] [backface-visibility:hidden]",
          ].join(" ")}
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        {/* Foreground video (lazy src attach) */}
        <video
          ref={videoRef}
          data-src={item.mp4}
          className={[
            "pointer-events-none absolute inset-0 h-full w-full",
            "object-contain",
            "opacity-0 transition-opacity duration-200",
            isTouch ? "opacity-100" : "group-hover:opacity-100",
            "will-change-[opacity]",
            "[transform:translateZ(0)] [backface-visibility:hidden]",
          ].join(" ")}
          muted
          loop
          playsInline
          preload="metadata"
          poster={item.poster}
        />

        {/* subtle cinematic vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />

        {/* ultra-subtle separators feel (not borders): soft falloff */}
        <div className="pointer-events-none absolute inset-0 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" />
      </div>
    </button>
  );
}

export default function AnimeGrid({ items }: { items: AnimeWork[] }) {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<AnimeWork | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // ✅ limit concurrent videos (mobile perf)
  const MAX_PLAYING = 1;
  const playing = useRef<HTMLVideoElement[]>([]);

  const controller = useRef<PlaybackController>({
    requestPlay: (v) => {
      // ✅ attach src only when needed
      ensureVideoSrc(v);

      if (playing.current.includes(v)) return;

      // if it's not loaded yet, nudge it lightly
      try {
        v.preload = "metadata";
      } catch {}

      while (playing.current.length >= MAX_PLAYING) {
        const old = playing.current.shift();
        if (!old) continue;
        try {
          old.pause();
          // don't seek aggressively; it can be expensive on some devices
        } catch {}
      }

      playing.current.push(v);

      try {
        const p = v.play();
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch(() => {
            playing.current = playing.current.filter((x) => x !== v);
          });
        }
      } catch {
        playing.current = playing.current.filter((x) => x !== v);
      }
    },

    release: (v) => {
      playing.current = playing.current.filter((x) => x !== v);
      try {
        v.pause();
      } catch {}
    },
  });

  return (
    <>
      {/* Full-width gallery, 4 columns on desktop */}
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((item) => (
            <AnimeItem
              key={item.id}
              item={item}
              isTouch={isTouch}
              controller={controller.current}
              onOpen={(it) => setActive(it)}
            />
          ))}
        </div>
      </div>

      <FullscreenPreviewModal
        open={active !== null}
        title={active?.title ?? ""}
        poster={active?.poster ?? ""}
        mp4={active?.mp4 ?? ""}
        buyUrl={active?.buyUrl ?? ""}
        priceLabel={active?.priceLabel ?? ""}
        onClose={() => setActive(null)}
      />
    </>
  );
}
