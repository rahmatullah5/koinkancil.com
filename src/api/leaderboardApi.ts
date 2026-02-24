/** @format */

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  coins: number;
  difficulty: string;
  completedAt: string;
  rank?: number;
}

const API_BASE = "/api";

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/leaderboard`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export async function submitScore(entry: {
  playerName: string;
  coins: number;
  difficulty: string;
}): Promise<LeaderboardEntry> {
  const res = await fetch(`${API_BASE}/leaderboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("Failed to submit score");
  return res.json();
}
