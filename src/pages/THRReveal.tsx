/** @format */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useGameStore } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";
import { FloatingParticles } from "../components/SharedComponents";

const WHEEL_PRIZES = [
  { label: "Bonus +5 🪙", coins: 5, color: "#FF6B6B" },
  { label: "Bonus +10 🪙", coins: 10, color: "#6C63FF" },
  { label: "Bonus +3 🪙", coins: 3, color: "#FFD93D" },
  { label: "Bonus +15 🪙", coins: 15, color: "#FF6B9D" },
  { label: "Bonus +7 🪙", coins: 7, color: "#6BCB77" },
  { label: "Bonus +20 🪙", coins: 20, color: "#4FC3F7" },
  { label: "Bonus +2 🪙", coins: 2, color: "#FF8C42" },
  { label: "Bonus +12 🪙", coins: 12, color: "#B388FF" },
];

function LuckyWheel({ onComplete }: { onComplete: (coins: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<(typeof WHEEL_PRIZES)[0] | null>(null);
  const rotationRef = useRef(0);
  const animRef = useRef<number>();

  useEffect(() => {
    drawWheel(0);
  }, []);

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const sliceAngle = (2 * Math.PI) / WHEEL_PRIZES.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotation);

    WHEEL_PRIZES.forEach((prize, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.font = "bold 11px Nunito, sans-serif";
      ctx.fillText(prize.label, radius * 0.6, 4);
      ctx.restore();
    });

    ctx.restore();

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "var(--color-accent)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Arrow at top
    ctx.beginPath();
    ctx.moveTo(center, 5);
    ctx.lineTo(center - 12, 25);
    ctx.lineTo(center + 12, 25);
    ctx.closePath();
    ctx.fillStyle = "#FFD93D";
    ctx.fill();
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    soundManager.spinWheel();

    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const sliceAngle = (2 * Math.PI) / WHEEL_PRIZES.length;
    // Calculate target rotation: multiple full turns + land on prize
    const targetAngle =
      -(prizeIndex * sliceAngle + sliceAngle / 2) +
      Math.PI * 2 * (5 + Math.random() * 3);

    const startRotation = rotationRef.current;
    const totalRotation = targetAngle - startRotation;
    const duration = 4000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalRotation * eased;
      rotationRef.current = currentRotation;
      drawWheel(currentRotation);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setResult(WHEEL_PRIZES[prizeIndex]);
        soundManager.celebration();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center" }}
    >
      <h3
        style={{
          fontWeight: 800,
          fontSize: "1.3rem",
          marginBottom: "16px",
          color: "var(--color-accent)",
        }}
      >
        🎰 Lucky Spin!
      </h3>

      <div
        style={{
          position: "relative",
          display: "inline-block",
          marginBottom: "16px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          style={{ borderRadius: "50%" }}
        />
      </div>

      {!result ? (
        <motion.button
          className="btn-accent"
          onClick={spin}
          disabled={spinning}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: "block",
            margin: "0 auto",
            opacity: spinning ? 0.6 : 1,
            cursor: spinning ? "wait" : "pointer",
          }}
        >
          {spinning ? "⏳ Memutar..." : "🎯 Putar!"}
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "var(--color-accent)",
              marginBottom: "16px",
            }}
          >
            🎉 Kamu mendapat: {result.label}!
          </p>
          <motion.button
            className="btn-primary"
            onClick={() => onComplete(result.coins)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Klaim Hadiah! →
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

function Certificate({
  name,
  coins,
  date,
}: {
  name: string;
  coins: number;
  date: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, "#1a0d40");
    gradient.addColorStop(0.5, "#2d1566");
    gradient.addColorStop(1, "#1a0d40");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Border
    ctx.strokeStyle = "#FFD93D";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 560);

    // Inner border
    ctx.strokeStyle = "rgba(255,217,61,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 730, 530);

    // Corner decorations
    const corners = [
      [40, 40],
      [760, 40],
      [40, 560],
      [760, 560],
    ];
    corners.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD93D";
      ctx.fill();
    });

    // Title
    ctx.fillStyle = "#FFD93D";
    ctx.font = "bold 36px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆 SERTIFIKAT 🏆", 400, 100);

    ctx.fillStyle = "#B8B0E0";
    ctx.font = "18px Nunito, sans-serif";
    ctx.fillText("Misi THR Nusantara", 400, 135);

    // Decorative line
    ctx.beginPath();
    ctx.moveTo(150, 160);
    ctx.lineTo(650, 160);
    ctx.strokeStyle = "rgba(255,217,61,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Certificate text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px Nunito, sans-serif";
    ctx.fillText("Dengan bangga diberikan kepada:", 400, 210);

    // Name
    ctx.fillStyle = "#FF6B9D";
    ctx.font = "bold 42px Nunito, sans-serif";
    ctx.fillText(name, 400, 270);

    // Details
    ctx.fillStyle = "#B8B0E0";
    ctx.font = "18px Nunito, sans-serif";
    ctx.fillText("Telah berhasil menyelesaikan seluruh misi", 400, 330);
    ctx.fillText("dan mengumpulkan", 400, 360);

    ctx.fillStyle = "#FFD93D";
    ctx.font = "bold 28px Nunito, sans-serif";
    ctx.fillText(`💰 ${coins} Koin THR`, 400, 405);

    // Date
    ctx.fillStyle = "#B8B0E0";
    ctx.font = "16px Nunito, sans-serif";
    ctx.fillText(date, 400, 460);

    // Mascot
    ctx.font = "40px sans-serif";
    ctx.fillText("🦌", 400, 520);

    // Stars decoration
    ctx.font = "16px sans-serif";
    ["⭐", "✨", "🌟"].forEach((star, i) => {
      ctx.fillText(star, 100 + i * 30, 520);
      ctx.fillText(star, 670 + i * 30, 520);
    });
  }, [name, coins, date]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `sertifikat-${name.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div style={{ textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxWidth: "500px",
          borderRadius: "12px",
          border: "2px solid rgba(255,217,61,0.3)",
        }}
      />
      <motion.button
        onClick={download}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          display: "block",
          margin: "16px auto 0",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "12px",
          padding: "10px 24px",
          color: "white",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          fontSize: "0.95rem",
        }}
      >
        📥 Download Sertifikat
      </motion.button>
    </div>
  );
}

export function THRReveal() {
  const {
    playerName,
    coins,
    addCoins,
    voucherCode,
    unlockTHR,
    resetGame,
    setPage,
  } = useGameStore();
  const [stage, setStage] = useState<
    "drumroll" | "envelope" | "reveal" | "wheel" | "certificate"
  >("drumroll");

  useEffect(() => {
    if (!voucherCode) {
      unlockTHR();
    }
  }, []);

  useEffect(() => {
    if (stage === "drumroll") {
      soundManager.drumroll();
      setTimeout(() => setStage("envelope"), 2000);
    }
  }, [stage]);

  const openEnvelope = () => {
    soundManager.celebration();

    // Big confetti burst
    const end = Date.now() + 3000;
    const colors = ["#FFD93D", "#FF6B9D", "#6C63FF", "#6BCB77", "#FF8C42"];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setStage("reveal");
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #050219 0%, #0D0630 50%, #1B0A4A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
      }}
    >
      <FloatingParticles />

      <AnimatePresence mode="wait">
        {/* Stage 1: Drumroll */}
        {stage === "drumroll" && (
          <motion.div
            key="drumroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: "center", zIndex: 10 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ fontSize: "4rem", marginBottom: "16px" }}
            >
              🥁
            </motion.div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--color-accent)",
              }}
            >
              Mempersiapkan THR-mu...
            </motion.p>
          </motion.div>
        )}

        {/* Stage 2: Envelope */}
        {stage === "envelope" && (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 12 }}
            style={{ textAlign: "center", zIndex: 10 }}
          >
            <p
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: "24px",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              THR-mu sudah siap, {playerName}! 🎉
            </p>

            <motion.button
              onClick={openEnvelope}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(255,217,61,0.3)",
                  "0 0 50px rgba(255,217,61,0.6)",
                  "0 0 20px rgba(255,217,61,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontSize: "6rem",
                background:
                  "linear-gradient(135deg, rgba(255,217,61,0.15), rgba(255,107,157,0.15))",
                border: "3px solid rgba(255,217,61,0.5)",
                borderRadius: "30px",
                padding: "40px 60px",
                cursor: "pointer",
                display: "block",
                margin: "0 auto 24px",
                outline: "none",
              }}
            >
              🧧
            </motion.button>

            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ color: "var(--color-accent)", fontWeight: 700 }}
            >
              Klik untuk membuka THR-mu! ✨
            </motion.p>
          </motion.div>
        )}

        {/* Stage 3: Reveal */}
        {stage === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              textAlign: "center",
              zIndex: 10,
              maxWidth: "500px",
              width: "100%",
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,217,61,0.1), rgba(255,107,157,0.1))",
                border: "2px solid rgba(255,217,61,0.3)",
                borderRadius: "24px",
                padding: "32px",
                marginBottom: "24px",
              }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: 3 }}
                style={{ fontSize: "3rem", marginBottom: "12px" }}
              >
                🎊
              </motion.div>

              <h2
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 900,
                  marginBottom: "8px",
                  background: "linear-gradient(135deg, #FFD93D, #FF6B9D)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Selamat, {playerName}! 🎉
              </h2>

              <p
                style={{
                  color: "var(--color-text-secondary)",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                Kamu berhasil menyelesaikan
                <br />
                <strong style={{ color: "var(--color-accent)" }}>
                  Misi THR Nusantara!
                </strong>
              </p>

              <p
                style={{
                  color: "var(--color-text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Ini THR spesial untuk kamu:
              </p>

              {/* Voucher code */}
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "16px",
                  padding: "16px",
                  border: "2px dashed rgba(255,217,61,0.5)",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "0.85rem",
                    marginBottom: "4px",
                  }}
                >
                  Kode Voucher:
                </p>
                <p
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 900,
                    color: "var(--color-accent)",
                    letterSpacing: "3px",
                    fontFamily: "monospace",
                  }}
                >
                  {voucherCode || "THR-XXXXXXXX"}
                </p>
              </motion.div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>💰 {coins} Koin</span>
                <span>•</span>
                <span>🏝️ 5 Pulau</span>
                <span>•</span>
                <span>⭐ Lengkap!</span>
              </div>
            </motion.div>

            <motion.button
              className="btn-accent"
              onClick={() => setStage("wheel")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ marginBottom: "12px", width: "100%" }}
            >
              🎰 Bonus: Lucky Spin! →
            </motion.button>
          </motion.div>
        )}

        {/* Stage 4: Wheel */}
        {stage === "wheel" && (
          <motion.div
            key="wheel"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ zIndex: 10, maxWidth: "400px", width: "100%" }}
          >
            <LuckyWheel
              onComplete={(bonusCoins) => {
                addCoins(bonusCoins);
                setStage("certificate");
              }}
            />
          </motion.div>
        )}

        {/* Stage 5: Certificate */}
        {stage === "certificate" && (
          <motion.div
            key="cert"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              zIndex: 10,
              maxWidth: "600px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontWeight: 800,
                fontSize: "1.3rem",
                marginBottom: "16px",
                color: "var(--color-accent)",
              }}
            >
              🏆 Sertifikat Kamu
            </h3>
            <Certificate name={playerName} coins={coins} date={today} />

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "24px",
                flexWrap: "wrap",
              }}
            >
              <motion.button
                className="btn-primary"
                onClick={() => {
                  resetGame();
                  setPage("landing");
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Main Lagi
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
