import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

type SaleItem = {
  key: string;
  priceLabel?: string;
  poster: string; // png
  mp4: string; // mp4 for hover
  webm?: string;
  buyUrl: string;
};

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

function SaleCard({
  item,
  active,
  dim,
  onOpen,
}: {
  item: SaleItem;
  active: boolean;
  dim: boolean;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = videoWrapRef.current;
    if (!video || !wrap) return;

    let tween: gsap.core.Tween | null = null;

    const fadeTo = (opacity: number) => {
      if (tween) tween.kill();
      tween = gsap.to(wrap, { opacity, duration: 0.32, ease: "power2.out" });
    };

    const tryPlay = async () => {
      try {
        video.muted = true;
        // @ts-ignore
        video.playsInline = true;
        await video.play();
      } catch {}
    };

    if (active) {
      video.currentTime = 0;
      tryPlay();
      fadeTo(1);
    } else {
      video.pause();
      fadeTo(0);
    }

    return () => {
      if (tween) tween.kill();
    };
  }, [active]);

  return (
    <div
      className="group relative h-full w-full cursor-pointer"
      onClick={onOpen}
      role="button"
      tabIndex={-1}
    >
      {/* Poster */}
      <img
        src={item.poster}
        alt="Artwork"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Video layer */}
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
          poster={item.poster}
        >
          {item.webm ? <source src={item.webm} type="video/webm" /> : null}
          <source src={item.mp4} type="video/mp4" />
        </video>
      </div>

      {/* Cinematic overlays (subtile) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.25)_65%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* Dim layer */}
      <div
        className={[
          "pointer-events-none absolute inset-0 transition duration-300",
          dim ? "bg-black/35" : "bg-transparent",
        ].join(" ")}
      />

      {/* Minimal BUY CTA (small, unobtrusive) */}
      <a
        href={item.buyUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()} // IMPORTANT: nu deschide modal
        className={[
          "absolute bottom-4 right-4",
          "inline-flex items-center justify-center",
          "rounded-full",
          "px-4 py-2",
          "text-[11px] font-black uppercase tracking-[0.22em]",
          "text-white/90",
          "bg-black/30 backdrop-blur-md",
          "border border-white/14",
          "shadow-[0_12px_50px_rgba(0,0,0,0.55)]",
          "transition duration-300",
          active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
          "hover:bg-black/40 hover:border-white/22 hover:text-white",
          "focus:outline-none focus:ring-2 focus:ring-white/25",
        ].join(" ")}
        aria-label={`Buy artwork ${item.priceLabel ?? ""}`}
      >
        BUY{item.priceLabel ? ` ${item.priceLabel}` : ""}
      </a>
    </div>
  );
}

export default function SaleGrid() {
  const items: SaleItem[] = useMemo(
    () => [
      {
        key: "art-01",
        priceLabel: "€30",
        poster: "/media/sale/art-01.png",
        mp4: "/media/sale/art-01.mp4",
        buyUrl: "https://example.com/buy/art-01",
      },
      {
        key: "art-02",
        priceLabel: "€30",
        poster: "/media/sale/art-02.png",
        mp4: "/media/sale/art-02.mp4",
        buyUrl: "https://example.com/buy/art-02",
      },
      {
        key: "art-03",
        priceLabel: "€30",
        poster: "/media/sale/art-03.png",
        mp4: "/media/sale/art-03.mp4",
        buyUrl: "https://example.com/buy/art-03",
      },
      {
        key: "art-04",
        priceLabel: "€30",
        poster: "/media/sale/art-04.png",
        mp4: "/media/sale/art-04.mp4",
        buyUrl: "https://example.com/buy/art-04",
      },
      {
        key: "art-05",
        priceLabel: "€30",
        poster: "/media/sale/art-05.png",
        mp4: "/media/sale/art-05.mp4",
        buyUrl: "https://example.com/buy/art-05",
      },
      {
        key: "art-06",
        priceLabel: "€30",
        poster: "/media/sale/art-06.png",
        mp4: "/media/sale/art-06.mp4",
        buyUrl: "https://example.com/buy/art-06",
      },
      {
        key: "art-07",
        priceLabel: "€30",
        poster: "/media/sale/art-07.png",
        mp4: "/media/sale/art-07.mp4",
        buyUrl: "https://example.com/buy/art-07",
      },
      {
        key: "art-08",
        priceLabel: "€30",
        poster: "/media/sale/art-08.png",
        mp4: "/media/sale/art-08.mp4",
        buyUrl: "https://example.com/buy/art-08",
      },
      {
        key: "art-09",
        priceLabel: "€30",
        poster: "/media/sale/art-09.png",
        mp4: "/media/sale/art-09.mp4",
        buyUrl: "https://example.com/buy/art-09",
      },
    ],
    []
  );

  const [active, setActive] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => setIsTouch(isTouchDevice()), []);

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length !== items.length) return;

    cards.forEach((el, i) => {
      const isActive = active === i;
      const hasActive = active !== null;

      gsap.to(el, {
        scale: hasActive ? (isActive ? 1.05 : 0.985) : 1,
        filter: hasActive
          ? isActive
            ? "brightness(1)"
            : "brightness(0.72)"
          : "brightness(1)",
        duration: 0.38,
        ease: "power3.out",
        overwrite: "auto",
      });

      el.style.zIndex = hasActive ? (isActive ? "20" : "1") : "1";
    });
  }, [active, items.length]);

  const onEnter = (i: number) => {
    if (isTouch) return;
    setActive(i);
  };

  const onLeave = () => {
    if (isTouch) return;
    setActive(null);
  };

  return (
    <>
      <div className="relative min-h-screen w-full bg-black text-white">
        {/* ambient */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-56 left-16 h-[460px] w-[460px] rounded-full bg-white/5 blur-3xl"></div>

        <div className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, i) => {
              const isActive = active === i;
              const dim = active !== null && !isActive;

              return (
                <div
                  key={item.key}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className={[
                    "relative overflow-hidden rounded-[28px] border border-white/12 bg-white/5",
                    "aspect-[16/10]",
                    "outline-none transform-gpu",
                    "transition-shadow duration-300",
                    isActive
                      ? "shadow-[0_40px_160px_rgba(0,0,0,0.72)]"
                      : "shadow-none",
                  ].join(" ")}
                  onMouseEnter={() => onEnter(i)}
                  onMouseLeave={onLeave}
                  onFocus={() => onEnter(i)}
                  onBlur={onLeave}
                  tabIndex={0}
                >
                  <SaleCard
                    item={item}
                    active={!isTouch && isActive}
                    dim={dim}
                    onOpen={() => setModalIndex(i)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* global vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.88)_100%)]" />
      </div>

      {/* Fullscreen preview modal */}
      <FullscreenPreviewModal
  open={modalIndex !== null}
  title={modalIndex !== null ? `ARTWORK ${items[modalIndex].key.toUpperCase()}` : ""}
  poster={modalIndex !== null ? items[modalIndex].poster : ""}
  mp4={modalIndex !== null ? items[modalIndex].mp4 : ""}
  buyUrl={modalIndex !== null ? items[modalIndex].buyUrl : ""}
  priceLabel={modalIndex !== null ? items[modalIndex].priceLabel : ""}
  onClose={() => setModalIndex(null)}
/>

    </>
  );
}
