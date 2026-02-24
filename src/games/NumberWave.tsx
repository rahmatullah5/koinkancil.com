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

function generateSequence(mixedOps: boolean): {
  numbers: number[];
  answer: number;
  options: number[];
} {
  if (!mixedOps) {
    // Simple arithmetic sequence
    const ops = [
      { gen: (s: number, d: number, i: number) => s + d * i, name: "+" },
      {
        gen: (s: number, d: number, i: number) => s * Math.pow(d, i),
        name: "×",
      },
    ];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const start = 1 + Math.floor(Math.random() * 10);
    const diff = 2 + Math.floor(Math.random() * 5);

    const len = 5;
    const numbers: number[] = [];
    for (let i = 0; i < len; i++) {
      if (op.name === "+") numbers.push(start + diff * i);
      else numbers.push(start * Math.pow(2, i));
    }
    const answer =
      op.name === "+" ? start + diff * len : start * Math.pow(2, len);
    const wrong = [answer + diff, answer - diff, answer + 1].filter(
      (w) => w !== answer && w > 0,
    );
    const options = [answer, ...wrong.slice(0, 2)].sort(
      () => Math.random() - 0.5,
    );
    return { numbers, answer, options };
  } else {
    // Mixed operations pattern
    const a = 2 + Math.floor(Math.random() * 5);
    const b = 1 + Math.floor(Math.random() * 3);
    const numbers: number[] = [a];
    for (let i = 1; i < 6; i++) {
      if (i % 2 === 1) numbers.push(numbers[i - 1] * 2);
      else numbers.push(numbers[i - 1] + b);
    }
    const answer =
      numbers.length % 2 === 1
        ? numbers[numbers.length - 1] * 2
        : numbers[numbers.length - 1] + b;
    const wrong = [answer + b, answer * 2, answer - 1].filter(
      (w) => w !== answer && w > 0,
    );
    const options = [answer, ...wrong.slice(0, 2)].sort(
      () => Math.random() - 0.5,
    );
    return { numbers: numbers.slice(0, 5), answer, options };
  }
}

export function NumberWave() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState(() => generateSequence(config.waveMixedOps));
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const handleChoice = useCallback(
    (choice: number) => {
      if (feedback || showCompletion || timeUp) return;
      if (choice === seq.answer) {
        setFeedback("correct");
        soundManager.correctAnswer();
        setTimeout(() => {
          if (round + 1 >= config.waveRounds) {
            setShowCompletion(true);
            soundManager.levelComplete();
          } else {
            setRound((r) => r + 1);
            setSeq(generateSequence(config.waveMixedOps));
            setFeedback(null);
          }
        }, 1000);
      } else {
        setFeedback("wrong");
        soundManager.wrongAnswer();
        setTimeout(() => setFeedback(null), 800);
      }
    },
    [feedback, showCompletion, timeUp, seq, round, config],
  );

  const handleRetry = () => {
    setRound(0);
    setSeq(generateSequence(config.waveMixedOps));
    setFeedback(null);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout
      title="🌊 Pulau Gelombang Angka"
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
            {Array.from({ length: config.waveRounds }, (_, i) => (
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
          Temukan Angka Berikutnya! 🌊
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "24px",
            fontSize: "0.85rem",
          }}
        >
          Apa pola-nya?
        </p>

        {/* Number wave */}
        <motion.div
          key={round}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "32px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {seq.numbers.map((num, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: [0, -10 * Math.sin(i * 0.8), 0], opacity: 1 }}
              transition={{
                delay: i * 0.15,
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                fontSize: "1.6rem",
                fontWeight: 900,
                color: "#4FC3F7",
                width: "55px",
                height: "55px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(79,195,247,0.1)",
                borderRadius: "14px",
                border: "2px solid rgba(79,195,247,0.3)",
              }}
            >
              {num}
            </motion.div>
          ))}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              fontSize: "1.6rem",
              fontWeight: 900,
              color: "var(--color-accent)",
              width: "55px",
              height: "55px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,217,61,0.15)",
              borderRadius: "14px",
              border: "2px dashed var(--color-accent)",
            }}
          >
            ?
          </motion.div>
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
          {seq.options.map((opt, i) => (
            <motion.button
              key={`${round}-${i}`}
              onClick={() => handleChoice(opt)}
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: "80px",
                height: "60px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.08)",
                border: "2px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                fontWeight: 900,
                color: "white",
                outline: "none",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              {opt}
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
              {feedback === "correct" ? "✅ Benar! 🌊" : "❌ Bukan, coba lagi!"}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("gelombang")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
