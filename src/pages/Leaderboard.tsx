/** @format */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGameStore,
  DIFFICULTY_CONFIGS,
  DifficultyLevel,
} from "../stores/gameStore";
import { getLeaderboard, LeaderboardEntry } from "../api/leaderboardApi";
import { soundManager } from "../utils/soundManager";
import { FloatingParticles } from "../components/SharedComponents";

const DIFFICULTY_BADGES: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  elementary: {
    label: "SD",
    color: DIFFICULTY_CONFIGS.elementary.color,
    emoji: "📚",
  },
  junior: { label: "SMP", color: DIFFICULTY_CONFIGS.junior.color, emoji: "🎓" },
  senior: { label: "SMA", color: DIFFICULTY_CONFIGS.senior.color, emoji: "🏆" },
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function Skeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "20px",
      }}
    >
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
          style={{
            height: "56px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </div>
  );
}

function PodiumCard({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: number;
}) {
  const heights = [140, 120, 100];
  const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const glows = [
    "0 0 40px rgba(255,215,0,0.4)",
    "0 0 30px rgba(192,192,192,0.3)",
    "0 0 25px rgba(205,127,50,0.3)",
  ];
  const badge =
    DIFFICULTY_BADGES[entry.difficulty] || DIFFICULTY_BADGES.elementary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3 + position * 0.15,
        type: "spring",
        stiffness: 120,
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        order: position === 0 ? 1 : position === 1 ? 0 : 2,
        flex: 1,
      }}
    >
      {/* Medal */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: position * 0.3,
        }}
        style={{ fontSize: "2.5rem" }}
      >
        {RANK_MEDALS[position]}
      </motion.div>

      {/* Name */}
      <div
        style={{
          fontWeight: 900,
          fontSize: "0.95rem",
          color: "white",
          textAlign: "center",
          maxWidth: "100px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.playerName}
      </div>

      {/* Difficulty badge */}
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          padding: "2px 10px",
          borderRadius: "8px",
          background: `${badge.color}22`,
          color: badge.color,
          border: `1px solid ${badge.color}44`,
        }}
      >
        {badge.emoji} {badge.label}
      </span>

      {/* Podium bar */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: heights[position] }}
        transition={{
          delay: 0.5 + position * 0.1,
          duration: 0.6,
          type: "spring",
        }}
        style={{
          width: "100%",
          maxWidth: "100px",
          background: `linear-gradient(180deg, ${colors[position]}33, ${colors[position]}11)`,
          border: `2px solid ${colors[position]}66`,
          borderRadius: "16px 16px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          boxShadow: glows[position],
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>🪙</span>
        <span
          style={{
            fontWeight: 900,
            fontSize: "1.1rem",
            color: colors[position],
          }}
        >
          {entry.coins}
        </span>
      </motion.div>
    </motion.div>
  );
}

export function Leaderboard() {
  const { playerName, setPage } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DifficultyLevel | "all">("all");

  useEffect(() => {
    getLeaderboard()
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat leaderboard 😢");
        setLoading(false);
      });
  }, []);

  const filteredEntries =
    filter === "all" ? entries : entries.filter((e) => e.difficulty === filter);

  // Re-rank after filtering
  const rankedEntries = filteredEntries.map((e, i) => ({ ...e, rank: i + 1 }));
  const top3 = rankedEntries.slice(0, 3);
  const rest = rankedEntries.slice(3);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0a0520 0%, #1a0d40 30%, #2d1566 60%, #1a0d40 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
      }}
    >
      <FloatingParticles />

      {/* Back button */}
      <motion.button
        onClick={() => {
          soundManager.buttonClick();
          setPage("worldmap");
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "12px",
          padding: "10px 20px",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          fontSize: "0.9rem",
          zIndex: 10,
        }}
      >
        ← Kembali
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: "center",
          zIndex: 5,
          marginTop: "60px",
          marginBottom: "24px",
        }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: "3.5rem", marginBottom: "8px" }}
        >
          🏆
        </motion.div>
        <h1
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: 900,
            marginBottom: "6px",
            lineHeight: 1.2,
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #FFD93D, #FF6B9D, #6C63FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Papan Peringkat
          </span>
        </h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "0.95rem",
            fontWeight: 600,
          }}
        >
          Petualang terhebat Nusantara! 🦌
        </p>
      </motion.div>

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          zIndex: 5,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          {
            key: "all" as const,
            label: "Semua",
            color: "#6C63FF",
            emoji: "🌟",
          },
          {
            key: "elementary" as const,
            label: "SD",
            color: DIFFICULTY_CONFIGS.elementary.color,
            emoji: "📚",
          },
          {
            key: "junior" as const,
            label: "SMP",
            color: DIFFICULTY_CONFIGS.junior.color,
            emoji: "🎓",
          },
          {
            key: "senior" as const,
            label: "SMA",
            color: DIFFICULTY_CONFIGS.senior.color,
            emoji: "🏆",
          },
        ].map((tab) => {
          const isActive = filter === tab.key;
          return (
            <motion.button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                soundManager.buttonClick();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                border: isActive
                  ? `2px solid ${tab.color}`
                  : "2px solid rgba(255,255,255,0.1)",
                background: isActive
                  ? `${tab.color}22`
                  : "rgba(255,255,255,0.05)",
                color: isActive ? tab.color : "var(--color-text-secondary)",
                transition: "all 0.3s",
              }}
            >
              {tab.emoji} {tab.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Content */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          zIndex: 5,
        }}
      >
        {loading ? (
          <Skeleton />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--color-text-secondary)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>😢</div>
            <p style={{ fontWeight: 700 }}>{error}</p>
          </motion.div>
        ) : rankedEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: "center",
              padding: "40px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🦌</div>
            <p
              style={{
                fontWeight: 700,
                color: "var(--color-text-secondary)",
                fontSize: "1.1rem",
              }}
            >
              Belum ada petualang!
            </p>
            <p
              style={{
                color: "var(--color-text-secondary)",
                opacity: 0.7,
                marginTop: "8px",
              }}
            >
              Jadilah yang pertama menyelesaikan misi! 🚀
            </p>
          </motion.div>
        ) : (
          <>
            {/* Podium for top 3 */}
            <AnimatePresence>
              {top3.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    gap: "12px",
                    marginBottom: "28px",
                    padding: "0 10px",
                  }}
                >
                  {top3.map((entry, i) => (
                    <PodiumCard key={entry.id} entry={entry} position={i} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table for the rest */}
            {rest.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                {rest.map((entry, i) => {
                  const badge =
                    DIFFICULTY_BADGES[entry.difficulty] ||
                    DIFFICULTY_BADGES.elementary;
                  const isCurrentPlayer =
                    playerName &&
                    entry.playerName.toLowerCase() === playerName.toLowerCase();

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "14px 20px",
                        gap: "14px",
                        borderBottom:
                          i < rest.length - 1
                            ? "1px solid rgba(255,255,255,0.05)"
                            : "none",
                        background: isCurrentPlayer
                          ? "rgba(108,99,255,0.1)"
                          : "transparent",
                        transition: "background 0.3s",
                      }}
                    >
                      {/* Rank */}
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: "0.9rem",
                          color: "var(--color-text-secondary)",
                          minWidth: "30px",
                          textAlign: "center",
                          opacity: 0.6,
                        }}
                      >
                        #{entry.rank}
                      </span>

                      {/* Name */}
                      <span
                        style={{
                          flex: 1,
                          fontWeight: isCurrentPlayer ? 900 : 700,
                          fontSize: "0.95rem",
                          color: isCurrentPlayer ? "#6C63FF" : "white",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.playerName}
                        {isCurrentPlayer && (
                          <span
                            style={{ marginLeft: "6px", fontSize: "0.75rem" }}
                          >
                            (Kamu!)
                          </span>
                        )}
                      </span>

                      {/* Difficulty */}
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: `${badge.color}22`,
                          color: badge.color,
                          border: `1px solid ${badge.color}33`,
                        }}
                      >
                        {badge.label}
                      </span>

                      {/* Coins */}
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: "0.95rem",
                          color: "#FFD93D",
                          minWidth: "50px",
                          textAlign: "right",
                        }}
                      >
                        🪙 {entry.coins}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
