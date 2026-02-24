/** @format */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";
import { FloatingParticles } from "../components/SharedComponents";

function CloudSVG({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 80"
      style={{ width: "120px", opacity: 0.15, ...style }}
    >
      <ellipse cx="60" cy="50" rx="60" ry="30" fill="white" />
      <ellipse cx="100" cy="40" rx="50" ry="25" fill="white" />
      <ellipse cx="140" cy="50" rx="55" ry="28" fill="white" />
      <ellipse cx="100" cy="55" rx="70" ry="22" fill="white" />
    </svg>
  );
}

export function LandingPage() {
  const {
    setPlayerName,
    setPlayerAge,
    startAdventure,
    soundEnabled,
    toggleSound,
    playerName,
  } = useGameStore();
  const [name, setName] = useState(playerName);
  const [age, setAge] = useState(8);
  const [showParentInfo, setShowParentInfo] = useState(false);
  const [step, setStep] = useState<"intro" | "form">("intro");

  const handleStart = () => {
    if (name.trim()) {
      setPlayerName(name.trim());
      setPlayerAge(age);
      soundManager.setEnabled(soundEnabled);
      soundManager.buttonClick();
      startAdventure();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0a0520 0%, #1a0d40 30%, #2d1566 60%, #1a0d40 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
      }}
    >
      <FloatingParticles />

      {/* Animated clouds */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ position: "absolute", top: `${10 + i * 15}%` }}
          animate={{ x: ["-200px", `${window.innerWidth + 200}px`] }}
          transition={{
            duration: 25 + i * 10,
            repeat: Infinity,
            ease: "linear",
            delay: i * 5,
          }}
        >
          <CloudSVG style={{}} />
        </motion.div>
      ))}

      {/* Floating Ketupat */}
      {["🎋", "🎋", "🌙", "⭐", "🕌"].map((emoji, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            fontSize: `${20 + Math.random() * 20}px`,
            left: `${10 + i * 18}%`,
            top: `${15 + (i % 3) * 20}%`,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Sound toggle */}
      <motion.button
        onClick={() => {
          toggleSound();
          soundManager.setEnabled(!soundEnabled);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          fontSize: "1.5rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {soundEnabled ? "🔊" : "🔇"}
      </motion.button>

      {/* Parent info */}
      <motion.button
        onClick={() => setShowParentInfo(true)}
        whileHover={{ scale: 1.05 }}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "12px",
          padding: "8px 16px",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 600,
          fontSize: "0.85rem",
          zIndex: 10,
        }}
      >
        👨‍👩‍👧 Info Orang Tua
      </motion.button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          textAlign: "center",
          zIndex: 5,
          maxWidth: "600px",
        }}
      >
        {/* Logo/Mascot */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: "5rem", marginBottom: "16px" }}
        >
          🦌
        </motion.div>

        <motion.h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            marginBottom: "8px",
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
            Misi THR Nusantara
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "1.1rem",
            marginBottom: "32px",
            fontWeight: 600,
          }}
        >
          "Selesaikan misi, kumpulkan koin, dan buka THR-mu!"
        </motion.p>

        <AnimatePresence mode="wait">
          {step === "intro" ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Story intro */}
              <motion.div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  padding: "24px 32px",
                  marginBottom: "32px",
                  textAlign: "left",
                  lineHeight: 1.8,
                }}
              >
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>📖</span> Si Kancil
                  kehilangan THR-nya! Koin THR tersebar di seluruh Nusantara.{" "}
                  <span
                    style={{ color: "var(--color-accent)", fontWeight: 700 }}
                  >
                    Bantulah Kancil mengumpulkannya!
                  </span>
                </p>
              </motion.div>

              <motion.button
                className="btn-accent"
                onClick={() => {
                  soundManager.buttonClick();
                  setStep("form");
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ fontSize: "1.3rem", padding: "18px 48px" }}
              >
                🚀 Mulai Petualangan!
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "24px",
                padding: "32px",
              }}
            >
              <h3
                style={{
                  marginBottom: "24px",
                  fontWeight: 800,
                  fontSize: "1.3rem",
                }}
              >
                👋 Siapa namamu?
              </h3>

              <input
                type="text"
                placeholder="Ketik nama kamu..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  borderRadius: "16px",
                  border: "2px solid rgba(108,99,255,0.3)",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  fontSize: "1.1rem",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  outline: "none",
                  marginBottom: "16px",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(108,99,255,0.8)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(108,99,255,0.3)")
                }
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                autoFocus
              />

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  🎂 Umur: {age} tahun
                </label>
                <input
                  type="range"
                  min={5}
                  max={15}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: "var(--color-primary)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.8rem",
                    marginTop: "4px",
                  }}
                >
                  <span>5</span>
                  <span>15</span>
                </div>
              </div>

              <motion.button
                className="btn-accent"
                onClick={handleStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!name.trim()}
                style={{
                  width: "100%",
                  fontSize: "1.2rem",
                  opacity: name.trim() ? 1 : 0.5,
                  cursor: name.trim() ? "pointer" : "not-allowed",
                }}
              >
                🦌 Ayo, {name.trim() || "..."}, Mulai!
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Parent Info Modal */}
      <AnimatePresence>
        {showParentInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowParentInfo(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--color-bg-card)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "24px",
                padding: "32px",
                maxWidth: "500px",
                width: "100%",
              }}
            >
              <h3
                style={{
                  marginBottom: "16px",
                  fontWeight: 800,
                  fontSize: "1.3rem",
                }}
              >
                🛡️ Informasi untuk Orang Tua
              </h3>
              <div
                style={{
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.8,
                  fontSize: "0.95rem",
                }}
              >
                <p style={{ marginBottom: "12px" }}>
                  <strong style={{ color: "white" }}>Misi THR Nusantara</strong>{" "}
                  adalah permainan edukatif yang aman untuk anak-anak.
                </p>
                <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
                  <li>✅ Tidak ada iklan</li>
                  <li>✅ Tidak ada fitur chat</li>
                  <li>✅ Tidak mengumpulkan data pribadi</li>
                  <li>✅ Nama hanya disimpan secara lokal di perangkat</li>
                  <li>✅ Semua konten aman dan edukatif</li>
                </ul>
                <p>
                  Permainan ini dirancang untuk mengasah kemampuan logika,
                  matematika, memori, dan kreativitas anak sambil merayakan
                  momen Lebaran. 🌙
                </p>
              </div>
              <motion.button
                className="btn-primary"
                onClick={() => setShowParentInfo(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: "20px", width: "100%" }}
              >
                Tutup
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
