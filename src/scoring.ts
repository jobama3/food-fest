export interface ScoringResult {
  rank: number;
  participantId: number;
  points: number;
  tied: boolean;
}

export function scoreVotes(
  ballots: number[][],
  allDishIds: number[]
): ScoringResult[] {
  if (allDishIds.length === 0) return [];

  const pointsMap = new Map<number, number>();
  for (const id of allDishIds) pointsMap.set(id, 0);

  for (const ballot of ballots) {
    const n = ballot.length;
    for (let i = 0; i < n; i++) {
      const id = ballot[i];
      if (pointsMap.has(id)) {
        pointsMap.set(id, (pointsMap.get(id) ?? 0) + (n - i));
      }
    }
  }

  // Sort by points descending, stable by id ascending
  const sorted = [...allDishIds].sort((a, b) => {
    const diff = (pointsMap.get(b) ?? 0) - (pointsMap.get(a) ?? 0);
    return diff !== 0 ? diff : a - b;
  });

  // Assign ranks with standard competition ranking (1,1,3 for a 2-way tie)
  const results: ScoringResult[] = [];
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    const id = sorted[i];
    const pts = pointsMap.get(id) ?? 0;
    if (i > 0 && pts !== (pointsMap.get(sorted[i - 1]) ?? 0)) {
      currentRank = i + 1;
    }
    const tied =
      (i > 0 && pts === (pointsMap.get(sorted[i - 1]) ?? 0)) ||
      (i < sorted.length - 1 && pts === (pointsMap.get(sorted[i + 1]) ?? 0));
    results.push({ rank: currentRank, participantId: id, points: pts, tied });
  }
  return results;
}
