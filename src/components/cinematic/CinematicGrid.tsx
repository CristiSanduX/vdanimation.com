import React, { useEffect, useRef, useState } from "react";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";
import type { CinematicWork } from "../../data/cinematicWorks";

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

function CinematicItem({
  item,
  index,
  onOpen,
  isTouch,
  controller,
  focused,
  onHoverChange,
  reducedMotion,
}: {
  item: CinematicWork;
  index: number;
  onOpen: (item: CinematicWork) => void;
  isTouch: boolean;
  controller: PlaybackController;
  focused: boolean;
  onHoverChange: (id: string | null) => void;
  reducedMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = "none";
  }, []);

  // Autoplay pe mobile via Intersection Observer
  useEffect(() => {
    if (!isTouch) return;
    const v = videoRef.current;
    const el = containerRef.current;
    if (!v || !el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (v.preload !== "metadata") v.preload = "metadata";
          if (v.readyState === 0) v.load();
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isTouch]);

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
        "group relative block w-full outline-none overflow-hidden",
        reducedMotion ? "opacity-100" : "reveal-card",
      ].join(" ")}
      style={
        reducedMotion
          ? undefined
          : ({ ["--d" as any]: `${delayMs}ms` } as React.CSSProperties)
      }
      aria-label={item.title}
    >
      <div
        ref={containerRef}
        className={[
          "relative w-full aspect-video overflow-hidden bg-[#0a0a0a]",
          reducedMotion || isTouch
            ? ""
            : "transition-transform duration-200 ease-out will-change-transform",
          reducedMotion || isTouch
            ? ""
            : "hover:scale-[1.03] focus-visible:scale-[1.03] active:scale-[1.01]",
        ].join(" ")}
        style={{
          transformOrigin: "center",
          backfaceVisibility: "hidden",
        }}
      >
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

        {/* Video */}
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
      </div>
    </button>
  );
}

export default function CinematicGrid({ items }: { items: CinematicWork[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<CinematicWork | null>(null);
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
          try { old.pause(); } catch {}
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
      try { v.pause(); } catch {}
    },
    stopAll: () => {
      for (const v of playing.current) {
        try { v.pause(); } catch {}
      }
      playing.current = [];
    },
  });

  useEffect(() => {
    return () => controller.current.stopAll();
  }, []);

  return (
    <>
      {/* px-0 + fără max-w = se întinde până în colțuri pe orice rezoluție */}
      <div className="w-full bg-[#050505] min-h-screen pt-0 pb-14 px-0 -mt-16 md:-mt-20">
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {items.map((item, idx) => (
            <CinematicItem
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
