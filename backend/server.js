import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
let ADMIN_SECRET = process.env.MY_SECRET_PASSWORD || 'supersecureadminpass123';

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Serve static files from the /public directory
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// --- RAW TABLE INITIALIZATION ---
const setupTables = async () => {
  try {
    // Settings Table (Stores persistent admin config like secret passcode)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Load persisted secret token if present, otherwise set default
    const secretCheck = await pool.query("SELECT value FROM settings WHERE key = 'admin_secret'");
    if (secretCheck.rows.length > 0 && secretCheck.rows[0].value) {
      ADMIN_SECRET = secretCheck.rows[0].value;
      console.log('🔒 Admin secret token loaded from database.');
    } else {
      await pool.query("INSERT INTO settings (key, value) VALUES ('admin_secret', $1) ON CONFLICT (key) DO NOTHING", [ADMIN_SECRET]);
    }
    // Profile Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profile (
        id SERIAL PRIMARY KEY,
        hero_title VARCHAR(255) NOT NULL,
        hero_bio TEXT NOT NULL,
        contact_phone TEXT,
        skills JSON,
        hobbies JSON,
        picture_data BYTEA,
        picture_mime_type VARCHAR(100)
      );
    `);
    
    // Add contact_phone, skills, hobbies to profile if they don't exist
    await pool.query(`ALTER TABLE profile ADD COLUMN IF NOT EXISTS contact_phone TEXT;`);
    await pool.query(`ALTER TABLE profile ADD COLUMN IF NOT EXISTS skills JSON;`);
    await pool.query(`ALTER TABLE profile ADD COLUMN IF NOT EXISTS hobbies JSON;`);

    // Insert default profile if table is empty
    const profileCheck = await pool.query('SELECT COUNT(*) FROM profile');
    if (parseInt(profileCheck.rows[0].count) === 0) {
        const defaultHeroTitle = 'Hi, I am Lewi.<br>I build dynamic <span>Software Solutions</span>';
        const defaultHeroBio = 'I am a versatile Software Engineer specializing in adapting to any tech stack to build robust full-stack web platforms and seamless mobile ecosystems.';
        const defaultPhone = '0968099678678';
        const defaultSkills = JSON.stringify(["Full-Stack", "Flutter", "Python", "HTML/CSS", "Vanilla JS", "Git Engine"]);
        const defaultHobbies = JSON.stringify(["Chess ♟️", "Basketball 🏀", "Watching TV Shows 🎬"]);
        await pool.query(`INSERT INTO profile (hero_title, hero_bio, contact_phone, skills, hobbies) VALUES ($1, $2, $3, $4, $5)`, [defaultHeroTitle, defaultHeroBio, defaultPhone, defaultSkills, defaultHobbies]);
    }

    // Projects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        link TEXT,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add tags column if it doesn't exist
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags JSON;`);

    const projectsCheck = await pool.query('SELECT COUNT(*) FROM projects');
    if (parseInt(projectsCheck.rows[0].count) === 0) {
        const defaultProjects = [
            { title: "Staff Review Platform", description: "A collaborative feedback application designed to streamline workplace reviews and performance evaluation data pipelines.", tags: JSON.stringify(["Full-Stack", "Web"]), link: "https://github.com/redwivision/staff-review-platform" },
            { title: "Travel Assistant App", description: "Smart itinerary planning software engineered to automate travel logistics, mapping routes, and localized discovery indices.", tags: JSON.stringify(["Full-Stack", "APIs"]), link: "https://github.com/redwivision/travel-assistant" },
            { title: "theONE Mobile App", description: "Sleek and responsive cross-platform Flutter experience built with decoupled states for ultimate performance and fluid animations.", tags: JSON.stringify(["Flutter", "Mobile"]), link: "https://github.com/redwivision/theONE" },
            { title: "Sewasew AI Mobile", description: "An intelligent artificial intelligence consumer endpoint designed with native Dart architectures for optimal local scaling.", tags: JSON.stringify(["Flutter", "AI"]), link: "https://github.com/redwivision/sewasew-ai" },
            { title: "Pain Hunt Tool", description: "A highly resilient back-end algorithmic suite written to trace down performance pain points, system lags, and bugs.", tags: JSON.stringify(["Python", "Automation"]), link: "https://github.com/redwivision/pain_hunt" },
            { title: "Jarvis System Node", description: "A fast terminal-based contextual assistant built to parse background scripts, automate environment tasks, and optimize logic workflows.", tags: JSON.stringify(["Python", "Scripts"]), link: "https://github.com/redwivision/Jarvis" },
            { title: "FavoriteSite Chrome Tool", description: "A lightweight Google Chrome layout injection tool for tracking, pinning, and indexing prioritized workspace web coordinates.", tags: JSON.stringify(["Extension", "JS"]), link: "https://github.com/redwivision/FavoriteSite-chrome_extention" },
            { title: "AI Tutor Engine", description: "An automated custom learning wrapper designed to feed documents directly into predictive LLM pathways for student support.", tags: JSON.stringify(["AI Labs", "Python"]), link: "https://github.com/redwivision/AI_tutor" },
            { title: "Expense Tracker Ledger", description: "A clean math matrix engine built to log transactions, compute continuous spend trajectories, and map financial records.", tags: JSON.stringify(["Utility", "Full-Stack"]), link: "https://github.com/redwivision/Expense-tracker" },
            { title: "Habit Tracker Matrix", description: "A consistency engine displaying streak counts, continuous logic updates, and interactive user progression elements.", tags: JSON.stringify(["Utility", "Frontend"]), link: "https://github.com/redwivision/Habit-Tracker" },
            { title: "O-Home School Link", description: "An integrated portal linking modern academic nodes with local systems to establish immediate data transparency.", tags: JSON.stringify(["Ecosystem", "Web", "Full-Stack"]), link: "https://github.com/redwivision/O-Home-School-Link" }
        ];
        for (const p of defaultProjects) {
            await pool.query(`INSERT INTO projects (title, description, link, tags) VALUES ($1, $2, $3, $4)`, [p.title, p.description, p.link, p.tags]);
        }
    }

    // Messages Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_name VARCHAR(100) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        message_body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🏁 Local PostgreSQL tables verified/created successfully.');
  } catch (err) {
    console.error('❌ Table initialization failed:', err);
  }
};
setupTables();

// --- ENDPOINTS ---

// 0. PUBLIC: Fetch profile info
app.get('/api/profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
    const row = result.rows[0];
    if (row && row.picture_data) {
      row.picture_base64 = Buffer.isBuffer(row.picture_data) ? row.picture_data.toString('base64') : row.picture_data;
    }
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// 1. PUBLIC: Fetch all projects to render on your frontend portfolio
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// 2. PUBLIC: Anyone can submit a message via your contact form
app.post('/api/messages', async (req, res) => {
  const { name, email, body } = req.body;
  try {
    const sql = 'INSERT INTO messages (sender_name, sender_email, message_body) VALUES ($1, $2, $3) RETURNING *';
    const result = await pool.query(sql, [name, email, body]);
    res.status(201).json({ success: true, saved: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// --- ADMIN VERIFY TOKEN: Check token validity for spy popup ---
app.post('/api/admin/verify', (req, res) => {
  const adminSecret = req.headers['x-admin-token'] || req.body.token;
  if (adminSecret === ADMIN_SECRET) {
    return res.json({ success: true, message: 'Access granted. Vault unlatched.' });
  }
  return res.status(401).json({ success: false, error: 'Access denied. Invalid security passcode.' });
});

// --- ADMIN CHANGE TOKEN: Secure endpoint to modify secret admin passcode ---
app.put('/api/admin/change-token', async (req, res) => {
  const currentToken = req.headers['x-admin-token'];
  const { newToken } = req.body;

  // Security check: Validate existing token
  if (currentToken !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Current admin token is invalid.' });
  }

  // Input validation & sanitization
  if (!newToken || typeof newToken !== 'string' || newToken.trim().length < 4) {
    return res.status(400).json({ success: false, error: 'New secret token must be at least 4 characters long.' });
  }

  const cleanToken = newToken.trim();

  try {
    // Persist new secret token in settings database table
    await pool.query("INSERT INTO settings (key, value) VALUES ('admin_secret', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [cleanToken]);
    ADMIN_SECRET = cleanToken;
    console.log('🔑 Secret admin passcode updated successfully.');
    res.json({ success: true, message: 'Secret admin token updated successfully!' });
  } catch (err) {
    console.error('Failed to change secret token:', err);
    res.status(500).json({ success: false, error: 'Failed to persist new secret token.' });
  }
});

// 3. ADMIN READ: Check your messages by passing your secret password in the header
app.get('/api/admin/messages', async (req, res) => {
  const adminSecret = req.headers['x-admin-token'];

  if (adminSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read messages' });
  }
});

// ADMIN DELETE: Purge a specific message from inbox
app.delete('/api/admin/messages/:id', async (req, res) => {
  const adminSecret = req.headers['x-admin-token'];
  const msgId = req.params.id;

  if (adminSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const sql = 'DELETE FROM messages WHERE id = $1 RETURNING *';
    const result = await pool.query(sql, [msgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ success: true, message: `Message ${msgId} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Database delete failed.' });
  }
});

// --- ADMIN UPDATE: Modify Profile ---
app.put('/api/admin/profile', async (req, res) => {
  const adminSecret = req.headers['x-admin-token'];
  const { hero_title, hero_bio, contact_phone, skills, hobbies, picture_base64, picture_mime_type } = req.body;

  if (adminSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const existing = await pool.query('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
    const existingRow = existing.rows[0] || {};

    let pictureBuffer = existingRow.picture_data;
    if (picture_base64 !== undefined) {
      pictureBuffer = picture_base64 ? (Buffer.isBuffer(picture_base64) ? picture_base64 : Buffer.from(picture_base64, 'base64')) : null;
    }

    let mimeType = existingRow.picture_mime_type;
    if (picture_mime_type !== undefined) {
      mimeType = picture_mime_type;
    }

    const sql = `
      UPDATE profile 
      SET hero_title = $1, hero_bio = $2, contact_phone = $3, skills = $4, hobbies = $5, picture_data = $6, picture_mime_type = $7 
      WHERE id = (SELECT id FROM profile ORDER BY id ASC LIMIT 1)
      RETURNING *
    `;
    const result = await pool.query(sql, [
      hero_title !== undefined ? hero_title : existingRow.hero_title,
      hero_bio !== undefined ? hero_bio : existingRow.hero_bio,
      contact_phone !== undefined ? contact_phone : existingRow.contact_phone,
      skills !== undefined ? JSON.stringify(skills) : JSON.stringify(existingRow.skills),
      hobbies !== undefined ? JSON.stringify(hobbies) : JSON.stringify(existingRow.hobbies),
      pictureBuffer,
      mimeType
    ]);
    res.json({ success: true, updated: result.rows[0] });
  } catch (err) {
    console.error('Profile update failed:', err);
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// --- ADMIN CREATE: Add a new project ---
app.post('/api/projects', async (req, res) => {
  const adminSecret = req.headers['x-admin-token'];
  const { title, description, link, tags } = req.body;

  if (adminSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const sql = 'INSERT INTO projects (title, description, link, tags) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(sql, [title, description, link, JSON.stringify(tags || [])]);
    res.status(201).json({ success: true, saved: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// --- ADMIN UPDATE: Modify an existing project by its unique ID ---
app.put('/api/projects/:id', async (req, res) => {
  const adminSecret = req.headers['x-admin-token'];
  const projectId = req.params.id;
  const { title, description, link, tags } = req.body;

  if (adminSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const sql = `
      UPDATE projects 
      SET title = $1, description = $2, link = $3, tags = $4 
      WHERE id = $5 
      RETURNING *
    `;
    const result = await pool.query(sql, [title, description, link, JSON.stringify(tags || []), projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ success: true, updated: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// --- ADMIN DELETE: Wipe a project out of your database completely ---
app.delete('/api/projects/:id', async (req, res) => {
  const adminSecret = req.headers['x-admin-token'];
  const projectId = req.params.id;

  if (adminSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const sql = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const result = await pool.query(sql, [projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ success: true, message: `Project with ID ${projectId} has been dropped.` });
  } catch (err) {
    res.status(500).json({ error: 'Database delete failed.' });
  }
});

// Fallback route for SPA / direct HTML navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
