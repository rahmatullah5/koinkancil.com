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

const SHAPES = ["🟥", "🟦", "🟨", "🟩", "🟪", "🟧"];

function generatePattern(
  shapeCount: number,
  patternLength: number,
): {
  sequence: string[];
  answer: string;
  options: string[];
} {
  const selectedShapes = [...SHAPES]
    .sort(() => Math.random() - 0.5)
    .slice(0, shapeCount);

  const sequence: string[] = [];
  for (let i = 0; i < patternLength; i++) {
    sequence.push(selectedShapes[i % selectedShapes.length]);
  }

  const answer = sequence[patternLength - 1];
  const displaySequence = [...sequence];
  displaySequence[patternLength - 1] = "❓";

  const wrongOptions = SHAPES.filter((s) => s !== answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);

  return { sequence: displaySequence, answer, options };
}

export function LogicPuzzle() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState(() =>
    generatePattern(config.logicShapeCount, config.logicPatternLength),
  );
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0); // for resetting

  const nextRound = useCallback(() => {
    if (round + 1 >= config.logicRounds) {
      setShowCompletion(true);
      soundManager.levelComplete();
    } else {
      setRound((r) => r + 1);
      setPattern(
        generatePattern(config.logicShapeCount, config.logicPatternLength),
      );
      setFeedback(null);
    }
  }, [round, config]);

  const handleChoice = (choice: string) => {
    if (feedback || showCompletion || timeUp) return;
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

  const handleRetry = () => {
    setRound(0);
    setPattern(
      generatePattern(config.logicShapeCount, config.logicPatternLength),
    );
    setFeedback(null);
    setTimeUp(false);
    setShowCompletion(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout title="🧠 Pulau Logika" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "600px", width: "100%" }}
      >
        {/* Timer + Progress */}
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
            {Array.from({ length: config.logicRounds }, (_, i) => (
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
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
