const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getCollection, saveCollection } = require('../data/db');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-greentrack-key-123';

// ── Validation Rules ────────────────────────────────────────────────────────
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const isStrongPassword = (password) => {
  // Minimum 8 characters
  return password.length >= 8;
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic empty checks
    if (!name || !name.trim()) return res.status(400).json({ field: 'name', error: 'Please enter your full name.' });
    if (!email) return res.status(400).json({ field: 'email', error: 'Please enter your university email.' });
    if (!password) return res.status(400).json({ field: 'password', error: 'Please create a password.' });

    // 2. Syntax Rules Validation
    const safeEmail = email.trim().toLowerCase();
    
    if (!isValidEmail(safeEmail)) {
      return res.status(400).json({ field: 'email', error: 'Please enter a valid email address format.' });
    }
    
    if (!isStrongPassword(password)) {
      return res.status(400).json({ field: 'password', error: 'Password must be at least 8 characters long.' });
    }

    const users = getCollection('users');

    // 3. Duplication check
    const existingUser = users.find(u => u.email === safeEmail);
    if (existingUser) {
      return res.status(400).json({ field: 'email', error: 'An account with this email already exists.' });
    }

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create new user record
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: safeEmail,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    saveCollection('users', users);

    // 6. Generate JWT token
    const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Signup successful!',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ field: 'general', error: 'Server error during signup. Please try again later.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Log in existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ field: 'email', error: 'Please enter your email.' });
    if (!password) return res.status(400).json({ field: 'password', error: 'Please enter your password.' });

    const safeEmail = email.trim().toLowerCase();

    if (!isValidEmail(safeEmail)) {
      return res.status(400).json({ field: 'email', error: 'Invalid email format.' });
    }

    const users = getCollection('users');

    // 1. Check if user exists
    const user = users.find(u => u.email === safeEmail);
    if (!user) {
      return res.status(400).json({ field: 'email', error: 'No account found with this email.' });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ field: 'password', error: 'Incorrect password. Please try again.' });
    }

    // 3. Generate JWT token
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ field: 'general', error: 'Server error during login. Please try again later.' });
  }
});

module.exports = router;
