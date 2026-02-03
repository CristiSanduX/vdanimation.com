export type CinematicWork = {
  id: string;
  title: string;
  poster: string;
  mp4: string;
  buyUrl?: string;
  priceLabel?: string;
};

export const cinematicWorks: CinematicWork[] = Array.from({ length: 33 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `cinematic-${n}`,
    title: `CINEMATIC ${n}`,
    poster: `/media/cinematic/c${n}.png`,
    mp4: `/media/cinematic/c${n}.mp4`,
    buyUrl: "", // optional
    priceLabel: "", // optional
  };
});
