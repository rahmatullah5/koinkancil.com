/** @format */

import { motion, AnimatePresence } from "framer-motion";
import {
  useGameStore,
  getIslandInfo,
  MAX_STEPS,
  type IslandId,
} from "../stores/gameStore";
import {
  CoinCounter,
  ProgressBar,
  FloatingParticles,
} from "../components/SharedComponents";
import { soundManager } from "../utils/soundManager";

// Step indicator showing progress through 5 islands
function StepCounter() {
  const { stepsUsed } = useGameStore();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span
        style={{
          fontSize: "0.8rem",
          color: "var(--color-text-secondary)",
          fontWeight: 700,
        }}
      >
        🗺️
      </span>
      {Array.from({ length: MAX_STEPS }, (_, i) => {
        const completed = i < stepsUsed;
        const current = i === stepsUsed;
        return (
          <motion.div
            key={i}
            animate={current ? { scale: [1, 1.3, 1] } : {}}
            transition={
              current
                ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            style={{
              width: completed ? "24px" : current ? "24px" : "16px",
              height: "8px",
              borderRadius: "4px",
              background: completed
                ? "var(--color-success)"
                : current
                  ? "var(--color-accent)"
                  : "rgba(255,255,255,0.15)",
              transition: "all 0.3s",
            }}
          />
        );
      })}
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-secondary)",
          fontWeight: 600,
          marginLeft: "4px",
        }}
      >
        {stepsUsed}/{MAX_STEPS}
      </span>
    </div>
  );
}

// Island card for fork selection
function IslandCard({
  islandId,
  onClick,
  delay = 0,
  isCompleted = false,
  isCurrent = false,
}: {
  islandId: IslandId;
  onClick?: () => void;
  delay?: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
}) {
  const info = getIslandInfo(islandId);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120 }}
      onClick={onClick}
      disabled={isCompleted || !onClick}
      whileHover={onClick && !isCompleted ? { scale: 1.05, y: -4 } : {}}
      whileTap={onClick && !isCompleted ? { scale: 0.95 } : {}}
      style={{
        background: isCompleted
          ? "linear-gradient(135deg, rgba(107,203,119,0.2), rgba(107,203,119,0.05))"
          : isCurrent
            ? `linear-gradient(135deg, ${info.color}22, ${info.color}11)`
            : `linear-gradient(135deg, ${info.color}15, ${info.color}08)`,
        border: isCompleted
          ? "2px solid var(--color-success)"
          : isCurrent
            ? `2px solid ${info.color}`
            : `2px solid ${info.color}44`,
        borderRadius: "20px",
        padding: "20px 24px",
        cursor: onClick && !isCompleted ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        minWidth: "130px",
        maxWidth: "160px",
        fontFamily: "Nunito, sans-serif",
        outline: "none",
        boxShadow:
          isCurrent && !isCompleted
            ? `0 0 25px ${info.color}33`
            : isCompleted
              ? "0 0 15px rgba(107,203,119,0.2)"
              : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow effect for clickable */}
      {onClick && !isCompleted && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            background: `radial-gradient(circle at center, ${info.color}15, transparent)`,
          }}
        />
      )}

      <motion.span
        animate={
          !isCompleted && onClick
            ? { y: [0, -4, 0], rotate: [0, 5, -5, 0] }
            : {}
        }
        transition={
          !isCompleted && onClick
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
        style={{ fontSize: "2.2rem", position: "relative", zIndex: 1 }}
      >
        {isCompleted ? "✅" : info.emoji}
      </motion.span>

      <span
        style={{
          fontWeight: 800,
          fontSize: "0.8rem",
          color: isCompleted
            ? "var(--color-success)"
            : "var(--color-text-primary)",
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {info.name}
      </span>

      <span
        style={{
          fontSize: "0.7rem",
          color: "var(--color-text-secondary)",
          opacity: 0.8,
          position: "relative",
          zIndex: 1,
        }}
      >
        {isCompleted ? "Selesai!" : info.description}
      </span>
    </motion.button>
  );
}

// The path visualization between completed and next islands
function PathLine({ direction = "down" }: { direction?: "down" | "fork" }) {
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: direction === "fork" ? "8px 0" : "4px 0",
      }}
    >
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: "2px",
          height: direction === "fork" ? "20px" : "30px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))",
        }}
      />
      <span style={{ fontSize: "0.8rem", opacity: 0.4 }}>
        {direction === "fork" ? "⚡" : "↓"}
      </span>
    </motion.div>
  );
}

export function WorldMap() {
  const {
    playerName,
    getProgress,
    completedLevels,
    currentIsland,
    availableNextIslands,
    stepsUsed,
    navigateToIsland,
  } = useGameStore();
  const progress = getProgress();

  // Determine what to show:
  // 1. Previously completed islands (trail)
  // 2. Current position indicator
  // 3. Next choices (fork or straight)

  const isFork = availableNextIslands.length > 1;
  const isStraight = availableNextIslands.length === 1;
  const isStart =
    stepsUsed === 0 &&
    currentIsland &&
    !completedLevels.includes(currentIsland);
  const isDone = stepsUsed >= MAX_STEPS;

  const handlePickIsland = (island: IslandId) => {
    soundManager.buttonClick();
    navigateToIsland(island);
  };

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
          <StepCounter />
          <ProgressBar progress={progress} />
          <CoinCounter />
        </div>
      </motion.div>

      {/* Title */}
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
          {isDone
            ? "Semua langkah selesai! 🎉"
            : isStart
              ? "Pulau pertamamu sudah menunggu!"
              : isFork
                ? "Pilih jalurmu! ⚡"
                : isStraight
                  ? "Lanjut ke pulau berikutnya!"
                  : "Jelajahi Nusantara!"}
        </p>
      </motion.div>

      {/* Path visualization */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 20px 20px",
          zIndex: 10,
          overflowY: "auto",
          gap: "0px",
        }}
      >
        {/* Completed islands trail */}
        {completedLevels.map((island, i) => (
          <div
            key={island}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <IslandCard islandId={island} isCompleted delay={i * 0.1} />
            <PathLine />
          </div>
        ))}

        {/* Current / Start island */}
        {isStart && currentIsland && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <IslandCard
                islandId={currentIsland}
                isCurrent
                onClick={() => handlePickIsland(currentIsland)}
              />
            </motion.div>

            {availableNextIslands.length > 0 && <PathLine />}
          </div>
        )}

        {/* Next choices */}
        {!isStart && !isDone && availableNextIslands.length > 0 && (
          <AnimatePresence>
            {isFork ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Fork label */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    background: "rgba(255,217,61,0.1)",
                    border: "1px solid rgba(255,217,61,0.3)",
                    borderRadius: "12px",
                    padding: "8px 16px",
                    marginBottom: "16px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#FFD93D",
                    }}
                  >
                    ⚡ Persimpangan! Pilih satu jalur:
                  </span>
                </motion.div>

                {/* Fork options */}
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {availableNextIslands.map((island, i) => (
                    <IslandCard
                      key={island}
                      islandId={island}
                      onClick={() => handlePickIsland(island)}
                      delay={0.4 + i * 0.15}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <IslandCard
                  islandId={availableNextIslands[0]}
                  isCurrent
                  onClick={() => handlePickIsland(availableNextIslands[0])}
                  delay={0.3}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Done state */}
        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", padding: "20px" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "8px" }}>🎊</div>
            <p style={{ fontWeight: 800, color: "var(--color-accent)" }}>
              Petualangan selesai!
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 16px",
          zIndex: 20,
        }}
      >
        <motion.button
          onClick={() => {
            if (confirm("Yakin mau mulai ulang?")) {
              useGameStore.getState().resetGame();
            }
          }}
          whileHover={{ scale: 1.05 }}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "8px 12px",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 600,
            fontSize: "0.8rem",
          }}
        >
          🔄 Mulai Ulang
        </motion.button>

        <motion.button
          onClick={() => {
            soundManager.buttonClick();
            useGameStore.getState().setPage("leaderboard");
          }}
          whileHover={{ scale: 1.05 }}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,217,61,0.15), rgba(108,99,255,0.15))",
            border: "1px solid rgba(255,217,61,0.3)",
            borderRadius: "12px",
            padding: "10px 16px",
            color: "#FFD93D",
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🏆 Leaderboard
        </motion.button>
      </div>
    </div>
  );
}
