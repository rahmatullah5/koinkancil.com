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

interface StoryNode {
  text: string;
  emoji: string;
  choices: { label: string; nextId: string; isSmart?: boolean }[];
  puzzle?: { question: string; answer: number; options: string[] };
}

function generateStory(
  numChoices: number,
  smartPath: boolean,
): Record<string, StoryNode> {
  const base: Record<string, StoryNode> = {
    start: {
      text: "Kancil menemukan sebuah gua misterius di hutan. Di depan gua ada tanda peringatan... 🦌",
      emoji: "🌳",
      choices: [
        { label: "Masuk ke gua", nextId: "cave" },
        { label: "Panggil teman", nextId: "friend" },
        ...(numChoices >= 3
          ? [{ label: "Cari jalan lain", nextId: "detour", isSmart: smartPath }]
          : []),
      ],
    },
    cave: {
      text: "Di dalam gua gelap, Kancil melihat cahaya berkilau! Tapi ada teka-teki di pintu...",
      emoji: "🕯️",
      choices: [],
      puzzle: {
        question: "Berapa 7 + 5 × 2?",
        answer: 1,
        options: ["24", "17", "19"],
      },
    },
    friend: {
      text: "Kancil memanggil Kura-kura. Bersama-sama mereka menemukan tangga rahasia!",
      emoji: "🐢",
      choices: [],
      puzzle: {
        question: "Hewan apa yang paling cepat di darat?",
        answer: 0,
        options: ["Cheetah", "Kuda", "Harimau"],
      },
    },
    detour: {
      text: "Kancil menemukan jalan setapak tersembunyi. Di ujung jalan ada peti harta karun! 💎",
      emoji: "✨",
      choices: [],
      puzzle: {
        question: "Berapa sisi segitiga?",
        answer: 0,
        options: ["3", "4", "5"],
      },
    },
    end: {
      text: "Kancil berhasil mendapatkan harta karun! Petualangan yang seru! 🎉",
      emoji: "🏆",
      choices: [],
    },
  };
  return base;
}

export function StoryBranch() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [story] = useState(() =>
    generateStory(config.storyChoices, config.storySmartPath),
  );
  const [currentNodeId, setCurrentNodeId] = useState("start");

  const [puzzleFeedback, setPuzzleFeedback] = useState<
    "correct" | "wrong" | null
  >(null);
  const [bonusEarned, setBonusEarned] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const node = story[currentNodeId];

  const handleChoice = useCallback(
    (choice: { label: string; nextId: string; isSmart?: boolean }) => {
      soundManager.buttonClick();
      if (choice.isSmart) setBonusEarned(true);
      setCurrentNodeId(choice.nextId);

      setPuzzleFeedback(null);
    },
    [],
  );

  const handlePuzzleAnswer = useCallback(
    (idx: number) => {
      if (puzzleFeedback) return;
      if (!node?.puzzle) return;

      if (idx === node.puzzle.answer) {
        setPuzzleFeedback("correct");
        soundManager.correctAnswer();
        setTimeout(() => {
          setCurrentNodeId("end");
          setTimeout(() => {
            setShowCompletion(true);
            soundManager.levelComplete();
          }, 1500);
        }, 1000);
      } else {
        setPuzzleFeedback("wrong");
        soundManager.wrongAnswer();
        setTimeout(() => setPuzzleFeedback(null), 800);
      }
    },
    [puzzleFeedback, node],
  );

  const handleRetry = () => {
    setCurrentNodeId("start");
    setPuzzleFeedback(null);
    setBonusEarned(false);
    setShowCompletion(false);
    setTimeUp(false);
    setKey((k) => k + 1);
  };

  if (!node) return null;

  return (
    <GameLayout
      title="📖 Pulau Cerita Interaktif"
      onBack={() => setPage("worldmap")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "550px", width: "100%" }}
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

        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            {/* Story emoji */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: "3.5rem", marginBottom: "16px" }}
            >
              {node.emoji}
            </motion.div>

            {/* Story text */}
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "24px",
                border: "1px solid rgba(255,255,255,0.1)",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  color: "white",
                  fontWeight: 600,
                }}
              >
                {node.text}
              </p>
              {bonusEarned && currentNodeId === "detour" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: "8px",
                    color: "#FFD93D",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  ✨ Bonus: Kamu menemukan jalan pintar!
                </motion.p>
              )}
            </div>

            {/* Choices */}
            {node.choices.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {node.choices.map((choice, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleChoice(choice)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    style={{
                      padding: "14px 20px",
                      borderRadius: "14px",
                      background: "rgba(108,99,255,0.1)",
                      border: "2px solid rgba(108,99,255,0.3)",
                      color: "white",
                      cursor: "pointer",
                      fontFamily: "Nunito, sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      textAlign: "left",
                      outline: "none",
                    }}
                  >
                    {i + 1}. {choice.label}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Puzzle */}
            {node.puzzle && (
              <div>
                <div
                  style={{
                    background: "rgba(255,217,61,0.1)",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "16px",
                    border: "1px solid rgba(255,217,61,0.3)",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 800,
                      color: "#FFD93D",
                      fontSize: "1rem",
                    }}
                  >
                    🧩 {node.puzzle.question}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {node.puzzle.options.map((opt, i) => (
                    <motion.button
                      key={i}
                      onClick={() => handlePuzzleAnswer(i)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: "12px 20px",
                        borderRadius: "12px",
                        background:
                          puzzleFeedback === "correct" &&
                          i === node.puzzle!.answer
                            ? "rgba(107,203,119,0.3)"
                            : "rgba(255,255,255,0.08)",
                        border:
                          puzzleFeedback === "correct" &&
                          i === node.puzzle!.answer
                            ? "2px solid var(--color-success)"
                            : "2px solid rgba(255,255,255,0.15)",
                        color: "white",
                        cursor: "pointer",
                        fontFamily: "Nunito, sans-serif",
                        fontWeight: 700,
                        outline: "none",
                      }}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {puzzleFeedback && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: "12px",
                        fontWeight: 700,
                        color:
                          puzzleFeedback === "correct"
                            ? "var(--color-success)"
                            : "var(--color-danger)",
                      }}
                    >
                      {puzzleFeedback === "correct"
                        ? "✅ Benar!"
                        : "❌ Coba lagi!"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* End screen */}
            {currentNodeId === "end" && !showCompletion && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                style={{ fontSize: "2rem" }}
              >
                🎊
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("cerita")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
