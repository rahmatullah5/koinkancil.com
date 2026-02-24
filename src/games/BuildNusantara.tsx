/** @format */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GameLayout,
  CompletionOverlay,
  GameTimer,
  TimeUpOverlay,
} from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

interface Piece {
  id: number;
  shape: boolean[][];
  placed: boolean;
}
interface Blueprint {
  grid: boolean[][];
  name: string;
  emoji: string;
}

const BLUEPRINTS: Blueprint[] = [
  {
    name: "Rumah Gadang",
    emoji: "🏠",
    grid: [
      [false, true, false],
      [true, true, true],
      [true, true, true],
    ],
  },
  {
    name: "Joglo",
    emoji: "🏛️",
    grid: [
      [true, true, true],
      [false, true, false],
      [true, true, true],
    ],
  },
  {
    name: "Rumah Toraja",
    emoji: "⛩️",
    grid: [
      [false, true, false],
      [true, true, true],
      [true, false, true],
    ],
  },
  {
    name: "Masjid",
    emoji: "🕌",
    grid: [
      [false, true, false],
      [true, true, true],
      [true, true, true],
      [false, true, false],
    ],
  },
];

function generatePieces(blueprint: Blueprint, count: number): Piece[] {
  // Simple: create pieces that together form the blueprint
  // Each piece is a small shape (1-3 cells)
  const cells: [number, number][] = [];
  blueprint.grid.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) cells.push([r, c]);
    }),
  );

  const shuffled = cells.sort(() => Math.random() - 0.5);
  const pieces: Piece[] = [];
  const perPiece = Math.max(1, Math.floor(cells.length / count));

  for (let i = 0; i < count; i++) {
    const start = i * perPiece;
    const end = i === count - 1 ? cells.length : start + perPiece;
    const pieceCells = shuffled.slice(start, end);
    if (pieceCells.length === 0) continue;

    const minR = Math.min(...pieceCells.map(([r]) => r));
    const minC = Math.min(...pieceCells.map(([, c]) => c));
    const maxR = Math.max(...pieceCells.map(([r]) => r));
    const maxC = Math.max(...pieceCells.map(([, c]) => c));

    const shape: boolean[][] = Array.from({ length: maxR - minR + 1 }, () =>
      Array(maxC - minC + 1).fill(false),
    );
    pieceCells.forEach(([r, c]) => {
      shape[r - minR][c - minC] = true;
    });

    pieces.push({ id: i, shape, placed: false });
  }

  return pieces;
}

const PIECE_COLORS = [
  "#FF6B6B",
  "#6C63FF",
  "#FFD93D",
  "#6BCB77",
  "#FF9100",
  "#E91E63",
  "#4FC3F7",
  "#AB47BC",
  "#FF5722",
];

export function BuildNusantara() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [blueprint] = useState(
    () => BLUEPRINTS[Math.floor(Math.random() * BLUEPRINTS.length)],
  );
  const [pieces, setPieces] = useState(() =>
    generatePieces(blueprint, config.buildPieces),
  );
  const [placedCount, setPlacedCount] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const handlePlacePiece = useCallback(
    (pieceId: number) => {
      if (showCompletion || timeUp) return;
      const newPieces = pieces.map((p) =>
        p.id === pieceId ? { ...p, placed: true } : p,
      );
      setPieces(newPieces);
      const newCount = placedCount + 1;
      setPlacedCount(newCount);

      soundManager.correctAnswer();

      if (newCount >= pieces.length) {
        setShowCompletion(true);
        soundManager.levelComplete();
      }
    },
    [pieces, placedCount, showCompletion, timeUp],
  );

  const handleRetry = () => {
    const bp = BLUEPRINTS[Math.floor(Math.random() * BLUEPRINTS.length)];
    setPieces(generatePieces(bp, config.buildPieces));
    setPlacedCount(0);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout
      title="🏗️ Pulau Bangun Nusantara"
      onBack={() => setPage("worldmap")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "600px", width: "100%" }}
      >
        {config.buildTimer && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <GameTimer
              key={key}
              seconds={config.timerSeconds}
              onTimeUp={() => setTimeUp(true)}
              paused={showCompletion || timeUp}
            />
          </div>
        )}

        <h3
          style={{ marginBottom: "8px", fontWeight: 800, fontSize: "1.2rem" }}
        >
          {blueprint.emoji} Bangun {blueprint.name}!
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "20px",
            fontSize: "0.85rem",
          }}
        >
          Ketuk potongan untuk memasangnya! ({placedCount}/{pieces.length})
        </p>

        {/* Blueprint preview */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "inline-grid",
              gridTemplateColumns: `repeat(${blueprint.grid[0].length}, 40px)`,
              gap: "3px",
            }}
          >
            {blueprint.grid.map((row, r) =>
              row.map((cell, c) => (
                <motion.div
                  key={`${r}-${c}`}
                  animate={
                    cell && placedCount > 0 ? { opacity: [0.4, 0.8, 0.4] } : {}
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: (r + c) * 0.1,
                  }}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "6px",
                    background: cell
                      ? placedCount >= pieces.length
                        ? "rgba(107,203,119,0.4)"
                        : "rgba(255,217,61,0.15)"
                      : "transparent",
                    border: cell
                      ? "2px dashed rgba(255,217,61,0.4)"
                      : "2px solid transparent",
                  }}
                />
              )),
            )}
          </div>
        </div>

        {/* Pieces */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {pieces.map((piece, idx) => (
            <motion.button
              key={piece.id}
              onClick={() => !piece.placed && handlePlacePiece(piece.id)}
              whileHover={!piece.placed ? { scale: 1.1, y: -4 } : {}}
              whileTap={!piece.placed ? { scale: 0.9 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: piece.placed ? 0.3 : 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              disabled={piece.placed}
              style={{
                display: "inline-grid",
                gridTemplateColumns: `repeat(${piece.shape[0]?.length || 1}, 20px)`,
                gap: "2px",
                padding: "8px",
                borderRadius: "12px",
                background: piece.placed
                  ? "rgba(107,203,119,0.1)"
                  : `${PIECE_COLORS[idx % PIECE_COLORS.length]}15`,
                border: piece.placed
                  ? "2px solid var(--color-success)"
                  : `2px solid ${PIECE_COLORS[idx % PIECE_COLORS.length]}44`,
                cursor: piece.placed ? "default" : "pointer",
                outline: "none",
              }}
            >
              {piece.shape.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "3px",
                      background: cell
                        ? PIECE_COLORS[idx % PIECE_COLORS.length]
                        : "transparent",
                    }}
                  />
                )),
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("bangun")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
