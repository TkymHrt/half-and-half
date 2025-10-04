import { type Area } from "@/types/app";

// In a real app, this would come from a database.
// For the mock, we'll define it statically.
const areas: Area[] = [
  {
    id: "honkan",
    name: "本館",
    floors: [
      {
        id: "honkan-1f",
        name: "1F",
        imageUrl: "/maps/honkan/1f.png",
        width: 2000,
        height: 1500,
      },
      {
        id: "honkan-2f",
        name: "2F",
        imageUrl: "/maps/honkan/2f.png",
        width: 2000,
        height: 1500,
      },
    ],
  },
  {
    id: "gym",
    name: "体育館",
    floors: [
      {
        id: "gym-1f",
        name: "1F",
        imageUrl: "/maps/gym/1f.png",
        width: 1800,
        height: 2000,
      },
    ],
  },
];

export const AreaRepo = {
  async list() {
    await delay();
    return areas;
  },

  async get(id: string) {
    await delay();
    return areas.find((a) => a.id === id) ?? null;
  },
};

function delay(ms = 50) {
  return new Promise((res) => setTimeout(res, ms));
}