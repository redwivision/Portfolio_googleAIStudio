# System Architecture & Technical API Specification

This document provides a comprehensive technical breakdown of the architecture, database layer, REST API endpoints, security mechanisms, and design rationale for the INSA Cyber Command & Software Engineer Portfolio Application.

---

## 🏗️ 1. Architecture Overview

The system adheres to a full-stack architecture built with **Node.js, Express, PostgreSQL, and Vanilla ES6+ Web Technologies**.

### Architectural Layers:
1. **Frontend Presentation Layer (`public/`)**:
   - Built with semantic HTML5, CSS3 CSS Variables, and modular Vanilla JavaScript.
   - Operates without external client-side framework overhead for maximum efficiency, instant load speeds, and clean DOM manipulation.
   - Includes full accessibility standards, touch target compliance, responsive design, and an interactive Spy Vault Modal interface.

2. **Backend Services & API Layer (`backend/server.js`)**:
   - Express REST API handling CORS, JSON body payloads (up to 10MB limit for image uploads), token-based authentication header validation (`x-admin-token`), and robust error handling.

3. **Data Access & Abstraction Layer (`backend/db.js`)**:
   - Employs a **Dual-Layer Persistence Pattern**:
     - **Primary Store**: PostgreSQL database connection pool via `pg.Pool`.
     - **Fallback Store**: In-memory state store with full schema query translation, ensuring zero downtime if PostgreSQL is unconfigured or unreachable.

---

## 🗄️ 2. Database Schema Specification

The PostgreSQL database maintains four core tables initialized automatically upon application startup:

### 1. `settings` Table
Stores persistent system configurations such as the active admin secret passcode.
```sql
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 2. `profile` Table
Stores personal biography, contact info, and binary profile image data.
```sql
CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  hero_title TEXT NOT NULL,
  hero_bio TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  skills JSONB NOT NULL,
  hobbies JSONB NOT NULL,
  picture_data BYTEA,
  picture_mime_type TEXT
);
```

### 3. `projects` Table
Stores portfolio projects showcased on the main page.
```sql
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags JSONB NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. `messages` Table
Stores contact form submissions sent by visitors.
```sql
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 3. REST API Endpoint Specification

### Public Endpoints

#### `GET /api/projects`
- **Description**: Retrieves all portfolio projects sorted by creation date (newest first).
- **Authentication**: None (Public).
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "title": "Cyber Threat Matrix",
      "description": "Real-time network security analyzer...",
      "tags": ["Cybersecurity", "React", "Node.js"],
      "link": "https://github.com/...",
      "created_at": "2026-08-04T00:00:00.000Z"
    }
  ]
  ```

#### `GET /api/profile`
- **Description**: Fetches current profile metadata, contact phone, skills, hobbies, and base64-encoded profile picture.
- **Authentication**: None (Public).
- **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "hero_title": "Hi, I am Lewi Kibru...",
    "hero_bio": "Cybersecurity & Software Engineer...",
    "contact_phone": "+251900000000",
    "skills": ["JavaScript", "Node.js", "PostgreSQL"],
    "hobbies": ["Chess ♟️", "Basketball 🏀"],
    "picture_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "picture_mime_type": "image/png"
  }
  ```

#### `POST /api/contact`
- **Description**: Receives a new contact message submission from a portfolio visitor.
- **Authentication**: None (Public).
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Project Collaboration",
    "message": "Hello Lewi, I would like to discuss..."
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Message sent successfully!",
    "insertedId": 5
  }
  ```

---

### Admin Authentication & Verification Endpoints

#### `POST /api/admin/verify`
- **Description**: Verifies whether an entered secret passcode token is valid.
- **Authentication**: `x-admin-token` header OR `token` in JSON body.
- **Request Body**:
  ```json
  {
    "token": "supersecureadminpass123"
  }
  ```
- **Response**:
  - `200 OK`: `{ "success": true, "message": "Access granted. Vault unlatched." }`
  - `401 Unauthorized`: `{ "success": false, "error": "Access denied. Invalid security passcode." }`

#### `PUT /api/admin/change-token`
- **Description**: Updates the secret admin token and persists it in the PostgreSQL `settings` table.
- **Authentication**: Required header `x-admin-token: <current_secret_token>`.
- **Request Body**:
  ```json
  {
    "newToken": "myNewSuperSecretPasscode2026"
  }
  ```
- **Response**:
  - `200 OK`: `{ "success": true, "message": "Secret admin token updated successfully!" }`
  - `400 Bad Request`: `{ "success": false, "error": "New secret token must be at least 4 characters long." }`
  - `401 Unauthorized`: `{ "success": false, "error": "Unauthorized. Current admin token is invalid." }`

---

### Admin Data Management (CRUD) Endpoints

#### `POST /api/projects`
- **Description**: Creates a new project in the portfolio.
- **Authentication**: Required header `x-admin-token`.
- **Request Body**:
  ```json
  {
    "title": "New System Tool",
    "description": "High performance logging service",
    "tags": ["Node.js", "Express"],
    "link": "https://github.com/..."
  }
  ```
- **Response**: `201 Created`

#### `PUT /api/projects/:id`
- **Description**: Updates an existing project by ID.
- **Authentication**: Required header `x-admin-token`.
- **Request Body**: Partial or full fields (`title`, `description`, `tags`, `link`).
- **Response**: `200 OK`

#### `DELETE /api/projects/:id`
- **Description**: Deletes a project by ID.
- **Authentication**: Required header `x-admin-token`.
- **Response**: `200 OK`

#### `PUT /api/admin/profile`
- **Description**: Updates profile details and uploads/removes the binary profile image in PostgreSQL.
- **Authentication**: Required header `x-admin-token`.
- **Request Body**:
  ```json
  {
    "hero_title": "Updated Title",
    "hero_bio": "Updated Bio...",
    "contact_phone": "+251911111111",
    "skills": ["Python", "Go", "Docker"],
    "hobbies": ["Cyber Security", "Reading"],
    "picture_base64": "iVBORw0KGgo...",
    "picture_mime_type": "image/png"
  }
  ```
- **Response**: `200 OK`

#### `GET /api/admin/messages`
- **Description**: Fetches all visitor contact messages.
- **Authentication**: Required header `x-admin-token`.
- **Response**: `200 OK` (Array of messages).

#### `DELETE /api/admin/messages/:id`
- **Description**: Deletes a visitor message by ID.
- **Authentication**: Required header `x-admin-token`.
- **Response**: `200 OK`

---

## 🔒 4. Security & Engineering Design Decisions

### 1. Database-Persisted Passcode Management
- **Why**: hardcoding admin credentials or relying purely on environment variables makes dynamic credential management impossible in production without server redeployment.
- **How**: The active admin token is initialized from `.env` or defaults to `supersecureadminpass123`. Upon first startup, it is stored in the `settings` database table. Admin token updates via `PUT /api/admin/change-token` persist immediately to the database and update the active runtime memory, ensuring persistence across restarts.

### 2. Binary Profile Picture DB Storage (BYTEA)
- **Why**: Storing image assets directly in PostgreSQL eliminates dependencies on third-party cloud object storage (e.g. AWS S3, Google Cloud Storage buckets), making the application completely self-contained and portable.
- **How**: The backend accepts base64 data URLs from client file uploads, converts them into Node `Buffer` instances for PostgreSQL `BYTEA` column storage, and converts stored binary back to base64 strings when serving `GET /api/profile`.

### 3. Audio & Sensory Hygiene
- **Why**: Web Audio API synthetics (beeps/boops) often violate user accessibility expectations, trigger unwanted background browser warnings, or disrupt screen-readers.
- **How**: All synthetic Web Audio sounds were completely removed in favor of clean CSS modal transitions, clear visual feedback notifications, scanline overlays, and responsive status indicator badges.

### 4. Multi-Modal Spy Vault Activation Strategy
- **Why**: Providing multiple covert entry actions (logo red dot triple-click, canvas 'L' gesture recognition, hotkeys, secret keyword typing) creates a memorable spy-themed user experience while guaranteeing accessible access for users on any device (desktop, tablet, or mobile) without cluttering the public header navigation.

### 6. Dynamic Tag Extraction & Category Filter Engine
- **Why**: Visitors need a fast, intuitive way to explore projects by technical stack (e.g. `Web`, `Backend`, `Full-Stack`, `Ecosystem`, `Cybersecurity`) without reloading pages or making extra database trips.
- **How**: Upon fetching projects from `/api/projects`, the client dynamically parses all JSON tag arrays, builds a map of unique categories with real-time project counts, and generates styled pill buttons. Clicking a button filters projects instantly in-memory, updating pagination states seamlessly.

