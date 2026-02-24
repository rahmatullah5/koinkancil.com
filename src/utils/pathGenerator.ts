/** @format */

import type { IslandId } from "../stores/gameStore";
import { ALL_ISLANDS } from "../stores/gameStore";

export interface PathNode {
  islandId: IslandId;
  next: IslandId[]; // 1 = straight, 2-3 = fork
}

export type PathGraph = PathNode[];

const MAX_STEPS = 5;

/**
 * Generate a randomized branching path graph for a playthrough.
 *
 * The graph has exactly `MAX_STEPS` depth. At each depth a node may have
 * 1 successor (straight) or 2-3 successors (fork). Regardless of which
 * branch the player picks, every route is exactly 5 islands long.
 *
 * Returns a flat list of PathNodes. The first element is the starting island.
 */
export function generatePathGraph(): PathGraph {
  const pool = shuffleArray([...ALL_ISLANDS.map((i) => i.id)]);
  const used = new Set<IslandId>();
  const graph: PathGraph = [];

  // Build depth-first. We need islands for each layer of the tree.
  // Layer 0: 1 island (start)
  // Layer 1-4: 1-3 islands each, depending on forks

  // Simple approach: walk 5 layers, at some layers create forks
  // To keep it manageable, we allow forks at layer 1 and layer 3
  // Fork means the player PICKS one, so both branches need to continue
  // to depth 5 independently.

  // Strategy: build the "main path" of 5 islands, then at fork points
  // add 1-2 alternative islands that the player could pick instead.
  // After a fork, the path converges back (or continues independently).

  // Simplified model:
  //   Start → [fork?] → Island → [fork?] → Island → Island → End
  //
  // Each node has `next` pointing to possible next islands.
  // We just build a tree of depth 5 that's flat-stored.

  const pickIsland = (): IslandId => {
    for (const id of pool) {
      if (!used.has(id)) {
        used.add(id);
        return id;
      }
    }
    // Fallback: if we run out (shouldn't with 17 islands for a 5-depth tree)
    const remaining = ALL_ISLANDS.filter((i) => !used.has(i.id));
    if (remaining.length > 0) {
      const id = remaining[0].id;
      used.add(id);
      return id;
    }
    // absolute fallback
    return pool[0];
  };

  // Decide fork pattern: randomly place 1-2 forks in the 5-step journey
  // Forks at positions 0-3 (position 4 is the last step, no next needed)
  const forkPositions = new Set<number>();
  const numForks = 1 + Math.floor(Math.random() * 2); // 1 or 2 forks
  while (forkPositions.size < numForks) {
    forkPositions.add(Math.floor(Math.random() * 4)); // positions 0-3
  }

  // Build layer by layer
  // We track "active branches" — each branch is a sequence of island IDs
  type Branch = IslandId[];
  let branches: Branch[] = [[]];

  for (let depth = 0; depth < MAX_STEPS; depth++) {
    const newBranches: Branch[] = [];

    for (const branch of branches) {
      const island = pickIsland();
      const extended = [...branch, island];

      if (depth < MAX_STEPS - 1 && forkPositions.has(depth)) {
        // Fork: this island has 2 possible next islands
        // But the player picks one, so both lead to independent continuations
        // We duplicate the branch
        newBranches.push(extended);
        newBranches.push(extended); // second branch diverges at next depth
      } else {
        newBranches.push(extended);
      }
    }

    branches = newBranches;
  }

  // Now convert branches into a graph
  // Collect all unique islands and their successors
  const nodeMap = new Map<IslandId, Set<IslandId>>();

  for (const branch of branches) {
    for (let i = 0; i < branch.length; i++) {
      if (!nodeMap.has(branch[i])) {
        nodeMap.set(branch[i], new Set());
      }
      if (i < branch.length - 1) {
        nodeMap.get(branch[i])!.add(branch[i + 1]);
      }
    }
  }

  // Convert to PathGraph
  for (const [islandId, nextSet] of nodeMap) {
    graph.push({
      islandId,
      next: [...nextSet],
    });
  }

  return graph;
}

/**
 * Get the starting island of a path graph.
 * It's the island that doesn't appear as a "next" of any other node.
 */
export function getStartIsland(graph: PathGraph): IslandId {
  const allNexts = new Set<IslandId>();
  for (const node of graph) {
    for (const n of node.next) {
      allNexts.add(n);
    }
  }
  for (const node of graph) {
    if (!allNexts.has(node.islandId)) {
      return node.islandId;
    }
  }
  return graph[0].islandId;
}

/**
 * Get the next options from the current island in the path graph.
 */
export function getNextIslands(
  graph: PathGraph,
  currentIsland: IslandId,
): IslandId[] {
  const node = graph.find((n) => n.islandId === currentIsland);
  return node ? node.next : [];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
