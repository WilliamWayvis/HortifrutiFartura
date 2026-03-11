import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let queue = [];
let current = null;
let history = [];
let counters = { frangos: 1, carnes: 1 };
let normalCallsSincePriority = { frangos: 0, carnes: 0 };
let marqueeMessage = '';
let marqueeSpeed = 1;
let marqueeBgColor = '#000000';
let marqueeFontColor = '#ffffff';
let marqueeFont = 'sans-serif';
let marqueeFontSize = 24;

const clients = [];
function broadcast() {
  const payload = { queue, current, history, counters, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize };
  clients.forEach(res => res.write(`data: ${JSON.stringify(payload)}\n\n`));
}

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);
  // send initial state
  res.write(`data: ${JSON.stringify({ queue, current, history, counters, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont })}\n\n`);
  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

app.get('/state', (req, res) => {
  res.json({ queue, current, history, counters, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize });
});

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_FONTS = ['sans-serif', 'serif', 'monospace', 'Arial', 'Georgia', 'Courier New', 'Impact', 'Trebuchet MS'];

app.post('/marquee', (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const parsedSpeed = Number(req.body?.speed);
  const safeSpeed = Number.isFinite(parsedSpeed) ? Math.min(4, Math.max(1, Math.round(parsedSpeed))) : marqueeSpeed;
  const bg = typeof req.body?.bgColor === 'string' && HEX_RE.test(req.body.bgColor) ? req.body.bgColor : marqueeBgColor;
  const fc = typeof req.body?.fontColor === 'string' && HEX_RE.test(req.body.fontColor) ? req.body.fontColor : marqueeFontColor;
  const ff = typeof req.body?.font === 'string' && ALLOWED_FONTS.includes(req.body.font) ? req.body.font : marqueeFont;
  const parsedSize = Number(req.body?.fontSize);
  const fs = Number.isFinite(parsedSize) ? Math.min(72, Math.max(12, Math.round(parsedSize))) : marqueeFontSize;
  marqueeMessage = message.slice(0, 220);
  marqueeSpeed = safeSpeed;
  marqueeBgColor = bg;
  marqueeFontColor = fc;
  marqueeFont = ff;
  marqueeFontSize = fs;
  broadcast();
  res.json({ marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize });
});

app.post('/next-number/:type', (req, res) => {
  const type = req.params.type;
  if (!['frangos','carnes'].includes(type)) {
    return res.status(400).json({ error: 'invalid type' });
  }
  const number = counters[type];
  counters[type]++;
  res.json({ number: String(number).padStart(3,'0') });
});

app.post('/add', (req, res) => {
  const { code, type, priority } = req.body;
  const item = { id: Date.now().toString(), code, type, priority, timestamp: Date.now() };
  queue.push(item);
  broadcast();
  res.json(item);
});

function callNextIn(list, typeHint) {
  if (list.length === 0) return null;

  const priorities = list.filter(i => i.priority);
  const normals = list.filter(i => !i.priority);

  let mustCallPriority = false;
  if (typeHint && Object.prototype.hasOwnProperty.call(normalCallsSincePriority, typeHint)) {
    mustCallPriority = normalCallsSincePriority[typeHint] >= 3;
  }

  let next;
  if (priorities.length > 0 && (mustCallPriority || normals.length === 0)) {
    next = priorities[0];
  } else {
    next = normals[0] || priorities[0];
  }

  const idx = queue.findIndex(i => i.id === next.id);
  if (idx !== -1) queue.splice(idx, 1);

  if (Object.prototype.hasOwnProperty.call(normalCallsSincePriority, next.type)) {
    if (next.priority) {
      normalCallsSincePriority[next.type] = 0;
    } else {
      normalCallsSincePriority[next.type] += 1;
    }
  }

  const called = { ...next, calledAt: Date.now() };
  current = called;
  history.unshift(called);
  if (history.length > 50) history.pop();
  return called;
}

app.post('/call/frangos', (req, res) => {
  const list = queue.filter(i => i.type === 'frangos');
  const called = callNextIn(list, 'frangos');
  broadcast();
  res.json(called);
});
app.post('/call/carnes', (req, res) => {
  const list = queue.filter(i => i.type === 'carnes');
  const called = callNextIn(list, 'carnes');
  broadcast();
  res.json(called);
});
app.post('/call/next', (req, res) => {
  const called = callNextIn(queue);
  broadcast();
  res.json(called);
});

app.post('/reset', (req, res) => {
  queue = [];
  current = null;
  history = [];
  counters = { frangos: 1, carnes: 1 };
  normalCallsSincePriority = { frangos: 0, carnes: 0 };
  broadcast();
  res.json({});
});

// Serve frontend build
app.use(express.static(join(__dirname, 'dist')));
// SPA fallback — must come after all API routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Queue server listening on port ${PORT}`));