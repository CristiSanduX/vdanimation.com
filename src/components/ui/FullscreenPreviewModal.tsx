import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface FullscreenPreviewModalProps {
  open: boolean;
  title: string;
  poster: string;
  mp4: string;
  onClose: () => void;
}

export default function FullscreenPreviewModal({
  open,
  title,
  poster,
  mp4,
  onClose,
}: FullscreenPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "unset";
      return;
    }

    // Blocăm scroll-ul paginii din spate
    document.body.style.overflow = "hidden";

    // Animație de intrare fluidă
    const tl = gsap.timeline();
    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" }
    );
    tl.fromTo(
      containerRef.current,
      { scale: 1.1, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" },
      "-=0.3"
    );

    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. FUNDALUL - Click oriunde pe negru închide videoul */}
      <div className="absolute inset-0 cursor-zoom-out" onClick={onClose} />

      {/* 2. BUTON ÎNCHIDERE (Minimalist - un simplu X fin) */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[2010] p-4 group transition-transform hover:scale-110 active:scale-95"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <div className="absolute w-full h-[1px] bg-white/40 rotate-45 group-hover:bg-white" />
          <div className="absolute w-full h-[1px] bg-white/40 -rotate-45 group-hover:bg-white" />
        </div>
      </button>

      {/* 3. CONTAINER VIDEO - Se adaptează la ecran (nu depășește) */}
      <div
        ref={containerRef}
        className="relative z-10 w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Titlu discret deasupra videoului */}
        <div className="mb-4 text-[10px] tracking-[0.6em] text-white/30 uppercase font-mono">
          {title}
        </div>

        <div className="relative w-full h-full flex items-center justify-center shadow-[0_50px_100px_rgba(0,0,0,0.9)] border border-white/5 rounded-lg overflow-hidden bg-black/40">
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain pointer-events-auto"
            poster={poster}
            muted
            playsInline
            loop
            preload="auto"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
          >
            <source src={mp4} type="video/mp4" />
          </video>
        </div>

        {/* Info Helper jos */}
        <div className="mt-4 text-[8px] tracking-[0.4em] text-white/20 uppercase">
          Click background to dismiss
        </div>
      </div>
    </div>
  );
}