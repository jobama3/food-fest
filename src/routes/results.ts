import { Router, Request } from 'express';
import db from '../db';
import { runIRV } from '../irv';

const router = Router({ mergeParams: true });

router.get('/', (req: Request<{ id: string }>, res) => {
  const { id: event_id } = req.params;

  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(event_id);
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }

  const participants = db.prepare(
    'SELECT id, dish_name FROM participants WHERE event_id = ? ORDER BY id ASC'
  ).all(event_id) as { id: number; dish_name: string }[];

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

  const allDishIds = participants.map(p => p.id);
  const irvResults = runIRV(ballots, allDishIds);

  const dishMap = new Map(participants.map(p => [p.id, p.dish_name]));
  const dishes = irvResults.map(r => ({
    rank: r.rank,
    dish_name: dishMap.get(r.participantId) ?? 'Unknown',
    participant_id: r.participantId,
  }));

  const voterIds = new Set(ballotMap.keys());
  res.json({
    dishes,
    total_voters: voterIds.size,
    total_participants: participants.length,
  });
});

export default router;
