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

interface Riddle {
  question: string;
  emoji?: string;
  choices: string[];
  answer: number;
}

const RIDDLES_SD: Riddle[] = [
  {
    question:
      "Aku punya jarum tapi tak bisa menjahit. Aku berdetak tapi tak hidup. Apa aku?",
    emoji: "🕐",
    choices: ["Jam", "Kompas", "Radio"],
    answer: 0,
  },
  {
    question: "Semakin kamu ambil, semakin banyak yang tersisa. Apa itu?",
    emoji: "👣",
    choices: ["Jejak kaki", "Air", "Pasir"],
    answer: 0,
  },
  {
    question: "Aku punya banyak daun tapi bukan pohon. Apa aku?",
    emoji: "📖",
    choices: ["Buku", "Bunga", "Kipas"],
    answer: 0,
  },
  {
    question: "Binatang apa yang namanya dua huruf?",
    emoji: "🐂",
    choices: ["Sapi", "Ayam", "U-D (udang)"],
    answer: 2,
  },
  {
    question: "Apa yang punya leher tapi tidak punya kepala?",
    emoji: "👕",
    choices: ["Botol", "Baju", "Gitar"],
    answer: 0,
  },
];

const RIDDLES_SMP: Riddle[] = [
  {
    question:
      "Aku berjalan tapi tidak punya kaki. Aku menunjuk tapi tidak punya tangan. Apa aku?",
    choices: ["Jam dinding", "Komputer", "Cermin", "Pintu"],
    answer: 0,
  },
  {
    question: "Semakin kering aku, semakin basah aku. Apa aku?",
    choices: ["Handuk", "Spons", "Kertas", "Batu"],
    answer: 0,
  },
  {
    question: "Aku selalu datang tapi tidak pernah sampai. Apa aku?",
    choices: ["Besok", "Angin", "Mimpi", "Hujan"],
    answer: 0,
  },
  {
    question: "Ada apa di ujung dunia?",
    choices: ["Huruf A", "Laut", "Gunung", "Awan"],
    answer: 0,
  },
  {
    question: "Kalau dipukul tidak sakit, tapi dipotong menangis. Apa?",
    choices: ["Bawang", "Kayu", "Bambu", "Tali"],
    answer: 0,
  },
  {
    question: "Rumah apa yang bisa terbang?",
    choices: ["Rumah lebah", "Rumah pohon", "Rumah kaca", "Rumah makan"],
    answer: 0,
  },
];

const RIDDLES_SMA: Riddle[] = [
  {
    question:
      "Aku ada di air tapi bukan ikan. Aku bisa terbang tapi bukan burung. Apa aku?",
    choices: ["Uap air", "Capung", "Ubur-ubur", "Nyamuk"],
    answer: 0,
  },
  {
    question:
      "Semakin aku besar, semakin sedikit yang bisa kamu lihat. Apa aku?",
    choices: ["Kegelapan", "Kabut", "Lubang hitam", "Bayangan"],
    answer: 0,
  },
  {
    question:
      "Aku punya kota, tapi tidak ada rumah. Punya hutan, tapi tidak ada pohon. Apa aku?",
    choices: ["Peta", "Mimpi", "Cerita", "Layar"],
    answer: 0,
  },
  {
    question: "Apa yang selalu meningkat tapi tidak pernah turun?",
    choices: ["Umurmu", "Gunung", "Harga", "Suhu"],
    answer: 0,
  },
  {
    question:
      "Aku ringan seperti bulu, tapi orang terkuat pun tak bisa menahanku lama. Apa aku?",
    choices: ["Napas", "Kantuk", "Angin", "Waktu"],
    answer: 0,
  },
  {
    question: "Apa yang bisa kamu pecahkan tanpa menyentuhnya?",
    choices: ["Janji", "Rekor", "Hati", "Keheningan"],
    answer: 0,
  },
  {
    question: "Apa yang punya mata tapi tidak bisa melihat?",
    choices: ["Jarum", "Topan", "Dadu", "Kentang"],
    answer: 0,
  },
];

function getRiddles(difficulty: string, count: number): Riddle[] {
  const pool =
    difficulty === "elementary"
      ? RIDDLES_SD
      : difficulty === "junior"
        ? RIDDLES_SMP
        : RIDDLES_SMA;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

export function RiddleWind() {
  const { setPage, completeLevel, getDifficultyConfig, difficulty } =
    useGameStore();
  const config = getDifficultyConfig();
  const [riddles] = useState(() => getRiddles(difficulty, config.riddleCount));
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [wrongAnim, setWrongAnim] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const currentRiddle = riddles[round];

  const handleChoice = useCallback(
    (idx: number) => {
      if (feedback || showCompletion || timeUp) return;
      if (idx === currentRiddle.answer) {
        setFeedback("correct");
        soundManager.correctAnswer();
        setTimeout(() => {
          if (round + 1 >= riddles.length) {
            setShowCompletion(true);
            soundManager.levelComplete();
          } else {
            setRound((r) => r + 1);
            setFeedback(null);
          }
        }, 1000);
      } else {
        setFeedback("wrong");
        setWrongAnim(true);
        soundManager.wrongAnswer();
        setTimeout(() => {
          setFeedback(null);
          setWrongAnim(false);
        }, 1200);
      }
    },
    [feedback, showCompletion, timeUp, currentRiddle, round, riddles.length],
  );

  const handleRetry = () => {
    setRound(0);
    setFeedback(null);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  if (!currentRiddle) return null;

  return (
    <GameLayout
      title="🌪️ Pulau Riddle Angin"
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
            {riddles.map((_, i) => (
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

        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            {currentRiddle.emoji && (
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: "3rem", marginBottom: "12px" }}
              >
                {currentRiddle.emoji}
              </motion.div>
            )}

            <motion.div
              animate={
                wrongAnim
                  ? { x: [-5, 5, -5, 5, 0], rotate: [-2, 2, -2, 2, 0] }
                  : {}
              }
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "24px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1.6,
                }}
              >
                {currentRiddle.question}
              </p>
            </motion.div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {currentRiddle.choices.map((choice, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleChoice(i)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "14px",
                    background:
                      feedback === "correct" && i === currentRiddle.answer
                        ? "rgba(107,203,119,0.2)"
                        : "rgba(255,255,255,0.06)",
                    border:
                      feedback === "correct" && i === currentRiddle.answer
                        ? "2px solid var(--color-success)"
                        : "2px solid rgba(255,255,255,0.1)",
                    color: "white",
                    cursor: "pointer",
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    textAlign: "left",
                    outline: "none",
                  }}
                >
                  <span style={{ opacity: 0.5, marginRight: "8px" }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice}
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
                    ? "✅ Benar! Pinter!"
                    : "😄 Bukan, coba lagi!"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("riddle")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
