// FantasyGrid.tsx — clean gallery + ghost backdrop
// ✅ 4-per-row on desktop
// ✅ tighter gaps + bigger feel
// ✅ WOW hover: active expands, lifts, glows; others dim + shrink slightly
// ✅ keeps perf model (lazy src + MAX_PLAYING)

import React, { useEffect, useRef, useState } from "react";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";
import type { FantasyWork } from "../../data/fantasyWorks";

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

function FantasyItem({
  item,
  onOpen,
  isTouch,
  controller,
  dimmed,
  focused,
  onHoverChange,
}: {
  item: FantasyWork;
  onOpen: (item: FantasyWork) => void;
  isTouch: boolean;
  controller: PlaybackController;
  dimmed: boolean;
  focused: boolean;
  onHoverChange: (id: string | null) => void;
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

  // Desktop hover play + focus state
  useEffect(() => {
    if (isTouch) return;

    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const onEnter = () => {
      onHoverChange(item.id);
      controller.requestPlay(v);
    };
    const onLeave = () => {
      onHoverChange(null);
      controller.release(v);
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [isTouch, controller, item.id, onHoverChange]);

  // Mobile autoplay via IO (no dim/focus)
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
        "overflow-visible", // allow glow/expand
        isTouch ? "cursor-pointer" : "cursor-zoom-in",

        // other cards dim when something is hovered
        dimmed
          ? "opacity-55 blur-[1px] saturate-[0.85]"
          : "opacity-100 blur-0 saturate-100",

        "transition-[opacity,filter] duration-300 ease-out",
      ].join(" ")}
      aria-label={`Open ${item.title}`}
    >
      <div
        className={[
          "relative w-full aspect-[4/5] bg-black overflow-hidden rounded-2xl",

          // ✅ WOW motion (no layout shift)
          "will-change-[transform,box-shadow]",
          "transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",

          // ✅ focus expand + lift; others shrink slightly
          focused ? "scale-[1.085] -translate-y-2 z-20" : "scale-[0.97]",

          // cinematic shadow
          "shadow-[0_20px_80px_rgba(0,0,0,0.6)]",
          focused ? "shadow-[0_40px_160px_rgba(0,0,0,0.85)]" : "",
        ].join(" ")}
      >
        {/* WOW glow ring */}
        <div
          className={[
            "pointer-events-none absolute -inset-[2px] rounded-[20px]",
            "opacity-0 transition-opacity duration-300",
            focused ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={{
            background:
              "radial-gradient(circle at 50% 15%, rgba(168,85,247,0.38), rgba(236,72,153,0.18) 35%, rgba(0,0,0,0) 60%)",
          }}
        />

        {/* Ghost backdrop */}
        <img
          src={item.poster}
          alt=""
          aria-hidden="true"
          className={[
            "absolute inset-0 h-full w-full",
            "object-cover scale-[1.08] blur-xl opacity-35",
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />

        {/* ultra-subtle frame */}
        <div className="pointer-events-none absolute inset-0 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" />
      </div>
    </button>
  );
}

export default function FantasyGrid({ items }: { items: FantasyWork[] }) {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<FantasyWork | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const MAX_PLAYING = 1;
  const playing = useRef<HTMLVideoElement[]>([]);

  const controller = useRef<PlaybackController>({
    requestPlay: (v) => {
      ensureVideoSrc(v);
      if (playing.current.includes(v)) return;

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

  const anyHover = !isTouch && hoverId !== null;

  return (
    <>
      <div className="w-full px-2 sm:px-3 lg:px-4">
        {/* ✅ 4 per row + tighter gaps */}
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {items.map((item) => (
            <FantasyItem
              key={item.id}
              item={item}
              isTouch={isTouch}
              controller={controller.current}
              onOpen={(it) => setActive(it)}
              onHoverChange={setHoverId}
              focused={!isTouch && hoverId === item.id}
              dimmed={anyHover && hoverId !== item.id}
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
