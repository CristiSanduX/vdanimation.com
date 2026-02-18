import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";
import type { CinematicWork } from "../../data/cinematicWorks";

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

type PlaybackController = {
  requestPlay: (v: HTMLVideoElement) => void;
  release: (v: HTMLVideoElement) => void;
};

// --- SUB-COMPONENT: CINEMATIC ITEM ---
function CinematicItem({
  item,
  onOpen,
  isTouch,
  controller,
  focused,
  onHoverChange,
}: {
  item: CinematicWork;
  onOpen: (item: CinematicWork) => void;
  isTouch: boolean;
  controller: PlaybackController;
  focused: boolean;
  onHoverChange: (id: string | null) => void;
}) {
  const wrapRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.playsInline = true;
      v.loop = true;
      v.preload = "metadata";
    }
  }, []);

  useEffect(() => {
    if (isTouch) return;
    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const onEnter = () => {
      onHoverChange(item.id);
      controller.requestPlay(v);
      gsap.to(infoRef.current, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    };
    const onLeave = () => {
      onHoverChange(null);
      controller.release(v);
      gsap.to(infoRef.current, { opacity: 0, y: 10, duration: 0.3, ease: "power2.in" });
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [isTouch, controller, item.id, onHoverChange]);

  return (
    <button
      ref={wrapRef}
      type="button"
      onClick={() => onOpen(item)}
      // ✅ "cinematic-card" class is used by GSAP for the reveal
      className="group relative block w-full outline-none opacity-0 cinematic-card overflow-visible"
    >
      <div
        className={[
          "relative w-full aspect-[4/5] bg-[#0a0a0a] overflow-hidden rounded-xl",
          "transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)]",
          focused 
            ? "scale-[1.04] -translate-y-3 z-30 shadow-[0_30px_100px_rgba(0,0,0,0.8)]" 
            : "scale-100 shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
        ].join(" ")}
      >
        {/* RIM LIGHT (Dungă fină de lumină sus) */}
        <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent z-40 transition-opacity duration-500 ${focused ? "opacity-100" : "opacity-0"}`} />

        {/* GHOST BACKDROP GLOW */}
        <img
          src={item.poster}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover scale-[1.3] blur-3xl opacity-10 transition-all duration-1000 ${focused ? "opacity-30 scale-[1.5]" : ""}`}
        />

        {/* STATIC POSTER */}
        <img
          src={item.poster}
          alt={item.title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${focused || isTouch ? "opacity-0" : "opacity-100"}`}
        />

        {/* VIDEO ENGINE */}
        <video
          ref={videoRef}
          src={item.mp4} // Direct src for simplicity
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${focused || isTouch ? "opacity-100" : "opacity-0"}`}
          muted loop playsInline preload="metadata"
        />

        {/* INFO OVERLAY */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-5">
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 ${focused ? "opacity-100" : "opacity-0"}`} />
          
          <div ref={infoRef} className="relative z-30 opacity-0 translate-y-3">
            <p className="text-[8px] tracking-[0.4em] font-mono text-white/40 uppercase mb-1">
              {item.category || "Selected Work"}
            </p>
            <h3 className="text-white text-sm md:text-base font-black tracking-tight uppercase leading-none">
              {item.title}
            </h3>
          </div>
        </div>

        {/* HAIRLINE FRAME */}
        <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none" />
      </div>
    </button>
  );
}

// --- MAIN GRID COMPONENT ---
export default function CinematicGrid({ items }: { items: CinematicWork[] }) {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<CinematicWork | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const playing = useRef<HTMLVideoElement[]>([]);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // ✅ REVEAL ANIMATION - Fixat pentru a nu dispărea cardurile
  useEffect(() => {
    if (!gridRef.current) return;
    
    const cards = gridRef.current.querySelectorAll('.cinematic-card');
    
    // Omorâm orice animație anterioară pentru a preveni bug-uri de stare
    gsap.killTweensOf(cards);
    
    gsap.fromTo(
      cards,
      { opacity: 0, y: 50 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        stagger: 0.05, 
        ease: "power4.out",
        delay: 0.2,
        clearProps: "transform" // Păstrăm opacitatea la 1, dar scoatem transformările
      }
    );
  }, [items.length]); // Se declanșează când lista de iteme este încărcată

  const MAX_PLAYING = 1;

  const controller = useRef<PlaybackController>({
    requestPlay: (v) => {
      if (!v.src) v.load(); // Lazy load trigger
      if (playing.current.includes(v)) return;

      while (playing.current.length >= MAX_PLAYING) {
        const old = playing.current.shift();
        if (old) old.pause();
      }

      playing.current.push(v);
      v.play().catch(() => {});
    },
    release: (v) => {
      playing.current = playing.current.filter((x) => x !== v);
      v.pause();
    },
  });

  return (
    <>
      <div className="w-full bg-[#050505] min-h-screen pt-10 pb-20 px-4 md:px-8">
        <div 
          ref={gridRef}
          className="max-w-[1920px] mx-auto grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {items.map((item) => (
            <CinematicItem
              key={item.id}
              item={item}
              isTouch={isTouch}
              controller={controller.current}
              onOpen={(it) => setActive(it)}
              onHoverChange={setHoverId}
              focused={!isTouch && hoverId === item.id}
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