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

interface FallingNote {
  id: number;
  lane: number;
  y: number;
  hit: boolean;
  missed: boolean;
}

const LANE_EMOJIS = ["🎋", "🌙", "⭐", "🕌"];
const LANE_COLORS = ["#6BCB77", "#FFD93D", "#FF6B9D", "#6C63FF"];

export function RhythmTakbir() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const [notes, setNotes] = useState<FallingNote[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);
  const [feedback, setFeedback] = useState<{
    lane: number;
    type: "hit" | "miss";
  } | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const noteIdRef = useRef(0);
  const gameActiveRef = useRef(true);
  const TARGET_NOTES = 20;

  const lanes = config.rhythmLanes;

  // Game loop
  useEffect(() => {
    if (showCompletion || timeUp) return;
    gameActiveRef.current = true;

    const loop = (timestamp: number) => {
      if (!gameActiveRef.current) return;

      // Spawn new notes
      if (
        timestamp - lastSpawnRef.current > config.rhythmSpeed &&
        totalNotes < TARGET_NOTES
      ) {
        const lane = Math.floor(Math.random() * lanes);
        setNotes((prev) => [
          ...prev,
          { id: noteIdRef.current++, lane, y: 0, hit: false, missed: false },
        ]);
        setTotalNotes((t) => t + 1);
        lastSpawnRef.current = timestamp;
      }

      // Move notes down
      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.hit || n.missed ? n : { ...n, y: n.y + 2 },
        );
        // Mark missed notes
        return updated.map((n) => {
          if (!n.hit && !n.missed && n.y > 400) {
            return { ...n, missed: true };
          }
          return n;
        });
      });

      // Clean old notes
      setNotes((prev) => prev.filter((n) => n.y < 500 || n.hit));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      gameActiveRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [showCompletion, timeUp, config.rhythmSpeed, lanes, totalNotes]);

  // Check for completion
  useEffect(() => {
    if (
      totalNotes >= TARGET_NOTES &&
      notes.every((n) => n.hit || n.missed || n.y > 400) &&
      notes.length > 0
    ) {
      const activeNotes = notes.filter(
        (n) => !n.hit && !n.missed && n.y <= 400,
      );
      if (activeNotes.length === 0 && !showCompletion) {
        setTimeout(() => {
          setShowCompletion(true);
          soundManager.levelComplete();
        }, 500);
      }
    }
  }, [notes, totalNotes, showCompletion]);

  const handleTap = useCallback(
    (lane: number) => {
      if (showCompletion || timeUp) return;

      const hitZone = notes.find(
        (n) => n.lane === lane && !n.hit && !n.missed && n.y > 300 && n.y < 400,
      );

      if (hitZone) {
        setNotes((prev) =>
          prev.map((n) => (n.id === hitZone.id ? { ...n, hit: true } : n)),
        );
        const newCombo = combo + 1;
        const comboBonus = config.rhythmCombo ? Math.floor(newCombo / 5) : 0;
        setScore((s) => s + 1 + comboBonus);
        setCombo(newCombo);

        setFeedback({ lane, type: "hit" });
        soundManager.correctAnswer();
      } else {
        setCombo(0);
        setFeedback({ lane, type: "miss" });
      }

      setTimeout(() => setFeedback(null), 300);
    },
    [notes, combo, showCompletion, timeUp, config.rhythmCombo],
  );

  const handleRetry = () => {
    setNotes([]);
    setScore(0);
    setCombo(0);

    setTotalNotes(0);
    setShowCompletion(false);
    setTimeUp(false);
    noteIdRef.current = 0;
    lastSpawnRef.current = 0;
    setKey((k) => k + 1);
  };

  return (
    <GameLayout
      title="🎵 Pulau Irama Takbir"
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
            gap: "20px",
            marginBottom: "16px",
          }}
        >
          <GameTimer
            key={key}
            seconds={config.timerSeconds}
            onTimeUp={() => setTimeUp(true)}
            paused={showCompletion || timeUp}
          />
          <span style={{ color: "#FFD93D", fontWeight: 800 }}>🎯 {score}</span>
          {config.rhythmCombo && combo > 2 && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ color: "#FF6B9D", fontWeight: 800 }}
            >
              🔥 x{combo}
            </motion.span>
          )}
        </div>

        {/* Rhythm lanes */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            justifyContent: "center",
            height: "400px",
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {Array.from({ length: lanes }, (_, lane) => (
            <div
              key={lane}
              onClick={() => handleTap(lane)}
              style={{
                flex: 1,
                position: "relative",
                borderRight:
                  lane < lanes - 1
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
                cursor: "pointer",
              }}
            >
              {/* Hit zone */}
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: 0,
                  right: 0,
                  height: "80px",
                  background: `${LANE_COLORS[lane]}15`,
                  borderTop: `2px solid ${LANE_COLORS[lane]}44`,
                }}
              />

              {/* Falling notes */}
              {notes
                .filter((n) => n.lane === lane && !n.hit)
                .map((note) => (
                  <motion.div
                    key={note.id}
                    style={{
                      position: "absolute",
                      top: `${note.y}px`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "1.8rem",
                      opacity: note.missed ? 0.2 : 1,
                    }}
                  >
                    {LANE_EMOJIS[lane]}
                  </motion.div>
                ))}

              {/* Hit feedback */}
              <AnimatePresence>
                {feedback?.lane === lane && (
                  <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: "absolute",
                      bottom: "30px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "1.5rem",
                    }}
                  >
                    {feedback.type === "hit" ? "✨" : "💨"}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lane button label */}
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "1.2rem",
                  opacity: 0.6,
                }}
              >
                {LANE_EMOJIS[lane]}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginTop: "12px",
            fontSize: "0.8rem",
          }}
        >
          Ketuk jalur saat ikon mencapai zona bawah! 🎵
        </p>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("irama")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
