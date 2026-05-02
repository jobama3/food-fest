import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const events = db.prepare(`
    SELECT e.id, e.name, e.created_at,
           COUNT(p.id) as participant_count
    FROM events e
    LEFT JOIN participants p ON p.event_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(events);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Event name is required' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO events (name) VALUES (?)'
  ).run(name.trim());
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(event);
});

router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
  res.json(event);
});

export default router;
