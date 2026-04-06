import React, { useEffect, useMemo, useRef, useState } from "react";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";
import type { AnimeWork } from "../../data/animeWorks";

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

type PlaybackController = {
  requestPlay: (v: HTMLVideoElement) => void;
  release: (v: HTMLVideoElement) => void;
  stopAll: () => void;
};

function AnimeItem({
  item,
  index,
  onOpen,
  isTouch,
  controller,
  focused,
  onHoverChange,
  reducedMotion,
}: {
  item: AnimeWork;
  index: number;
  onOpen: (item: AnimeWork) => void;
  isTouch: boolean;
  controller: PlaybackController;
  focused: boolean;
  onHoverChange: (id: string | null) => void;
  reducedMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Keep video cold until hover (desktop)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = "none";
  }, []);

  const onEnter = () => {
    if (isTouch) return;
    onHoverChange(item.id);
    const v = videoRef.current;
    if (v) controller.requestPlay(v);
  };

  const onLeave = () => {
    if (isTouch) return;
    onHoverChange(null);
    const v = videoRef.current;
    if (v) controller.release(v);
  };

  const delayMs = Math.min(index * 26, 240);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={[
        "group relative block w-full outline-none overflow-visible",
        reducedMotion ? "opacity-100" : "reveal-card",
      ].join(" ")}
      style={
        reducedMotion
          ? undefined
          : ({
              ["--d" as any]: `${delayMs}ms`,
            } as React.CSSProperties)
      }
      aria-label={item.title}
    >
      <div
        className={[
          // LONGER
          "relative w-full aspect-[3/5] overflow-hidden rounded-xl bg-[#0a0a0a]",
          // baseline (no shadows)
          "border bg-white/[0.03] border-white/6",
          // hover/focus micro-interaction
          reducedMotion || isTouch
            ? ""
            : "transition-[transform,background-color,border-color] duration-200 ease-out will-change-transform",
          reducedMotion || isTouch
            ? ""
            : "hover:scale-[1.03] focus-visible:scale-[1.03] active:scale-[1.01]",
          focused ? "bg-white/[0.06] border-white/12" : "",
        ].join(" ")}
        style={{
          transformOrigin: "center",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Rim light (cheap) */}
        <div
          className={[
            "absolute inset-x-0 top-0 h-[1.5px] z-40",
            "bg-gradient-to-r from-transparent via-white/50 to-transparent",
            "transition-opacity duration-200",
            focused ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        {/* Poster */}
        <img
          src={item.poster}
          alt={item.title}
          className={[
            "absolute inset-0 h-full w-full object-cover",
            "transition-opacity duration-200",
            focused && !isTouch ? "opacity-0" : "opacity-100",
          ].join(" ")}
          decoding="async"
          loading="lazy"
          draggable={false}
        />

        {/* Video (desktop hover only) */}
        <video
          ref={videoRef}
          src={item.mp4}
          className={[
            "absolute inset-0 h-full w-full object-cover",
            "transition-opacity duration-200",
            focused && !isTouch ? "opacity-100" : "opacity-0",
          ].join(" ")}
          muted
          loop
          playsInline
          preload="none"
        />

        {/* NO TITLE / NO TEXT OVERLAY */}
      </div>
    </button>
  );
}

export default function AnimeGrid({ items }: { items: AnimeWork[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<AnimeWork | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const playing = useRef<HTMLVideoElement[]>([]);
  const MAX_PLAYING = 1;

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const controller = useRef<PlaybackController>({
    requestPlay: (v) => {
      if (playing.current.includes(v)) return;

      while (playing.current.length >= MAX_PLAYING) {
        const old = playing.current.shift();
        if (old) {
          try {
            old.pause();
          } catch {}
        }
      }

      try {
        if (v.preload !== "metadata") v.preload = "metadata";
        if (v.readyState === 0) v.load();
      } catch {}

      playing.current.push(v);
      v.play().catch(() => {});
    },
    release: (v) => {
      playing.current = playing.current.filter((x) => x !== v);
      try {
        v.pause();
      } catch {}
    },
    stopAll: () => {
      for (const v of playing.current) {
        try {
          v.pause();
        } catch {}
      }
      playing.current = [];
    },
  });

  useEffect(() => {
    return () => controller.current.stopAll();
  }, []);

  const ordered = useMemo(() => items, [items]);

  return (
    <>
      <div className="w-full bg-[#050505] min-h-screen pt-0 pb-14 px-4 md:px-8 -mt-16 md:-mt-20">
        <div className="max-w-[1920px] mx-auto grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {ordered.map((item, idx) => (
            <AnimeItem
              key={item.id}
              item={item}
              index={idx}
              onOpen={(it) => setActive(it)}
              isTouch={isTouch}
              controller={controller.current}
              focused={!isTouch && hoverId === item.id}
              onHoverChange={setHoverId}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>

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
        open={active !== null}
        title={active?.title ?? ""}
        poster={active?.poster ?? ""}
        mp4={active?.mp4 ?? ""}
        onClose={() => setActive(null)}
      />
    </>
  );
}