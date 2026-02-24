/** @format */

import { useGameStore } from "./stores/gameStore";
import { LandingPage } from "./pages/LandingPage";
import { WorldMap } from "./pages/WorldMap";
import { THRReveal } from "./pages/THRReveal";
import { LogicPuzzle } from "./games/LogicPuzzle";
import { MathBattle } from "./games/MathBattle";
import { ColorShape } from "./games/ColorShape";
import { MemoryGame } from "./games/MemoryGame";
import { CreativeChallenge } from "./games/CreativeChallenge";
import { Leaderboard } from "./pages/Leaderboard";
import { AnimatePresence, motion } from "framer-motion";
import "./index.css";

function GameRouter() {
  const { currentPage, currentIsland } = useGameStore();

  if (currentPage === "game" && currentIsland) {
    switch (currentIsland) {
      case "logika":
        return <LogicPuzzle />;
      case "warna":
        return <ColorShape />;
      case "matematika":
        return <MathBattle />;
      case "memori":
        return <MemoryGame />;
      case "kreatif":
        return <CreativeChallenge />;
    }
  }

  switch (currentPage) {
    case "landing":
      return <LandingPage />;
    case "worldmap":
      return <WorldMap />;
    case "thr-reveal":
      return <THRReveal />;
    case "leaderboard":
      return <Leaderboard />;
    default:
      return <LandingPage />;
  }
}

export default function App() {
  const currentPage = useGameStore((s) => s.currentPage);
  const currentIsland = useGameStore((s) => s.currentIsland);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentPage}-${currentIsland}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GameRouter />
      </motion.div>
    </AnimatePresence>
  );
}
