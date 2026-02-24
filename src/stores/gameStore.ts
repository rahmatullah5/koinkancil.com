/** @format */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IslandId = "logika" | "warna" | "matematika" | "memori" | "kreatif";
export type PageId = "landing" | "worldmap" | "game" | "thr-reveal";

export const ISLANDS: {
  id: IslandId;
  name: string;
  emoji: string;
  color: string;
}[] = [
  {
    id: "logika",
    name: "Pulau Logika",
    emoji: "🧠",
    color: "var(--color-island-logika)",
  },
  {
    id: "warna",
    name: "Pulau Warna",
    emoji: "🎨",
    color: "var(--color-island-warna)",
  },
  {
    id: "matematika",
    name: "Pulau Matematika",
    emoji: "🔢",
    color: "var(--color-island-math)",
  },
  {
    id: "memori",
    name: "Pulau Memori",
    emoji: "🧠",
    color: "var(--color-island-memori)",
  },
  {
    id: "kreatif",
    name: "Pulau Kreatif",
    emoji: "🎤",
    color: "var(--color-island-kreatif)",
  },
];

export const COINS_PER_LEVEL = 10;

interface GameState {
  // Player
  playerName: string;
  playerAge: number;
  coins: number;
  completedLevels: IslandId[];
  currentIsland: IslandId | null;
  currentPage: PageId;
  thrUnlocked: boolean;
  voucherCode: string;

  // Settings
  soundEnabled: boolean;

  // Actions
  setPlayerName: (name: string) => void;
  setPlayerAge: (age: number) => void;
  startAdventure: () => void;
  navigateToIsland: (island: IslandId) => void;
  completeLevel: (island: IslandId) => void;
  addCoins: (amount: number) => void;
  setPage: (page: PageId) => void;
  toggleSound: () => void;
  unlockTHR: () => void;
  resetGame: () => void;

  // Computed helpers
  isIslandUnlocked: (island: IslandId) => boolean;
  isIslandCompleted: (island: IslandId) => boolean;
  getProgress: () => number;
}

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "THR-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: "",
      playerAge: 8,
      coins: 0,
      completedLevels: [],
      currentIsland: null,
      currentPage: "landing",
      thrUnlocked: false,
      voucherCode: "",
      soundEnabled: true,

      setPlayerName: (name) => set({ playerName: name }),
      setPlayerAge: (age) => set({ playerAge: age }),

      startAdventure: () => set({ currentPage: "worldmap" }),

      navigateToIsland: (island) => {
        const state = get();
        if (state.isIslandUnlocked(island)) {
          set({ currentIsland: island, currentPage: "game" });
        }
      },

      completeLevel: (island) => {
        const state = get();
        if (!state.completedLevels.includes(island)) {
          const newCompleted = [...state.completedLevels, island];
          const allDone = newCompleted.length === ISLANDS.length;
          set({
            completedLevels: newCompleted,
            coins: state.coins + COINS_PER_LEVEL,
            thrUnlocked: allDone,
            currentPage: allDone ? "thr-reveal" : "worldmap",
            currentIsland: null,
          });
        }
      },

      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

      setPage: (page) => set({ currentPage: page, currentIsland: null }),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      unlockTHR: () =>
        set({
          thrUnlocked: true,
          voucherCode: generateVoucherCode(),
        }),

      resetGame: () =>
        set({
          playerName: "",
          playerAge: 8,
          coins: 0,
          completedLevels: [],
          currentIsland: null,
          currentPage: "landing",
          thrUnlocked: false,
          voucherCode: "",
        }),

      isIslandUnlocked: (island) => {
        const state = get();
        const idx = ISLANDS.findIndex((i) => i.id === island);
        if (idx === 0) return true;
        const prevIsland = ISLANDS[idx - 1];
        return state.completedLevels.includes(prevIsland.id);
      },

      isIslandCompleted: (island) => {
        return get().completedLevels.includes(island);
      },

      getProgress: () => {
        const state = get();
        return (state.completedLevels.length / ISLANDS.length) * 100;
      },
    }),
    {
      name: "koinkancil-game",
    },
  ),
);
