/** @format */

import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = join(__dirname, "data");
const LEADERBOARD_FILE = join(DATA_DIR, "leaderboard.json");
const MAX_ENTRIES = 50;

// Ensure data directory and file exist
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}
if (!existsSync(LEADERBOARD_FILE)) {
  writeFileSync(LEADERBOARD_FILE, "[]", "utf-8");
}

app.use(cors());
app.use(express.json());

// --- Leaderboard API ---

// GET /api/leaderboard — returns top entries sorted by coins (desc)
app.get("/api/leaderboard", (_req, res) => {
  try {
    const data = JSON.parse(readFileSync(LEADERBOARD_FILE, "utf-8"));
    const sorted = data
      .sort((a, b) => b.coins - a.coins)
      .slice(0, MAX_ENTRIES)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
    res.json(sorted);
  } catch (err) {
    console.error("Error reading leaderboard:", err);
    res.status(500).json({ error: "Failed to read leaderboard" });
  }
});

// POST /api/leaderboard — add a new score entry
app.post("/api/leaderboard", (req, res) => {
  try {
    const { playerName, coins, difficulty } = req.body;

    if (!playerName || typeof coins !== "number" || !difficulty) {
      return res.status(400).json({ error: "Missing required fields: playerName, coins, difficulty" });
    }

    const data = JSON.parse(readFileSync(LEADERBOARD_FILE, "utf-8"));

    const newEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      playerName: String(playerName).slice(0, 20),
      coins: Math.min(100, Math.max(0, Math.round(coins))),
      difficulty: String(difficulty),
      completedAt: new Date().toISOString(),
    };

    data.push(newEntry);

    // Keep only the top entries to prevent file from growing indefinitely
    const sorted = data.sort((a, b) => b.coins - a.coins).slice(0, MAX_ENTRIES * 2);
    writeFileSync(LEADERBOARD_FILE, JSON.stringify(sorted, null, 2), "utf-8");

    // Find rank of newly added entry
    const rank = sorted.findIndex((e) => e.id === newEntry.id) + 1;

    res.status(201).json({ ...newEntry, rank });
  } catch (err) {
    console.error("Error writing leaderboard:", err);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// --- Production: Serve static files ---
if (process.env.NODE_ENV === "production") {
  const distPath = join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🦌 Leaderboard API running at http://localhost:${PORT}`);
});
