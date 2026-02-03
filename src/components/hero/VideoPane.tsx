// VideoPane.tsx — CLEAR + PERF (lazy src, no eager load)
// ✅ smooth reveal on Safari (waits for first frame)
// ✅ keeps poster + video layer
// ✅ avoids first-load lag: no preload auto + no load() on mount
// ✅ lazy attach src only when active
// ✅ tighter title tracking (premium)

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export type VideoPaneItem = {
  key: string;
  title: string;
  poster: string;
  mp4: string;
  webm?: string;
};

export default function VideoPane({
  item,
  active,
  dim, // kept for API compatibility but ignored (no darkening)
  showTitle = true,
}: {
  item: VideoPaneItem;
  active: boolean;
  dim: boolean;
  showTitle?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);

  const ensureSourcesAttached = () => {
    const video = videoRef.current;
    if (!video) return;

    // If sources already exist, don't re-add
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

    // Keep it light; don't force full download
    try {
      video.preload = "metadata";
    } catch {}
  };

  // Lightweight init only
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = "metadata";
      // do NOT call load() here
    } catch {}
  }, []);

  // Play/pause + fade video layer via GSAP (fade AFTER first frame for Safari)
  useEffect(() => {
    const video = videoRef.current;
    const wrap = videoWrapRef.current;
    if (!video || !wrap) return;

    let tween: gsap.core.Tween | null = null;

    const fadeTo = (opacity: number) => {
      tween?.kill();
      tween = gsap.to(wrap, {
        opacity,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
        force3D: true,
      });
    };

    const revealAfterFirstFrame = () => {
      // @ts-ignore
      if (typeof video.requestVideoFrameCallback === "function") {
        // @ts-ignore
        video.requestVideoFrameCallback(() => fadeTo(1));
        return;
      }

      const onPlaying = () => {
        fadeTo(1);
      };
      video.addEventListener("playing", onPlaying, { once: true });
    };

    const tryPlay = async () => {
      try {
        // attach sources only when needed
        ensureSourcesAttached();

        // tiny seek only if we already have metadata
        try {
          if (video.readyState !== 0) {
            video.currentTime = 0.001;
          }
        } catch {}

        const p = video.play();
        if (p && typeof (p as Promise<void>).catch === "function") {
          await p;
        }

        revealAfterFirstFrame();
      } catch {
        fadeTo(0);
      }
    };

    if (active) {
      tryPlay();
    } else {
      try {
        video.pause();
      } catch {}
      fadeTo(0);
    }

    return () => {
      tween?.kill();
      tween = null;
    };
  }, [active, item.mp4, item.webm]);

  return (
    <div className="group relative h-full w-full">
      {/* Poster (always visible under video layer) */}
      <img
        src={item.poster}
        alt={item.title}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "[transform:translateZ(0)] [backface-visibility:hidden]",
        ].join(" ")}
        draggable={false}
        loading="eager"
        decoding="async"
      />

      {/* Video layer (fades in when active) */}
      <div
        ref={videoWrapRef}
        className={[
          "absolute inset-0 opacity-0",
          "will-change-[opacity,transform]",
          "[transform:translateZ(0)] [backface-visibility:hidden]",
        ].join(" ")}
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          className={[
            "h-full w-full object-cover",
            "[transform:translateZ(0)] [backface-visibility:hidden]",
          ].join(" ")}
          muted
          playsInline
          loop
          preload="metadata"
          poster={item.poster}
        />
      </div>

      {/* Title */}
      {showTitle && (
        <div className="absolute inset-x-0 bottom-12 sm:bottom-10 px-5">
          <div
            className={[
              "hero-gotham",
              "text-center font-black uppercase whitespace-nowrap leading-none",
              "text-2xl sm:text-4xl lg:text-5xl",
              // ✅ tighter than before (was 0.16/0.22)
              "tracking-tighter sm:tracking-tight",
              "[text-shadow:0_10px_30px_rgba(0,0,0,0.35)]",
              "transition-all duration-300",
              active ? "opacity-100 scale-100" : "opacity-95 scale-[0.98]",
            ].join(" ")}
          >
            {item.title}
          </div>
        </div>
      )}
    </div>
  );
}
