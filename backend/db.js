import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let poolInstance = null;

// Initial seed data for in-memory store (used as fallback when DB is disconnected)
const inMemoryStore = {
  profile: {
    id: 1,
    hero_title: 'Hi, I am Lewi.<br>I build dynamic <span>Software Solutions</span>',
    hero_bio: 'I am a versatile Software Engineer specializing in adapting to any tech stack to build robust full-stack web platforms and seamless mobile ecosystems.',
    contact_phone: '0968099678678',
    skills: ["Full-Stack", "Flutter", "Python", "HTML/CSS", "Vanilla JS", "Git Engine"],
    hobbies: ["Chess ♟️", "Basketball 🏀", "Watching TV Shows 🎬"],
    picture_data: null,
    picture_mime_type: null
  },
  projects: [
    { id: 1, title: "Staff Review Platform", description: "A collaborative feedback application designed to streamline workplace reviews and performance evaluation data pipelines.", tags: ["Full-Stack", "Web"], link: "https://github.com/redwivision/staff-review-platform", created_at: new Date().toISOString() },
    { id: 2, title: "Travel Assistant App", description: "Smart itinerary planning software engineered to automate travel logistics, mapping routes, and localized discovery indices.", tags: ["Full-Stack", "APIs"], link: "https://github.com/redwivision/travel-assistant", created_at: new Date().toISOString() },
    { id: 3, title: "theONE Mobile App", description: "Sleek and responsive cross-platform Flutter experience built with decoupled states for ultimate performance and fluid animations.", tags: ["Flutter", "Mobile"], link: "https://github.com/redwivision/theONE", created_at: new Date().toISOString() },
    { id: 4, title: "Sewasew AI Mobile", description: "An intelligent artificial intelligence consumer endpoint designed with native Dart architectures for optimal local scaling.", tags: ["Flutter", "AI"], link: "https://github.com/redwivision/sewasew-ai", created_at: new Date().toISOString() },
    { id: 5, title: "Pain Hunt Tool", description: "A highly resilient back-end algorithmic suite written to trace down performance pain points, system lags, and bugs.", tags: ["Python", "Automation"], link: "https://github.com/redwivision/pain_hunt", created_at: new Date().toISOString() },
    { id: 6, title: "Jarvis System Node", description: "A fast terminal-based contextual assistant built to parse background scripts, automate environment tasks, and optimize logic workflows.", tags: ["Python", "Scripts"], link: "https://github.com/redwivision/Jarvis", created_at: new Date().toISOString() },
    { id: 7, title: "FavoriteSite Chrome Tool", description: "A lightweight Google Chrome layout injection tool for tracking, pinning, and indexing prioritized workspace web coordinates.", tags: ["Extension", "JS"], link: "https://github.com/redwivision/FavoriteSite-chrome_extention", created_at: new Date().toISOString() },
    { id: 8, title: "AI Tutor Engine", description: "An automated custom learning wrapper designed to feed documents directly into predictive LLM pathways for student support.", tags: ["AI Labs", "Python"], link: "https://github.com/redwivision/AI_tutor", created_at: new Date().toISOString() },
    { id: 9, title: "Expense Tracker Ledger", description: "A clean math matrix engine built to log transactions, compute continuous spend trajectories, and map financial records.", tags: ["Utility", "Full-Stack"], link: "https://github.com/redwivision/Expense-tracker", created_at: new Date().toISOString() },
    { id: 10, title: "Habit Tracker Matrix", description: "A consistency engine displaying streak counts, continuous logic updates, and interactive user progression elements.", tags: ["Utility", "Frontend"], link: "https://github.com/redwivision/Habit-Tracker", created_at: new Date().toISOString() },
    { id: 11, title: "O-Home School Link", description: "An integrated portal linking modern academic nodes with local systems to establish immediate data transparency.", tags: ["Ecosystem", "Web", "Full-Stack"], link: "https://github.com/redwivision/O-Home-School-Link", created_at: new Date().toISOString() }
  ],
  messages: [],
  settings: {},
  nextProjectId: 12,
  nextMessageId: 1
};

if (process.env.DB_HOST && process.env.DB_HOST.trim() && process.env.DB_NAME && process.env.DB_NAME.trim()) {
  try {
    poolInstance = new pg.Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      connectionTimeoutMillis: 1500,
    });
  } catch (err) {
    console.warn('[DB] PostgreSQL pool initialization skipped:', err.message);
    poolInstance = null;
  }
}

// Resilient pool wrapper with in-memory fallback
const pool = {
  query: async (text, params = []) => {
    if (poolInstance) {
      try {
        const res = await poolInstance.query(text, params);
        return res;
      } catch (err) {
        console.warn('[DB] PostgreSQL connection unavailable. Using in-memory fallback store.');
        poolInstance = null;
      }
    }

    const queryStr = text.trim();

    // DDL Statements (CREATE, ALTER)
    if (/^CREATE TABLE/i.test(queryStr) || /^ALTER TABLE/i.test(queryStr)) {
      return { rows: [], count: 0 };
    }

    // SELECT COUNT(*)
    if (/SELECT COUNT\(\*\) FROM profile/i.test(queryStr)) {
      return { rows: [{ count: '1' }] };
    }
    if (/SELECT COUNT\(\*\) FROM projects/i.test(queryStr)) {
      return { rows: [{ count: String(inMemoryStore.projects.length) }] };
    }

    // Profile SELECT
    if (/SELECT \* FROM profile/i.test(queryStr)) {
      return { rows: [inMemoryStore.profile] };
    }

    // Profile UPDATE
    if (/UPDATE profile/i.test(queryStr)) {
      const [hero_title, hero_bio, contact_phone, skills, hobbies, picture_data, picture_mime_type] = params;
      if (hero_title !== undefined) inMemoryStore.profile.hero_title = hero_title;
      if (hero_bio !== undefined) inMemoryStore.profile.hero_bio = hero_bio;
      if (contact_phone !== undefined) inMemoryStore.profile.contact_phone = contact_phone;
      if (skills !== undefined) {
        inMemoryStore.profile.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
      }
      if (hobbies !== undefined) {
        inMemoryStore.profile.hobbies = typeof hobbies === 'string' ? JSON.parse(hobbies) : hobbies;
      }
      if (picture_data !== undefined) inMemoryStore.profile.picture_data = picture_data;
      if (picture_mime_type !== undefined) inMemoryStore.profile.picture_mime_type = picture_mime_type;

      return { rows: [inMemoryStore.profile] };
    }

    // Profile INSERT
    if (/INSERT INTO profile/i.test(queryStr)) {
      return { rows: [inMemoryStore.profile] };
    }

    // Projects SELECT
    if (/SELECT \* FROM projects/i.test(queryStr)) {
      const sorted = [...inMemoryStore.projects].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return { rows: sorted };
    }

    // Projects INSERT
    if (/INSERT INTO projects/i.test(queryStr)) {
      const [title, description, link, tags] = params;
      const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
      const newProj = {
        id: inMemoryStore.nextProjectId++,
        title,
        description,
        link,
        tags: parsedTags,
        created_at: new Date().toISOString()
      };
      inMemoryStore.projects.push(newProj);
      return { rows: [newProj] };
    }

    // Projects UPDATE
    if (/UPDATE projects/i.test(queryStr)) {
      const [title, description, link, tags, projectId] = params;
      const idNum = parseInt(projectId);
      const index = inMemoryStore.projects.findIndex(p => p.id === idNum);
      if (index !== -1) {
        const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
        inMemoryStore.projects[index] = {
          ...inMemoryStore.projects[index],
          title,
          description,
          link,
          tags: parsedTags
        };
        return { rows: [inMemoryStore.projects[index]] };
      }
      return { rows: [] };
    }

    // Projects DELETE
    if (/DELETE FROM projects/i.test(queryStr)) {
      const [projectId] = params;
      const idNum = parseInt(projectId);
      const index = inMemoryStore.projects.findIndex(p => p.id === idNum);
      if (index !== -1) {
        const deleted = inMemoryStore.projects.splice(index, 1)[0];
        return { rows: [deleted] };
      }
      return { rows: [] };
    }

    // Settings SELECT
    if (/SELECT value FROM settings/i.test(queryStr)) {
      const key = params && params[0] ? params[0] : 'admin_secret';
      const val = inMemoryStore.settings[key];
      return { rows: val ? [{ value: val }] : [] };
    }

    // Settings INSERT / UPSERT / UPDATE
    if (/settings/i.test(queryStr) && (/INSERT/i.test(queryStr) || /UPDATE/i.test(queryStr))) {
      const key = params && params[0] ? params[0] : 'admin_secret';
      const val = params && params[1] ? params[1] : '';
      if (key && val) {
        inMemoryStore.settings[key] = val;
      }
      return { rows: [{ key, value: val }] };
    }

    // Messages SELECT
    if (/SELECT \* FROM messages/i.test(queryStr)) {
      const sorted = [...inMemoryStore.messages].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return { rows: sorted };
    }

    // Messages INSERT
    if (/INSERT INTO messages/i.test(queryStr)) {
      const [sender_name, sender_email, message_body] = params;
      const newMsg = {
        id: inMemoryStore.nextMessageId++,
        sender_name,
        sender_email,
        message_body,
        created_at: new Date().toISOString()
      };
      inMemoryStore.messages.push(newMsg);
      return { rows: [newMsg] };
    }

    // Messages DELETE
    if (/DELETE FROM messages/i.test(queryStr)) {
      const msgId = parseInt(params[0], 10);
      const idx = inMemoryStore.messages.findIndex(m => m.id === msgId);
      if (idx !== -1) {
        const removed = inMemoryStore.messages.splice(idx, 1);
        return { rows: removed };
      }
      return { rows: [] };
    }

    return { rows: [] };
  }
};

export default pool;
