import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('/{*path}', cors()); // responde preflight para qualquer rota
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
let buttonBattery = { frangos: null, carnes: null, lastSeenFrangos: null, lastSeenCarnes: null };

const clients = [];
function broadcast() {
  const payload = { queue, current, history, counters, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize, buttonBattery };
  clients.forEach(res => res.write(`data: ${JSON.stringify(payload)}\n\n`));
}

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);
  // send initial state
  res.write(`data: ${JSON.stringify({ queue, current, history, counters, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize })}\n\n`);
  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

app.get('/state', (req, res) => {
  res.json({ queue, current, history, counters, normalCallsSincePriority, marqueeMessage, marqueeSpeed, marqueeBgColor, marqueeFontColor, marqueeFont, marqueeFontSize, buttonBattery });
});

// Endpoint para ESP8266/ESP32 reportar nivel de bateria
// POST /battery  body: { device: 'frangos'|'carnes', level: 0-100 }
app.post('/battery', (req, res) => {
  const device = req.body?.device;
  const level = Number(req.body?.level);
  if ((device !== 'frangos' && device !== 'carnes') || !Number.isFinite(level) || level < 0 || level > 100) {
    return res.status(400).json({ error: 'device (frangos|carnes) e level (0-100) sao obrigatorios' });
  }
  buttonBattery[device] = Math.round(level);
  buttonBattery[device === 'frangos' ? 'lastSeenFrangos' : 'lastSeenCarnes'] = Date.now();
  broadcast();
  res.json({ ok: true });
});

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_FONTS = ['sans-serif', 'serif', 'monospace', 'Arial', 'Georgia', 'Courier New', 'Impact', 'Trebuchet MS', 'Montserrat'];

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

  let mustCallPriority = false;
  if (typeHint && Object.prototype.hasOwnProperty.call(normalCallsSincePriority, typeHint)) {
    mustCallPriority = normalCallsSincePriority[typeHint] >= 3;
  }

  // Se chegou no limite de 3 gerais seguidos e tem prioritário na fila, chama o prioritário mais antigo
  let next;
  if (priorities.length > 0 && mustCallPriority) {
    next = priorities[0]; // mais antigo entre os prioritários
  } else {
    // Caso contrário, segue a ordem de chegada (FIFO) independente de ser prioritário ou geral
    next = list[0];
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
  // atualiza bateria se enviada junto com a chamada
  const lvl = Number(req.body?.battery);
  if (Number.isFinite(lvl) && lvl >= 0 && lvl <= 100) {
    buttonBattery.frangos = Math.round(lvl);
    buttonBattery.lastSeenFrangos = Date.now();
  }
  broadcast();
  res.json(called);
});
app.get('/call/frangos', (req, res) => {
  const list = queue.filter(i => i.type === 'frangos');
  const called = callNextIn(list, 'frangos');
  broadcast();
  res.json(called);
});

app.post('/call/carnes', (req, res) => {
  const list = queue.filter(i => i.type === 'carnes');
  const called = callNextIn(list, 'carnes');
  // atualiza bateria se enviada junto com a chamada
  const lvl = Number(req.body?.battery);
  if (Number.isFinite(lvl) && lvl >= 0 && lvl <= 100) {
    buttonBattery.carnes = Math.round(lvl);
    buttonBattery.lastSeenCarnes = Date.now();
  }
  broadcast();
  res.json(called);
});
app.get('/call/carnes', (req, res) => {
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
app.get('/call/next', (req, res) => {
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

// ── Setup TV via QR Code ────────────────────────────────────────────────────
// Mapa de tokens pendentes: token -> { display, createdAt }
const setupTokens = {};

const DISPLAY_ROUTES = {
  frangos: '/display/frangos',
  carnes: '/display/acougue',
  totem: '/',
  admin: '/admin',
};

// Gera um token de 6 chars para a TV aguardar
app.post('/setup/token', (req, res) => {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  setupTokens[token] = { display: null, createdAt: Date.now() };
  // Expira em 10 minutos
  setTimeout(() => delete setupTokens[token], 10 * 60 * 1000);
  res.json({ token });
});

// Celular escaneia o QR e envia qual display a TV deve mostrar
// GET /setup/assign?token=ABCD12&display=frangos
app.get('/setup/assign', (req, res) => {
  const { token, display } = req.query;
  if (!token || !setupTokens[token]) {
    return res.status(400).send('<h2>Token inválido ou expirado. Volte para /setup na TV e tente novamente.</h2>');
  }
  if (!DISPLAY_ROUTES[display]) {
    return res.status(400).send('<h2>Display inválido.</h2>');
  }
  setupTokens[token].display = display;
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>TV Configurada</title></head><body style="font-family:sans-serif;text-align:center;padding:2rem"><h1>✅ Pronto!</h1><p>A TV foi direcionada para <strong>${display}</strong>.</p><p>Pode fechar esta página.</p></body></html>`);
});

// TV faz polling neste endpoint aguardando ser configurada
app.get('/setup/check/:token', (req, res) => {
  const entry = setupTokens[req.params.token];
  if (!entry) return res.json({ status: 'expired' });
  if (!entry.display) return res.json({ status: 'waiting' });
  const route = DISPLAY_ROUTES[entry.display];
  delete setupTokens[req.params.token];
  res.json({ status: 'ready', route });
});

// Serve frontend build
app.use(express.static(join(__dirname, 'dist')));
// SPA fallback — must come after all API routes
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Queue server listening on port ${PORT}`));