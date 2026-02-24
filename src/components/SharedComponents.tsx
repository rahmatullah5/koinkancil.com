/** @format */

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, DIFFICULTY_CONFIGS } from "../stores/gameStore";
import { useEffect, useState, useRef } from "react";

export function CoinCounter() {
  const coins = useGameStore((s) => s.coins);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (coins > 0) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }
  }, [coins]);

  return (
    <motion.div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background:
          "linear-gradient(135deg, rgba(255,217,61,0.2), rgba(255,140,66,0.2))",
        border: "2px solid rgba(255,217,61,0.4)",
        borderRadius: "50px",
        padding: "8px 20px",
        fontWeight: 800,
        fontSize: "1.1rem",
      }}
      animate={animate ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        style={{ fontSize: "1.5rem" }}
        animate={animate ? { rotateY: 360 } : { rotateY: 0 }}
        transition={{ duration: 0.5 }}
      >
        💰
      </motion.span>
      <span style={{ color: "var(--color-accent)" }}>{coins}</span>
      <span
        style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}
      >
        Koin
      </span>
    </motion.div>
  );
}

export function DifficultyBadge() {
  const difficulty = useGameStore((s) => s.difficulty);
  const config = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: `${config.color}22`,
        border: `2px solid ${config.color}66`,
        borderRadius: "50px",
        padding: "6px 14px",
        fontWeight: 700,
        fontSize: "0.85rem",
        color: config.color,
      }}
    >
      <span>{config.emoji}</span>
      <span>{config.shortLabel}</span>
      <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
        ×{config.coinMultiplier}
      </span>
    </div>
  );
}

export function GameTimer({
  seconds,
  onTimeUp,
  paused = false,
}: {
  seconds: number;
  onTimeUp: () => void;
  paused?: boolean;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (paused || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 0 && !hasTriggered.current) {
          hasTriggered.current = true;
          setTimeout(() => onTimeUpRef.current(), 0);
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paused, remaining]);

  const pct = (remaining / seconds) * 100;
  const color = pct > 50 ? "#6BCB77" : pct > 25 ? "#FFD93D" : "#FF6B6B";
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <motion.div
      animate={remaining <= 10 ? { scale: [1, 1.05, 1] } : {}}
      transition={remaining <= 10 ? { duration: 0.5, repeat: Infinity } : {}}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontWeight: 800,
          fontSize: remaining <= 10 ? "1.3rem" : "1.1rem",
          color,
          transition: "all 0.3s",
        }}
      >
        <span>⏱</span>
        <span>
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
      <div
        style={{
          width: "120px",
          height: "6px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: "100%",
            background: color,
            borderRadius: "3px",
            transition: "background 0.3s",
          }}
        />
      </div>
    </motion.div>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        height: "16px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <motion.div
        style={{
          height: "100%",
          background:
            "linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-accent))",
          borderRadius: "10px",
          backgroundSize: "200% 100%",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export function GameLayout({
  title,
  children,
  onBack,
}: {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-main)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "12px",
            padding: "8px 16px",
            color: "white",
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 700,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Kembali
        </motion.button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <DifficultyBadge />
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "var(--color-text-accent)",
            }}
          >
            {title}
          </h2>
        </div>

        <CoinCounter />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function FloatingParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    emoji: ["✨", "⭐", "🌟", "💫", "🌙"][i % 5],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    size: 12 + Math.random() * 16,
  }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            fontSize: `${p.size}px`,
            opacity: 0.3,
          }}
          animate={{
            y: [window.innerHeight + 50, -50],
            opacity: [0, 0.4, 0.4, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

export function TimeUpOverlay({
  show,
  onRetry,
  onQuit,
}: {
  show: boolean;
  onRetry: () => void;
  onQuit: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={{
              background:
                "linear-gradient(135deg, var(--color-bg-card), var(--color-bg-soft))",
              border: "2px solid rgba(255,107,107,0.3)",
              borderRadius: "24px",
              padding: "48px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>⏰</div>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                marginBottom: "8px",
                color: "var(--color-danger)",
              }}
            >
              Waktu Habis!
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: "24px",
              }}
            >
              Jangan menyerah, coba lagi! 💪
            </p>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <motion.button
                className="btn-accent"
                onClick={onRetry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Coba Lagi
              </motion.button>
              <motion.button
                onClick={onQuit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                }}
              >
                🗺️ Ke Peta
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CompletionOverlay({
  show,
  coins,
  onContinue,
}: {
  show: boolean;
  coins: number;
  onContinue: () => void;
}) {
  const difficulty = useGameStore((s) => s.difficulty);
  const config = DIFFICULTY_CONFIGS[difficulty];
  const earnedCoins = Math.round(coins * config.coinMultiplier);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={{
              background:
                "linear-gradient(135deg, var(--color-bg-card), var(--color-bg-soft))",
              border: "2px solid rgba(255,217,61,0.3)",
              borderRadius: "24px",
              padding: "48px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
              style={{ fontSize: "4rem", marginBottom: "16px" }}
            >
              🎉
            </motion.div>
            <h2
              style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                marginBottom: "8px",
                color: "var(--color-accent)",
              }}
            >
              Hebat!
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: "16px",
              }}
            >
              Kamu mendapatkan
            </p>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color: "var(--color-accent)",
                marginBottom: "8px",
              }}
            >
              +{earnedCoins} 💰 Koin THR
            </motion.div>
            {config.coinMultiplier > 1 && (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: config.color,
                  marginBottom: "16px",
                  fontWeight: 700,
                }}
              >
                {config.emoji} Bonus {config.shortLabel}: ×
                {config.coinMultiplier}
              </div>
            )}
            <motion.button
              className="btn-accent"
              onClick={onContinue}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Lanjutkan! →
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
