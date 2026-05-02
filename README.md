# TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

## 🚀 Live Demo
> [Add your Railway URL here after deployment]

## 📁 Repo Structure

```
team-task-manager/
├── backend/          # Node.js + Express + SQLite
│   ├── server.js     # All REST API routes
│   ├── package.json
│   └── railway.toml
└── frontend/         # React SPA
    ├── src/
    │   ├── App.js    # Complete frontend (auth, dashboard, projects, tasks)
    │   └── index.js
    └── package.json
```

## ✅ Features

### Authentication
- Signup / Login with JWT tokens
- Passwords hashed with bcrypt
- Protected routes — token stored in localStorage

### Project & Team Management
- Create / view / delete projects
- Add members by email
- Role-based access: **Admin** (full control) vs **Member** (limited)
- View member list, change roles, remove members

### Task Management
- Create, edit, delete tasks per project
- Assign tasks to project members
- Priority levels: Low / Medium / High
- Status: To Do / In Progress / Done
- Due dates with overdue highlighting

### Dashboard
- Stats: total projects, my tasks, completed, overdue
- Recent task activity
- Overdue task list with quick navigation

### Two Views
- **Board (Kanban)**: columns by status
- **List**: sortable table with filters

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcryptjs |
| Frontend | React 18 (Create React App) |
| Styling | Pure CSS (no UI library) |
| Deployment | Railway |

---

## 🚂 Deployment on Railway

### Step 1 — Deploy Backend

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub Repo** → point to `backend/` folder  
   *(or use Railway's monorepo root dir setting)*
3. Set environment variables:
   ```
   JWT_SECRET=your-super-secret-key-here
   PORT=5000
   ```
4. Railway auto-detects Node.js and runs `npm start`
5. Copy the generated backend URL (e.g. `https://taskflow-backend.up.railway.app`)

### Step 2 — Deploy Frontend

1. In Railway → **New Service** → GitHub repo → point to `frontend/` folder
2. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.up.railway.app/api
   ```
3. Build command: `npm run build`
4. Start command: `npx serve -s build -l $PORT`

> **Tip:** Add `"serve": "^14.0.0"` to frontend `dependencies` for the serve command.

### Step 3 — Verify
- Visit the frontend URL
- Sign up with a new account
- Create a project, add tasks

---

## 🏃 Running Locally

### Backend
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
# Create .env file:
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
# Runs on http://localhost:3000
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Projects
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/projects` | Member | List my projects |
| POST | `/api/projects` | Any | Create project |
| GET | `/api/projects/:id` | Member | Get project |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Owner | Delete project |

### Members
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/projects/:id/members` | Member | List members |
| POST | `/api/projects/:id/members` | Admin | Add member |
| PUT | `/api/projects/:id/members/:uid` | Admin | Change role |
| DELETE | `/api/projects/:id/members/:uid` | Admin | Remove member |

### Tasks
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/projects/:id/tasks` | Member | List tasks |
| POST | `/api/projects/:id/tasks` | Member | Create task |
| PUT | `/api/projects/:id/tasks/:tid` | Admin/Assignee | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | Admin/Creator | Delete task |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Stats + recent + overdue tasks |

---

## 🔒 Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| View project & tasks | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Update any task | ✅ | ❌ |
| Update own/assigned task status | ✅ | ✅ |
| Delete tasks (admin or creator) | ✅ | Own only |
| Add/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Delete project | Owner only | ❌ |

---

## 📊 Database Schema

```sql
users           -- id, name, email, password, created_at
projects        -- id, name, description, owner_id, created_at
project_members -- project_id, user_id, role (admin|member)
tasks           -- id, title, description, project_id, assignee_id,
                --   created_by, status, priority, due_date, timestamps
```

---

## 👤 Author
Built as part of a full-stack development assignment.
