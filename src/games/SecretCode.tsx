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

const SYMBOLS = [
  "🌙",
  "⭐",
  "☀️",
  "🌸",
  "🦌",
  "🌊",
  "🔥",
  "🍃",
  "💎",
  "🎋",
  "🕌",
  "🌺",
];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface CodePuzzle {
  word: string;
  mapping: Map<string, string>; // letter → symbol
  display: string[]; // symbols to show
  hints: Map<string, string>; // revealed symbol → letter
}

const WORDS_BY_DIFFICULTY: Record<string, string[]> = {
  elementary: ["KOK", "AIR", "API", "IBU", "TAS", "DUA"],
  junior: ["EMAS", "KOIN", "HARTA", "DESA", "PETA"],
  senior: ["KANCIL", "HARTA", "MISTERI", "RAHASIA", "PULAU"],
};

function generatePuzzle(
  wordLength: number,
  hintLevel: number,
  difficulty: string,
): CodePuzzle {
  const pool =
    WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY.elementary;
  const validWords = pool.filter((w) => w.length >= wordLength);
  const word =
    validWords[Math.floor(Math.random() * validWords.length)] || pool[0];

  const uniqueLetters = [...new Set(word.split(""))];
  const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5);
  const mapping = new Map<string, string>();
  uniqueLetters.forEach((letter, i) => {
    mapping.set(letter, shuffledSymbols[i % shuffledSymbols.length]);
  });

  const display = word.split("").map((l) => mapping.get(l) || "❓");

  // Generate hints based on level
  const hints = new Map<string, string>();
  if (hintLevel === 0) {
    // All hints shown
    mapping.forEach((symbol, letter) => hints.set(symbol, letter));
  } else if (hintLevel === 1) {
    // Partial hints - show half
    const entries = [...mapping.entries()];
    const count = Math.ceil(entries.length / 2);
    entries
      .slice(0, count)
      .forEach(([letter, symbol]) => hints.set(symbol, letter));
  }
  // hintLevel 2 = no hints

  return { word, mapping, display, hints };
}

export function SecretCode() {
  const { setPage, completeLevel, getDifficultyConfig, difficulty } =
    useGameStore();
  const config = getDifficultyConfig();
  const [puzzle, setPuzzle] = useState(() =>
    generatePuzzle(config.codeWordLength, config.codeHints, difficulty),
  );
  const [guesses, setGuesses] = useState<(string | null)[]>(() =>
    puzzle.word.split("").map(() => null),
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const handleLetterInput = useCallback(
    (letter: string) => {
      if (feedback || showCompletion || timeUp) return;
      const newGuesses = [...guesses];
      newGuesses[currentIdx] = letter;
      setGuesses(newGuesses);

      // Move to next empty slot
      const nextEmpty = newGuesses.findIndex(
        (g, i) => i > currentIdx && g === null,
      );
      if (nextEmpty >= 0) {
        setCurrentIdx(nextEmpty);
      }

      // Check if all filled
      if (newGuesses.every((g) => g !== null)) {
        const guessWord = newGuesses.join("");
        if (guessWord === puzzle.word) {
          setFeedback("correct");
          soundManager.correctAnswer();
          setTimeout(() => {
            setShowCompletion(true);
            soundManager.levelComplete();
          }, 1000);
        } else {
          setFeedback("wrong");
          soundManager.wrongAnswer();
          setTimeout(() => {
            setGuesses(puzzle.word.split("").map(() => null));
            setCurrentIdx(0);
            setFeedback(null);
          }, 1000);
        }
      }
    },
    [guesses, currentIdx, feedback, showCompletion, timeUp, puzzle],
  );

  const handleRetry = () => {
    const newPuzzle = generatePuzzle(
      config.codeWordLength,
      config.codeHints,
      difficulty,
    );
    setPuzzle(newPuzzle);
    setGuesses(newPuzzle.word.split("").map(() => null));
    setCurrentIdx(0);
    setFeedback(null);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout
      title="🧩 Pulau Kode Rahasia"
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

        <h3
          style={{ marginBottom: "8px", fontWeight: 800, fontSize: "1.2rem" }}
        >
          Pecahkan Kode! 🔐
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "20px",
            fontSize: "0.85rem",
          }}
        >
          Tebak huruf untuk setiap simbol!
        </p>

        {/* Code display */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {puzzle.display.map((symbol, i) => (
            <motion.div
              key={i}
              onClick={() => !guesses[i] && setCurrentIdx(i)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              style={{
                width: "60px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "1.8rem" }}>{symbol}</span>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: guesses[i]
                    ? feedback === "correct"
                      ? "rgba(107,203,119,0.3)"
                      : "rgba(108,99,255,0.2)"
                    : currentIdx === i
                      ? "rgba(255,217,61,0.2)"
                      : "rgba(255,255,255,0.05)",
                  border:
                    currentIdx === i
                      ? "2px solid var(--color-accent)"
                      : "2px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  color: "white",
                }}
              >
                {guesses[i] || ""}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hint table */}
        {puzzle.hints.size > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
                marginBottom: "8px",
              }}
            >
              📋 Petunjuk:
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {[...puzzle.hints.entries()].map(([symbol, letter]) => (
                <div
                  key={symbol}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "0.9rem",
                  }}
                >
                  <span>{symbol}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    =
                  </span>
                  <span style={{ fontWeight: 800 }}>{letter}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Letter keyboard */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            justifyContent: "center",
            maxWidth: "350px",
            margin: "0 auto",
          }}
        >
          {LETTERS.split("").map((letter) => (
            <motion.button
              key={letter}
              onClick={() => handleLetterInput(letter)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "Nunito, sans-serif",
                outline: "none",
              }}
            >
              {letter}
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
                ? `✅ Benar! Kata rahasianya: ${puzzle.word}`
                : "❌ Salah, coba lagi!"}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("kode")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
