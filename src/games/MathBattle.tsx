/** @format */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameLayout, CompletionOverlay } from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

const MONSTERS = ["👾", "👹", "🐲", "👻", "🤖"];
const ROUNDS = 5;

function generateMathQ(age: number): {
  question: string;
  answer: number;
  options: number[];
} {
  const maxNum = age <= 7 ? 10 : age <= 10 ? 20 : 50;
  const ops = age <= 7 ? ["+"] : age <= 10 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case "-":
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
    default: // +
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
  }

  // Generate wrong options
  const wrongSet = new Set<number>();
  while (wrongSet.size < 2) {
    const offset = Math.floor(Math.random() * 6) + 1;
    const wrong =
      Math.random() > 0.5 ? answer + offset : Math.max(0, answer - offset);
    if (wrong !== answer) wrongSet.add(wrong);
  }

  const options = [answer, ...wrongSet].sort(() => Math.random() - 0.5);

  return { question: `${a} ${op} ${b} = ?`, answer, options };
}

export function MathBattle() {
  const { setPage, completeLevel, playerAge } = useGameStore();
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(() => generateMathQ(playerAge));
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [monster, setMonster] = useState(MONSTERS[0]);
  const [monsterHp, setMonsterHp] = useState(100);
  const [monsterDefeated, setMonsterDefeated] = useState(false);

  const nextRound = useCallback(() => {
    if (round + 1 >= ROUNDS) {
      setShowCompletion(true);
      soundManager.levelComplete();
    } else {
      setRound((r) => r + 1);
      setProblem(generateMathQ(playerAge));
      setFeedback(null);
      setMonster(MONSTERS[(round + 1) % MONSTERS.length]);
      setMonsterHp(100);
      setMonsterDefeated(false);
    }
  }, [round, playerAge]);

  const handleAnswer = (choice: number) => {
    if (feedback) return;
    if (choice === problem.answer) {
      setFeedback("correct");
      setMonsterHp(0);
      setMonsterDefeated(true);
      soundManager.correctAnswer();
      setTimeout(nextRound, 1200);
    } else {
      setFeedback("wrong");
      soundManager.wrongAnswer();
      setMonsterHp((hp) => Math.max(0, hp - 20));
      setTimeout(() => setFeedback(null), 800);
    }
  };

  return (
    <GameLayout title="🔢 Pulau Matematika" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "500px", width: "100%" }}
      >
        {/* Round indicator */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          {Array.from({ length: ROUNDS }, (_, i) => (
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

        {/* Monster */}
        <motion.div
          animate={
            monsterDefeated
              ? { scale: 0, rotate: 720, opacity: 0 }
              : feedback === "wrong"
                ? { x: [0, -5, 5, -5, 0] }
                : { y: [0, -8, 0] }
          }
          transition={
            monsterDefeated
              ? { duration: 0.6 }
              : feedback === "wrong"
                ? { duration: 0.3 }
                : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
          style={{
            fontSize: "5rem",
            marginBottom: "8px",
          }}
        >
          {monster}
        </motion.div>

        {/* Monster HP bar */}
        <div
          style={{
            width: "200px",
            height: "10px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "5px",
            margin: "0 auto 20px",
            overflow: "hidden",
          }}
        >
          <motion.div
            animate={{ width: `${monsterHp}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: "100%",
              background:
                monsterHp > 50
                  ? "var(--color-danger)"
                  : "var(--color-accent-warm)",
              borderRadius: "5px",
            }}
          />
        </div>

        {/* Speech bubble with question */}
        <motion.div
          key={round}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "2px solid rgba(255,255,255,0.15)",
            borderRadius: "20px",
            padding: "20px 32px",
            marginBottom: "28px",
            position: "relative",
          }}
        >
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
              marginBottom: "8px",
            }}
          >
            Monster bertanya:
          </p>
          <p
            style={{
              fontSize: "2.2rem",
              fontWeight: 900,
              color: "var(--color-accent)",
            }}
          >
            {problem.question}
          </p>
          {/* Triangle */}
          <div
            style={{
              position: "absolute",
              top: "-10px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "10px solid rgba(255,255,255,0.15)",
            }}
          />
        </motion.div>

        {/* Answer bubbles */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {problem.options.map((opt, i) => (
            <motion.button
              key={`${round}-${i}`}
              onClick={() => handleAnswer(opt)}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.9 }}
              animate={{ y: [0, -5, 0] }}
              transition={{
                y: {
                  duration: 1.5 + i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                border: "none",
                color: "white",
                fontSize: "1.5rem",
                fontWeight: 900,
                cursor: "pointer",
                fontFamily: "Nunito, sans-serif",
                boxShadow: "0 4px 20px rgba(108,99,255,0.4)",
                outline: "none",
              }}
            >
              {opt}
            </motion.button>
          ))}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
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
                ? "💥 Monster kalah! Hebat!"
                : "😅 Coba lagi!"}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("matematika")}
      />
    </GameLayout>
  );
}
