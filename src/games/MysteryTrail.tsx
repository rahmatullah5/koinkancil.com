/** @format */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameLayout,
  CompletionOverlay,
  GameTimer,
  TimeUpOverlay,
} from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

const DIRECTIONS = [
  { emoji: "⬆️", label: "Atas", dr: -1, dc: 0 },
  { emoji: "➡️", label: "Kanan", dr: 0, dc: 1 },
  { emoji: "⬇️", label: "Bawah", dr: 1, dc: 0 },
  { emoji: "⬅️", label: "Kiri", dr: 0, dc: -1 },
];

function generateTrail(
  length: number,
  reverse: boolean,
): { sequence: number[]; answer: number } {
  // Generate a pattern of direction indices
  const patternLen = 2 + Math.floor(Math.random() * 2); // 2-3 repeating unit
  const pattern: number[] = [];
  for (let i = 0; i < patternLen; i++) {
    pattern.push(Math.floor(Math.random() * 4));
  }

  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(pattern[i % patternLen]);
  }

  // The answer is the next in the pattern
  let answer = pattern[length % patternLen];

  // Reverse mode: answer is what would come BEFORE
  if (reverse) {
    answer = pattern[(length - 1) % patternLen];
    // Show the sequence in reverse
    sequence.reverse();
  }

  return { sequence, answer };
}

export function MysteryTrail() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [round, setRound] = useState(0);
  const [trail, setTrail] = useState(() =>
    generateTrail(5, config.trailReverse),
  );
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const handleChoice = useCallback(
    (dirIdx: number) => {
      if (feedback || showCompletion || timeUp) return;
      if (dirIdx === trail.answer) {
        setFeedback("correct");
        soundManager.correctAnswer();
        setTimeout(() => {
          if (round + 1 >= config.trailRounds) {
            setShowCompletion(true);
            soundManager.levelComplete();
          } else {
            setRound((r) => r + 1);
            setTrail(generateTrail(5 + round, config.trailReverse));
            setFeedback(null);
          }
        }, 1000);
      } else {
        setFeedback("wrong");
        soundManager.wrongAnswer();
        setTimeout(() => setFeedback(null), 800);
      }
    },
    [feedback, showCompletion, timeUp, trail, round, config],
  );

  const handleRetry = () => {
    setRound(0);
    setTrail(generateTrail(5, config.trailReverse));
    setFeedback(null);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout
      title="🐾 Pulau Jejak Misteri"
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
          <div style={{ display: "flex", gap: "8px" }}>
            {Array.from({ length: config.trailRounds }, (_, i) => (
              <div
                key={i}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background:
                    i < round
                      ? "var(--color-success)"
                      : i === round
                        ? "var(--color-accent)"
                        : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        <h3
          style={{ marginBottom: "8px", fontWeight: 800, fontSize: "1.2rem" }}
        >
          {config.trailReverse
            ? "🔄 Ke mana jejak sebelumnya?"
            : "🐾 Ke mana jejak selanjutnya?"}
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "20px",
            fontSize: "0.85rem",
          }}
        >
          Temukan pola dari jejak kaki!
        </p>

        {/* Trail display */}
        <motion.div
          key={round}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {trail.sequence.map((dirIdx, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              style={{
                fontSize: "1.8rem",
                width: "50px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {DIRECTIONS[dirIdx].emoji}
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              delay: trail.sequence.length * 0.1,
              duration: 1.5,
              repeat: Infinity,
            }}
            style={{
              fontSize: "1.8rem",
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,217,61,0.15)",
              borderRadius: "12px",
              border: "2px dashed var(--color-accent)",
            }}
          >
            ❓
          </motion.div>
        </motion.div>

        {/* Direction choices */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {DIRECTIONS.map((dir, i) => (
            <motion.button
              key={i}
              onClick={() => handleChoice(i)}
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.08)",
                border: "2px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                outline: "none",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{dir.emoji}</span>
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--color-text-secondary)",
                  fontWeight: 700,
                }}
              >
                {dir.label}
              </span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: "16px",
                fontSize: "1.1rem",
                fontWeight: 700,
                color:
                  feedback === "correct"
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            >
              {feedback === "correct"
                ? "✅ Benar! Kamu jeli!"
                : "❌ Bukan, perhatikan polanya!"}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("jejak")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
