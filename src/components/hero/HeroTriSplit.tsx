import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

// --- TYPES ---
export type VideoPaneItem = {
  key: string;
  title: string;
  poster: string;
  mp4: string;
  webm?: string;
};

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

export default function HeroTriSplit() {
  const items: VideoPaneItem[] = useMemo(
    () => [
      { key: "fantasy", title: "FANTASY", poster: "/media/fantasy-poster.png", mp4: "/media/fantasy.mp4" },
      { key: "cinematic", title: "CINEMATIC", poster: "/media/cinematic-poster.png", mp4: "/media/cinematic.mp4" },
      { key: "anime", title: "ANIME", poster: "/media/anime-poster.png", mp4: "/media/anime.mp4" },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // GSAP: Expansiune snappy a coloanelor
  useEffect(() => {
    if (isTouch) return;
    const panes = paneRefs.current.filter(Boolean) as HTMLDivElement[];
    
    panes.forEach((pane, i) => {
      const isFocused = activeIndex === i;
      const isAnyFocused = activeIndex !== null;
      
      let growValue = 1;
      if (isAnyFocused) {
        growValue = isFocused ? 1.25 : 0.85; // Expansiune mai discretă, mai curată
      }

      gsap.to(pane, {
        flexGrow: growValue,
        duration: 0.45, // Mai rapid
        ease: "power4.out",
        overwrite: "auto",
      });
    });
  }, [activeIndex, isTouch]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black select-none">
      {/* Texture discretă */}
      <div className="pointer-events-none absolute inset-0 z-[100] opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      <div className="relative flex w-full h-full flex-col md:flex-row" onMouseLeave={() => !isTouch && setActiveIndex(null)}>
        {items.map((item, i) => (
          <div
            key={item.key}
            ref={(el) => { paneRefs.current[i] = el; }}
            className="relative outline-none cursor-pointer overflow-hidden w-full flex-1 md:h-auto group"
            onMouseEnter={() => !isTouch && setActiveIndex(i)}
            onClick={() => window.location.href = `/${item.key}`}
          >
            <VideoPane
              item={item}
              active={isTouch ? true : activeIndex === i} 
              isAnyActive={activeIndex !== null}
            />
          </div>
        ))}

        {/* Separatoare ultra-fine */}
        <div className="pointer-events-none absolute inset-y-0 left-1/3 z-30 w-[0.5px] bg-white/5 hidden md:block" />
        <div className="pointer-events-none absolute inset-y-0 left-2/3 z-30 w-[0.5px] bg-white/5 hidden md:block" />
      </div>

      <FullscreenPreviewModal
        open={modalIndex !== null}
        title={modalIndex !== null ? items[modalIndex].title : ""}
        poster={modalIndex !== null ? items[modalIndex].poster : ""}
        mp4={modalIndex !== null ? items[modalIndex].mp4 : ""}
        onClose={() => setModalIndex(null)}
      />
    </div>
  );
}

// --- SUB-COMPONENT: VIDEOPANE (Clean & Snappy) ---
function VideoPane({ item, active, isAnyActive }: { item: VideoPaneItem; active: boolean; isAnyActive: boolean; }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active) {
      video.play().catch(() => {});
      gsap.to(videoWrapRef.current, { opacity: 1, duration: 0.4 });
      
      // ANIMAȚIE: Ridicare ușoară (Lift) la baza ecranului
      gsap.to(textGroupRef.current, {
        y: -30, // Se ridică doar 30px
        duration: 0.4,
        ease: "power4.out",
      });
    } else {
      video.pause();
      gsap.to(videoWrapRef.current, { opacity: 0, duration: 0.3 });

      // REVENIRE: Poziția originală
      gsap.to(textGroupRef.current, {
        y: 0,
        duration: 0.4,
        ease: "power4.out",
      });
    }
  }, [active]);

  return (
    <div className="relative h-full w-full bg-[#0a0a0a]">
      {/* Background Media */}
      <div className={`absolute inset-0 transition-all duration-500 ease-out ${
        active ? "scale-[1.05] opacity-100" : "scale-100 opacity-40"
      } ${!active && isAnyActive ? "blur-[2px] grayscale-[0.5]" : ""}`}>
        <img src={item.poster} className="absolute inset-0 h-full w-full object-cover" alt="" />
        <div ref={videoWrapRef} className="absolute inset-0 opacity-0">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline loop preload="metadata">
            <source src={item.mp4} type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Shadow Overlay fin */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />

      {/* --- CLEAN TYPOGRAPHY --- */}
      <div 
        ref={textGroupRef}
        className="absolute left-0 right-0 bottom-12 z-20 flex flex-col items-center pointer-events-none px-6 will-change-transform"
      >
        <h2 
          className={`hero-gotham font-black leading-none uppercase transition-all duration-300 tracking-tight ${
            active ? "text-4xl md:text-[5vw] scale-100" : "text-3xl md:text-4xl scale-95"
          }`}
          style={{
            // Fără gri în interior, contur alb pur
            color: active ? "white" : "transparent",
            WebkitTextStroke: active ? "0px" : "1px rgba(255,255,255,0.7)",
          }}
        >
          {item.title}
        </h2>

        {/* Linie minimalistă */}
        <div className={`mt-4 h-[1px] bg-white transition-all duration-500 ${active ? "w-12 opacity-100" : "w-0 opacity-0"}`} />
      </div>

      {/* Mobile fix */}
      <div className="absolute bottom-8 left-0 right-0 text-center md:hidden z-30 px-4">
         <h3 className="text-white text-xl font-black uppercase tracking-widest">{item.title}</h3>
      </div>
    </div>
  );
}