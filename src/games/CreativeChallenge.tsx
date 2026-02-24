/** @format */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { GameLayout, CompletionOverlay } from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

const COLORS = [
  "#FF6B6B",
  "#6C63FF",
  "#FFD93D",
  "#6BCB77",
  "#FF6B9D",
  "#4FC3F7",
  "#FF8C42",
  "#B388FF",
  "#FFFFFF",
  "#1A1A2E",
];

const BRUSH_SIZES = [4, 8, 14, 22];

export function CreativeChallenge() {
  const { setPage, completeLevel, playerName } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw hint text
    ctx.fillStyle = "#CCCCCC";
    ctx.font = "16px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "🎨 Gambarlah sesuatu yang indah!",
      rect.width / 2,
      rect.height / 2 - 10,
    );
    ctx.fillText(
      "Ucapan Lebaran, Ketupat, atau apa saja!",
      rect.width / 2,
      rect.height / 2 + 15,
    );
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getPos(e);
    lastPosRef.current = pos;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const pos = getPos(e);
      const last = lastPosRef.current;

      if (last) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      lastPosRef.current = pos;
    },
    [isDrawing, color, brushSize],
  );

  const stopDraw = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  const handleSubmit = () => {
    if (!hasDrawn) return;
    soundManager.levelComplete();
    setShowCompletion(true);
  };

  return (
    <GameLayout title="🎤 Pulau Kreatif" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <h3 style={{ marginBottom: "4px", fontWeight: 800 }}>
          Buat Karya Senimu! 🖌️
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          Gambar ucapan Lebaran atau sesuatu yang kreatif untuk {playerName}!
        </p>

        {/* Canvas */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "20px",
            padding: "12px",
            border: "2px solid rgba(255,255,255,0.1)",
            marginBottom: "16px",
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            style={{
              width: "100%",
              height: "300px",
              borderRadius: "14px",
              cursor: "crosshair",
              touchAction: "none",
              display: "block",
            }}
          />
        </div>

        {/* Tools */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {/* Color picker */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {COLORS.map((c) => (
              <motion.button
                key={c}
                onClick={() => setColor(c)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: c,
                  border:
                    color === c
                      ? "3px solid var(--color-accent)"
                      : "2px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow:
                    color === c ? "0 0 10px rgba(255,217,61,0.5)" : "none",
                }}
              />
            ))}
          </div>

          {/* Brush size */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              Ukuran:
            </span>
            {BRUSH_SIZES.map((size) => (
              <motion.button
                key={size}
                onClick={() => setBrushSize(size)}
                whileHover={{ scale: 1.1 }}
                style={{
                  width: `${size + 20}px`,
                  height: `${size + 20}px`,
                  borderRadius: "50%",
                  background:
                    brushSize === size
                      ? "rgba(108,99,255,0.3)"
                      : "rgba(255,255,255,0.05)",
                  border:
                    brushSize === size
                      ? "2px solid var(--color-primary)"
                      : "2px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  outline: "none",
                }}
              >
                <div
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <motion.button
            onClick={clearCanvas}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "14px",
              padding: "12px 24px",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            🗑 Hapus
          </motion.button>

          <motion.button
            className="btn-accent"
            onClick={handleSubmit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              opacity: hasDrawn ? 1 : 0.5,
              cursor: hasDrawn ? "pointer" : "not-allowed",
              padding: "12px 32px",
            }}
          >
            ✅ Selesai & Kirim!
          </motion.button>
        </div>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("kreatif")}
      />
    </GameLayout>
  );
}
