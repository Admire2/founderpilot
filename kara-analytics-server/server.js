const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const db = new Database('analytics.db');
db.exec('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, event TEXT, data TEXT, ts INTEGER, version TEXT, app TEXT)');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/v1/event', (req, res) => {
  const b = req.body || {};
  if (!b.event) return res.status(400).json({ error: 'missing event' });
  db.prepare('INSERT INTO events (userId,event,data,ts,version,app) VALUES (?,?,?,?,?,?)')
    .run(b.userId || 'anon', b.event, JSON.stringify(b.data || {}), b.ts || Date.now(), b.version || '', b.app || '');
  res.status(204).end();
});

app.get('/v1/stats', (req, res) => {
  const day = 86400000; const now = Date.now();
  const dau = db.prepare('SELECT COUNT(DISTINCT userId) c FROM events WHERE ts > ?').get(now - day).c;
  const totalUsers = db.prepare('SELECT COUNT(DISTINCT userId) c FROM events').get().c;
  const quantUsers = db.prepare("SELECT COUNT(DISTINCT userId) c FROM events WHERE event='quant_mode_toggled'").get().c;
  const tradeCalls = db.prepare("SELECT COUNT(*) c FROM events WHERE event='trade_analyzer_called'").get().c;
  const optIns = db.prepare("SELECT COUNT(DISTINCT userId) c FROM events WHERE event='analytics_opt_in'").get().c;
  const top = db.prepare('SELECT event, COUNT(*) c FROM events GROUP BY event ORDER BY c DESC LIMIT 10').all();
  res.json({ dau, totalUsers, quantUsers, tradeCalls, optIns, topEvents: top, generatedAt: new Date().toISOString() });
});

app.listen(3002, () => console.log('Kara Analytics (sovereign, on-prem) running on port 3002'));
