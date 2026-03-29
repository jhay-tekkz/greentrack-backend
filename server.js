// server.js — GreenTrack Backend API
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const itemsRouter   = require('./routes/items');
const contactRouter = require('./routes/contact');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS — allow your frontend to talk to this server ─────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// ── Rate limiting — prevent spam/abuse ───────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
}));

// ── Parse incoming request bodies ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded photos as static files ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/items',   itemsRouter);
app.use('/api/contact', contactRouter);

// ── Health check — lets you verify the server is running ─────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'ok',
    project: 'GreenTrack',
    time:    new Date().toISOString()
  });
});

// ── 404 — route not found ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Server error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Max size is 5MB.' });
  }

  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌿 GreenTrack API running → http://localhost:${PORT}`);
  console.log(`   Health check          → http://localhost:${PORT}/api/health`);
  console.log(`   Items API             → http://localhost:${PORT}/api/items`);
  console.log(`   Contact API           → http://localhost:${PORT}/api/contact`);
});
