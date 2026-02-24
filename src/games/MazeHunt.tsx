/** @format */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameLayout,
  CompletionOverlay,
  GameTimer,
  TimeUpOverlay,
} from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

// Maze cell types
const WALL = 1;
const PATH = 0;
const COIN = 2;
const EXIT = 3;
const PLAYER = 4;

type Cell =
  | typeof WALL
  | typeof PATH
  | typeof COIN
  | typeof EXIT
  | typeof PLAYER;

function generateMaze(size: number): {
  grid: Cell[][];
  start: [number, number];
  end: [number, number];
} {
  // Create grid filled with walls
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array(size).fill(WALL),
  );

  // Recursive backtracker maze generation
  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  function carve(r: number, c: number) {
    visited.add(key(r, c));
    grid[r][c] = PATH;

    const dirs = [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ].sort(() => Math.random() - 0.5);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        !visited.has(key(nr, nc))
      ) {
        grid[r + dr / 2][c + dc / 2] = PATH;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);

  // Place coins on random path cells
  const pathCells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === PATH && !(r === 1 && c === 1)) {
        pathCells.push([r, c]);
      }
    }
  }

  const shuffled = pathCells.sort(() => Math.random() - 0.5);
  const coinCount = Math.min(5, shuffled.length);
  for (let i = 0; i < coinCount; i++) {
    grid[shuffled[i][0]][shuffled[i][1]] = COIN;
  }

  // Set exit
  const exitPos = shuffled[coinCount] || [size - 2, size - 2];
  grid[exitPos[0]][exitPos[1]] = EXIT;

  return { grid, start: [1, 1], end: exitPos as [number, number] };
}

export function MazeHunt() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [maze, setMaze] = useState(() => generateMaze(config.mazeSize));
  const [playerPos, setPlayerPos] = useState<[number, number]>(maze.start);
  const [movesLeft, setMovesLeft] = useState(config.mazeMoves);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const totalCoins = maze.grid.flat().filter((c) => c === COIN).length;

  const move = useCallback(
    (dr: number, dc: number) => {
      if (showCompletion || timeUp || movesLeft <= 0) return;
      const [r, c] = playerPos;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= config.mazeSize || nc < 0 || nc >= config.mazeSize)
        return;
      if (maze.grid[nr][nc] === WALL) return;

      const cell = maze.grid[nr][nc];
      if (cell === COIN) {
        maze.grid[nr][nc] = PATH;
        setCoinsCollected((p) => p + 1);
        soundManager.correctAnswer();
      }

      setPlayerPos([nr, nc]);
      setMovesLeft((m) => m - 1);

      if (cell === EXIT) {
        setShowCompletion(true);
        soundManager.levelComplete();
      }
    },
    [playerPos, movesLeft, showCompletion, timeUp, maze, config.mazeSize],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          move(-1, 0);
          break;
        case "ArrowDown":
        case "s":
          move(1, 0);
          break;
        case "ArrowLeft":
        case "a":
          move(0, -1);
          break;
        case "ArrowRight":
        case "d":
          move(0, 1);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const handleRetry = () => {
    const newMaze = generateMaze(config.mazeSize);
    setMaze(newMaze);
    setPlayerPos(newMaze.start);
    setMovesLeft(config.mazeMoves);
    setCoinsCollected(0);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  const cellSize = Math.min(28, Math.floor(300 / config.mazeSize));

  return (
    <GameLayout
      title="🌋 Pulau Labirin Harta"
      onBack={() => setPage("worldmap")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "600px", width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "24px",
            marginBottom: "16px",
          }}
        >
          <GameTimer
            key={key}
            seconds={config.timerSeconds}
            onTimeUp={() => setTimeUp(true)}
            paused={showCompletion || timeUp}
          />
          <span
            style={{
              color: "var(--color-text-secondary)",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            🪙 {coinsCollected}/{totalCoins}
          </span>
          <span
            style={{
              color:
                movesLeft <= 5
                  ? "var(--color-danger)"
                  : "var(--color-text-secondary)",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            👣 {movesLeft} langkah
          </span>
        </div>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          Arahkan Kancil 🦌 ke pintu keluar 🚪! Kumpulkan koin 🪙 di jalan!
        </p>

        {/* Maze grid */}
        <div
          style={{
            display: "inline-grid",
            gridTemplateColumns: `repeat(${config.mazeSize}, ${cellSize}px)`,
            gap: "1px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "8px",
            margin: "0 auto",
          }}
        >
          {maze.grid.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = r === playerPos[0] && c === playerPos[1];
              const isVisible =
                !config.mazeFog ||
                (Math.abs(r - playerPos[0]) <= 2 &&
                  Math.abs(c - playerPos[1]) <= 2);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => {
                    const dr = r - playerPos[0];
                    const dc = c - playerPos[1];
                    if (Math.abs(dr) + Math.abs(dc) === 1) move(dr, dc);
                  }}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: "3px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: `${cellSize * 0.6}px`,
                    background: !isVisible
                      ? "rgba(0,0,0,0.8)"
                      : isPlayer
                        ? "rgba(108,99,255,0.4)"
                        : cell === WALL
                          ? "rgba(255,255,255,0.12)"
                          : cell === EXIT
                            ? "rgba(107,203,119,0.3)"
                            : cell === COIN
                              ? "rgba(255,217,61,0.15)"
                              : "rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {isVisible &&
                    (isPlayer
                      ? "🦌"
                      : cell === COIN
                        ? "🪙"
                        : cell === EXIT
                          ? "🚪"
                          : "")}
                </div>
              );
            }),
          )}
        </div>

        {/* Mobile controls */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => move(-1, 0)}
            style={{
              width: "50px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            ↑
          </motion.button>
          <div style={{ display: "flex", gap: "4px" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => move(0, -1)}
              style={{
                width: "50px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              ←
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => move(1, 0)}
              style={{
                width: "50px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              ↓
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => move(0, 1)}
              style={{
                width: "50px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              →
            </motion.button>
          </div>
        </div>

        {movesLeft <= 0 && !showCompletion && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: "16px",
                color: "var(--color-danger)",
                fontWeight: 700,
              }}
            >
              Langkah habis! 😢
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("labirin")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
