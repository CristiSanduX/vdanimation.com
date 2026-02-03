export type FantasyWork = {
  id: string;
  title: string;
  poster: string;
  mp4: string;
  buyUrl?: string;
  priceLabel?: string;
};

export const fantasyWorks: FantasyWork[] = Array.from({ length: 24 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `fantasy-${n}`,
    title: `FANTASY ${n}`,
    poster: `/media/fantasy/f${n}.png`,
    mp4: `/media/fantasy/f${n}.mp4`,
    buyUrl: "", // optional
    priceLabel: "", // optional
  };
});
