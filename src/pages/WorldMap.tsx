/** @format */

import { motion } from "framer-motion";
import { useGameStore, ISLANDS, type IslandId } from "../stores/gameStore";
import {
  CoinCounter,
  ProgressBar,
  FloatingParticles,
} from "../components/SharedComponents";
import { soundManager } from "../utils/soundManager";

// Island positions on the "map" (percentage-based)
const ISLAND_POSITIONS: Record<IslandId, { left: string; top: string }> = {
  logika: { left: "18%", top: "35%" },
  warna: { left: "42%", top: "55%" },
  matematika: { left: "58%", top: "30%" },
  memori: { left: "72%", top: "55%" },
  kreatif: { left: "85%", top: "35%" },
};

function IslandNode({
  island,
  index,
}: {
  island: (typeof ISLANDS)[0];
  index: number;
}) {
  const { navigateToIsland, isIslandUnlocked, isIslandCompleted } =
    useGameStore();
  const unlocked = isIslandUnlocked(island.id);
  const completed = isIslandCompleted(island.id);
  const pos = ISLAND_POSITIONS[island.id];

  return (
    <motion.div
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 + index * 0.15, type: "spring", damping: 12 }}
    >
      <motion.button
        onClick={() => {
          if (unlocked) {
            soundManager.buttonClick();
            navigateToIsland(island.id);
          }
        }}
        whileHover={unlocked ? { scale: 1.15, y: -5 } : {}}
        whileTap={unlocked ? { scale: 0.95 } : {}}
        animate={unlocked && !completed ? { y: [0, -6, 0] } : {}}
        transition={
          unlocked && !completed
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
        style={{
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          border: completed
            ? "4px solid var(--color-success)"
            : unlocked
              ? `4px solid ${island.color}`
              : "4px solid rgba(255,255,255,0.15)",
          background: completed
            ? "linear-gradient(135deg, rgba(107,203,119,0.3), rgba(107,203,119,0.1))"
            : unlocked
              ? `linear-gradient(135deg, ${island.color}33, ${island.color}11)`
              : "rgba(255,255,255,0.05)",
          cursor: unlocked ? "pointer" : "not-allowed",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          position: "relative",
          boxShadow: unlocked
            ? `0 0 20px ${island.color}44, 0 0 40px ${island.color}22`
            : "none",
          fontFamily: "inherit",
          outline: "none",
        }}
      >
        {!unlocked && (
          <div
            style={{ fontSize: "1.5rem", filter: "grayscale(1)", opacity: 0.5 }}
          >
            🔒
          </div>
        )}
        {unlocked && !completed && (
          <div style={{ fontSize: "2rem" }}>{island.emoji}</div>
        )}
        {completed && <div style={{ fontSize: "1.8rem" }}>✅</div>}

        {/* Glow ring for current unlocked */}
        {unlocked && !completed && (
          <motion.div
            style={{
              position: "absolute",
              inset: "-6px",
              borderRadius: "50%",
              border: `2px solid ${island.color}`,
              opacity: 0.5,
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 + index * 0.1 }}
        style={{
          textAlign: "center",
          marginTop: "8px",
          fontWeight: 700,
          fontSize: "0.75rem",
          color: unlocked
            ? "var(--color-text-primary)"
            : "var(--color-text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        {island.name}
      </motion.div>
    </motion.div>
  );
}

// Path connecting islands
function ConnectionPath() {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 5,
        pointerEvents: "none",
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M 18 35 Q 30 45, 42 55 Q 50 42, 58 30 Q 65 42, 72 55 Q 78 45, 85 35"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.4"
        strokeDasharray="1 1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
    </svg>
  );
}

export function WorldMap() {
  const { playerName, getProgress } = useGameStore();
  const progress = getProgress();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #050219 0%, #0D0630 30%, #1B0A4A 60%, #0D0630 100%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <FloatingParticles />

      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(10px)",
          zIndex: 20,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "1rem",
              color: "var(--color-text-secondary)",
            }}
          >
            🦌 Halo,{" "}
            <span style={{ color: "var(--color-accent)" }}>{playerName}</span>!
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <ProgressBar progress={progress} />
          <CoinCounter />
        </div>
      </motion.div>

      {/* Map Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          textAlign: "center",
          padding: "20px",
          zIndex: 15,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            fontWeight: 900,
            background: "linear-gradient(135deg, #FFD93D, #FF6B9D)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          🗺️ Peta Nusantara
        </h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "0.9rem",
            marginTop: "4px",
          }}
        >
          Pilih pulau untuk memulai misi!
        </p>
      </motion.div>

      {/* Map area */}
      <div
        style={{
          flex: 1,
          position: "relative",
          margin: "0 20px 20px",
          minHeight: "400px",
        }}
      >
        {/* Ocean waves decorations */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            background:
              "linear-gradient(180deg, transparent, rgba(0,80,180,0.08))",
            borderRadius: "50% 50% 0 0",
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <ConnectionPath />

        {ISLANDS.map((island, i) => (
          <IslandNode key={island.id} island={island} index={i} />
        ))}
      </div>

      {/* Reset button */}
      <motion.button
        onClick={() => {
          if (confirm("Yakin mau mulai ulang?")) {
            useGameStore.getState().resetGame();
          }
        }}
        whileHover={{ scale: 1.05 }}
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          padding: "8px 12px",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 600,
          fontSize: "0.8rem",
          zIndex: 20,
        }}
      >
        🔄 Mulai Ulang
      </motion.button>
    </div>
  );
}
