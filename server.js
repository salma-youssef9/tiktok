require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'users.json');
const LOGIN_ATTEMPTS_FILE = path.join(__dirname, 'login_attempts.json');

// ---------- tiny JSON "database" ----------
// Stores accounts in a plain file on this computer, in plain text —
// exactly what was typed in, nothing hashed or hidden.
// This is fine for a local, disclosed, not-deployed class demo where
// everyone testing it knows what's being stored. Don't reuse this
// pattern for anything real people rely on.
function loadUsers() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

function loadLoginAttempts() {
  if (!fs.existsSync(LOGIN_ATTEMPTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOGIN_ATTEMPTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function saveLoginAttempts(attempts) {
  fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
}

// ---------- routes ----------

// Create an account — stores username + password exactly as typed
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const users = loadUsers();
  const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'That username is already taken' });
  }

  users.push({ username, password });
  saveUsers(users);

  res.json({ ok: true, message: 'Account created' });
});

// Log in — for this demo, ANY username/password combo succeeds.
// Every attempt (whatever was typed) gets saved to login_attempts.json
// so you can see exactly what people entered.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const attempts = loadLoginAttempts();
  attempts.push({
    username,
    password,
    timestamp: new Date().toISOString(),
  });
  saveLoginAttempts(attempts);

  res.json({ ok: true, username });
});

// Forgot password — since the password is stored as-is, this just
// reads it back directly. No token, no email, no reset flow needed.
app.post('/api/forgot-password', (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account with that username' });
  }

  res.json({ ok: true, password: user.password });
});

app.listen(PORT, () => {
  console.log(`Auth backend running at http://localhost:${PORT}`);
  console.log(`Signups stored in plain text at ${DB_FILE}`);
  console.log(`Login attempts stored in plain text at ${LOGIN_ATTEMPTS_FILE}`);
});