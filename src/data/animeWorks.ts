export type AnimeWork = {
  id: string;
  title: string;
  poster: string;
  mp4: string;
  buyUrl?: string;
  priceLabel?: string;
};

export const animeWorks: AnimeWork[] = Array.from({ length: 23 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `anime-${n}`,
    title: `ANIME ${n}`,
    poster: `/media/anime/a${n}.png`,
    mp4: `/media/anime/a${n}.mp4`,
    buyUrl: "", // optional
    priceLabel: "", // optional
  };
});
