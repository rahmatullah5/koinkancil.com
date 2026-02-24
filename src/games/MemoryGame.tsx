/** @format */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  GameLayout,
  CompletionOverlay,
  GameTimer,
  TimeUpOverlay,
} from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

const CARD_ICONS = ["🕌", "🌙", "⭐", "🏮", "🎋", "🎆", "☪️", "🧕", "📿", "🎁"];

interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

function createCards(pairsCount: number): Card[] {
  const icons = [...CARD_ICONS]
    .sort(() => Math.random() - 0.5)
    .slice(0, pairsCount);
  const cards: Card[] = [];
  icons.forEach((icon, i) => {
    cards.push({ id: i * 2, icon, flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, icon, flipped: false, matched: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export function MemoryGame() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const totalPairs = config.memoryPairs;
  const columns = config.memoryColumns;

  const [cards, setCards] = useState<Card[]>(() => createCards(totalPairs));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [key]);

  const handleCardClick = useCallback(
    (id: number) => {
      if (selected.length >= 2 || showCompletion || timeUp) return;

      const card = cards.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return;

      soundManager.cardFlip();

      const newCards = cards.map((c) =>
        c.id === id ? { ...c, flipped: true } : c,
      );
      setCards(newCards);
      const newSelected = [...selected, id];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        setMoves((m) => m + 1);
        const [firstId, secondId] = newSelected;
        const first = newCards.find((c) => c.id === firstId)!;
        const second = newCards.find((c) => c.id === secondId)!;

        if (first.icon === second.icon) {
          soundManager.cardMatch();
          const matched = newCards.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, matched: true } : c,
          );
          setCards(matched);
          setSelected([]);
          const newMatchedCount = matchedCount + 1;
          setMatchedCount(newMatchedCount);

          if (newMatchedCount >= totalPairs) {
            clearInterval(timerRef.current);
            setTimeout(() => {
              setShowCompletion(true);
              soundManager.levelComplete();
            }, 500);
          }
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, flipped: false }
                  : c,
              ),
            );
            setSelected([]);
          }, 800);
        }
      }
    },
    [cards, selected, matchedCount, totalPairs, showCompletion, timeUp],
  );

  const handleRetry = () => {
    clearInterval(timerRef.current);
    setCards(createCards(totalPairs));
    setSelected([]);
    setMoves(0);
    setMatchedCount(0);
    setTimeElapsed(0);
    setTimeUp(false);
    setShowCompletion(false);
    setKey((k) => k + 1);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <GameLayout title="🧠 Pulau Memori" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "500px", width: "100%" }}
      >
        {/* Timer (if enabled for this difficulty) */}
        {config.memoryTimerEnabled && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <GameTimer
              key={key}
              seconds={config.memoryTimerSeconds}
              onTimeUp={() => {
                clearInterval(timerRef.current);
                setTimeUp(true);
              }}
              paused={showCompletion || timeUp}
            />
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "8px 16px",
            }}
          >
            <span
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.8rem",
              }}
            >
              ⏱ Waktu
            </span>
            <div style={{ fontWeight: 800, color: "var(--color-info)" }}>
              {formatTime(timeElapsed)}
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "8px 16px",
            }}
          >
            <span
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.8rem",
              }}
            >
              🎯 Langkah
            </span>
            <div style={{ fontWeight: 800, color: "var(--color-accent)" }}>
              {moves}
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "8px 16px",
            }}
          >
            <span
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.8rem",
              }}
            >
              ✅ Cocok
            </span>
            <div style={{ fontWeight: 800, color: "var(--color-success)" }}>
              {matchedCount}/{totalPairs}
            </div>
          </div>
        </div>

        {/* Card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "10px",
            maxWidth: columns === 5 ? "450px" : "360px",
            margin: "0 auto",
          }}
        >
          {cards.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
              whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
              animate={card.matched ? { scale: [1, 1.1, 1], opacity: 0.7 } : {}}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: "14px",
                border: card.matched
                  ? "2px solid var(--color-success)"
                  : card.flipped
                    ? "2px solid var(--color-accent)"
                    : "2px solid rgba(255,255,255,0.15)",
                background:
                  card.flipped || card.matched
                    ? "rgba(255,255,255,0.1)"
                    : "linear-gradient(135deg, var(--color-bg-soft), var(--color-bg-glow))",
                cursor: card.flipped || card.matched ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: card.flipped || card.matched ? "2rem" : "1.5rem",
                fontFamily: "inherit",
                outline: "none",
                transition: "all 0.3s",
              }}
            >
              {card.flipped || card.matched ? card.icon : "❓"}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("memori")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
