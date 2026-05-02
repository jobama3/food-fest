import { Router, Request } from 'express';
import db from '../db';

const router = Router({ mergeParams: true });

router.get('/', (req: Request<{ id: string }>, res) => {
  const { id: event_id } = req.params;
  const viewerId = req.query.viewer_participant_id
    ? Number(req.query.viewer_participant_id)
    : null;

  const rows = db.prepare(
    'SELECT id, event_id, dish_name, joined_at, CASE WHEN id = ? THEN username ELSE NULL END as username FROM participants WHERE event_id = ? ORDER BY joined_at ASC'
  ).all(viewerId, event_id);

  res.json(rows);
});

router.post('/join', (req: Request<{ id: string }>, res) => {
  const { id: event_id } = req.params;
  const { username, dish_name } = req.body;

  if (!username || typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }
  if (!dish_name || typeof dish_name !== 'string' || !dish_name.trim()) {
    res.status(400).json({ error: 'Dish name is required' });
    return;
  }

  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(event_id);
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }

  try {
    const result = db.prepare(
      'INSERT INTO participants (event_id, username, dish_name) VALUES (?, ?, ?)'
    ).run(event_id, username.trim(), dish_name.trim());
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(participant);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'That username is already taken for this event' });
      return;
    }
    throw err;
  }
});

export default router;
