// CinematicGrid.tsx — clean gallery (NO cards/borders/rounding) + "ghost backdrop"
// ✅ identical perf model to AnimeGrid
// ✅ tuned for CINEMATIC content (structure-ready for slower fades if needed)

import React, { useEffect, useRef, useState } from "react";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";
import type { CinematicWork } from "../../data/cinematicWorks";

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

type PlaybackController = {
  requestPlay: (v: HTMLVideoElement) => void;
  release: (v: HTMLVideoElement) => void;
};

function ensureVideoSrc(v: HTMLVideoElement) {
  const anyV = v as HTMLVideoElement & { dataset: { src?: string } };
  if (!v.src) {
    const ds = anyV.dataset?.src;
    if (ds) v.src = ds;
  }
}

function CinematicItem({
  item,
  onOpen,
  isTouch,
  controller,
}: {
  item: CinematicWork;
  onOpen: (item: CinematicWork) => void;
  isTouch: boolean;
  controller: PlaybackController;
}) {
  const wrapRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.preload = "metadata";
    } catch {}
  }, []);

  // Desktop hover
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

  // Mobile autoplay via IO
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
        "overflow-hidden",
        isTouch ? "cursor-pointer" : "cursor-zoom-in",
      ].join(" ")}
      aria-label={`Open ${item.title}`}
    >
      <div className="relative w-full aspect-[4/5] bg-black overflow-hidden">
        {/* Ghost backdrop */}
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

        <div className="absolute inset-0 bg-black/60" />

        {/* Poster */}
        <img
          src={item.poster}
          alt={item.title}
          className={[
            "absolute inset-0 h-full w-full select-none",
            "object-contain",
            "opacity-100 transition-opacity duration-300",
            isTouch ? "" : "group-hover:opacity-0",
            "[transform:translateZ(0)] [backface-visibility:hidden]",
          ].join(" ")}
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        {/* Video */}
        <video
          ref={videoRef}
          data-src={item.mp4}
          className={[
            "pointer-events-none absolute inset-0 h-full w-full",
            "object-contain",
            "opacity-0 transition-opacity duration-300",
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

        {/* Cinematic vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />

        {/* ultra-subtle frame */}
        <div className="pointer-events-none absolute inset-0 shadow-[0_0_0_1px_rgba(255,255,255,0.025)]" />
      </div>
    </button>
  );
}

export default function CinematicGrid({ items }: { items: CinematicWork[] }) {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<CinematicWork | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const MAX_PLAYING = 1;
  const playing = useRef<HTMLVideoElement[]>([]);

  const controller = useRef<PlaybackController>({
    requestPlay: (v) => {
      ensureVideoSrc(v);

      if (playing.current.includes(v)) return;

      try {
        v.preload = "metadata";
      } catch {}

      while (playing.current.length >= MAX_PLAYING) {
        const old = playing.current.shift();
        if (!old) continue;
        try {
          old.pause();
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
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((item) => (
            <CinematicItem
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
