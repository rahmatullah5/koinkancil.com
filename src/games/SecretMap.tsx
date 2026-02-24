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

interface MapPiece {
  id: number;
  emoji: string;
  rotation: number; // 0, 90, 180, 270
  flipped: boolean;
  targetRotation: number;
  targetFlipped: boolean;
  isCorrect: boolean;
}

const MAP_EMOJIS = ["🏔️", "🌳", "🏠", "🌊", "🏝️", "🗻", "🌸", "⛩️", "🕌"];

function generatePuzzle(numPieces: number, allowFlip: boolean): MapPiece[] {
  const shuffled = [...MAP_EMOJIS].sort(() => Math.random() - 0.5);
  const pieces: MapPiece[] = [];
  const rotations = [0, 90, 180, 270];

  for (let i = 0; i < numPieces; i++) {
    const targetRot = 0; // Target is always upright
    const currentRot = rotations[Math.floor(Math.random() * rotations.length)];
    const flipped = allowFlip && Math.random() > 0.5;

    pieces.push({
      id: i,
      emoji: shuffled[i % shuffled.length],
      rotation: currentRot,
      flipped: flipped,
      targetRotation: targetRot,
      targetFlipped: false,
      isCorrect: currentRot === targetRot && (!flipped || !allowFlip),
    });
  }

  // Ensure at least one piece needs fixing
  if (pieces.every((p) => p.isCorrect)) {
    pieces[0].rotation = 90;
    pieces[0].isCorrect = false;
  }

  return pieces;
}

export function SecretMap() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [pieces, setPieces] = useState(() =>
    generatePuzzle(config.mapPieces, config.mapFlip),
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const checkComplete = useCallback(
    (updatedPieces: MapPiece[]) => {
      if (updatedPieces.every((p) => p.isCorrect) && !showCompletion) {
        setTimeout(() => {
          setShowCompletion(true);
          soundManager.levelComplete();
        }, 300);
      }
    },
    [showCompletion],
  );

  const handleRotate = useCallback(
    (pieceId: number) => {
      if (showCompletion || timeUp) return;
      soundManager.buttonClick();
      setPieces((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== pieceId) return p;
          const newRot = (p.rotation + 90) % 360;
          const isCorrect =
            newRot === p.targetRotation && (!p.flipped || !config.mapFlip);
          return { ...p, rotation: newRot, isCorrect };
        });
        checkComplete(updated);
        return updated;
      });
    },
    [showCompletion, timeUp, config.mapFlip, checkComplete],
  );

  const handleFlip = useCallback(
    (pieceId: number) => {
      if (showCompletion || timeUp || !config.mapFlip) return;
      soundManager.buttonClick();
      setPieces((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== pieceId) return p;
          const newFlipped = !p.flipped;
          const isCorrect = p.rotation === p.targetRotation && !newFlipped;
          return { ...p, flipped: newFlipped, isCorrect };
        });
        checkComplete(updated);
        return updated;
      });
    },
    [showCompletion, timeUp, config.mapFlip, checkComplete],
  );

  const handleRetry = () => {
    setPieces(generatePuzzle(config.mapPieces, config.mapFlip));
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  const cols = Math.ceil(Math.sqrt(config.mapPieces));
  const completedCount = pieces.filter((p) => p.isCorrect).length;

  return (
    <GameLayout
      title="🧭 Pulau Peta Rahasia"
      onBack={() => setPage("worldmap")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "500px", width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "24px",
            marginBottom: "20px",
          }}
        >
          <GameTimer
            key={key}
            seconds={config.timerSeconds}
            onTimeUp={() => setTimeUp(true)}
            paused={showCompletion || timeUp}
          />
          <span
            style={{ color: "var(--color-text-secondary)", fontWeight: 700 }}
          >
            🧩 {completedCount}/{pieces.length}
          </span>
        </div>

        <h3
          style={{ marginBottom: "8px", fontWeight: 800, fontSize: "1.2rem" }}
        >
          Susun Peta! 🗺️
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "20px",
            fontSize: "0.85rem",
          }}
        >
          Putar setiap potongan ke posisi yang benar!
          {config.mapFlip && " Ketuk 2x untuk membalik!"}
        </p>

        {/* Compass reference */}
        {config.mapCompass && (
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>🧭</span>
            </div>
          </div>
        )}

        {/* Map grid */}
        <div
          style={{
            display: "inline-grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "8px",
            margin: "0 auto",
          }}
        >
          {pieces.map((piece) => (
            <motion.button
              key={piece.id}
              onClick={() => handleRotate(piece.id)}
              onDoubleClick={() => handleFlip(piece.id)}
              animate={{
                rotate: piece.rotation,
                scaleX: piece.flipped ? -1 : 1,
              }}
              whileHover={{ scale: piece.isCorrect ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200 }}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "14px",
                background: piece.isCorrect
                  ? "rgba(107,203,119,0.2)"
                  : "rgba(255,255,255,0.05)",
                border: piece.isCorrect
                  ? "2px solid var(--color-success)"
                  : "2px solid rgba(255,255,255,0.15)",
                cursor: piece.isCorrect ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
                fontFamily: "Nunito, sans-serif",
                transition: "border-color 0.3s, background 0.3s",
              }}
            >
              <span style={{ fontSize: "2rem" }}>{piece.emoji}</span>
              {piece.isCorrect && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    fontSize: "0.7rem",
                    position: "absolute",
                    bottom: "4px",
                  }}
                >
                  ✅
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginTop: "16px",
            fontSize: "0.75rem",
            opacity: 0.6,
          }}
        >
          Ketuk = Putar 90° {config.mapFlip && "| Ketuk 2x = Balik"}
        </p>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("peta")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
