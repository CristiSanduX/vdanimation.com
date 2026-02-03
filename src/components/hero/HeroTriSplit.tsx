import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import VideoPane, { type VideoPaneItem } from "../hero/VideoPane";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

export default function HeroTriSplit() {
  const items: VideoPaneItem[] = useMemo(
    () => [
      {
        key: "fantasy",
        title: "FANTASY",
        poster: "/media/fantasy-poster.png",
        mp4: "/media/fantasy.mp4",
      },
      {
        key: "cinematic",
        title: "CINEMATIC",
        poster: "/media/cinematic-poster.png",
        mp4: "/media/cinematic.mp4",
      },
      {
        key: "anime",
        title: "ANIME",
        poster: "/media/anime-poster.png",
        mp4: "/media/anime.mp4",
      },
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

  // GSAP flex-grow animation (desktop only)
  useEffect(() => {
    if (isTouch) return;

    const panes = paneRefs.current.filter(Boolean) as HTMLDivElement[];
    if (panes.length !== items.length) return;

    const baseGrow = 1;
    const activeGrow = 1.18;
    const inactiveGrow = 0.91;

    panes.forEach((pane, i) => {
      const grow =
        activeIndex === null
          ? baseGrow
          : i === activeIndex
          ? activeGrow
          : inactiveGrow;

      gsap.to(pane, {
        flexGrow: grow,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }, [activeIndex, items.length, isTouch]);

  const navigateTo = (href: string) => {
    if (typeof window === "undefined") return;
    window.location.href = href;
  };

  const onEnter = (i: number) => {
    if (isTouch) return;
    setActiveIndex(i);
  };

  const onLeave = () => {
    if (isTouch) return;
    setActiveIndex(null);
  };

  const onClickPane = (i: number) => {
    const key = items[i]?.key;
    if (key === "anime") return navigateTo("/anime");
    if (key === "cinematic") return navigateTo("/cinematic");
    if (key === "fantasy") return navigateTo("/fantasy");

    // (fallback) touch modal if you ever add a non-route pane
    if (isTouch) setModalIndex(i);
  };

  const onKeyDownPane = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onClickPane(i);
  };

  const modalItem = modalIndex !== null ? items[modalIndex] : null;

  return (
    <>
      <div
        className={[
          // ✅ mobile stack, desktop row
          "relative flex w-full overflow-hidden",
          "flex-col md:flex-row",

          // ✅ mobile: spacing + padding like “stack cards”
          "gap-3 px-3 py-3 md:gap-0 md:px-0 md:py-0",

          // ✅ IMPORTANT: fill parent height so 3 panes can split perfectly on mobile
          "h-full",
        ].join(" ")}
        onMouseLeave={onLeave}
      >
        {items.map((item, i) => {
          return (
            <div
              key={item.key}
              ref={(el) => {
                paneRefs.current[i] = el;
              }}
              className={[
                "relative outline-none cursor-pointer",
                "overflow-hidden",

                // ✅ MOBILE: each pane takes 1/3 of available height
                "w-full flex-1 min-h-0",

                // ✅ DESKTOP: tri-split
                "md:flex md:min-w-0 md:flex-1 md:h-auto",

                // ✅ mobile styling
                "rounded-2xl md:rounded-none",
                "shadow-[0_20px_80px_rgba(0,0,0,0.55)] md:shadow-none",
              ].join(" ")}
              style={{ flexGrow: 1 }}
              onMouseEnter={() => onEnter(i)}
              onFocus={() => onEnter(i)}
              onBlur={onLeave}
              onClick={() => onClickPane(i)}
              onKeyDown={(e) => onKeyDownPane(e, i)}
              role="button"
              tabIndex={0}
              aria-label={`Open ${item.title}`}
            >
              <div className="absolute inset-0 hero-gotham">
                <VideoPane
                  item={item}
                  active={!isTouch && activeIndex === i}
                  dim={!isTouch && activeIndex !== null && activeIndex !== i}
                  showTitle
                  focal="top"
                />
              </div>

              {/* extra mobile polish: subtle bottom bar behind title */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:hidden" />
            </div>
          );
        })}

        {/* separators — ONLY desktop */}
        <div className="pointer-events-none absolute inset-y-0 left-1/3 z-40 w-12 -translate-x-1/2 hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent blur-2xl" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-2/3 z-40 w-12 -translate-x-1/2 hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/45 to-transparent blur-2xl" />
        </div>

        {/* global vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.88)_100%)]" />
      </div>

      {/* touch modal (fallback) */}
      <FullscreenPreviewModal
        open={modalItem !== null}
        title={modalItem?.title ?? ""}
        poster={modalItem?.poster ?? ""}
        mp4={modalItem?.mp4 ?? ""}
        buyUrl=""
        priceLabel=""
        onClose={() => setModalIndex(null)}
      />
    </>
  );
}
