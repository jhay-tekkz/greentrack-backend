// data/db.js — simple JSON file database
// Think of this like a librarian who reads and writes your data file

const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// ── Read all data from the JSON file ─────────────────────────────────────────
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // If file is missing or corrupted, return a fresh empty database
    console.error('⚠️  Could not read db.json, starting fresh:', err.message);
    return { items: [], contact_messages: [], newsletter_subscribers: [] };
  }
}

// ── Write all data back to the JSON file ──────────────────────────────────────
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Could not write to db.json:', err.message);
    throw new Error('Database write failed.');
  }
}

// ── Helper: get one collection (e.g. "items") ────────────────────────────────
function getCollection(name) {
  const db = readDb();
  return db[name] || [];
}

// ── Helper: save a whole collection back ─────────────────────────────────────
function saveCollection(name, data) {
  const db = readDb();
  db[name] = data;
  writeDb(db);
}

module.exports = { readDb, writeDb, getCollection, saveCollection };
