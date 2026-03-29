// routes/contact.js — contact form & newsletter API
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, saveCollection } = require('../data/db');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── POST /api/contact — save a contact form message ───────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate
    const missing = [];
    if (!name?.trim())    missing.push('name');
    if (!email?.trim())   missing.push('email');
    if (!subject?.trim()) missing.push('subject');
    if (!message?.trim()) missing.push('message');

    if (missing.length) {
      return res.status(400).json({ error: 'Missing required fields.', fields: missing });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const newMessage = {
      id:         uuidv4(),
      name:       name.trim(),
      email:      email.trim(),
      subject:    subject.trim(),
      message:    message.trim(),
      created_at: new Date().toISOString()
    };

    const messages = getCollection('contact_messages');
    messages.push(newMessage);
    saveCollection('contact_messages', messages);

    res.status(201).json({ message: 'Message received! We will get back to you shortly.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

// ── GET /api/contact — list all contact messages (admin) ─────────────────────
router.get('/', (_req, res) => {
  try {
    const messages = getCollection('contact_messages');
    // Newest first
    messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ── POST /api/contact/newsletter — subscribe an email ────────────────────────
router.post('/newsletter', (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const subscribers = getCollection('newsletter_subscribers');

    // Check for duplicate
    const already = subscribers.find(s => s.email === email.trim());
    if (already) {
      return res.status(409).json({ message: 'You are already subscribed!' });
    }

    subscribers.push({
      id:            uuidv4(),
      email:         email.trim(),
      subscribed_at: new Date().toISOString()
    });

    saveCollection('newsletter_subscribers', subscribers);

    res.status(201).json({ message: 'Subscribed successfully! Welcome to GreenTrack.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

// ── GET /api/contact/newsletter — list all subscribers (admin) ───────────────
router.get('/newsletter', (_req, res) => {
  try {
    const subscribers = getCollection('newsletter_subscribers');
    subscribers.sort((a, b) => new Date(b.subscribed_at) - new Date(a.subscribed_at));
    res.json(subscribers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscribers.' });
  }
});

module.exports = router;
