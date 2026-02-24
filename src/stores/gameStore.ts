/** @format */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  generatePathGraph,
  getStartIsland,
  getNextIslands,
  type PathGraph,
} from "../utils/pathGenerator";

// === Island & Page Types ===

export type IslandId =
  | "logika"
  | "warna"
  | "matematika"
  | "memori"
  | "kreatif"
  | "labirin"
  | "riddle"
  | "bangun"
  | "irama"
  | "eksperimen"
  | "kode"
  | "jejak"
  | "gelombang"
  | "bintang"
  | "cerita"
  | "urutan"
  | "peta";

export type PageId =
  | "landing"
  | "worldmap"
  | "game"
  | "thr-reveal"
  | "leaderboard";

export type DifficultyLevel = "elementary" | "junior" | "senior";

// === All Islands ===

export interface IslandInfo {
  id: IslandId;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const ALL_ISLANDS: IslandInfo[] = [
  // Original 5
  {
    id: "logika",
    name: "Pulau Logika",
    emoji: "🧠",
    color: "#6C63FF",
    description: "Tebak pola!",
  },
  {
    id: "warna",
    name: "Pulau Warna",
    emoji: "🎨",
    color: "#FF6B9D",
    description: "Cocokkan bayangan!",
  },
  {
    id: "matematika",
    name: "Pulau Matematika",
    emoji: "🔢",
    color: "#4FC3F7",
    description: "Lawan monster!",
  },
  {
    id: "memori",
    name: "Pulau Memori",
    emoji: "🃏",
    color: "#AB47BC",
    description: "Ingat kartu!",
  },
  {
    id: "kreatif",
    name: "Pulau Kreatif",
    emoji: "🎤",
    color: "#FF7043",
    description: "Gambar bebas!",
  },
  // New 12
  {
    id: "labirin",
    name: "Pulau Labirin Harta",
    emoji: "🌋",
    color: "#F44336",
    description: "Jelajahi labirin!",
  },
  {
    id: "riddle",
    name: "Pulau Riddle Angin",
    emoji: "🌪️",
    color: "#00BCD4",
    description: "Tebak tebakan!",
  },
  {
    id: "bangun",
    name: "Pulau Bangun Nusantara",
    emoji: "🏗️",
    color: "#795548",
    description: "Bangun rumah!",
  },
  {
    id: "irama",
    name: "Pulau Irama Takbir",
    emoji: "🎵",
    color: "#E91E63",
    description: "Ketuk irama!",
  },
  {
    id: "eksperimen",
    name: "Pulau Eksperimen Warna",
    emoji: "🧪",
    color: "#4CAF50",
    description: "Campur warna!",
  },
  {
    id: "kode",
    name: "Pulau Kode Rahasia",
    emoji: "🧩",
    color: "#FF9800",
    description: "Pecahkan sandi!",
  },
  {
    id: "jejak",
    name: "Pulau Jejak Misteri",
    emoji: "🐾",
    color: "#8BC34A",
    description: "Ikuti jejak!",
  },
  {
    id: "gelombang",
    name: "Pulau Gelombang Angka",
    emoji: "🌊",
    color: "#2196F3",
    description: "Tebak urutan!",
  },
  {
    id: "bintang",
    name: "Pulau Bintang Cepat",
    emoji: "🌟",
    color: "#FFC107",
    description: "Tangkap bintang!",
  },
  {
    id: "cerita",
    name: "Pulau Cerita Interaktif",
    emoji: "📖",
    color: "#9C27B0",
    description: "Pilih jalanmu!",
  },
  {
    id: "urutan",
    name: "Pulau Ingat Urutan",
    emoji: "💡",
    color: "#009688",
    description: "Ingat urutan!",
  },
  {
    id: "peta",
    name: "Pulau Peta Rahasia",
    emoji: "🧭",
    color: "#607D8B",
    description: "Susun peta!",
  },
];

export function getIslandInfo(id: IslandId): IslandInfo {
  return ALL_ISLANDS.find((i) => i.id === id) || ALL_ISLANDS[0];
}

export const COINS_PER_LEVEL = 10;
export const MAX_STEPS = 5;

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
  mathMinOps: number;
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
  // Maze
  mazeSize: number;
  mazeMoves: number;
  mazeFog: boolean;
  mazeMovingWalls: boolean;
  // Riddles
  riddleCount: number;
  riddleChoices: number;
  riddleVisual: boolean;
  // Build
  buildPieces: number;
  buildRotation: boolean;
  buildTimer: boolean;
  // Rhythm
  rhythmSpeed: number; // ms per beat
  rhythmLanes: number;
  rhythmCombo: boolean;
  // Color Mix
  colorMixColors: number;
  colorMixRounds: number;
  colorMixLimitedMoves: boolean;
  // Secret Code
  codeWordLength: number;
  codeHints: number; // 0=all, 1=partial, 2=minimal
  // Mystery Trail
  trailRounds: number;
  trailReverse: boolean;
  // Number Wave
  waveRounds: number;
  waveMixedOps: boolean;
  // Star Speed
  starTargetSize: number;
  starLives: number; // 0 = unlimited
  starDuration: number; // seconds
  // Story Branch
  storyChoices: number;
  storySmartPath: boolean;
  // Simon Sequence
  simonStart: number;
  simonSpeed: number; // ms between flashes
  // Secret Map
  mapPieces: number;
  mapFlip: boolean;
  mapCompass: boolean;
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
    mathMinOps: 1,
    colorShadowCount: 3,
    colorRounds: 4,
    memoryPairs: 6,
    memoryColumns: 4,
    memoryTimerEnabled: false,
    memoryTimerSeconds: 0,
    creativePrompt: null,
    creativeTimerEnabled: false,
    creativeTimerSeconds: 0,
    // Maze
    mazeSize: 6,
    mazeMoves: 30,
    mazeFog: false,
    mazeMovingWalls: false,
    // Riddles
    riddleCount: 3,
    riddleChoices: 3,
    riddleVisual: true,
    // Build
    buildPieces: 3,
    buildRotation: false,
    buildTimer: false,
    // Rhythm
    rhythmSpeed: 1200,
    rhythmLanes: 3,
    rhythmCombo: false,
    // Color Mix
    colorMixColors: 2,
    colorMixRounds: 3,
    colorMixLimitedMoves: false,
    // Secret Code
    codeWordLength: 3,
    codeHints: 0,
    // Mystery Trail
    trailRounds: 4,
    trailReverse: false,
    // Number Wave
    waveRounds: 4,
    waveMixedOps: false,
    // Star Speed
    starTargetSize: 80,
    starLives: 0,
    starDuration: 30,
    // Story Branch
    storyChoices: 2,
    storySmartPath: false,
    // Simon
    simonStart: 3,
    simonSpeed: 800,
    // Map
    mapPieces: 4,
    mapFlip: false,
    mapCompass: false,
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
    mathMinOps: 2,
    colorShadowCount: 5,
    colorRounds: 5,
    memoryPairs: 8,
    memoryColumns: 4,
    memoryTimerEnabled: true,
    memoryTimerSeconds: 90,
    creativePrompt: "Gambar Ketupat Lebaran! 🎋",
    creativeTimerEnabled: true,
    creativeTimerSeconds: 90,
    // Maze
    mazeSize: 8,
    mazeMoves: 20,
    mazeFog: false,
    mazeMovingWalls: true,
    // Riddles
    riddleCount: 4,
    riddleChoices: 4,
    riddleVisual: false,
    // Build
    buildPieces: 5,
    buildRotation: true,
    buildTimer: false,
    // Rhythm
    rhythmSpeed: 800,
    rhythmLanes: 3,
    rhythmCombo: true,
    // Color Mix
    colorMixColors: 3,
    colorMixRounds: 4,
    colorMixLimitedMoves: true,
    // Secret Code
    codeWordLength: 4,
    codeHints: 1,
    // Mystery Trail
    trailRounds: 5,
    trailReverse: false,
    // Number Wave
    waveRounds: 5,
    waveMixedOps: true,
    // Star Speed
    starTargetSize: 60,
    starLives: 0,
    starDuration: 30,
    // Story Branch
    storyChoices: 3,
    storySmartPath: false,
    // Simon
    simonStart: 4,
    simonSpeed: 600,
    // Map
    mapPieces: 6,
    mapFlip: true,
    mapCompass: false,
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
    mathMinOps: 4,
    colorShadowCount: 6,
    colorRounds: 6,
    memoryPairs: 10,
    memoryColumns: 5,
    memoryTimerEnabled: true,
    memoryTimerSeconds: 60,
    creativePrompt: "Gambar Masjid dengan detail! 🕌",
    creativeTimerEnabled: true,
    creativeTimerSeconds: 60,
    // Maze
    mazeSize: 10,
    mazeMoves: 15,
    mazeFog: true,
    mazeMovingWalls: true,
    // Riddles
    riddleCount: 5,
    riddleChoices: 4,
    riddleVisual: false,
    // Build
    buildPieces: 7,
    buildRotation: true,
    buildTimer: true,
    // Rhythm
    rhythmSpeed: 500,
    rhythmLanes: 4,
    rhythmCombo: true,
    // Color Mix
    colorMixColors: 3,
    colorMixRounds: 5,
    colorMixLimitedMoves: true,
    // Secret Code
    codeWordLength: 5,
    codeHints: 2,
    // Mystery Trail
    trailRounds: 6,
    trailReverse: true,
    // Number Wave
    waveRounds: 6,
    waveMixedOps: true,
    // Star Speed
    starTargetSize: 40,
    starLives: 3,
    starDuration: 30,
    // Story Branch
    storyChoices: 3,
    storySmartPath: true,
    // Simon
    simonStart: 5,
    simonSpeed: 450,
    // Map
    mapPieces: 9,
    mapFlip: true,
    mapCompass: true,
  },
};

// === Game State ===

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
  wheelSpun: boolean;
  scoreSubmitted: boolean;

  // Path system
  pathGraph: PathGraph;
  stepsUsed: number;
  availableNextIslands: IslandId[];

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
  setWheelSpun: () => void;
  setScoreSubmitted: (v: boolean) => void;
  resetGame: () => void;

  // Computed helpers
  isIslandCompleted: (island: IslandId) => boolean;
  getProgress: () => number;
  getDifficultyConfig: () => DifficultyConfig;
  getStepsRemaining: () => number;
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
      wheelSpun: false,
      scoreSubmitted: false,
      pathGraph: [],
      stepsUsed: 0,
      availableNextIslands: [],
      soundEnabled: true,

      setPlayerName: (name) => set({ playerName: name }),
      setDifficulty: (d) => set({ difficulty: d }),

      startAdventure: () => {
        // Generate a fresh random path and go to worldmap
        const graph = generatePathGraph();
        const start = getStartIsland(graph);
        const nextOptions = getNextIslands(graph, start);

        set({
          currentPage: "worldmap",
          pathGraph: graph,
          stepsUsed: 0,
          completedLevels: [],
          coins: 0,
          thrUnlocked: false,
          voucherCode: "",
          wheelSpun: false,
          scoreSubmitted: false,
          currentIsland: start,
          availableNextIslands: nextOptions,
        });
      },

      navigateToIsland: (island) => {
        set({ currentIsland: island, currentPage: "game" });
      },

      completeLevel: (island) => {
        const state = get();
        if (state.completedLevels.includes(island)) return;

        const config = DIFFICULTY_CONFIGS[state.difficulty];
        const earnedCoins = Math.round(COINS_PER_LEVEL * config.coinMultiplier);
        const newCompleted = [...state.completedLevels, island];
        const newSteps = state.stepsUsed + 1;
        const allDone = newSteps >= MAX_STEPS;

        if (allDone) {
          set({
            completedLevels: newCompleted,
            coins: Math.min(100, state.coins + earnedCoins),
            stepsUsed: newSteps,
            thrUnlocked: true,
            currentPage: "thr-reveal",
            currentIsland: null,
            availableNextIslands: [],
          });
        } else {
          // Find next options from this island
          const nextOptions = getNextIslands(state.pathGraph, island);
          set({
            completedLevels: newCompleted,
            coins: Math.min(100, state.coins + earnedCoins),
            stepsUsed: newSteps,
            currentPage: "worldmap",
            currentIsland: island, // stay on current for path display
            availableNextIslands: nextOptions,
          });
        }
      },

      addCoins: (amount) =>
        set((s) => ({ coins: Math.min(100, s.coins + amount) })),

      setPage: (page) => set({ currentPage: page }),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      unlockTHR: () =>
        set({
          thrUnlocked: true,
          voucherCode: generateVoucherCode(),
        }),

      setWheelSpun: () => set({ wheelSpun: true }),
      setScoreSubmitted: (v) => set({ scoreSubmitted: v }),

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
          wheelSpun: false,
          scoreSubmitted: false,
          pathGraph: [],
          stepsUsed: 0,
          availableNextIslands: [],
        }),

      isIslandCompleted: (island) => {
        return get().completedLevels.includes(island);
      },

      getProgress: () => {
        const state = get();
        return (state.stepsUsed / MAX_STEPS) * 100;
      },

      getDifficultyConfig: () => {
        return DIFFICULTY_CONFIGS[get().difficulty];
      },

      getStepsRemaining: () => {
        return MAX_STEPS - get().stepsUsed;
      },
    }),
    {
      name: "koinkancil-game",
    },
  ),
);

// Keep ISLANDS export for backward compatibility (used in some components)
export const ISLANDS = ALL_ISLANDS;
