import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function FullscreenPreviewModal({
  open,
  title,
  poster,
  mp4,
  onClose,
}: {
  open: boolean;
  title: string;
  poster: string;
  mp4: string;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (open) {
      gsap.fromTo(
        wrap,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" }
      );
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[100] bg-black/95"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-xs tracking-[0.22em] uppercase text-white/90 hover:bg-white/15"
      >
        Close
      </button>

      <div className="flex h-full w-full flex-col items-center justify-center px-6">
        <div className="mb-5 text-center text-sm tracking-[0.28em] uppercase text-white/80">
          {title}
        </div>

        <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl">
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            muted
            playsInline
            loop
            preload="metadata"
            poster={poster}
            controls
          >
            <source src={mp4} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}
