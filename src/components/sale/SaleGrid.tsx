import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

type SaleItem = {
  key: string;
  priceLabel?: string;
  poster: string;
  mp4: string;
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

  // ✅ Prewarm once (WebKit-friendly) + keep first frame ready
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const prewarm = async () => {
      try {
        v.muted = true;
        // @ts-ignore
        v.playsInline = true;
        v.preload = "metadata";
        v.load();

        // tiny seek to “unlock” first frame (Safari)
        try {
          v.currentTime = 0.001;
        } catch {}

        // don’t autoplay here, only on active
        v.pause();
      } catch {}
    };

    prewarm();
  }, []);

  // ✅ Play/pause without resetting time each hover (smoother, less lag)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const play = async () => {
      try {
        v.muted = true;
        // @ts-ignore
        v.playsInline = true;
        await v.play();
      } catch {}
    };

    if (active) play();
    else v.pause();
  }, [active]);

  return (
    <div
      className="group relative h-full w-full cursor-pointer select-none"
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

      {/* Video layer (CSS fade = smoother decât GSAP) */}
      <div
        className={[
          "absolute inset-0 transition-opacity duration-300 ease-out",
          active ? "opacity-100" : "opacity-0",
        ].join(" ")}
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

      {/* Cinematic overlays */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.25)_65%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* Dim (doar overlay, fără filter) */}
      <div
        className={[
          "pointer-events-none absolute inset-0 transition duration-300",
          dim ? "bg-black/45" : "bg-transparent",
        ].join(" ")}
      />

      {/* ✅ BUY (mai mic + mai jos / mai aproape de bottom) */}
      <a
        href={item.buyUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={[
          // poziție: mai jos
          "absolute left-1/2 -translate-x-1/2",
          "bottom-3 sm:bottom-4", // mai jos pe ambele
          // anim: apare/dispare
          "opacity-0 translate-y-1",
          "transition duration-300 ease-out",
          active ? "opacity-100 translate-y-0" : "",
        ].join(" ")}
        aria-label={`Buy artwork ${item.priceLabel ?? ""}`}
      >
        <span
          className={[
            // ✅ mult mai mic decât înainte
            "inline-flex items-center justify-center",
            "rounded-full",
            "px-4 py-2 sm:px-4 sm:py-2",
            "text-[11px] sm:text-[12px]",
            "font-black uppercase tracking-[0.22em]",
            "text-white/90",
            "bg-black/28 backdrop-blur-md",
            "border border-white/14",
            "shadow-[0_14px_70px_rgba(0,0,0,0.70)]",
            "transition duration-300",
            "hover:bg-black/40 hover:border-white/22 hover:text-white",
            "focus:outline-none focus:ring-2 focus:ring-white/25",
          ].join(" ")}
        >
          BUY{item.priceLabel ? ` ${item.priceLabel}` : ""}
        </span>
      </a>
    </div>
  );
}

export default function SaleGrid() {
  const items: SaleItem[] = useMemo(
    () => [
      { key: "art-01", priceLabel: "€30", poster: "/media/sale/art-01.png", mp4: "/media/sale/art-01.mp4", buyUrl: "https://example.com/buy/art-01" },
      { key: "art-02", priceLabel: "€30", poster: "/media/sale/art-02.png", mp4: "/media/sale/art-02.mp4", buyUrl: "https://example.com/buy/art-02" },
      { key: "art-03", priceLabel: "€30", poster: "/media/sale/art-03.png", mp4: "/media/sale/art-03.mp4", buyUrl: "https://example.com/buy/art-03" },
      { key: "art-04", priceLabel: "€30", poster: "/media/sale/art-04.png", mp4: "/media/sale/art-04.mp4", buyUrl: "https://example.com/buy/art-04" },
      { key: "art-05", priceLabel: "€30", poster: "/media/sale/art-05.png", mp4: "/media/sale/art-05.mp4", buyUrl: "https://example.com/buy/art-05" },
      { key: "art-06", priceLabel: "€30", poster: "/media/sale/art-06.png", mp4: "/media/sale/art-06.mp4", buyUrl: "https://example.com/buy/art-06" },
      { key: "art-07", priceLabel: "€30", poster: "/media/sale/art-07.png", mp4: "/media/sale/art-07.mp4", buyUrl: "https://example.com/buy/art-07" },
      { key: "art-08", priceLabel: "€30", poster: "/media/sale/art-08.png", mp4: "/media/sale/art-08.mp4", buyUrl: "https://example.com/buy/art-08" },
      { key: "art-09", priceLabel: "€30", poster: "/media/sale/art-09.png", mp4: "/media/sale/art-09.mp4", buyUrl: "https://example.com/buy/art-09" },
    ],
    []
  );

  const [active, setActive] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  // ✅ mobile: first tap activates (video + buy), second tap opens modal
  const [armedIndex, setArmedIndex] = useState<number | null>(null);

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => setIsTouch(isTouchDevice()), []);

  // ✅ Only transform scale (no filter) = less lag
  useEffect(() => {
    const cells = cellRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cells.length !== items.length) return;

    cells.forEach((el, i) => {
      const isActive = active === i;
      const hasActive = active !== null;

      gsap.to(el, {
        scale: hasActive ? (isActive ? 1.03 : 0.995) : 1,
        duration: 0.28,
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

  const onTapCard = (i: number) => {
    if (!isTouch) {
      setModalIndex(i);
      return;
    }

    // tap behavior:
    // 1st tap -> activate + show BUY
    // 2nd tap same card -> open modal
    if (armedIndex === i && active === i) {
      setModalIndex(i);
      return;
    }

    setActive(i);
    setArmedIndex(i);
  };

  return (
    <>
      <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
        {/* ambient */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-56 left-16 h-[460px] w-[460px] rounded-full bg-white/5 blur-3xl"></div>

        <div className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <div className="mt-12 grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, i) => {
              const isActive = active === i;
              const dim = active !== null && !isActive;

              return (
                <div
                  key={item.key}
                  ref={(el) => {
                    cellRefs.current[i] = el;
                  }}
                  className={[
                    "relative aspect-[16/10] overflow-hidden bg-black",
                    "outline-none transform-gpu will-change-transform",
                    // separators, dar fără “card border”
                    "after:pointer-events-none after:absolute after:inset-0 after:content-['']",
                    "after:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                    isActive ? "shadow-[0_50px_220px_rgba(0,0,0,0.82)]" : "",
                  ].join(" ")}
                  // desktop hover
                  onPointerEnter={() => onEnter(i)}
                  onPointerLeave={onLeave}
                  onFocus={() => onEnter(i)}
                  onBlur={onLeave}
                  // mobile tap
                  onClick={() => onTapCard(i)}
                  tabIndex={0}
                >
                  <SaleCard item={item} active={isActive} dim={dim} onOpen={() => onTapCard(i)} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.9)_100%)]" />
      </div>

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
