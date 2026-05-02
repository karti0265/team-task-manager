const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'team-task-manager-secret-key-2024';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Database setup
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    project_id INTEGER NOT NULL,
    assignee_id INTEGER,
    created_by INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Check if user is admin of a project
function requireProjectAdmin(req, res, next) {
  const projectId = parseInt(req.params.projectId || req.body.project_id);
  const member = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);
  
  if (!member || member.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.memberRole = member.role;
  next();
}

// Check if user is member of a project (admin or member)
function requireProjectMember(req, res, next) {
  const projectId = parseInt(req.params.projectId || req.params.id || req.body.project_id);
  const member = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);
  
  if (!member) {
    return res.status(403).json({ error: 'Project access denied' });
  }
  req.memberRole = member.role;
  next();
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  ).run(name, email.toLowerCase(), hashed);

  const user = { id: result.lastInsertRowid, name, email: email.toLowerCase() };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ user, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid email or password' });

  const payload = { id: user.id, name: user.name, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: payload, token });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ─── PROJECT ROUTES ───────────────────────────────────────────────────────────
// Get all projects for current user
app.get('/api/projects', authenticate, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as owner_name,
      pm.role as my_role,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
      (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// Create project
app.post('/api/projects', authenticate, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const result = db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description || '', req.user.id);

  // Auto-add creator as admin
  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(result.lastInsertRowid, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...project, my_role: 'admin' });
});

// Get single project
app.get('/api/projects/:projectId', authenticate, requireProjectMember, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name, pm.role as my_role,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    WHERE p.id = ?
  `).get(req.user.id, req.params.projectId);
  
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Update project (admin only)
app.put('/api/projects/:projectId', authenticate, requireProjectAdmin, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  db.prepare(
    'UPDATE projects SET name = ?, description = ? WHERE id = ?'
  ).run(name, description || '', req.params.projectId);

  res.json({ message: 'Project updated' });
});

// Delete project (admin only)
app.delete('/api/projects/:projectId', authenticate, requireProjectAdmin, (req, res) => {
  // Only owner can delete
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(req.params.projectId);
  if (project.owner_id !== req.user.id)
    return res.status(403).json({ error: 'Only the project owner can delete it' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.projectId);
  res.json({ message: 'Project deleted' });
});

// ─── MEMBER ROUTES ────────────────────────────────────────────────────────────
// Get members of a project
app.get('/api/projects/:projectId/members', authenticate, requireProjectMember, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(req.params.projectId);
  res.json(members);
});

// Add member (admin only) - by email
app.post('/api/projects/:projectId/members', authenticate, requireProjectAdmin, (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found with that email' });

  const existing = db.prepare(
    'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(req.params.projectId, user.id);
  if (existing) return res.status(409).json({ error: 'User is already a member' });

  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(req.params.projectId, user.id, role === 'admin' ? 'admin' : 'member');

  res.status(201).json({ message: 'Member added', user });
});

// Update member role (admin only)
app.put('/api/projects/:projectId/members/:userId', authenticate, requireProjectAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role))
    return res.status(400).json({ error: 'Role must be admin or member' });

  db.prepare(
    'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?'
  ).run(role, req.params.projectId, req.params.userId);

  res.json({ message: 'Role updated' });
});

// Remove member (admin only)
app.delete('/api/projects/:projectId/members/:userId', authenticate, requireProjectAdmin, (req, res) => {
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(req.params.projectId);
  if (parseInt(req.params.userId) === project.owner_id)
    return res.status(400).json({ error: 'Cannot remove the project owner' });

  db.prepare(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
  ).run(req.params.projectId, req.params.userId);
  res.json({ message: 'Member removed' });
});

// ─── TASK ROUTES ──────────────────────────────────────────────────────────────
// Get all tasks for a project
app.get('/api/projects/:projectId/tasks', authenticate, requireProjectMember, (req, res) => {
  const { status, assignee, priority } = req.query;
  let query = `
    SELECT t.*, 
      u.name as assignee_name, u.email as assignee_email,
      c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.created_by
    WHERE t.project_id = ?
  `;
  const params = [req.params.projectId];

  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (assignee) { query += ' AND t.assignee_id = ?'; params.push(assignee); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }

  query += ' ORDER BY t.created_at DESC';
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

// Create task
app.post('/api/projects/:projectId/tasks', authenticate, requireProjectMember, (req, res) => {
  const { title, description, assignee_id, status, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  // Members can only create tasks, admins can assign
  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assignee_id, created_by, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || '',
    req.params.projectId,
    assignee_id || null,
    req.user.id,
    status || 'todo',
    priority || 'medium',
    due_date || null
  );

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.created_by
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// Update task
app.put('/api/projects/:projectId/tasks/:taskId', authenticate, requireProjectMember, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?')
    .get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Members can only update status of their own tasks; admins can update all
  const isAdmin = req.memberRole === 'admin';
  const isAssignee = task.assignee_id === req.user.id;
  const isCreator = task.created_by === req.user.id;

  if (!isAdmin && !isAssignee && !isCreator)
    return res.status(403).json({ error: 'You can only update tasks assigned to you or created by you' });

  const { title, description, assignee_id, status, priority, due_date } = req.body;

  // Non-admins can only update status
  if (!isAdmin) {
    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status || task.status, task.id);
  } else {
    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, assignee_id = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || task.title,
      description !== undefined ? description : task.description,
      assignee_id !== undefined ? assignee_id : task.assignee_id,
      status || task.status,
      priority || task.priority,
      due_date !== undefined ? due_date : task.due_date,
      task.id
    );
  }

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    JOIN users c ON c.id = t.created_by
    WHERE t.id = ?
  `).get(task.id);

  res.json(updated);
});

// Delete task (admin or creator)
app.delete('/api/projects/:projectId/tasks/:taskId', authenticate, requireProjectMember, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND project_id = ?')
    .get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.memberRole !== 'admin' && task.created_by !== req.user.id)
    return res.status(403).json({ error: 'Only admins or task creators can delete tasks' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ message: 'Task deleted' });
});

// ─── DASHBOARD ROUTE ─────────────────────────────────────────────────────────
app.get('/api/dashboard', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const stats = {
    totalProjects: db.prepare(`
      SELECT COUNT(*) as count FROM project_members WHERE user_id = ?
    `).get(req.user.id).count,

    totalTasks: db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    `).get(req.user.id).count,

    myTasks: db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?
    `).get(req.user.id).count,

    overdueTasks: db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      WHERE t.due_date < ? AND t.status != 'done'
    `).get(req.user.id, today).count,

    tasksByStatus: db.prepare(`
      SELECT t.status, COUNT(*) as count
      FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      GROUP BY t.status
    `).all(req.user.id),

    recentTasks: db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      LEFT JOIN users u ON u.id = t.assignee_id
      ORDER BY t.updated_at DESC
      LIMIT 5
    `).all(req.user.id),

    overdueList: db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.due_date < ? AND t.status != 'done'
      ORDER BY t.due_date ASC
      LIMIT 10
    `).all(req.user.id, today)
  };

  res.json(stats);
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
