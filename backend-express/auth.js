const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

// Helper function to generate JWT with Hasura Claims
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': 'user',
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-user-id': user.id,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// @route   POST /auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check for existing user
    const userSelect = await db.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    if (userSelect.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username.toLowerCase(), hash]
    );

    const user = newUser.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Error in signup:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    // Check for user
    const userSelect = await db.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    if (userSelect.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = userSelect.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
