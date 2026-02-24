/** @format */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameLayout, CompletionOverlay } from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

const SHAPES = ["🟥", "🟦", "🟨", "🟩", "🟪", "🟧"];
const PATTERNS_COUNT = 3; // number of rounds to complete

function generatePattern(): {
  sequence: string[];
  answer: string;
  options: string[];
} {
  // Pick 2-3 shapes for the pattern
  const numShapes = 2 + Math.floor(Math.random() * 2);
  const selectedShapes = [...SHAPES]
    .sort(() => Math.random() - 0.5)
    .slice(0, numShapes);

  // Create a repeating pattern
  const patternLength = 6;
  const sequence: string[] = [];
  for (let i = 0; i < patternLength; i++) {
    sequence.push(selectedShapes[i % selectedShapes.length]);
  }

  // The answer is the last element
  const answer = sequence[patternLength - 1];
  // Replace last element with ❓
  const displaySequence = [...sequence];
  displaySequence[patternLength - 1] = "❓";

  // Create options (answer + 2-3 wrong ones)
  const wrongOptions = SHAPES.filter((s) => s !== answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);

  return { sequence: displaySequence, answer, options };
}

export function LogicPuzzle() {
  const { setPage, completeLevel } = useGameStore();
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState(generatePattern);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const nextRound = useCallback(() => {
    if (round + 1 >= PATTERNS_COUNT) {
      setShowCompletion(true);
      soundManager.levelComplete();
    } else {
      setRound((r) => r + 1);
      setPattern(generatePattern());
      setFeedback(null);
    }
  }, [round]);

  const handleChoice = (choice: string) => {
    if (feedback) return;
    if (choice === pattern.answer) {
      setFeedback("correct");
      soundManager.correctAnswer();
      setTimeout(nextRound, 1000);
    } else {
      setFeedback("wrong");
      soundManager.wrongAnswer();
      setTimeout(() => setFeedback(null), 800);
    }
  };

  return (
    <GameLayout title="🧠 Pulau Logika" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          {Array.from({ length: PATTERNS_COUNT }, (_, i) => (
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
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        <h3
          style={{ marginBottom: "8px", fontWeight: 800, fontSize: "1.3rem" }}
        >
          Temukan Polanya! 🔍
        </h3>
        <p
          style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}
        >
          Apa yang seharusnya menggantikan ❓?
        </p>

        {/* Pattern display */}
        <motion.div
          key={round}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}
        >
          {pattern.sequence.map((shape, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              style={{
                fontSize: "2.5rem",
                width: "60px",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  shape === "❓"
                    ? "rgba(255,217,61,0.15)"
                    : "rgba(255,255,255,0.05)",
                borderRadius: "16px",
                border:
                  shape === "❓"
                    ? "2px dashed var(--color-accent)"
                    : "2px solid rgba(255,255,255,0.1)",
              }}
            >
              {shape}
            </motion.div>
          ))}
        </motion.div>

        {/* Options */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {pattern.options.map((option, i) => (
            <motion.button
              key={`${round}-${i}`}
              onClick={() => handleChoice(option)}
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.9 }}
              animate={feedback === "wrong" ? { x: [0, -3, 3, -3, 0] } : {}}
              style={{
                fontSize: "2rem",
                width: "70px",
                height: "70px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "18px",
                border: "2px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
                outline: "none",
              }}
            >
              {option}
            </motion.button>
          ))}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: "20px",
                fontSize: "1.2rem",
                fontWeight: 700,
                color:
                  feedback === "correct"
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            >
              {feedback === "correct" ? "✅ Benar! Hebat!" : "❌ Coba lagi!"}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("logika")}
      />
    </GameLayout>
  );
}
