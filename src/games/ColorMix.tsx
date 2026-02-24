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

interface ColorDef {
  name: string;
  hex: string;
  emoji: string;
}
interface MixRule {
  a: string;
  b: string;
  result: string;
}

const COLORS: ColorDef[] = [
  { name: "Merah", hex: "#FF4444", emoji: "🔴" },
  { name: "Biru", hex: "#4488FF", emoji: "🔵" },
  { name: "Kuning", hex: "#FFD700", emoji: "🟡" },
  { name: "Hijau", hex: "#44BB44", emoji: "🟢" },
  { name: "Oranye", hex: "#FF8800", emoji: "🟠" },
  { name: "Ungu", hex: "#9944FF", emoji: "🟣" },
];

const MIX_RULES: MixRule[] = [
  { a: "Merah", b: "Kuning", result: "Oranye" },
  { a: "Merah", b: "Biru", result: "Ungu" },
  { a: "Biru", b: "Kuning", result: "Hijau" },
  { a: "Kuning", b: "Merah", result: "Oranye" },
  { a: "Biru", b: "Merah", result: "Ungu" },
  { a: "Kuning", b: "Biru", result: "Hijau" },
];

function getColor(name: string): ColorDef {
  return COLORS.find((c) => c.name === name) || COLORS[0];
}

function generateRound(numColors: number): {
  target: ColorDef;
  available: ColorDef[];
  rule: MixRule;
} {
  const validRules = MIX_RULES.filter(() => true);
  const rule = validRules[Math.floor(Math.random() * validRules.length)];
  const target = getColor(rule.result);
  const needed = [getColor(rule.a), getColor(rule.b)];
  const extras = COLORS.filter(
    (c) => c.name !== rule.a && c.name !== rule.b && c.name !== rule.result,
  )
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(0, numColors - 2));
  const available = [...needed, ...extras].sort(() => Math.random() - 0.5);
  return { target, available, rule };
}

export function ColorMix() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(() =>
    generateRound(config.colorMixColors + 1),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const handleSelect = useCallback(
    (colorName: string) => {
      if (feedback || showCompletion || timeUp) return;
      if (selected.includes(colorName)) {
        setSelected(selected.filter((s) => s !== colorName));
        return;
      }

      const newSelected = [...selected, colorName];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        // Check if mix is correct
        const match = MIX_RULES.find(
          (r) =>
            ((r.a === newSelected[0] && r.b === newSelected[1]) ||
              (r.a === newSelected[1] && r.b === newSelected[0])) &&
            r.result === puzzle.target.name,
        );

        if (match) {
          setFeedback("correct");
          soundManager.correctAnswer();
          setTimeout(() => {
            if (round + 1 >= config.colorMixRounds) {
              setShowCompletion(true);
              soundManager.levelComplete();
            } else {
              setRound((r) => r + 1);
              setPuzzle(generateRound(config.colorMixColors + 1));
              setSelected([]);
              setFeedback(null);
            }
          }, 1000);
        } else {
          setFeedback("wrong");
          soundManager.wrongAnswer();
          setTimeout(() => {
            setSelected([]);
            setFeedback(null);
          }, 800);
        }
      }
    },
    [selected, feedback, showCompletion, timeUp, puzzle, round, config],
  );

  const handleRetry = () => {
    setRound(0);
    setPuzzle(generateRound(config.colorMixColors + 1));
    setSelected([]);
    setFeedback(null);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout
      title="🧪 Pulau Eksperimen Warna"
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
            {Array.from({ length: config.colorMixRounds }, (_, i) => (
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
          Buat Warna Ini!
        </h3>

        {/* Target color */}
        <motion.div
          key={round}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "16px",
            padding: "16px 28px",
            marginBottom: "24px",
            border: `2px solid ${puzzle.target.hex}44`,
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: puzzle.target.hex,
              boxShadow: `0 0 20px ${puzzle.target.hex}44`,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.2rem",
              color: puzzle.target.hex,
            }}
          >
            {puzzle.target.name}
          </span>
        </motion.div>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "20px",
            fontSize: "0.85rem",
          }}
        >
          Pilih 2 warna untuk dicampur! 🎨
        </p>

        {/* Color options */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {puzzle.available.map((color) => {
            const isSelected = selected.includes(color.name);
            return (
              <motion.button
                key={color.name}
                onClick={() => handleSelect(color.name)}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.9 }}
                animate={isSelected ? { y: -8 } : { y: 0 }}
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: color.hex,
                  border: isSelected
                    ? "4px solid white"
                    : "4px solid transparent",
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? `0 0 25px ${color.hex}88`
                    : `0 4px 12px ${color.hex}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  outline: "none",
                }}
              >
                {color.emoji}
              </motion.button>
            );
          })}
        </div>

        {/* Mix preview */}
        {selected.length === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: getColor(selected[0]).hex,
              }}
            />
            <span
              style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}
            >
              +
            </span>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: getColor(selected[1]).hex,
              }}
            />
            <span
              style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}
            >
              =
            </span>
            <span style={{ fontSize: "1.2rem" }}>❓</span>
          </motion.div>
        )}

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
                ? "✅ Campuran sempurna!"
                : "❌ Hmm, bukan itu!"}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("eksperimen")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
