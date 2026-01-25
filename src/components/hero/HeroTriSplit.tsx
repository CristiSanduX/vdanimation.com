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

  // touch modal (kept for other panes; anime navigates)
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Smoothly animate widths using flex-grow (GSAP) — stable & premium
  useEffect(() => {
    const panes = paneRefs.current.filter(Boolean) as HTMLDivElement[];
    if (panes.length !== items.length) return;

    const baseGrow = 1;
    const activeGrow = 1.18; // expanded
    const inactiveGrow = 0.91; // compressed

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
  }, [activeIndex, items.length]);

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

    // Always navigate on Anime (desktop + touch)
    if (key === "anime") {
      navigateTo("/anime");
      return;
    }

    // On desktop we keep the tri-split hover behavior; no click action needed
    if (!isTouch) return;

    // Touch: open modal for non-anime panes
    setModalIndex(i);
  };

  const onKeyDownPane = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onClickPane(i);
  };

  const modalItem = modalIndex !== null ? items[modalIndex] : null;

  return (
    <>
      <div className="relative flex h-full w-full overflow-hidden" onMouseLeave={onLeave}>
        {items.map((item, i) => {
          const isAnime = item.key === "anime";

          return (
            <div
              key={item.key}
              ref={(el) => {
                paneRefs.current[i] = el;
              }}
              className={[
                "relative flex min-w-0 flex-1 outline-none",
                isAnime ? "cursor-pointer" : isTouch ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              style={{ flexGrow: 1 }}
              onMouseEnter={() => onEnter(i)}
              onFocus={() => onEnter(i)}
              onBlur={onLeave}
              onClick={() => onClickPane(i)}
              onKeyDown={(e) => onKeyDownPane(e, i)}
              role="button"
              tabIndex={0}
              aria-label={isAnime ? "Open Anime page" : `Open ${item.title}`}
            >
              {/* ✅ Gotham for pane contents */}
              <div className="absolute inset-0 hero-gotham">
                <VideoPane
                  item={item}
                  active={!isTouch && activeIndex === i}
                  dim={!isTouch && activeIndex !== null && activeIndex !== i}
                  showTitle
                />
              </div>

              {/* Optional tiny hint on Anime (desktop) */}
              {isAnime && !isTouch && (
                <div className="pointer-events-none absolute bottom-5 left-5 z-20 text-[11px] tracking-[0.24em] text-white/70 hero-gotham-tight">
                  ENTER → /ANIME
                </div>
              )}
            </div>
          );
        })}

        {/* ✅ black blur separators (between the 3 panes) */}
        <div className="pointer-events-none absolute inset-y-0 left-1/3 z-40 w-12 -translate-x-1/2">
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent blur-2xl" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-2/3 z-40 w-12 -translate-x-1/2">
          <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/45 to-transparent blur-2xl" />
        </div>

        {/* subtle global vignette (optional) */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.88)_100%)]" />
      </div>

      {/* Touch modal for non-anime panes only */}
      <FullscreenPreviewModal
        open={modalItem !== null && modalItem.key !== "anime"}
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
