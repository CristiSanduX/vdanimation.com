// cinematicWorks.ts — Datele pentru galeria premium

export type CinematicWork = {
  id: string;
  title: string;
  category: string; // Adăugat pentru label-ul de deasupra titlului
  year: string;     // Adăugat pentru look-ul de "Arhivă"
  poster: string;
  mp4: string;
  buyUrl?: string;
  priceLabel?: string;
};

// Helper arrays pentru a genera date care arată profi (nu doar Cinematic 01, 02...)
const projectNames = [
  "Beyond Shadows", "Urban Pulse", "Neon Echoes", "Silent Motion", 
  "The Last Frame", "Digital Soul", "Vivid Reality", "Eternal Flow",
  "Shadow & Light", "Abstract Visions", "Primal Edge", "Future Past",
  "Nordic Mood", "Siren Call", "Midnight City", "Lost Horizon"
];

const categories = [
  "Commercial", "Music Video", "Fashion Film", 
  "Experimental", "Short Film", "Branded Content"
];

const years = ["2024", "2025"];

export const cinematicWorks: CinematicWork[] = Array.from({ length: 33 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  
  // Alegem date random sau secvențiale pentru varietate vizuală
  const title = projectNames[i % projectNames.length];
  const category = categories[i % categories.length];
  const year = years[i % years.length];

  return {
    id: `cinematic-${n}`,
    title: `${title} ${n}`,
    category: category,
    year: year,
    poster: `/media/cinematic/c${n}.png`,
    mp4: `/media/cinematic/c${n}.mp4`,
    buyUrl: "https://yourshop.com/item", // Pune link-ul tău real aici dacă ai
    priceLabel: "€29.00",
  };
});