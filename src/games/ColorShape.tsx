/** @format */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameLayout,
  CompletionOverlay,
  GameTimer,
  TimeUpOverlay,
} from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

interface ShapeItem {
  id: number;
  emoji: string;
  name: string;
  color: string;
}

const ALL_SHAPES: ShapeItem[] = [
  { id: 0, emoji: "🎋", name: "Ketupat", color: "#4CAF50" },
  { id: 1, emoji: "🕌", name: "Masjid", color: "#2196F3" },
  { id: 2, emoji: "🌙", name: "Bulan", color: "#FFC107" },
  { id: 3, emoji: "⭐", name: "Bintang", color: "#FF9800" },
  { id: 4, emoji: "🏮", name: "Lentera", color: "#F44336" },
  { id: 5, emoji: "🎆", name: "Kembang Api", color: "#9C27B0" },
  { id: 6, emoji: "📿", name: "Tasbih", color: "#795548" },
  { id: 7, emoji: "☪️", name: "Sabit", color: "#607D8B" },
];

function generateRound(shadowCount: number): {
  target: ShapeItem;
  options: ShapeItem[];
  shadows: ShapeItem[];
} {
  const shuffled = [...ALL_SHAPES].sort(() => Math.random() - 0.5);
  const count = Math.min(shadowCount, ALL_SHAPES.length);
  const shadows = shuffled.slice(0, count);
  const target = shadows[Math.floor(Math.random() * shadows.length)];
  const options = [...shadows].sort(() => Math.random() - 0.5);

  return { target, options, shadows };
}

export function ColorShape() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [round, setRound] = useState(0);
  const [data, setData] = useState(() =>
    generateRound(config.colorShadowCount),
  );
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [selectedShadow, setSelectedShadow] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const handleShadowClick = (shape: ShapeItem) => {
    if (feedback || showCompletion || timeUp) return;
    setSelectedShadow(shape.id);

    if (shape.id === data.target.id) {
      setFeedback("correct");
      soundManager.correctAnswer();

      setTimeout(() => {
        if (round + 1 >= config.colorRounds) {
          setShowCompletion(true);
          soundManager.levelComplete();
        } else {
          setRound((r) => r + 1);
          setData(generateRound(config.colorShadowCount));
          setFeedback(null);
          setSelectedShadow(null);
        }
      }, 1000);
    } else {
      setFeedback("wrong");
      soundManager.wrongAnswer();
      setTimeout(() => {
        setFeedback(null);
        setSelectedShadow(null);
      }, 800);
    }
  };

  const handleRetry = () => {
    setRound(0);
    setData(generateRound(config.colorShadowCount));
    setFeedback(null);
    setSelectedShadow(null);
    setTimeUp(false);
    setShowCompletion(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout title="🎨 Pulau Warna" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
            {Array.from({ length: config.colorRounds }, (_, i) => (
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

        <h3 style={{ marginBottom: "8px", fontWeight: 800 }}>
          Temukan Bayangan! 👁️
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "24px",
            fontSize: "0.95rem",
          }}
        >
          Klik bayangan yang cocok dengan objek di bawah:
        </p>

        {/* Target object */}
        <motion.div
          key={round}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "20px 32px",
            border: "2px solid rgba(255,217,61,0.3)",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "3rem" }}>{data.target.emoji}</span>
          <span
            style={{
              marginTop: "8px",
              fontWeight: 700,
              color: "var(--color-accent)",
              fontSize: "1.1rem",
            }}
          >
            {data.target.name}
          </span>
        </motion.div>

        {/* Shadow options */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {data.shadows.map((shape, i) => (
            <motion.button
              key={`${round}-${shape.id}`}
              onClick={() => handleShadowClick(shape)}
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background:
                  selectedShadow === shape.id && feedback === "correct"
                    ? "rgba(107,203,119,0.2)"
                    : selectedShadow === shape.id && feedback === "wrong"
                      ? "rgba(255,107,107,0.2)"
                      : "rgba(255,255,255,0.05)",
                border:
                  selectedShadow === shape.id && feedback === "correct"
                    ? "2px solid var(--color-success)"
                    : selectedShadow === shape.id && feedback === "wrong"
                      ? "2px solid var(--color-danger)"
                      : "2px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                filter: "brightness(0.3) contrast(2)",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.3s, background 0.3s",
              }}
            >
              {shape.emoji}
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
              {feedback === "correct"
                ? "✨ Cocok! Keren!"
                : "🤔 Bukan itu, coba lagi!"}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("warna")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
