import { Router, Request } from 'express';
import db from '../db';
import { runIRV } from '../irv';

const router = Router({ mergeParams: true });

router.get('/', (req: Request<{ id: string }>, res) => {
  const { id: event_id } = req.params;

  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(event_id);
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }

  const participants = db.prepare(
    'SELECT id, dish_name, username FROM participants WHERE event_id = ? ORDER BY id ASC'
  ).all(event_id) as { id: number; dish_name: string; username: string }[];

  const voteRows = db.prepare(`
    SELECT voter_id, ranked_dish_id, rank
    FROM votes
    WHERE event_id = ?
    ORDER BY voter_id, rank ASC
  `).all(event_id) as { voter_id: number; ranked_dish_id: number; rank: number }[];

  // Group votes by voter into ordered ballot arrays
  const ballotMap = new Map<number, number[]>();
  for (const row of voteRows) {
    if (!ballotMap.has(row.voter_id)) ballotMap.set(row.voter_id, []);
    ballotMap.get(row.voter_id)!.push(row.ranked_dish_id);
  }
  const ballots = Array.from(ballotMap.values());

  // Count how many voters' ballots include each dish (at any rank)
  const ballotCountMap = new Map<number, number>();
  for (const [, ballot] of ballotMap) {
    for (const dishId of ballot) {
      ballotCountMap.set(dishId, (ballotCountMap.get(dishId) ?? 0) + 1);
    }
  }

  const allDishIds = participants.map(p => p.id);
  const irvResults = runIRV(ballots, allDishIds);

  const dishMap = new Map(participants.map(p => [p.id, p.dish_name]));
  const allDishes = irvResults.map(r => ({
    rank: r.rank,
    dish_name: dishMap.get(r.participantId) ?? 'Unknown',
    participant_id: r.participantId,
    ballot_count: ballotCountMap.get(r.participantId) ?? 0,
  }));

  // Split into fully-voted and partial dishes. If no one has voted yet
  // (maxBallotCount === 0), treat all as full so the empty-state still shows.
  const maxBallotCount = allDishes.reduce((max, d) => Math.max(max, d.ballot_count), 0);
  const dishes = maxBallotCount === 0
    ? allDishes
    : allDishes.filter(d => d.ballot_count >= maxBallotCount);
  const partialDishes = maxBallotCount === 0
    ? []
    : allDishes.filter(d => d.ballot_count < maxBallotCount);

  // Participants whose ballot is missing one or more current dishes
  const totalOtherDishes = participants.length - 1;
  const needsRevote = participants
    .filter(p => (ballotMap.get(p.id)?.length ?? 0) < totalOtherDishes)
    .map(p => ({
      username: p.username,
      dishes_ranked: ballotMap.get(p.id)?.length ?? 0,
      total_other_dishes: totalOtherDishes,
    }));

  const voterIds = new Set(ballotMap.keys());
  res.json({
    dishes,
    partial_dishes: partialDishes,
    total_voters: voterIds.size,
    total_participants: participants.length,
    needs_revote: needsRevote,
  });
});

export default router;
