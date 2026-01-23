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
        key: "semi-real",
        title: "SEMI-REAL",
        poster: "/media/semi.png",
        mp4: "/media/semi-real.mp4",
      },
      {
        key: "fictional",
        title: "FICTIONAL",
        poster: "/media/fictional-poster.png",
        mp4: "/media/fictional.mp4",
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

  // mobile modal
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

  const onEnter = (i: number) => {
    if (isTouch) return;
    setActiveIndex(i);
  };

  const onLeave = () => {
    if (isTouch) return;
    setActiveIndex(null);
  };

  const onClickPane = (i: number) => {
    if (!isTouch) return;
    setModalIndex(i);
  };

  return (
    <>
      <div
        className="relative flex h-full w-full overflow-hidden"
        onMouseLeave={onLeave}
      >
        {items.map((item, i) => (
          <div
            key={item.key}
            ref={(el) => {
              paneRefs.current[i] = el;
            }}
            className={[
              "relative flex min-w-0 flex-1 outline-none",
              isTouch ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
            style={{ flexGrow: 1 }}
            onMouseEnter={() => onEnter(i)}
            onFocus={() => onEnter(i)}
            onBlur={onLeave}
            onClick={() => onClickPane(i)}
            role={isTouch ? "button" : undefined}
            tabIndex={0}
          >
            <VideoPane
              item={item}
              active={!isTouch && activeIndex === i}
              dim={!isTouch && activeIndex !== null && activeIndex !== i}
              showTitle
            />
          </div>
        ))}

        {/* subtle global vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_72%,rgba(0,0,0,0.88)_100%)]" />
      </div>

     <FullscreenPreviewModal
  open={modalIndex !== null}
  title={modalIndex !== null ? items[modalIndex].title : ""}
  poster={modalIndex !== null ? items[modalIndex].poster : ""}
  mp4={modalIndex !== null ? items[modalIndex].mp4 : ""}
  buyUrl=""
  priceLabel=""
  onClose={() => setModalIndex(null)}
/>

    </>
  );
}
