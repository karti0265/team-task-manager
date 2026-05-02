import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_BASE = "https://team-task-manager-production-55a4.up.railway.app/api";
// ─── API HELPER ───────────────────────────────────────────────────────────────
const api = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password) => {
    const data = await api('/auth/signup', { method: 'POST', body: { name, email, password } });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, signup, logout, loading }}>{children}</AuthContext.Provider>;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a14;
    --surface: #12121e;
    --surface2: #1a1a2e;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --accent: #6c63ff;
    --accent2: #ff6584;
    --accent3: #43e97b;
    --text: #f0f0ff;
    --text2: #9898b8;
    --text3: #5a5a7a;
    --danger: #ff4757;
    --warning: #ffa502;
    --success: #2ed573;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --radius: 12px;
    --radius-sm: 8px;
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
    --glow: 0 0 30px rgba(108,99,255,0.2);
  }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* LAYOUT */
  .app-shell { display: flex; min-height: 100vh; }

  .sidebar {
    width: 240px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    transition: transform 0.3s ease;
  }

  .sidebar-logo {
    padding: 24px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo-text {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, #6c63ff, #ff6584);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }

  .logo-sub { font-size: 11px; color: var(--text3); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }

  .sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }

  .nav-label { font-size: 10px; color: var(--text3); letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 8px 4px; margin-top: 8px; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text2);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s;
    margin-bottom: 2px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: rgba(108,99,255,0.15); color: var(--accent); }
  .nav-item .nav-icon { width: 18px; text-align: center; font-size: 16px; }
  .nav-item .badge { margin-left: auto; background: var(--accent); color: white; font-size: 10px; padding: 1px 6px; border-radius: 99px; font-weight: 700; }

  .sidebar-user {
    padding: 16px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
  }

  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-email { font-size: 11px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .btn-logout {
    background: none; border: none; cursor: pointer;
    color: var(--text3); font-size: 14px; padding: 4px;
    border-radius: 6px; transition: all 0.15s;
  }
  .btn-logout:hover { color: var(--danger); background: rgba(255,71,87,0.1); }

  /* MAIN CONTENT */
  .main { margin-left: 240px; flex: 1; }

  .topbar {
    padding: 20px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: rgba(10,10,20,0.8);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .page-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; }
  .page-subtitle { font-size: 13px; color: var(--text3); margin-top: 1px; }

  .content { padding: 28px 32px; }

  /* CARDS */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: var(--border2); }

  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #7c74ff; box-shadow: 0 4px 15px rgba(108,99,255,0.4); transform: translateY(-1px); }
  .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border2); }
  .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: rgba(255,71,87,0.15); color: var(--danger); border: 1px solid rgba(255,71,87,0.3); }
  .btn-danger:hover { background: rgba(255,71,87,0.25); }
  .btn-sm { padding: 5px 10px; font-size: 12px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

  /* FORMS */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .form-input, .form-select, .form-textarea {
    width: 100%; background: var(--surface2);
    border: 1px solid var(--border2); border-radius: var(--radius-sm);
    padding: 10px 14px; color: var(--text); font-family: var(--font-body); font-size: 14px;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: var(--accent); box-shadow: 0 0 0 3px rgba(108,99,255,0.15);
  }
  .form-select option { background: var(--surface2); }
  .form-textarea { min-height: 80px; resize: vertical; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
    z-index: 200; display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 16px; padding: 28px;
    width: 100%; max-width: 480px;
    box-shadow: var(--shadow);
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

  /* GRID */
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }

  /* STATS */
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .stat-label { font-size: 12px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-value { font-family: var(--font-display); font-size: 32px; font-weight: 800; }
  .stat-sub { font-size: 12px; color: var(--text2); }
  .stat-accent { color: var(--accent); }
  .stat-danger { color: var(--danger); }
  .stat-success { color: var(--success); }
  .stat-warning { color: var(--warning); }

  /* TAGS / BADGES */
  .badge-status {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 99px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .badge-todo { background: rgba(152,152,184,0.15); color: var(--text2); }
  .badge-in_progress { background: rgba(108,99,255,0.2); color: var(--accent); }
  .badge-done { background: rgba(46,213,115,0.2); color: var(--success); }
  .badge-low { background: rgba(46,213,115,0.1); color: var(--success); }
  .badge-medium { background: rgba(255,165,2,0.15); color: var(--warning); }
  .badge-high { background: rgba(255,71,87,0.15); color: var(--danger); }
  .badge-admin { background: rgba(108,99,255,0.2); color: var(--accent); }
  .badge-member { background: rgba(152,152,184,0.1); color: var(--text2); }

  /* TASK CARD */
  .task-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    transition: all 0.2s;
  }
  .task-card:hover { border-color: var(--border2); transform: translateY(-1px); box-shadow: var(--shadow); }
  .task-card-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .task-card-desc { font-size: 13px; color: var(--text3); margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .task-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .task-card-actions { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }

  /* PROJECT CARD */
  .project-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .project-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    opacity: 0;
    transition: opacity 0.2s;
  }
  .project-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--glow); }
  .project-card:hover::before { opacity: 1; }
  .project-name { font-family: var(--font-display); font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .project-desc { font-size: 13px; color: var(--text3); margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .project-progress { height: 4px; background: var(--surface2); border-radius: 2px; margin-bottom: 12px; overflow: hidden; }
  .project-progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent3)); border-radius: 2px; transition: width 0.5s ease; }
  .project-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text3); }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
  td { padding: 12px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.02); }

  /* AUTH PAGE */
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at 30% 40%, rgba(108,99,255,0.1), transparent 60%),
                radial-gradient(ellipse at 70% 80%, rgba(255,101,132,0.08), transparent 60%),
                var(--bg);
    padding: 20px;
  }
  .auth-card {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 20px;
    padding: 40px;
    width: 100%;
    max-width: 420px;
    box-shadow: var(--shadow);
  }
  .auth-logo { text-align: center; margin-bottom: 32px; }
  .auth-logo-text { font-family: var(--font-display); font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #6c63ff, #ff6584); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .auth-logo-sub { font-size: 13px; color: var(--text3); margin-top: 4px; }
  .auth-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; margin-bottom: 24px; }
  .auth-switch { text-align: center; font-size: 13px; color: var(--text3); margin-top: 20px; }
  .auth-switch a { color: var(--accent); cursor: pointer; font-weight: 600; }

  /* ALERTS */
  .alert { padding: 12px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 16px; }
  .alert-error { background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.3); color: #ff8795; }
  .alert-success { background: rgba(46,213,115,0.1); border: 1px solid rgba(46,213,115,0.3); color: var(--success); }

  /* EMPTY */
  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .empty-desc { font-size: 14px; color: var(--text3); margin-bottom: 20px; }

  /* FILTERS */
  .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
  .filter-select { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--radius-sm); padding: 7px 12px; color: var(--text2); font-size: 13px; cursor: pointer; outline: none; }
  .filter-select:focus { border-color: var(--accent); color: var(--text); }

  /* AVATAR GROUP */
  .avatar-sm {
    width: 26px; height: 26px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; flex-shrink: 0;
  }

  /* LOADING */
  .loading { display: flex; align-items: center; justify-content: center; padding: 60px; }
  .spinner { width: 36px; height: 36px; border: 3px solid var(--border2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* DIVIDER */
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* SECTION HEADER */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .section-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; }

  /* OVERDUE */
  .overdue-row td { color: var(--danger) !important; }

  /* COLUMNS VIEW */
  .kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .kanban-col { background: var(--surface2); border-radius: var(--radius); padding: 14px; }
  .kanban-col-header { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text2); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
  .kanban-count { background: var(--border2); padding: 1px 7px; border-radius: 99px; font-size: 11px; }
  .kanban-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; }
  .kanban-card:hover { border-color: var(--accent); }
  .kanban-card-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  .kanban-card-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

  /* DATE */
  .due-overdue { color: var(--danger); }
  .due-soon { color: var(--warning); }
  .due-ok { color: var(--success); }

  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .main { margin-left: 0; }
    .kanban { grid-template-columns: 1fr; }
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .topbar { padding: 14px 16px; }
    .content { padding: 16px; }
  }
`;

// ─── UTILITY ──────────────────────────────────────────────────────────────────
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const dueClass = (due_date, status) => {
  if (!due_date || status === 'done') return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(due_date);
  const diff = Math.floor((due - today) / 86400000);
  if (diff < 0) return 'due-overdue';
  if (diff <= 2) return 'due-soon';
  return 'due-ok';
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Spinner() { return <div className="loading"><div className="spinner" /></div>; }

function Modal({ title, onClose, children, actions }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title">{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

function Alert({ type = 'error', msg }) {
  if (!msg) return null;
  return <div className={`alert alert-${type}`}>{msg}</div>;
}

function StatusBadge({ status }) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  return <span className={`badge-status badge-${status}`}>{labels[status] || status}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`badge-status badge-${priority}`}>{priority}</span>;
}

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
function AuthPage() {
  const [mode, setMode] = useState('login');
  const { login, signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await signup(form.name, form.email, form.password);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-text">TaskFlow</div>
          <div className="auth-logo-sub">Team Task Manager</div>
        </div>
        <div className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
        <Alert msg={error} />
        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')}
            onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
        <div className="auth-switch">
          {mode === 'login' ? <>Don't have an account? <a onClick={() => setMode('signup')}>Sign up</a></> :
            <>Already have an account? <a onClick={() => setMode('login')}>Sign in</a></>}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onGoToProject }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const statusMap = {};
  (data.tasksByStatus || []).forEach(r => { statusMap[r.status] = r.count; });

  return (
    <div>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Projects</div>
          <div className="stat-value stat-accent">{data.totalProjects}</div>
          <div className="stat-sub">You're a member of</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">My Tasks</div>
          <div className="stat-value">{data.myTasks}</div>
          <div className="stat-sub">Assigned to me</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value stat-success">{statusMap.done || 0}</div>
          <div className="stat-sub">Tasks done</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value stat-danger">{data.overdueTasks}</div>
          <div className="stat-sub">Need attention</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Activity</div></div>
          {data.recentTasks.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>No tasks yet</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Project</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recentTasks.map(t => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => onGoToProject(t.project_id)}>
                      <td>{t.title}</td>
                      <td style={{ color: 'var(--text3)' }}>{t.project_name}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title" style={{ color: 'var(--danger)' }}>⚠ Overdue Tasks</div></div>
          {data.overdueList.length === 0 ? (
            <div style={{ color: 'var(--success)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>🎉 No overdue tasks!</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Project</th><th>Due</th></tr></thead>
                <tbody>
                  {data.overdueList.map(t => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => onGoToProject(t.project_id)}>
                      <td style={{ color: 'var(--danger)' }}>{t.title}</td>
                      <td style={{ color: 'var(--text3)' }}>{t.project_name}</td>
                      <td style={{ color: 'var(--danger)' }}>{formatDate(t.due_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT LIST ─────────────────────────────────────────────────────────────
function ProjectList({ onSelect }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const load = useCallback(() => api('/projects').then(setProjects).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setError('');
    try {
      const p = await api('/projects', { method: 'POST', body: form });
      setProjects(prev => [{ ...p, task_count: 0, done_count: 0, member_count: 1 }, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '' });
    } catch (e) { setError(e.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="section-header">
        <div className="section-title">All Projects ({projects.length})</div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>＋ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-desc">Create your first project to get started</div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Project</button>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => {
            const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <div key={p.id} className="project-card" onClick={() => onSelect(p.id)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="project-name">{p.name}</div>
                  <span className={`badge-status badge-${p.my_role}`}>{p.my_role}</span>
                </div>
                <div className="project-desc">{p.description || 'No description'}</div>
                <div className="project-progress">
                  <div className="project-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="project-meta">
                  <span>{p.task_count} tasks · {pct}% done</span>
                  <span>👥 {p.member_count} member{p.member_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="New Project" onClose={() => { setShowCreate(false); setError(''); }}
          actions={[
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>,
            <button className="btn btn-primary" onClick={create}>Create</button>
          ]}>
          <Alert msg={error} />
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What is this project about?" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TASK FORM ────────────────────────────────────────────────────────────────
function TaskForm({ task, projectId, members, onSave, onClose, isAdmin }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee_id: task?.assignee_id || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
  });
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setError('');
    try {
      let result;
      const body = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      if (task) {
        result = await api(`/projects/${projectId}/tasks/${task.id}`, { method: 'PUT', body });
      } else {
        result = await api(`/projects/${projectId}/tasks`, { method: 'POST', body });
      }
      onSave(result);
      onClose();
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal title={task ? 'Edit Task' : 'New Task'} onClose={onClose}
      actions={[
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>,
        <button className="btn btn-primary" onClick={save}>{task ? 'Save' : 'Create'}</button>
      ]}>
      <Alert msg={error} />
      {isAdmin ? (
        <>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title} onChange={set('title')} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Details..." value={form.description} onChange={set('description')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assignee_id} onChange={set('assignee_id')}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.due_date} onChange={set('due_date')} />
            </div>
          </div>
        </>
      ) : (
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={set('status')}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      )}
    </Modal>
  );
}

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
function ProjectDetail({ projectId, onBack }) {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [taskFilter, setTaskFilter] = useState({ status: '', priority: '', assignee: '' });
  const [editTask, setEditTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: 'member' });
  const [memberError, setMemberError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t, m] = await Promise.all([
        api(`/projects/${projectId}`),
        api(`/projects/${projectId}/tasks`),
        api(`/projects/${projectId}/members`),
      ]);
      setProject(p);
      setTasks(t);
      setMembers(m);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const isAdmin = project?.my_role === 'admin';

  const filteredTasks = tasks.filter(t => {
    if (taskFilter.status && t.status !== taskFilter.status) return false;
    if (taskFilter.priority && t.priority !== taskFilter.priority) return false;
    if (taskFilter.assignee && String(t.assignee_id) !== taskFilter.assignee) return false;
    return true;
  });

  const byStatus = (s) => filteredTasks.filter(t => t.status === s);

  const handleTaskSave = (saved) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addMember = async () => {
    setMemberError('');
    try {
      await api(`/projects/${projectId}/members`, { method: 'POST', body: newMember });
      setNewMember({ email: '', role: 'member' });
      setShowAddMember(false);
      load();
    } catch (e) { setMemberError(e.message); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
    setMembers(prev => prev.filter(m => m.id !== userId));
  };

  const changeRole = async (userId, role) => {
    await api(`/projects/${projectId}/members/${userId}`, { method: 'PUT', body: { role } });
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, role } : m));
  };

  if (loading) return <Spinner />;
  if (!project) return null;

  const TabBtn = ({ id, label }) => (
    <button className={`btn ${tab === id ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab(id)}>{label}</button>
  );

  const TaskCard = ({ task }) => (
    <div className="task-card">
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="task-card-title">{task.title}</div>
      {task.description && <div className="task-card-desc">{task.description}</div>}
      <div className="task-card-meta">
        {task.assignee_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="avatar-sm">{initials(task.assignee_name)}</div>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{task.assignee_name}</span>
          </span>
        )}
        {task.due_date && (
          <span style={{ fontSize: 12 }} className={dueClass(task.due_date, task.status)}>
            📅 {formatDate(task.due_date)}
          </span>
        )}
      </div>
      <div className="task-card-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => setEditTask(task)}>
          {isAdmin ? '✏ Edit' : '↑ Status'}
        </button>
        {(isAdmin || task.created_by === user.id) && (
          <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>🗑</button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back</button>
        <div>
          <div className="section-title">{project.name}</div>
          {project.description && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{project.description}</div>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>
            👥 Members ({members.length})
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>＋ Task</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <TabBtn id="board" label="📋 Board" />
        <TabBtn id="list" label="≡ List" />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select className="filter-select" value={taskFilter.status} onChange={e => setTaskFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select className="filter-select" value={taskFilter.priority} onChange={e => setTaskFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="filter-select" value={taskFilter.assignee} onChange={e => setTaskFilter(f => ({ ...f, assignee: e.target.value }))}>
            <option value="">All Assignees</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* BOARD VIEW */}
      {tab === 'board' && (
        <div className="kanban">
          {[['todo', 'To Do'], ['in_progress', 'In Progress'], ['done', 'Done']].map(([s, label]) => (
            <div key={s} className="kanban-col">
              <div className="kanban-col-header">
                <span>{label}</span>
                <span className="kanban-count">{byStatus(s).length}</span>
              </div>
              {byStatus(s).map(t => <TaskCard key={t.id} task={t} />)}
              {byStatus(s).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>No tasks</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {tab === 'list' && (
        <div className="card">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No tasks</div>
              <div className="empty-desc">Create a task to get started</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        {t.description && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
                      </td>
                      <td>
                        {t.assignee_name ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="avatar-sm">{initials(t.assignee_name)}</div>
                            <span style={{ fontSize: 13 }}>{t.assignee_name}</span>
                          </span>
                        ) : <span style={{ color: 'var(--text3)', fontSize: 13 }}>—</span>}
                      </td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        <span className={`${dueClass(t.due_date, t.status)}`} style={{ fontSize: 13 }}>
                          {formatDate(t.due_date)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditTask(t)}>
                            {isAdmin ? 'Edit' : 'Status'}
                          </button>
                          {(isAdmin || t.created_by === user.id) && (
                            <button className="btn btn-danger btn-sm" onClick={() => deleteTask(t.id)}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {(showNewTask || editTask) && (
        <TaskForm
          task={editTask}
          projectId={projectId}
          members={members}
          isAdmin={isAdmin}
          onSave={handleTaskSave}
          onClose={() => { setShowNewTask(false); setEditTask(null); }}
        />
      )}

      {showMembers && (
        <Modal title="Project Members" onClose={() => setShowMembers(false)}>
          {isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>＋ Add Member</button>
            </div>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Role</th>{isAdmin && <th>Actions</th>}</tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar-sm">{initials(m.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name} {m.id === user.id && <span style={{ color: 'var(--text3)' }}>(you)</span>}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge-status badge-${m.role}`}>{m.role}</span></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {m.id !== user.id && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => changeRole(m.id, m.role === 'admin' ? 'member' : 'admin')}>
                                → {m.role === 'admin' ? 'Member' : 'Admin'}
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {showAddMember && (
        <Modal title="Add Member" onClose={() => { setShowAddMember(false); setMemberError(''); }}
          actions={[
            <button className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>,
            <button className="btn btn-primary" onClick={addMember}>Add</button>
          ]}>
          <Alert msg={memberError} />
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="user@example.com"
              value={newMember.email} onChange={e => setNewMember(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={newMember.role} onChange={e => setNewMember(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
  const { user, logout, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <AuthPage />;

  const navItems = [
    { id: 'dashboard', icon: '⬡', label: 'Dashboard' },
    { id: 'projects', icon: '📁', label: 'Projects' },
  ];

  const goToProject = (id) => {
    setSelectedProject(id);
    setPage('project');
  };

  const pageTitle = () => {
    if (page === 'dashboard') return { title: 'Dashboard', sub: `Welcome back, ${user.name}` };
    if (page === 'project') return { title: 'Project', sub: 'Tasks & Team' };
    return { title: 'Projects', sub: 'All your projects' };
  };

  const { title, sub } = pageTitle();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">TaskFlow</div>
          <div className="logo-sub">Team Manager</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Main</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); setSelectedProject(null); }}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{initials(user.name)}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button className="btn-logout" onClick={logout} title="Logout">⎋</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{title}</div>
            <div className="page-subtitle">{sub}</div>
          </div>
        </div>
        <div className="content">
          {page === 'dashboard' && <Dashboard onGoToProject={goToProject} />}
          {page === 'projects' && <ProjectList onSelect={goToProject} />}
          {page === 'project' && selectedProject && (
            <ProjectDetail projectId={selectedProject} onBack={() => setPage('projects')} />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Root() {
  return (
    <>
      <style>{styles}</style>
      <AuthProvider>
        <App />
      </AuthProvider>
    </>
  );
}
