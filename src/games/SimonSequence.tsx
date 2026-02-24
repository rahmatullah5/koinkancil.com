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

const SIMON_COLORS = [
  { color: "#FF4444", label: "Merah", activeColor: "#FF8888" },
  { color: "#4488FF", label: "Biru", activeColor: "#88BBFF" },
  { color: "#44BB44", label: "Hijau", activeColor: "#88DD88" },
  { color: "#FFD700", label: "Kuning", activeColor: "#FFEE88" },
];

export function SimonSequence() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const MAX_ROUNDS = 5;

  // Generate initial sequence
  useEffect(() => {
    startNewSequence(config.simonStart);
  }, []);

  const startNewSequence = (length: number) => {
    const seq: number[] = [];
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * 4));
    }
    setSequence(seq);
    setPlayerInput([]);
    playSequence(seq);
  };

  const playSequence = useCallback(
    async (seq: number[]) => {
      setIsPlaying(true);
      setActiveButton(null);

      // Small delay before playing
      await new Promise((r) => setTimeout(r, 500));

      for (let i = 0; i < seq.length; i++) {
        setActiveButton(seq[i]);
        await new Promise((r) => setTimeout(r, config.simonSpeed));
        setActiveButton(null);
        await new Promise((r) => setTimeout(r, 200));
      }

      setIsPlaying(false);
    },
    [config.simonSpeed],
  );

  const handleButtonPress = useCallback(
    (idx: number) => {
      if (isPlaying || showCompletion || timeUp || feedback) return;

      setActiveButton(idx);
      setTimeout(() => setActiveButton(null), 200);

      const newInput = [...playerInput, idx];
      setPlayerInput(newInput);

      // Check each step
      if (newInput[newInput.length - 1] !== sequence[newInput.length - 1]) {
        // Wrong!
        setFeedback("wrong");
        soundManager.wrongAnswer();
        setTimeout(() => {
          setFeedback(null);
          setPlayerInput([]);
          playSequence(sequence); // Replay
        }, 1000);
        return;
      }

      soundManager.correctAnswer();

      // Check if sequence complete
      if (newInput.length === sequence.length) {
        setFeedback("correct");
        setTimeout(() => {
          setFeedback(null);
          if (round + 1 >= MAX_ROUNDS) {
            setShowCompletion(true);
            soundManager.levelComplete();
          } else {
            // Add one more to sequence
            const newSeq = [...sequence, Math.floor(Math.random() * 4)];
            setSequence(newSeq);
            setPlayerInput([]);
            setRound((r) => r + 1);
            playSequence(newSeq);
          }
        }, 800);
      }
    },
    [
      isPlaying,
      showCompletion,
      timeUp,
      feedback,
      playerInput,
      sequence,
      round,
      playSequence,
    ],
  );

  const handleRetry = () => {
    setRound(0);
    setFeedback(null);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
    startNewSequence(config.simonStart);
  };

  return (
    <GameLayout
      title="💡 Pulau Ingat Urutan"
      onBack={() => setPage("worldmap")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "400px", width: "100%" }}
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
            {Array.from({ length: MAX_ROUNDS }, (_, i) => (
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
          {isPlaying ? "👀 Perhatikan!" : "🎯 Ulangi urutannya!"}
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "20px",
            fontSize: "0.85rem",
          }}
        >
          Urutan: {sequence.length} warna | Progress: {playerInput.length}/
          {sequence.length}
        </p>

        {/* Simon buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            maxWidth: "280px",
            margin: "0 auto",
          }}
        >
          {SIMON_COLORS.map((btn, i) => (
            <motion.button
              key={i}
              onClick={() => handleButtonPress(i)}
              whileHover={!isPlaying ? { scale: 1.05 } : {}}
              whileTap={!isPlaying ? { scale: 0.95 } : {}}
              animate={
                activeButton === i
                  ? { scale: 1.1, boxShadow: `0 0 40px ${btn.activeColor}` }
                  : { scale: 1, boxShadow: `0 4px 12px ${btn.color}33` }
              }
              style={{
                width: "100%",
                height: "120px",
                borderRadius: "20px",
                background: activeButton === i ? btn.activeColor : btn.color,
                border: "none",
                cursor: isPlaying ? "default" : "pointer",
                outline: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "rgba(0,0,0,0.5)",
                fontFamily: "Nunito, sans-serif",
                transition: "background 0.15s",
                opacity: isPlaying && activeButton !== i ? 0.5 : 1,
              }}
            >
              {btn.label}
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
                ? "✅ Benar! Level naik!"
                : "❌ Salah urutan! Diulang..."}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("urutan")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
