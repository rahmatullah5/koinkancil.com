/** @format */

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GameLayout,
  CompletionOverlay,
  GameTimer,
  TimeUpOverlay,
} from "../components/SharedComponents";
import { useGameStore, COINS_PER_LEVEL } from "../stores/gameStore";
import { soundManager } from "../utils/soundManager";

const COLORS = [
  "#FF6B6B",
  "#6BCB77",
  "#4D96FF",
  "#FFD93D",
  "#FF9900",
  "#9B59B6",
  "#E91E63",
  "#00BCD4",
  "#FF5722",
  "#8BC34A",
];

const SIZES = [4, 8, 14, 22];

export function CreativeChallenge() {
  const { setPage, completeLevel, getDifficultyConfig } = useGameStore();
  const config = getDifficultyConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(8);
  const [showCompletion, setShowCompletion] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [key, setKey] = useState(0);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (showCompletion || timeUp) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      setHasDrawn(true);
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    [getPos, showCompletion, timeUp],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || showCompletion || timeUp) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, color, brushSize, getPos, showCompletion, timeUp],
  );

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.fillStyle = "#1a0d40";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSubmit = () => {
    if (!hasDrawn) return;
    soundManager.levelComplete();
    setShowCompletion(true);
  };

  const handleRetry = () => {
    clearCanvas();
    setTimeUp(false);
    setShowCompletion(false);
    setKey((k) => k + 1);
  };

  return (
    <GameLayout title="🎨 Pulau Kreatif" onBack={() => setPage("worldmap")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", maxWidth: "600px", width: "100%" }}
      >
        {/* Timer (if enabled) */}
        {config.creativeTimerEnabled && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <GameTimer
              key={key}
              seconds={config.creativeTimerSeconds}
              onTimeUp={() => setTimeUp(true)}
              paused={showCompletion || timeUp}
            />
          </div>
        )}

        <h3 style={{ marginBottom: "8px", fontWeight: 800 }}>
          {config.creativePrompt
            ? config.creativePrompt
            : "Gambarlah Ucapan Lebaran! ✏️"}
        </h3>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          {config.creativePrompt
            ? "Ikuti tantangan di atas dan tunjukkan kreativitasmu!"
            : "Buat gambar atau tulisan kreatifmu di kanvas di bawah"}
        </p>

        {/* Canvas */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            borderRadius: "16px",
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.15)",
            marginBottom: "16px",
            touchAction: "none",
          }}
        >
          <canvas
            ref={canvasRef}
            width={500}
            height={350}
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#1a0d40",
              cursor: "crosshair",
              display: "block",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>

        {/* Color palette */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "12px",
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
                  color === c ? "3px solid white" : "3px solid transparent",
                cursor: "pointer",
                outline: "none",
                boxShadow: color === c ? `0 0 12px ${c}` : "none",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>

        {/* Brush sizes */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "16px",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.85rem",
            }}
          >
            🖌️
          </span>
          {SIZES.map((s) => (
            <motion.button
              key={s}
              onClick={() => setBrushSize(s)}
              whileHover={{ scale: 1.1 }}
              style={{
                width: `${18 + s * 1.5}px`,
                height: `${18 + s * 1.5}px`,
                borderRadius: "50%",
                background:
                  brushSize === s
                    ? "var(--color-primary)"
                    : "rgba(255,255,255,0.15)",
                border: "none",
                cursor: "pointer",
                outline: "none",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <motion.button
            onClick={clearCanvas}
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
            🗑️ Hapus
          </motion.button>
          <motion.button
            className="btn-accent"
            onClick={handleSubmit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              opacity: hasDrawn ? 1 : 0.5,
              cursor: hasDrawn ? "pointer" : "not-allowed",
            }}
          >
            📬 Kirim Karya!
          </motion.button>
        </div>
      </motion.div>

      <CompletionOverlay
        show={showCompletion}
        coins={COINS_PER_LEVEL}
        onContinue={() => completeLevel("kreatif")}
      />
      <TimeUpOverlay
        show={timeUp}
        onRetry={handleRetry}
        onQuit={() => setPage("worldmap")}
      />
    </GameLayout>
  );
}
