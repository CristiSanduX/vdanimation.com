import React, { useEffect, useMemo, useRef, useState } from "react";
import FullscreenPreviewModal from "../ui/FullscreenPreviewModal";

export type VideoPaneItem = {
  key: string;
  title: string;
  poster: string;
  mp4: string;
};

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function createPlaybackLimiter(maxPlaying = 1) {
  const playing = new Set<HTMLVideoElement>();
  return {
    requestPlay(v: HTMLVideoElement) {
      if (playing.has(v)) return;
      playing.add(v);
      while (playing.size > maxPlaying) {
        const first = playing.values().next().value as HTMLVideoElement | undefined;
        if (!first) break;
        try { first.pause(); } catch {}
        playing.delete(first);
      }
      if (v.readyState === 0) {
        v.load();
        v.addEventListener("loadedmetadata", () => v.play().catch(() => {}), { once: true });
      } else {
        v.play().catch(() => {});
      }
    },
    stop(v: HTMLVideoElement) {
      try { v.pause(); } catch {}
      playing.delete(v);
    },
    stopAll() {
      for (const v of playing) {
        try { v.pause(); } catch {}
      }
      playing.clear();
    },
  };
}

export default function HeroTriSplit() {
  const items: VideoPaneItem[] = useMemo(
    () => [
      { key: "fantasy",   title: "FANTASY",   poster: "/media/fantasy-poster.png",   mp4: "/media/optimized_fantasy.mp4" },
      { key: "cinematic", title: "CINEMATIC", poster: "/media/cinematic-poster.png", mp4: "/media/optimized_cinematic.mp4" },
      { key: "anime",     title: "ANIME",     poster: "/media/anime-poster.png",     mp4: "/media/optimized_anime.mp4" },
    ],
    []
  );

  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  const playbackDesktop = useMemo(() => createPlaybackLimiter(1), []);
  const playbackTouch = useMemo(() => createPlaybackLimiter(3), []);
  const playback = isTouch ? playbackTouch : playbackDesktop;

  useEffect(() => {
    return () => {
      playbackDesktop.stopAll();
      playbackTouch.stopAll();
    };
  }, [playbackDesktop, playbackTouch]);

  return (
    <div
      className="relative w-screen h-[100svh] md:h-[100dvh] overflow-hidden bg-black select-none"
      style={{ maxWidth: "100vw" }}
      onMouseLeave={() => { if (!isTouch) setActiveIndex(null); }}
    >
      <div className="relative z-0 flex w-full h-full flex-col md:flex-row">
        {items.map((item, i) => {
          const isActive = isTouch ? true : activeIndex === i;
          const isAnyActive = isTouch ? true : activeIndex !== null;

          // CSS flex-grow transition instead of GSAP
          const flexGrow = !isAnyActive ? 1 : isActive ? 1.06 : 0.97;

          return (
            <div
              key={item.key}
              className="relative w-full overflow-hidden cursor-pointer outline-none"
              style={{
                flexGrow,
                transition: reducedMotion ? "none" : "flex-grow 0.4s cubic-bezier(0.2,0,0.2,1)",
              }}
              tabIndex={0}
              role="link"
              aria-label={item.title}
              onMouseEnter={() => { if (!isTouch) setActiveIndex(i); }}
              onFocus={() => { if (!isTouch) setActiveIndex(i); }}
              onBlur={() => { if (!isTouch) setActiveIndex(null); }}
              onClick={(e) => {
                if (e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  setModalIndex(i);
                  return;
                }
                window.location.href = `/${item.key}`;
              }}
            >
              <VideoPane
                item={item}
                active={isActive}
                isAnyActive={isAnyActive}
                reducedMotion={reducedMotion}
                playback={playback}
              />
            </div>
          );
        })}
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

function VideoPane({
  item,
  active,
  isAnyActive,
  reducedMotion,
  playback,
}: {
  item: VideoPaneItem;
  active: boolean;
  isAnyActive: boolean;
  reducedMotion: boolean;
  playback: ReturnType<typeof createPlaybackLimiter>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sourcesAttachedRef = useRef(false);

  const ensureSourcesAttached = () => {
    const v = videoRef.current;
    if (!v || sourcesAttachedRef.current) return;
    const s = document.createElement("source");
    s.src = item.mp4;
    s.type = "video/mp4";
    v.appendChild(s);
    v.preload = "none";
    sourcesAttachedRef.current = true;
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && !reducedMotion) {
      ensureSourcesAttached();
      v.preload = "metadata";
      playback.requestPlay(v);
    } else {
      playback.stop(v);
    }
  }, [active, reducedMotion]);

  return (
    <div className="relative h-full w-full bg-black">
      {/* Poster + scale on hover */}
      <div
        className="absolute inset-0"
        style={{
          transform: active ? "scale(1.01)" : "scale(1)",
          transition: reducedMotion ? "none" : "transform 0.7s cubic-bezier(0.2,0,0.2,1)",
        }}
      >
        <img
          src={item.poster}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />

        {/* Dim overlay on inactive panes */}
        <div
          className="absolute inset-0"
          style={{
            background: "black",
            opacity: !active && isAnyActive ? 0.15 : 0,
            transition: reducedMotion ? "none" : "opacity 0.2s ease",
          }}
        />

        {/* Video layer */}
        <div
          className="absolute inset-0"
          style={{
            opacity: active && !reducedMotion ? 1 : 0,
            transition: reducedMotion ? "none" : "opacity 0.22s ease",
          }}
        >
          <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            loop
            preload="none"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
          />
        </div>
      </div>

      {/* Text */}
      <div
        className="absolute left-0 right-0 bottom-12 z-20 flex flex-col items-center pointer-events-none px-6"
        style={{
          transform: active ? "translate3d(0,-8px,0)" : "translate3d(0,0,0)",
          transition: reducedMotion ? "none" : "transform 0.28s cubic-bezier(0.2,0,0.2,1)",
        }}
      >
        <h2
          className="hero-gotham font-black leading-none uppercase text-3xl md:text-[3.8vw]"
          style={{
            color: active ? "white" : "transparent",
            WebkitTextStroke: active ? "0px" : "1.25px rgba(255,255,255,0.75)",
            letterSpacing: "0em",
            textShadow: "0 10px 30px rgba(0,0,0,0.35)",
            transition: reducedMotion ? "none" : "color 0.2s ease, -webkit-text-stroke 0.2s ease",
          }}
        >
          {item.title}
        </h2>

        <div
          className="mt-4 h-[1px] bg-white"
          style={{
            width: active ? "3rem" : "0",
            opacity: active ? 1 : 0,
            transition: reducedMotion ? "none" : "width 0.3s ease, opacity 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
