/** @format */

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../stores/gameStore";
import { useEffect, useState } from "react";

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

        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "var(--color-text-accent)",
          }}
        >
          {title}
        </h2>

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

export function CompletionOverlay({
  show,
  coins,
  onContinue,
}: {
  show: boolean;
  coins: number;
  onContinue: () => void;
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
                marginBottom: "24px",
              }}
            >
              +{coins} 💰 Koin THR
            </motion.div>
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
