import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

/* =========================
   TYPES
========================= */
type SaleItem = {
  key: string;
  title: string;
  category: string;
  poster: string;
  mp4: string;
  buyUrl: string;
};

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

/* =========================
   SALE CARD (The "Bomba" Version)
========================= */
function SaleCard({
  item,
  active,
  onOpen,
  cta,
}: {
  item: SaleItem;
  active: boolean;
  onOpen: () => void;
  cta: "FREE" | "BUY";
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {});
      gsap.to(infoRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    } else {
      v.pause();
      gsap.to(infoRef.current, { opacity: 0, y: 10, duration: 0.3, ease: "power2.in" });
    }
  }, [active]);

  return (
    <div
      className="group relative h-full w-full cursor-pointer select-none overflow-hidden"
      onClick={onOpen}
    >
      {/* Poster */}
      <img
        src={item.poster}
        alt={item.title}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[2s] ease-out ${active ? 'scale-110' : 'scale-100'}`}
        draggable={false}
      />

      {/* Video Layer */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted playsInline loop poster={item.poster}
        >
          <source src={item.mp4} type="video/mp4" />
        </video>
      </div>

      {/* Overlays Cinematici */}
      <div className="absolute inset-0 z-10">
        {/* Rim Light (linia de sus) */}
        <div className={`absolute inset-x-0 top-0 h-[1px] bg-white/20 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Info Content (Editorial Style) */}
      <div ref={infoRef} className="absolute inset-x-0 bottom-16 z-20 px-6 opacity-0 translate-y-4 pointer-events-none">
        <span className="text-[9px] tracking-[0.5em] text-white/40 uppercase font-mono">{item.category}</span>
        <h3 className="text-white text-lg font-black tracking-tighter uppercase leading-none mt-1">{item.title}</h3>
      </div>

      {/* Floating CTA Button */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-white/20 transition-colors">
            <span className="text-[10px] font-black tracking-[0.3em] text-white">{cta}</span>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SALE GRID (The "Top Top" Layout)
========================= */
export default function SaleGrid() {
  const items: SaleItem[] = useMemo(
    () => [
      { key: "01", title: "Genesis", category: "Abstract", poster: "/media/sale/art-01.png", mp4: "/media/sale/art-01.mp4", buyUrl: "#" },
      { key: "02", title: "Neon Flow", category: "Motion", poster: "/media/sale/art-02.png", mp4: "/media/sale/art-02.mp4", buyUrl: "#" },
      { key: "03", title: "Void Star", category: "Space", poster: "/media/sale/art-03.png", mp4: "/media/sale/art-03.mp4", buyUrl: "#" },
      { key: "04", title: "Cyber P.", category: "Tech", poster: "/media/sale/art-04.png", mp4: "/media/sale/art-04.mp4", buyUrl: "#" },
      { key: "05", title: "Organic", category: "Nature", poster: "/media/sale/art-05.png", mp4: "/media/sale/art-05.mp4", buyUrl: "#" },
      { key: "06", title: "Chrome", category: "Metallic", poster: "/media/sale/art-06.png", mp4: "/media/sale/art-06.mp4", buyUrl: "#" },
    ],
    []
  );

  const [active, setActive] = useState<number | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
    
    // Animație intrare (Stagger)
    if (gridRef.current) {
        gsap.fromTo(gridRef.current.children, 
            { opacity: 0, y: 40 }, 
            { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "expo.out", delay: 0.5 }
        );
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden py-24 px-4 md:px-10">
      
      {/* 1. PREMIUM GRAIN OVERLAY */}
      <div className="pointer-events-none absolute inset-0 z-[100] opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }} />

      {/* 2. AMBIENT LIGHT LEAKS */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] bg-white/5 blur-[120px] rounded-full animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] bg-white/5 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '2s'}} />

      <div className="max-w-[1600px] mx-auto">
        {/* HEADER SECTION (Minimal) */}
        <div className="mb-12 flex items-baseline justify-between border-b border-white/10 pb-6">
            <h2 className="text-white/30 text-[10px] tracking-[0.8em] uppercase font-mono">Available Assets</h2>
            <div className="text-[10px] text-white/50 font-mono tracking-widest">{items.length} PROJECTS</div>
        </div>

        {/* THE GRID (Hairline Design) */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-white/10"
        >
          {items.map((item, i) => {
            const isA = active === i;
            return (
              <div
                key={item.key}
                className="relative aspect-[16/11] border-r border-b border-white/10 overflow-hidden"
                onMouseEnter={() => !isTouch && setActive(i)}
                onMouseLeave={() => !isTouch && setActive(null)}
                onClick={() => setModalIndex(i)}
              >
                <SaleCard
                  item={item}
                  active={isA}
                  onOpen={() => setModalIndex(i)}
                  cta={i < 2 ? "FREE" : "BUY"}
                />
              </div>
            );
          })}
        </div>
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