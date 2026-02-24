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

const MONSTERS = ["👾", "👹", "🐲", "👻", "🤖", "🧟", "👿"];

/**
 * Generate a math question. For minOps > 1, we chain operations left-to-right.
 * E.g. minOps=2 → "3 + 5 × 2 = ?" evaluated left-to-right → (3+5)×2 = 16
 * minOps=4 → "8 + 3 × 2 - 4 ÷ 2 = ?" evaluated L→R
 */
function generateMathQ(
  maxNum: number,
  ops: string[],
  optionCount: number,
  minOps: number,
): {
  question: string;
  answer: number;
  options: number[];
} {
  if (minOps <= 1) {
    // Single operation (SD mode)
    return generateSingleOp(maxNum, ops, optionCount);
  }

  // Multi-operation chain evaluated left-to-right
  const numOps = minOps + Math.floor(Math.random() * 2); // minOps or minOps+1
  let result = Math.floor(Math.random() * Math.min(maxNum, 20)) + 1;
  let expression = `${result}`;

  for (let i = 0; i < numOps; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let operand: number;

    switch (op) {
      case "-":
        operand = Math.floor(Math.random() * Math.min(result, 15)) + 1;
        result = result - operand;
        break;
      case "×":
        operand = Math.floor(Math.random() * 5) + 2;
        result = result * operand;
        break;
      case "÷": {
        // Find a divisor that works cleanly
        const divisors = [];
        for (let d = 2; d <= Math.min(result, 10); d++) {
          if (result % d === 0) divisors.push(d);
        }
        if (divisors.length > 0) {
          operand = divisors[Math.floor(Math.random() * divisors.length)];
          result = result / operand;
        } else {
          // Fallback to addition
          operand = Math.floor(Math.random() * 10) + 1;
          result = result + operand;
          expression += ` + ${operand}`;
          continue;
        }
        break;
      }
      default: // +
        operand = Math.floor(Math.random() * Math.min(maxNum, 20)) + 1;
        result = result + operand;
        break;
    }
    expression += ` ${op} ${operand}`;
  }

  // Ensure result is reasonable (positive, not too large)
  if (result < 0 || result > 999) {
    return generateMathQ(maxNum, ops, optionCount, minOps);
  }

  const answer = result;
  const wrongSet = new Set<number>();
  while (wrongSet.size < optionCount - 1) {
    const offset =
      Math.floor(Math.random() * Math.max(8, Math.abs(answer / 5))) + 1;
    const wrong =
      Math.random() > 0.5 ? answer + offset : Math.max(0, answer - offset);
    if (wrong !== answer && wrong >= 0) wrongSet.add(wrong);
  }

  const options = [answer, ...wrongSet].sort(() => Math.random() - 0.5);
  return { question: `${expression} = ?`, answer, options };
}

function generateSingleOp(
  maxNum: number,
  ops: string[],
  optionCount: number,
): {
  question: string;
  answer: number;
  options: number[];
} {
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case "-":
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
      b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
      answer = a * b;
      break;
    case "÷":
      b = Math.floor(Math.random() * 10) + 2;
      answer = Math.floor(Math.random() * 10) + 1;
      a = b * answer;
      break;
    default:
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
  }

  const wrongSet = new Set<number>();
  while (wrongSet.size < optionCount - 1) {
    const offset = Math.floor(Math.random() * 8) + 1;
    const wrong =
      Math.random() > 0.5 ? answer + offset : Math.max(0, answer - offset);
    if (wrong !== answer) wrongSet.add(wrong);
  }

  const options = [answer, ...wrongSet].sort(() => Math.random() - 0.5);
  return { question: `${a} ${op} ${b} = ?`, answer, options };
}

export function MathBattle() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [round, setRound] = useState(0);
  const [problem, setProblem] = useState(() =>
    generateMathQ(
      config.mathMaxNum,
      config.mathOps,
      config.mathOptions,
      config.mathMinOps,
    ),
  );
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [monster, setMonster] = useState(MONSTERS[0]);
  const [monsterHp, setMonsterHp] = useState(100);
  const [monsterDefeated, setMonsterDefeated] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const nextRound = useCallback(() => {
    if (round + 1 >= config.mathRounds) {
      setShowCompletion(true);
      soundManager.levelComplete();
    } else {
      setRound((r) => r + 1);
      setProblem(
        generateMathQ(
          config.mathMaxNum,
          config.mathOps,
          config.mathOptions,
          config.mathMinOps,
        ),
      );
      setFeedback(null);
      setMonster(MONSTERS[(round + 1) % MONSTERS.length]);
      setMonsterHp(100);
      setMonsterDefeated(false);
    }
  }, [round, config]);

  const handleAnswer = (choice: number) => {
    if (feedback || showCompletion || timeUp) return;
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

  const handleRetry = () => {
    setRound(0);
    setProblem(
      generateMathQ(
        config.mathMaxNum,
        config.mathOps,
        config.mathOptions,
        config.mathMinOps,
      ),
    );
    setFeedback(null);
    setMonster(MONSTERS[0]);
    setMonsterHp(100);
    setMonsterDefeated(false);
    setTimeUp(false);
    setShowCompletion(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout title="🔢 Pulau Matematika" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "500px", width: "100%" }}
      >
        {/* Timer + Round indicator */}
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
            {Array.from({ length: config.mathRounds }, (_, i) => (
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
          style={{ fontSize: "5rem", marginBottom: "8px" }}
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
            {config.mathMinOps > 1
              ? "Monster memberi soal berantai:"
              : "Monster bertanya:"}
          </p>
          <p
            style={{
              fontSize:
                config.mathMinOps >= 4
                  ? "1.4rem"
                  : config.mathMinOps >= 2
                    ? "1.8rem"
                    : "2.2rem",
              fontWeight: 900,
              color: "var(--color-accent)",
              wordBreak: "break-word",
            }}
          >
            {problem.question}
          </p>
          {config.mathMinOps > 1 && (
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.75rem",
                marginTop: "6px",
                opacity: 0.7,
              }}
            >
              💡 Hitung dari kiri ke kanan
            </p>
          )}
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
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
