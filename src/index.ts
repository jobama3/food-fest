import express from 'express';
import path from 'path';
import './db'; // initialize DB on startup

import eventsRouter from './routes/events';
import participantsRouter from './routes/participants';
import votesRouter from './routes/votes';
import resultsRouter from './routes/results';

const app = express();
const PORT = process.env.PORT ?? 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/events', eventsRouter);
app.use('/api/events/:id/participants', participantsRouter);
app.use('/api/events/:id/votes', votesRouter);
app.use('/api/events/:id/results', resultsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Serve the SPA for any non-API route
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Food Fest running on http://localhost:${PORT}`);
});
