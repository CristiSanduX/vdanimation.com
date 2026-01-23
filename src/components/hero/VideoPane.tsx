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
  dim,
  showTitle = true,
}: {
  item: VideoPaneItem;
  active: boolean;
  dim: boolean;
  showTitle?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);

  // Play/pause + fade video layer via GSAP
  useEffect(() => {
    const video = videoRef.current;
    const wrap = videoWrapRef.current;
    if (!video || !wrap) return;

    let tween: gsap.core.Tween | null = null;

    const fadeTo = (opacity: number) => {
      tween?.kill();
      tween = gsap.to(wrap, {
        opacity,
        duration: 0.35,
        ease: "power2.out",
      });
    };

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay policies can block in some cases; ignore silently.
      }
    };

    if (active) {
      // restart from beginning for snappy effect
      video.currentTime = 0;
      tryPlay();
      fadeTo(1);
    } else {
      video.pause();
      fadeTo(0);
    }

    return () => {
      tween?.kill();
    };
  }, [active]);

  return (
    <div className="group relative h-full w-full">
      {/* Poster */}
      <img
        src={item.poster}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Video layer (hidden until active) */}
      <div
        ref={videoWrapRef}
        className="absolute inset-0 opacity-0"
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          loop
          preload="metadata"
          // Keep a poster too (helps first frame)
          poster={item.poster}
        >
          {item.webm ? <source src={item.webm} type="video/webm" /> : null}
          <source src={item.mp4} type="video/mp4" />
        </video>
      </div>

      {/* Cinematic overlays */}
      <div className="pointer-events-none absolute inset-0">
        {/* bottom fade for title readability */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        {/* side vignette */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Dim non-active panes when one is active */}
      <div
        className={[
          "pointer-events-none absolute inset-0 transition",
          dim ? "bg-black/45" : "bg-transparent",
        ].join(" ")}
      />

      {/* Title */}
{showTitle && (
  <div className="absolute inset-x-0 bottom-12 sm:bottom-10 px-5">
    <div
      className={[
        "text-center font-black uppercase whitespace-nowrap leading-none",
        // mobile smaller + higher, desktop bigger
        "text-2xl sm:text-4xl lg:text-5xl",
        // tracking tighter on mobile
        "tracking-[0.16em] sm:tracking-[0.22em]",
        "drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]",
        "transition-all duration-300",
        active ? "opacity-100 scale-100" : "opacity-90 scale-[0.96]",
      ].join(" ")}
    >
      {item.title}
    </div>
  </div>
)}


    </div>
  );
}
