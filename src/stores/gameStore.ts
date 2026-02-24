/** @format */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IslandId = "logika" | "warna" | "matematika" | "memori" | "kreatif";
export type PageId = "landing" | "worldmap" | "game" | "thr-reveal";
export type DifficultyLevel = "elementary" | "junior" | "senior";

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

// === Difficulty Configuration ===

export interface DifficultyConfig {
  label: string;
  shortLabel: string;
  emoji: string;
  coinMultiplier: number;
  timerSeconds: number;
  description: string;
  color: string;
  // Logic puzzle
  logicShapeCount: number;
  logicPatternLength: number;
  logicRounds: number;
  // Math battle
  mathMaxNum: number;
  mathOps: string[];
  mathOptions: number;
  mathRounds: number;
  // Color/Shape
  colorShadowCount: number;
  colorRounds: number;
  // Memory
  memoryPairs: number;
  memoryColumns: number;
  memoryTimerEnabled: boolean;
  memoryTimerSeconds: number;
  // Creative
  creativePrompt: string | null;
  creativeTimerEnabled: boolean;
  creativeTimerSeconds: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  elementary: {
    label: "SD (Elementary)",
    shortLabel: "SD",
    emoji: "📚",
    coinMultiplier: 1.0,
    timerSeconds: 60,
    description: "Mudah & menyenangkan",
    color: "#6BCB77",
    logicShapeCount: 2,
    logicPatternLength: 6,
    logicRounds: 3,
    mathMaxNum: 20,
    mathOps: ["+", "-"],
    mathOptions: 3,
    mathRounds: 5,
    colorShadowCount: 3,
    colorRounds: 4,
    memoryPairs: 6,
    memoryColumns: 4,
    memoryTimerEnabled: false,
    memoryTimerSeconds: 0,
    creativePrompt: null,
    creativeTimerEnabled: false,
    creativeTimerSeconds: 0,
  },
  junior: {
    label: "SMP (Junior High)",
    shortLabel: "SMP",
    emoji: "🎓",
    coinMultiplier: 1.1,
    timerSeconds: 45,
    description: "Lebih menantang!",
    color: "#FF9100",
    logicShapeCount: 3,
    logicPatternLength: 7,
    logicRounds: 4,
    mathMaxNum: 50,
    mathOps: ["+", "-", "×"],
    mathOptions: 4,
    mathRounds: 6,
    colorShadowCount: 5,
    colorRounds: 5,
    memoryPairs: 8,
    memoryColumns: 4,
    memoryTimerEnabled: true,
    memoryTimerSeconds: 90,
    creativePrompt: "Gambar Ketupat Lebaran! 🎋",
    creativeTimerEnabled: true,
    creativeTimerSeconds: 90,
  },
  senior: {
    label: "SMA (Senior High)",
    shortLabel: "SMA",
    emoji: "🏆",
    coinMultiplier: 1.25,
    timerSeconds: 30,
    description: "Untuk yang berani! 🔥",
    color: "#FF4081",
    logicShapeCount: 4,
    logicPatternLength: 8,
    logicRounds: 5,
    mathMaxNum: 100,
    mathOps: ["+", "-", "×", "÷"],
    mathOptions: 4,
    mathRounds: 7,
    colorShadowCount: 6,
    colorRounds: 6,
    memoryPairs: 10,
    memoryColumns: 5,
    memoryTimerEnabled: true,
    memoryTimerSeconds: 60,
    creativePrompt: "Gambar Masjid dengan detail! 🕌",
    creativeTimerEnabled: true,
    creativeTimerSeconds: 60,
  },
};

interface GameState {
  // Player
  playerName: string;
  difficulty: DifficultyLevel;
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
  setDifficulty: (d: DifficultyLevel) => void;
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
  getDifficultyConfig: () => DifficultyConfig;
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
      difficulty: "elementary",
      coins: 0,
      completedLevels: [],
      currentIsland: null,
      currentPage: "landing",
      thrUnlocked: false,
      voucherCode: "",
      soundEnabled: true,

      setPlayerName: (name) => set({ playerName: name }),
      setDifficulty: (d) => set({ difficulty: d }),

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
          const config = DIFFICULTY_CONFIGS[state.difficulty];
          const earnedCoins = Math.round(
            COINS_PER_LEVEL * config.coinMultiplier,
          );
          const newCompleted = [...state.completedLevels, island];
          const allDone = newCompleted.length === ISLANDS.length;
          set({
            completedLevels: newCompleted,
            coins: state.coins + earnedCoins,
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
          difficulty: "elementary",
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

      getDifficultyConfig: () => {
        return DIFFICULTY_CONFIGS[get().difficulty];
      },
    }),
    {
      name: "koinkancil-game",
    },
  ),
);
