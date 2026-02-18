import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export type VideoPaneItem = {
  key: string;
  title: string;
  poster: string;
  mp4: string;
  webm?: string;
};

interface VideoPaneProps {
  item: VideoPaneItem;
  index: number;
  active: boolean;
  isAnyActive: boolean;
  showTitle?: boolean;
  focal?: "center" | "top";
}

export default function VideoPane({
  item,
  index,
  active,
  isAnyActive,
  showTitle = true,
  focal = "center",
}: VideoPaneProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);

  // Poziționare imagine (focal top pentru mobile)
  const objectPosClass = focal === "top" ? "object-[50%_15%]" : "object-center";

  // ✅ PERFORMANȚĂ: Atașăm sursele video doar când e nevoie
  const ensureSourcesAttached = () => {
    const video = videoRef.current;
    if (!video) return;
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
    video.preload = "metadata";
  };

  // ✅ ANIMAȚIA "BOMBA" (GSAP)
  useEffect(() => {
    const video = videoRef.current;
    const wrap = videoWrapRef.current;
    const textGroup = textGroupRef.current;
    if (!video || !wrap || !textGroup) return;

    if (active) {
      ensureSourcesAttached();
      video.play().catch(() => {});
      
      // 1. Fade-in video
      gsap.to(wrap, { 
        opacity: 1, 
        duration: 0.8, 
        ease: "power2.out" 
      });

      // 2. Center Lift: Textul zboară la mijloc
      gsap.to(textGroup, {
        top: "50%",
        yPercent: -50,
        duration: 1.1,
        ease: "expo.out", // Easing-ul de lux
      });
    } else {
      video.pause();
      
      // 1. Fade-out video
      gsap.to(wrap, { 
        opacity: 0, 
        duration: 0.6, 
        ease: "power2.in" 
      });

      // 2. Revenire: Textul coboară la bază
      gsap.to(textGroup, {
        top: "85%",
        yPercent: 0,
        duration: 0.9,
        ease: "power3.inOut",
      });
    }
  }, [active]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-900">
      
      {/* 1. MEDIA LAYER: Zoom-in când e activ + Blur pe restul */}
      <div 
        className={`absolute inset-0 transition-all duration-[1.5s] ease-[cubic-bezier(0.2,0,0.2,1)] ${
          active ? "scale-110 opacity-100" : "scale-100 opacity-60"
        } ${!active && isAnyActive ? "grayscale-[0.6] blur-[2px] opacity-30" : ""}`}
      >
        {/* Poster stativ sub video */}
        <img
          src={item.poster}
          alt={item.title}
          className={`absolute inset-0 h-full w-full object-cover ${objectPosClass}`}
          draggable={false}
        />

        {/* Video Layer */}
        <div
          ref={videoWrapRef}
          className="absolute inset-0 opacity-0 will-change-opacity"
        >
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${objectPosClass}`}
            muted
            playsInline
            loop
          />
        </div>
      </div>

      {/* 2. OVERLAY DRAMATIC: Gradient pentru contrast text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-10 pointer-events-none" />

      {/* 3. KINETIC TEXT GROUP: Inima designului */}
      {showTitle && (
        <div
          ref={textGroupRef}
          className="absolute left-0 right-0 z-20 flex flex-col items-center px-6 pointer-events-none"
          style={{ top: "85%" }} // Starea inițială jos
        >
          {/* Index mic: [ 01 ] */}
          <span className="text-[10px] tracking-[0.7em] font-mono text-white/40 mb-3 uppercase">
            0{index + 1}
          </span>

          {/* Titlul Gotham: Hollow-to-Solid */}
          <h2
            className={`hero-gotham font-black leading-none uppercase transition-all duration-1000 tracking-tighter ${
              active ? "text-5xl md:text-[7.5vw] scale-100" : "text-4xl md:text-5xl scale-90"
            }`}
            style={{
              // Interior transparent când e jos, Alb plin când e sus
              color: active ? "white" : "transparent",
              // Contur alb fin
              WebkitTextStroke: active ? "0px" : "1.5px rgba(255,255,255,0.8)",
              textShadow: active ? "0 20px 60px rgba(0,0,0,0.6)" : "none",
            }}
          >
            {item.title}
          </h2>

          {/* Linie de design care se extinde */}
          <div
            className={`mt-8 h-[1px] bg-white transition-all duration-[1.2s] ease-out ${
              active ? "w-24 opacity-100" : "w-0 opacity-0"
            }`}
          />
        </div>
      )}

      {/* 4. MOBILE-ONLY LABEL: Pentru lizibilitate pe touch */}
      <div className="absolute bottom-10 left-0 right-0 text-center md:hidden z-30 px-4 opacity-100 pointer-events-none">
        <h3 className="hero-gotham text-white text-xl font-black tracking-widest uppercase">
          {item.title}
        </h3>
      </div>
    </div>
  );
}