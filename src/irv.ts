export interface IrvResult {
  rank: number;
  participantId: number;
}

export function runIRV(
  ballots: number[][],  // each ballot is an ordered array of participant IDs (index 0 = first choice)
  allDishIds: number[]
): IrvResult[] {
  if (allDishIds.length === 0) return [];
  if (allDishIds.length === 1) return [{ rank: 1, participantId: allDishIds[0] }];

  const eliminated = new Set<number>();
  const eliminationOrder: number[] = []; // first eliminated appended first

  while (true) {
    const remaining = allDishIds.filter(id => !eliminated.has(id));
    if (remaining.length <= 1) break;

    const tally = new Map<number, number>();
    for (const id of remaining) tally.set(id, 0);

    let totalVotes = 0;
    for (const ballot of ballots) {
      const topChoice = ballot.find(id => !eliminated.has(id));
      if (topChoice !== undefined) {
        tally.set(topChoice, (tally.get(topChoice) ?? 0) + 1);
        totalVotes++;
      }
    }

    // Check for majority winner
    const majorityThreshold = totalVotes / 2;
    const winner = remaining.find(id => (tally.get(id) ?? 0) > majorityThreshold);
    if (winner !== undefined) break;

    // Eliminate dish with fewest votes (tie-break: smallest id)
    let minVotes = Infinity;
    let loser = remaining[0];
    for (const id of remaining) {
      const votes = tally.get(id) ?? 0;
      if (votes < minVotes || (votes === minVotes && id < loser)) {
        minVotes = votes;
        loser = id;
      }
    }
    eliminated.add(loser);
    eliminationOrder.push(loser);
  }

  // Build final results: remaining (non-eliminated) come first by tally, then eliminated in reverse order
  const remaining = allDishIds.filter(id => !eliminated.has(id));

  // Final tally for remaining dishes
  const finalTally = new Map<number, number>();
  for (const id of remaining) finalTally.set(id, 0);
  for (const ballot of ballots) {
    const topChoice = ballot.find(id => !eliminated.has(id));
    if (topChoice !== undefined) {
      finalTally.set(topChoice, (finalTally.get(topChoice) ?? 0) + 1);
    }
  }

  remaining.sort((a, b) => {
    const diff = (finalTally.get(b) ?? 0) - (finalTally.get(a) ?? 0);
    return diff !== 0 ? diff : a - b;
  });

  // eliminationOrder: first item = first eliminated = last place
  // Reverse to get last-place first
  const orderedEliminated = [...eliminationOrder].reverse();

  const allOrdered = [...remaining, ...orderedEliminated];

  // Assign ranks (ties share a rank)
  const results: IrvResult[] = [];
  let currentRank = 1;
  for (let i = 0; i < allOrdered.length; i++) {
    results.push({ rank: currentRank, participantId: allOrdered[i] });
    currentRank++;
  }

  return results;
}
