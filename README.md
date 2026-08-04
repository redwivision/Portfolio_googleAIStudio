# INSA Cyber Command & Software Engineer Portfolio

Welcome to the **INSA Cyber Command & Software Engineer Portfolio** codebase — a resilient full-stack web application designed for showcasing projects, managing profile credentials, capturing client messages, and performing full administrative CRUD operations via a secret "Spy Vault" access gateway.

---

## 📖 Quick Start & Operational Runbook

### 1. Prerequisites
- **Node.js**: v18.x or higher recommended.
- **npm**: v9.x or higher.
- *(Optional)* **PostgreSQL**: PostgreSQL 12+ database instance.

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory or set environment variables:
```env
PORT=3000
MY_SECRET_PASSWORD=supersecureadminpass123

# Optional PostgreSQL Database Configuration:
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=portfolio_db
```
*Note: If PostgreSQL environment variables are omitted or unreachable, the application automatically falls back to an isolated in-memory data store without breaking the application.*

### 4. Running the Application
Start the server in production or development mode:
```bash
# Start server
npm start

# Or run dev mode
npm run dev
```
The app will be accessible at `http://localhost:3000`.

---

## 🕵️ Secret "Spy Vault" Access Triggers

To access the hidden **Admin Command Center** from the main portfolio page (`/`), perform any of the following covert actions:

1. **Logo Secret Dot**: Click the red dot (`.`) in the `LEWI.KIBRU` logo **3 times rapidly**.
2. **Canvas Gesture**: Draw a downward then rightward **"L" gesture** on the Hero section background canvas.
3. **Keyboard Shortcut**: Press `Ctrl + Shift + A` on Windows/Linux or `Cmd + Shift + A` on Mac.
4. **Secret Keyword Typing**: Type `spy`, `admin`, or `vault` on your keyboard anywhere on the main page.

---

## 🔑 Admin Command Center & Workflows

Once the Spy Vault Modal opens:
1. Enter your active secret token (default: `supersecureadminpass123`).
2. Click **VERIFY & ENTER VAULT** to navigate to `/admin.html`.

### Admin Capabilities & CRUD Workflows:
- **Interactive Category Filtering**: Dynamic filter buttons allow visitors to filter project cards by technology tags (e.g. `#Web`, `#Backend`, `#Full-Stack`, `#Ecosystem`, `#Cybersecurity`) with live project count badges.
- **Project Management (Full CRUD)**:
  - **Create**: Add project title, description, tags, and link.
  - **Read**: View all live projects in an interactive grid.
  - **Update**: Edit project details directly with pre-filled forms.
  - **Delete**: Instantly purge projects from the database.
- **Profile & Image Management**:
  - Update Hero Title, Hero Bio, Contact Phone, Skills, and Hobbies.
  - **Profile Picture Upload**: Upload an image file (`.jpg`, `.png`, `.webp`). The binary data is stored directly in PostgreSQL (or fallback store) and rendered dynamically across the hero banner.
- **Messages Management**:
  - Read incoming contact form submissions.
  - Delete processed messages.
- **Security Settings (Change Secret Token)**:
  - Modify the active secret admin passcode dynamically. The new token is saved directly in the database `settings` table and persisted across server restarts.

---

## 📁 Repository Directory Structure

```
.
├── backend/
│   ├── db.js            # Unified database module with PostgreSQL pool & in-memory fallback
│   └── server.js        # Express REST API routes, middleware, and table migrations
├── public/
│   ├── index.html       # Public portfolio landing page with secret spy triggers & modal
│   ├── script.js        # Client-side interactions, spy engine, and public API calls
│   ├── style.css        # Responsive styling, spy modal UI, and custom animations
│   ├── admin.html       # Admin Command Center interface
│   └── admin.js        # Admin dashboard CRUD state manager & token updater
├── package.json         # NPM package declaration and scripts
├── README.md            # Operational Runbook (This document)
└── ARCHITECTURE.md      # Comprehensive Architectural & Technical API documentation
```
