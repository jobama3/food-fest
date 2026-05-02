import { Router, Request } from 'express';
import db from '../db';

const router = Router({ mergeParams: true });

router.get('/:participant_id', (req: Request<{ id: string; participant_id: string }>, res) => {
  const { id: event_id, participant_id } = req.params;

  const rows = db.prepare(`
    SELECT ranked_dish_id, rank
    FROM votes
    WHERE event_id = ? AND voter_id = ?
    ORDER BY rank ASC
  `).all(event_id, participant_id) as { ranked_dish_id: number; rank: number }[];

  res.json({ rankings: rows.map(r => r.ranked_dish_id) });
});

router.post('/:participant_id', (req: Request<{ id: string; participant_id: string }>, res) => {
  const { id: event_id, participant_id } = req.params;
  const { rankings } = req.body;

  if (!Array.isArray(rankings)) {
    res.status(400).json({ error: 'rankings must be an array' });
    return;
  }

  const voter = db.prepare(
    'SELECT id FROM participants WHERE id = ? AND event_id = ?'
  ).get(participant_id, event_id);
  if (!voter) { res.status(404).json({ error: 'Participant not found in this event' }); return; }

  // Validate all ranked_dish_ids belong to this event and are not the voter
  for (const dishId of rankings) {
    if (typeof dishId !== 'number') {
      res.status(400).json({ error: 'Each ranking must be a participant id (number)' });
      return;
    }
    if (dishId === Number(participant_id)) {
      res.status(400).json({ error: 'Cannot vote for your own dish' });
      return;
    }
    const dish = db.prepare(
      'SELECT id FROM participants WHERE id = ? AND event_id = ?'
    ).get(dishId, event_id);
    if (!dish) {
      res.status(400).json({ error: `Participant ${dishId} not found in this event` });
      return;
    }
  }

  // Upsert: delete old ballot, insert new
  const upsert = db.transaction(() => {
    db.prepare('DELETE FROM votes WHERE voter_id = ? AND event_id = ?').run(participant_id, event_id);
    const insert = db.prepare(
      'INSERT INTO votes (event_id, voter_id, ranked_dish_id, rank) VALUES (?, ?, ?, ?)'
    );
    for (let i = 0; i < rankings.length; i++) {
      insert.run(event_id, participant_id, rankings[i], i + 1);
    }
  });
  upsert();

  res.json({ success: true, rankings });
});

export default router;
