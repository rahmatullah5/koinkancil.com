/** @format */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameLayout,
  CompletionOverlay,
  GameTimer,
  TimeUpOverlay,
} from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  active: boolean;
  hit: boolean;
}

export function StarSpeed() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [stars, setStars] = useState<Star[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(config.starLives || 999);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const starIdRef = useRef(0);
  const TARGET_SCORE = 15;

  // Spawn stars periodically
  useEffect(() => {
    if (showCompletion || timeUp || gameOver) return;

    const interval = setInterval(() => {
      const newStar: Star = {
        id: starIdRef.current++,
        x: 10 + Math.random() * 80, // percentage
        y: 10 + Math.random() * 70,
        size: config.starTargetSize,
        active: true,
        hit: false,
      };
      setStars((prev) => [...prev, newStar]);

      // Remove star after timeout if not hit
      setTimeout(() => {
        setStars((prev) => {
          const star = prev.find((s) => s.id === newStar.id);
          if (star && !star.hit && star.active) {
            if (config.starLives > 0) {
              setLives((l) => {
                const nl = l - 1;
                if (nl <= 0) setGameOver(true);
                return nl;
              });
            }
            return prev.map((s) =>
              s.id === newStar.id ? { ...s, active: false } : s,
            );
          }
          return prev;
        });
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [showCompletion, timeUp, gameOver, config]);

  // Clean old stars
  useEffect(() => {
    const cleanup = setInterval(() => {
      setStars((prev) => prev.filter((s) => s.active || s.hit));
    }, 3000);
    return () => clearInterval(cleanup);
  }, []);

  // Check completion
  useEffect(() => {
    if (score >= TARGET_SCORE && !showCompletion) {
      setShowCompletion(true);
      soundManager.levelComplete();
    }
  }, [score, showCompletion]);

  const handleTap = useCallback(
    (starId: number) => {
      if (showCompletion || timeUp || gameOver) return;
      setStars((prev) =>
        prev.map((s) =>
          s.id === starId ? { ...s, hit: true, active: false } : s,
        ),
      );
      setScore((s) => s + 1);
      soundManager.correctAnswer();
    },
    [showCompletion, timeUp, gameOver],
  );

  const handleRetry = () => {
    setStars([]);
    setScore(0);
    setLives(config.starLives || 999);
    setShowCompletion(false);
    setTimeUp(false);
    setGameOver(false);
    starIdRef.current = 0;
    setKey((k) => k + 1);
  };

  const handleTimeUp = () => {
    if (score >= TARGET_SCORE) {
      setShowCompletion(true);
      soundManager.levelComplete();
    } else {
      setTimeUp(true);
    }
  };

  return (
    <GameLayout
      title="🌟 Pulau Bintang Cepat"
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
            gap: "20px",
            marginBottom: "16px",
          }}
        >
          <GameTimer
            key={key}
            seconds={config.starDuration}
            onTimeUp={handleTimeUp}
            paused={showCompletion || timeUp || gameOver}
          />
          <span style={{ color: "#FFD93D", fontWeight: 800 }}>
            ⭐ {score}/{TARGET_SCORE}
          </span>
          {config.starLives > 0 && (
            <span
              style={{
                color:
                  lives <= 1
                    ? "var(--color-danger)"
                    : "var(--color-text-secondary)",
                fontWeight: 700,
              }}
            >
              ❤️ {lives}
            </span>
          )}
        </div>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          Ketuk bintang secepat mungkin! ⚡
        </p>

        {/* Star field */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "350px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <AnimatePresence>
            {stars
              .filter((s) => s.active && !s.hit)
              .map((star) => (
                <motion.button
                  key={star.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleTap(star.id)}
                  style={{
                    position: "absolute",
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #FFD93D, #FF9800)",
                    border: "none",
                    cursor: "pointer",
                    outline: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: `${star.size * 0.5}px`,
                    boxShadow: "0 0 20px rgba(255,217,61,0.6)",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  ⭐
                </motion.button>
              ))}
          </AnimatePresence>

          {/* Hit effects */}
          <AnimatePresence>
            {stars
              .filter((s) => s.hit)
              .map((star) => (
                <motion.div
                  key={`hit-${star.id}`}
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: "absolute",
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    fontSize: "1.5rem",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                >
                  ✨
                </motion.div>
              ))}
          </AnimatePresence>

          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <span style={{ fontSize: "3rem" }}>💔</span>
              <p
                style={{ fontWeight: 800, fontSize: "1.2rem", color: "white" }}
              >
                Game Over!
              </p>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Skor: {score}
              </p>
              <motion.button
                onClick={handleRetry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary"
              >
                🔄 Coba Lagi
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("bintang")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
