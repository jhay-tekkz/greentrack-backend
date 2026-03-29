// routes/items.js — lost & found item reports API
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, saveCollection } = require('../data/db');
const upload = require('../middleware/upload');

// ── GET /api/items — get all items (with optional filters) ────────────────────
router.get('/', (req, res) => {
  try {
    let items = getCollection('items');

    // Filter by type: lost or found
    if (req.query.type && ['lost', 'found'].includes(req.query.type)) {
      items = items.filter(i => i.type === req.query.type);
    }

    // Filter by category
    if (req.query.category) {
      items = items.filter(i => i.category === req.query.category);
    }

    // Filter by status (default: only show active items)
    const status = req.query.status || 'active';
    items = items.filter(i => i.status === status);

    // Search across title, description, location
    if (req.query.search) {
      const term = req.query.search.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        i.location.toLowerCase().includes(term)
      );
    }

    // Sort: newest first by default
    if (req.query.sort === 'oldest') {
      items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Pagination
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const total = items.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);

    res.json({ total, page, pages, items: paginated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// ── GET /api/items/:id — get a single item by ID ──────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const items = getCollection('items');
    const item  = items.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch item.' });
  }
});

// ── POST /api/items — create a new lost/found report ─────────────────────────
router.post('/', upload.single('photo'), (req, res) => {
  try {
    const {
      type, category, title, description, location,
      date_occurred, time_occurred,
      reward_offered, reward_amount,
      where_now, safe_keeping, hold_duration,
      contact_email, contact_phone, notify_match
    } = req.body;

    // Validate required fields
    const missing = [];
    if (!type)          missing.push('type');
    if (!category)      missing.push('category');
    if (!title)         missing.push('title');
    if (!description)   missing.push('description');
    if (!location)      missing.push('location');
    if (!date_occurred) missing.push('date_occurred');
    if (!contact_email) missing.push('contact_email');

    if (missing.length) {
      return res.status(400).json({ error: 'Missing required fields.', fields: missing });
    }

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({ error: 'type must be "lost" or "found".' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contact_email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    if (type === 'found' && !where_now) {
      return res.status(400).json({ error: 'where_now is required for found items.' });
    }

    // Build the new item object
    const newItem = {
      id:             uuidv4(),
      type,
      category,
      title:          title.trim(),
      description:    description.trim(),
      location:       location.trim(),
      date_occurred,
      time_occurred:  time_occurred || null,
      reward_offered: reward_offered === 'true' || reward_offered === true,
      reward_amount:  reward_amount ? parseFloat(reward_amount) : null,
      where_now:      where_now ? where_now.trim() : null,
      safe_keeping:   safe_keeping === 'true' || safe_keeping === true,
      hold_duration:  hold_duration || null,
      contact_email:  contact_email.trim(),
      contact_phone:  contact_phone ? contact_phone.trim() : null,
      notify_match:   notify_match !== 'false',
      photo_filename: req.file ? req.file.filename : null,
      status:         'active',
      created_at:     new Date().toISOString(),
      updated_at:     new Date().toISOString()
    };

    // Add to the collection and save
    const items = getCollection('items');
    items.push(newItem);
    saveCollection('items', items);

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create report.' });
  }
});

// ── PATCH /api/items/:id/status — update item status ─────────────────────────
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'resolved', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'status must be active, resolved, or expired.' });
    }

    const items = getCollection('items');
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Item not found.' });

    items[index].status     = status;
    items[index].updated_at = new Date().toISOString();
    saveCollection('items', items);

    res.json({ message: `Item marked as ${status}.`, item: items[index] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ── DELETE /api/items/:id — delete an item ────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const items   = getCollection('items');
    const filtered = items.filter(i => i.id !== req.params.id);
    if (filtered.length === items.length) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    saveCollection('items', filtered);
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;
