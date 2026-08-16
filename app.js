/* =========================================================
   HomeworkHub — app.js (Supabase Realtime Cloud Sync + Local Fallback)
   ========================================================= */

'use strict';

const STORAGE_KEY = 'homeworkhub_retro_v7';
const TEACHER_PASSWORD = '2992006bot1';

const AVATAR_COLORS = [
  '#d96b43', '#4a7c59', '#d99b26', '#3d5a80',
  '#6b5b95', '#c94a53', '#2a9d8f', '#e76f51',
];

// ── SUPABASE CLIENT CONFIG ─────────────────────────────────
// Credentials are public anon keys — safe to embed in frontend
const SUPABASE_URL = 'https://nxzysmgtuzhmysvclshd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54enlzbWd0dXpobXlzdmNsc2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjI5MzIsImV4cCI6MjEwMjE5ODkzMn0.Cfo9jcEyP26aJpTSJHAb2dnwhRDCiBgMr2KMh9LQaC0';

let supabaseClient = null;
let isCloudEnabled = false;

function initSupabase() {
  if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isCloudEnabled = true;
      console.log('⚡ Supabase Cloud Connected!');
    } catch (e) {
      console.warn('Failed to init Supabase:', e);
      isCloudEnabled = false;
    }
  }
}

// These functions kept for compatibility with any remaining HTML references
function saveSupabaseConfig() { closeModal('modal-supabase-config'); }
function useOfflineLocalStorage() { closeModal('modal-supabase-config'); }

// ── STATE ──────────────────────────────────────────────────
let state = {
  students: [],
  tasks: [],
  currentUser: null
};

let currentView = 'dashboard';
let selectedColor = AVATAR_COLORS[0];
let selectedRoleInModal = 'teacher';
let pendingDeleteFn = null;
let pendingUploadTaskId = null; // for upload confirmation dialog

// ── PERSISTENCE ────────────────────────────────────────────
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (isCloudEnabled) syncToCloud();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state.students = parsed.students || [];
      state.tasks = parsed.tasks || [];
      // Always require manual login on every page load
      state.currentUser = null;
    } catch (e) {
      console.warn('Failed to parse state:', e);
      state = { students: [], tasks: [], currentUser: null };
    }
  }
}

// ── CLOUD SYNC WITH SUPABASE ───────────────────────────────
async function syncFromCloud() {
  if (!isCloudEnabled || !supabaseClient) return;

  try {
    // 1. Fetch Students
    const { data: dbStudents, error: errS } = await supabaseClient.from('students').select('*');
    if (dbStudents) {
      state.students = dbStudents.map(s => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        pin: s.pin,
        color: s.color,
        createdAt: s.created_at
      }));
    }

    // 2. Fetch Tasks
    const { data: dbTasks, error: errT } = await supabaseClient.from('tasks').select('*');
    if (errT) console.error('Error fetching tasks from Supabase:', errT);

    // 3. Fetch Submissions
    const { data: dbSubs, error: errSub } = await supabaseClient.from('submissions').select('*');
    if (errSub) console.error('Error fetching submissions from Supabase:', errSub);

    if (dbTasks) {
      state.tasks = dbTasks.map(t => {
        const subs = (dbSubs || [])
          .filter(sub => sub.task_id === t.id)
          .map(sub => ({ data: sub.image_url, date: sub.created_at, id: sub.id }));

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          studentId: t.student_id,
          dueDate: t.due_date || '',
          status: t.status,
          isRecurring: !!t.is_recurring,
          approvedAt: t.approved_at,
          submissions: subs,
          createdAt: t.created_at
        };
      });
    }

    saveState();
    renderView(currentView);
  } catch (err) {
    console.error('Cloud Sync Error:', err);
  }
}

async function syncToCloud() {
  // Realtime Cloud pushes on actions
}

// ── HELPERS ────────────────────────────────────────────────
function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function initials(name) {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date() && !isToday(iso);
}

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function relativeTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 24);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function toast(message, type = 'info', icon = null) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icon || icons[type]}</span><span>${message}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── STREAK CALCULATION ─────────────────────────────────────
function getStudentStreak(studentId) {
  const days = new Set();
  state.tasks.forEach(task => {
    if (task.studentId !== studentId) return;
    if (task.submissions && task.submissions.length > 0) {
      task.submissions.forEach(sub => {
        const d = new Date(sub.date);
        days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
    }
  });

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return { streak, totalDays: days.size };
}

function getLast30DaysActivity(studentId) {
  const result = [];
  const today = new Date();
  const submissionDays = new Set();

  state.tasks.forEach(task => {
    if (task.studentId !== studentId) return;
    if (task.submissions) {
      task.submissions.forEach(sub => {
        const d = new Date(sub.date);
        submissionDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
    }
  });

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    result.push({
      date: d,
      active: submissionDays.has(key),
      isToday: i === 0,
    });
  }
  return result;
}

function getStudentStats(studentId) {
  const tasks = state.tasks.filter(t => t.studentId === studentId);
  const total = tasks.length;
  const submitted = tasks.filter(t => t.submissions && t.submissions.length > 0).length;
  const approved = tasks.filter(t => t.status === 'approved').length;
  const { streak } = getStudentStreak(studentId);
  return { total, submitted, approved, streak };
}

// ── ROLE & USER SESSION ────────────────────────────────────
function isLoggedIn() {
  return state.currentUser !== null;
}

function isTeacher() {
  return state.currentUser && state.currentUser.role === 'teacher';
}

function updateRoleUI() {
  if (!isLoggedIn()) {
    document.body.classList.add('unauthenticated');
    document.getElementById('sidebar-user-avatar').textContent = '?';
    document.getElementById('sidebar-user-avatar').style.background = 'var(--bg3)';
    document.getElementById('sidebar-user-name').textContent = 'Not Logged In';
    document.getElementById('sidebar-user-role').textContent = 'Please Login';
    return;
  }

  document.body.classList.remove('unauthenticated');
  const user = state.currentUser;
  const isT = isTeacher();

  // Sidebar profile card
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');

  if (isT) {
    avatarEl.textContent = 'T';
    avatarEl.style.background = 'var(--terracotta-dim)';
    nameEl.textContent = 'Teacher View';
    roleEl.textContent = 'Teacher Admin';
  } else {
    const s = state.students.find(st => st.id === user.studentId);
    avatarEl.textContent = s ? initials(s.name) : 'S';
    if (s) avatarEl.style.background = s.color || 'var(--denim)';
    nameEl.textContent = s ? s.name : 'Student View';
    roleEl.textContent = s ? (s.grade || 'Student') : 'Student Portal';
  }

  // Teacher-only elements
  document.querySelectorAll('.teacher-only').forEach(el => {
    if (isT) el.classList.remove('teacher-only-hide');
    else el.classList.add('teacher-only-hide');
  });

  // Nav tasks label
  const navTasksLabel = document.getElementById('nav-tasks-label');
  if (navTasksLabel) {
    navTasksLabel.textContent = isT ? 'Assignments' : 'My Homework';
  }

  // Welcome banner
  const heading = document.getElementById('welcome-heading');
  const subtext = document.getElementById('welcome-subtext');
  const bannerStreak = document.getElementById('banner-streak-val');

  if (isT) {
    heading.textContent = 'Welcome back, Teacher!';
    subtext.textContent = 'Overview of all student assignments, homework uploads, and streaks.';
    const maxStreak = Math.max(0, ...state.students.map(s => getStudentStreak(s.id).streak));
    bannerStreak.textContent = maxStreak;
  } else {
    const s = state.students.find(st => st.id === user.studentId);
    heading.textContent = `Welcome back, ${s ? s.name : 'Student'}!`;
    subtext.textContent = 'Here are your homework assignments to complete and upload images for.';
    const streak = s ? getStudentStreak(s.id).streak : 0;
    bannerStreak.textContent = streak;
  }
}

function selectLoginRole(role) {
  selectedRoleInModal = role;
  document.getElementById('role-btn-teacher').classList.toggle('active', role === 'teacher');
  document.getElementById('role-btn-student').classList.toggle('active', role === 'student');

  const studentWrap = document.getElementById('student-login-select-wrap');
  const teacherWrap = document.getElementById('teacher-login-pass-wrap');

  if (role === 'student') {
    studentWrap.classList.remove('hidden');
    teacherWrap.classList.add('hidden');
    const select = document.getElementById('login-student-select');
    select.innerHTML = state.students.map(s => `<option value="${s.id}">${escHtml(s.name)} (${escHtml(s.grade || 'Student')})</option>`).join('');
  } else {
    studentWrap.classList.add('hidden');
    teacherWrap.classList.remove('hidden');
  }
}

function openLoginDialog() {
  selectLoginRole('teacher');
  document.getElementById('input-teacher-pass').value = '';
  document.getElementById('input-student-pin').value = '';
  openModal('modal-login');
}

function handleDoLogin() {
  if (selectedRoleInModal === 'teacher') {
    const pass = document.getElementById('input-teacher-pass').value.trim();
    if (pass !== TEACHER_PASSWORD) {
      toast('Incorrect Teacher Password! (Required: 2992006bot1)', 'error');
      return;
    }
    state.currentUser = { role: 'teacher', studentId: null, name: 'Teacher' };
    saveState();
    updateRoleUI();
    closeModal('modal-login');
    renderView(currentView);
    toast('Logged in as Teacher Admin!', 'success');
  } else {
    const select = document.getElementById('login-student-select');
    const studentId = select ? select.value : null;
    if (!studentId) { toast('Please select a student account.', 'error'); return; }

    const student = state.students.find(s => s.id === studentId);
    const pin = document.getElementById('input-student-pin').value.trim();

    if (!student || (student.pin && pin !== student.pin)) {
      toast('Incorrect PIN passcode! (Default: 0000)', 'error');
      return;
    }

    state.currentUser = { role: 'student', studentId: studentId, name: student ? student.name : 'Student' };
    saveState();
    updateRoleUI();
    closeModal('modal-login');
    renderView(currentView);
    toast(`Welcome, ${student ? student.name : 'Student'}!`, 'success');
  }
}

// ── NAVIGATION ─────────────────────────────────────────────
function navigateTo(view) {
  if (!isLoggedIn()) {
    openLoginDialog();
    return;
  }
  if (!isTeacher() && view === 'students') {
    toast('Student accounts can only view tasks and streaks.', 'info');
    return;
  }
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNavBtn = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (activeNavBtn) activeNavBtn.classList.add('active');

  document.getElementById('page-title').textContent =
    { dashboard: 'Dashboard', students: 'Manage Students', tasks: isTeacher() ? 'Assignments' : 'My Tasks', streaks: 'Streak Tracker' }[view];
  renderView(view);
}

function renderView(view) {
  updateRoleUI();
  if (!isLoggedIn()) return;
  if (view === 'dashboard') renderDashboard();
  if (view === 'students') renderStudents();
  if (view === 'tasks') renderTasks();
  if (view === 'streaks') renderStreaks();
}

// ── DASHBOARD ──────────────────────────────────────────────
function renderDashboard() {
  renderStats();
  renderRecentSubmissions();
  renderTopStreaks();
  renderPendingTasks();
}

function renderStats() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;

  if (isT) {
    const totalStudents = state.students.length;
    const totalTasks = state.tasks.length;
    const submitted = state.tasks.filter(t => t.submissions && t.submissions.length > 0).length;
    const approved = state.tasks.filter(t => t.status === 'approved').length;

    const stats = [
      { icon: '👥', label: 'Total Students', value: totalStudents, color: 'var(--violet)', bg: 'var(--violet-dim)' },
      { icon: '📖', label: 'Assigned Tasks', value: totalTasks, color: 'var(--denim)', bg: 'var(--denim-dim)' },
      { icon: '📸', label: 'Submissions', value: submitted, color: 'var(--terracotta)', bg: 'var(--terracotta-dim)' },
      { icon: '✅', label: 'Approved', value: approved, color: 'var(--sage)', bg: 'var(--sage-dim)' },
    ];
    document.getElementById('stats-row').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${s.bg}; color:${s.color}">${s.icon}</div>
        <div>
          <div class="stat-value" style="color:${s.color}">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      </div>
    `).join('');
  } else {
    const myTasks = state.tasks.filter(t => t.studentId === currentStudentId);
    const totalTasks = myTasks.length;
    const submitted = myTasks.filter(t => t.submissions && t.submissions.length > 0).length;
    const approved = myTasks.filter(t => t.status === 'approved').length;
    const { streak } = getStudentStreak(currentStudentId);

    const stats = [
      { icon: '🔥', label: 'My Current Streak', value: `${streak} Days`, color: 'var(--terracotta)', bg: 'var(--terracotta-dim)' },
      { icon: '📖', label: 'My Total Tasks', value: totalTasks, color: 'var(--denim)', bg: 'var(--denim-dim)' },
      { icon: '📸', label: 'Submitted', value: submitted, color: 'var(--mustard)', bg: 'var(--mustard-dim)' },
      { icon: '✅', label: 'Approved', value: approved, color: 'var(--sage)', bg: 'var(--sage-dim)' },
    ];
    document.getElementById('stats-row').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${s.bg}; color:${s.color}">${s.icon}</div>
        <div>
          <div class="stat-value" style="color:${s.color}">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      </div>
    `).join('');
  }
}

function renderRecentSubmissions() {
  const allSubs = [];
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;

  state.tasks.forEach(task => {
    if (!isT && task.studentId !== currentStudentId) return;
    const student = state.students.find(s => s.id === task.studentId);
    if (!student || !task.submissions) return;
    task.submissions.forEach(sub => {
      allSubs.push({ task, student, sub });
    });
  });
  allSubs.sort((a, b) => new Date(b.sub.date) - new Date(a.sub.date));
  const recent = allSubs.slice(0, 6);

  const el = document.getElementById('recent-submissions-list');
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p>No uploaded homework photos yet</p></div>`;
    return;
  }
  el.innerHTML = recent.map(({ task, student, sub }) => `
    <div class="submission-item" onclick="openImageViewer('${sub.data}', '${escHtml(task.title)} — ${escHtml(student.name)}')">
      <div class="submission-thumb">
        <img src="${sub.data}" alt="submission" />
      </div>
      <div class="submission-info">
        <strong>${escHtml(student.name)}</strong>
        <span>${escHtml(task.title)}</span>
      </div>
      <div class="submission-time">${relativeTime(sub.date)}</div>
    </div>
  `).join('');
}

function renderTopStreaks() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;

  let studentStreaks = state.students.map(s => ({
    student: s,
    ...getStudentStreak(s.id),
  })).sort((a, b) => b.streak - a.streak).slice(0, 5);

  const el = document.getElementById('top-streaks-list');
  if (!studentStreaks.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔥</div><p>No student streaks recorded yet</p></div>`;
    return;
  }
  el.innerHTML = studentStreaks.map((item, i) => `
    <div class="streak-item" style="${item.student.id === currentStudentId ? 'background:var(--terracotta-dim);border-radius:var(--radius-sm)' : ''}">
      <div class="streak-rank">#${i + 1}</div>
      <div class="streak-avatar" style="background:${item.student.color}">${initials(item.student.name)}</div>
      <div class="streak-name">${escHtml(item.student.name)} ${item.student.id === currentStudentId ? ' (You)' : ''}</div>
      <div class="streak-flame">🔥 ${item.streak} days</div>
    </div>
  `).join('');
}

function renderPendingTasks() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;

  let pending = state.tasks.filter(t => {
    if (!isT && t.studentId !== currentStudentId) return false;
    return !t.submissions || t.submissions.length === 0;
  });

  document.getElementById('pending-count-badge').textContent = pending.length;

  const el = document.getElementById('pending-tasks-list');
  if (!pending.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎉</div><p>All assigned homework tasks have been submitted!</p></div>`;
    return;
  }
  el.innerHTML = pending.slice(0, 10).map(task => {
    const student = state.students.find(s => s.id === task.studentId);
    const overdue = isOverdue(task.dueDate);
    return `
      <div class="pending-item" onclick="openStudentDetailForTask('${task.studentId}')">
        <div class="pending-dot" style="${overdue ? 'background:var(--rose)' : ''}"></div>
        <div class="pending-task-name">${escHtml(task.title)}</div>
        <div class="pending-student">${student ? escHtml(student.name) : '—'}</div>
        <div class="pending-due ${overdue ? 'overdue' : ''}">${task.dueDate ? formatDate(task.dueDate) : '—'}</div>
      </div>
    `;
  }).join('');
}

// ── STUDENTS VIEW ──────────────────────────────────────────
function renderStudents(filter = '') {
  const search = (filter || document.getElementById('student-search').value || '').toLowerCase();
  const filtered = state.students.filter(s => s.name.toLowerCase().includes(search) || (s.grade && s.grade.toLowerCase().includes(search)));
  const grid = document.getElementById('student-grid');

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1">
        <div class="empty-state">
          <div class="empty-state-icon">👤</div>
          <p>${state.students.length ? 'No students match your search.' : 'Add your first student to get started!'}</p>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(student => {
    const stats = getStudentStats(student.id);
    const progress = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;
    return `
      <div class="student-card" onclick="openStudentDetail('${student.id}')">
        <div class="student-card-header">
          <div class="student-avatar" style="background:${student.color}">${initials(student.name)}</div>
          <div>
            <div class="student-card-name">${escHtml(student.name)}</div>
            <div class="student-card-grade">${escHtml(student.grade || 'No grade')}</div>
          </div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width:${progress}%;background:${student.color};"></div>
        </div>
        <div class="student-card-stats">
          <div class="student-stat">
            <div class="student-stat-val" style="color:var(--denim)">${stats.total}</div>
            <div class="student-stat-lbl">Tasks</div>
          </div>
          <div class="student-stat">
            <div class="student-stat-val" style="color:var(--mustard)">${stats.submitted}</div>
            <div class="student-stat-lbl">Done</div>
          </div>
          <div class="student-stat">
            <div class="student-stat-val" style="color:var(--terracotta)">🔥 ${stats.streak}</div>
            <div class="student-stat-lbl">Streak</div>
          </div>
        </div>
        <div class="student-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" onclick="openStudentDetail('${student.id}')">Tasks</button>
          <button class="btn btn-ghost btn-sm" onclick="editStudent('${student.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteStudent('${student.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// ── TASKS VIEW ─────────────────────────────────────────────
function renderTasks() {
  const sel = document.getElementById('task-filter-student');
  const prevVal = sel.value;
  sel.innerHTML = '<option value="all">All Students</option>' +
    state.students.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
  sel.value = prevVal || 'all';

  applyTaskFilters();
}

function applyTaskFilters() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;
  const studentFilter = isT ? document.getElementById('task-filter-student').value : currentStudentId;
  const statusFilter = document.getElementById('task-filter-status').value;

  let filtered = [...state.tasks];
  if (!isT) {
    filtered = filtered.filter(t => t.studentId === currentStudentId);
  } else if (studentFilter !== 'all') {
    filtered = filtered.filter(t => t.studentId === studentFilter);
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter(t => getTaskStatus(t) === statusFilter);
  }

  const list = document.getElementById('tasks-list');
  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>${state.tasks.length ? 'No tasks match your filter.' : 'No tasks assigned yet!'}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(task => renderTaskCard(task)).join('');
  filtered.forEach(task => {
    const fi = document.getElementById(`file-input-${task.id}`);
    if (fi) fi.addEventListener('change', e => handleFileUpload(e, task.id));
  });
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function hasSubmissionToday(task) {
  if (!task.submissions || task.submissions.length === 0) return false;
  const today = todayKey();
  return task.submissions.some(sub => {
    const d = new Date(sub.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return k === today;
  });
}

function getTaskStatus(task) {
  // Daily recurring: resets each day
  if (task.isRecurring) {
    if (task.status === 'approved' && task.approvedAt) {
      const approvedDay = new Date(task.approvedAt).toDateString();
      if (approvedDay === new Date().toDateString()) return 'approved';
    }
    if (hasSubmissionToday(task)) {
      // Has photos today but not yet submitted
      if (task.status !== 'submitted' && task.status !== 'approved') return 'draft';
      return task.status;
    }
    return 'pending';
  }
  if (task.status === 'approved') return 'approved';
  if (task.status === 'submitted') return 'submitted';
  // Has photos but student hasn’t clicked Submit yet
  if (task.submissions && task.submissions.length > 0) return 'draft';
  if (isOverdue(task.dueDate)) return 'overdue';
  return 'pending';
}

function getStatusLabel(task) {
  const s = getTaskStatus(task);
  const labels = {
    approved: '✅ Đã duyệt',
    submitted: '📨 Đã nộp',
    draft:    '📷 Chưa nộp',
    pending:  '⏳ Chưa làm',
    overdue:  '⚠️ Quá hạn',
  };
  const recurBadge = task.isRecurring ? '<span class="badge-recurring">🔁 Hàng ngày</span> ' : '';
  return `${recurBadge}<span class="status-pill status-${s}">${labels[s] || s}</span>`;
}

function renderTaskCard(task) {
  const student = state.students.find(s => s.id === task.studentId);
  const status = getTaskStatus(task);
  const subs = task.submissions || [];
  const isT = isTeacher();
  const canUpload = !isT && status !== 'approved' && status !== 'submitted';
  const canSubmit = !isT && status === 'draft' && subs.length > 0;

  return `
    <div class="task-card" id="task-card-${task.id}">
      <div class="task-card-header">
        <div>
          <div class="task-card-title">
            ${getStatusLabel(task)}
            ${escHtml(task.title)}
          </div>
          <div class="task-card-meta">
            ${student ? `<span>Học sinh: <strong>${escHtml(student.name)}</strong></span>` : ''}
            ${task.dueDate ? `<span>Hạn: ${formatDate(task.dueDate)}</span>` : ''}
            <span>${subs.length} ảnh đã chụp</span>
          </div>
        </div>
        <div class="task-card-actions">
          ${isT && status === 'submitted' ? `<button class="btn-approve" onclick="approveTask('${task.id}')">Duyệt bài</button>` : ''}
          ${isT && status === 'approved' ? `<button class="btn-approve approved" disabled>Đã duyệt ✅</button>` : ''}
          ${isT ? `
          <button class="btn btn-ghost btn-sm" onclick="editTask('${task.id}')">Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteTask('${task.id}')">Xóa</button>` : ''}
        </div>
      </div>
      <div class="task-card-body">
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        ${task.isRecurring ? `<div class="recurring-info">🔁 Task này lặp lại mỗi ngày — học sinh phải nộp ảnh mới mỗi ngày.</div>` : ''}
        ${isT && status === 'pending' ? `<div class="teacher-waiting-note">⏳ Học sinh chưa upload ảnh bài tập.</div>` : ''}
        ${isT && status === 'draft' ? `<div class="teacher-waiting-note draft-note">📷 Học sinh đã upload ảnh nhưng chưa nộp chính thức.</div>` : ''}
        ${canUpload ? `
        <div class="upload-zone" id="drop-${task.id}"
          onclick="openUploadConfirm('${task.id}')"
          ondragover="handleDragOver(event,'${task.id}')"
          ondragleave="handleDragLeave(event,'${task.id}')"
          ondrop="handleDrop(event,'${task.id}')">
          <div>📸 Chụp ảnh bài tập</div>
          <div style="font-size:11px;margin-top:4px;color:var(--text-3)">${subs.length > 0 ? 'Thêm ảnh nữa hoặc nộp bài bên dưới' : 'Click hoặc kéo thả ảnh vào đây'}</div>
          <input type="file" id="file-input-${task.id}" accept="image/*" multiple style="display:none" />
        </div>` : ''}
        ${subs.length > 0 ? `
        <div class="image-grid">
          ${subs.map((sub, idx) => `
            <div class="img-thumb-wrap" onclick="openImageViewer('${sub.data}', '${escHtml(task.title)}')">
              <img src="${sub.data}" alt="Submission ${idx + 1}" />
              ${canUpload ? `<button class="img-thumb-remove" onclick="removeSubmission(event,'${task.id}',${idx})">✕</button>` : ''}
            </div>
          `).join('')}
        </div>` : ''}
        ${canSubmit ? `
        <div class="submit-homework-bar">
          <div class="submit-homework-hint">📌 Kiểm tra lại ảnh rồi bấm nộp bài</div>
          <button class="btn-submit-homework" onclick="submitHomework('${task.id}')">📨 Nộp bài cho giáo viên</button>
        </div>` : ''}
        ${!isT && status === 'submitted' ? `<div class="submitted-notice">📨 Bài đã được nộp — đợi giáo viên duyệt!</div>` : ''}
        ${!isT && status === 'approved' ? `<div class="approved-notice">✅ Bài đã được duyệt! Chúc mừng 🎉</div>` : ''}
      </div>
    </div>
  `;
}

// ── STREAKS VIEW ───────────────────────────────────────────
function renderStreaks() {
  const grid = document.getElementById('streaks-grid');
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;

  let list = [...state.students];
  if (!isT) {
    list = list.filter(s => s.id === currentStudentId);
  }

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔥</div><p>No student streaks recorded yet!</p></div>`;
    return;
  }

  const sorted = list
    .map(s => ({ student: s, ...getStudentStreak(s.id), stats: getStudentStats(s.id), activity: getLast30DaysActivity(s.id) }))
    .sort((a, b) => b.streak - a.streak);

  grid.innerHTML = sorted.map(item => {
    const calHtml = item.activity.map(day => `
      <div class="cal-day ${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''}" title="${day.date.toLocaleDateString()}"></div>
    `).join('');

    return `
      <div class="streak-card">
        <div class="student-card-header">
          <div class="student-avatar" style="background:${item.student.color}">${initials(item.student.name)}</div>
          <div>
            <div class="student-card-name">${escHtml(item.student.name)}</div>
            <div class="student-card-grade">${escHtml(item.student.grade || 'No grade')}</div>
          </div>
        </div>

        <div class="streak-big">
          <div class="streak-fire">🔥</div>
          <div>
            <div class="streak-count">${item.streak}</div>
            <div class="streak-count-label">Day Streak</div>
          </div>
        </div>

        <div class="streak-mini-stats">
          <div class="streak-mini-stat">
            <div class="streak-mini-stat-val" style="color:var(--denim)">${item.stats.total}</div>
            <div class="streak-mini-stat-lbl">Tasks</div>
          </div>
          <div class="streak-mini-stat">
            <div class="streak-mini-stat-val" style="color:var(--mustard)">${item.stats.submitted}</div>
            <div class="streak-mini-stat-lbl">Done</div>
          </div>
          <div class="streak-mini-stat">
            <div class="streak-mini-stat-val" style="color:var(--sage)">${item.stats.approved}</div>
            <div class="streak-mini-stat-lbl">Approved</div>
          </div>
        </div>

        <div>
          <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;">Last 30 Days</div>
          <div class="calendar-grid">${calHtml}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── STUDENT DETAIL MODAL ───────────────────────────────────
function openStudentDetail(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  const tasks = state.tasks.filter(t => t.studentId === studentId);
  const { streak } = getStudentStreak(studentId);
  const isT = isTeacher();

  document.getElementById('modal-student-info').innerHTML = `
    <div class="student-avatar" style="background:${student.color}">${initials(student.name)}</div>
    <div>
      <strong>${escHtml(student.name)}</strong>
      <div style="color:var(--text-2);font-size:12px">${escHtml(student.grade || '')} • 🔥 ${streak} Day Streak</div>
    </div>
  `;

  const body = document.getElementById('modal-student-tasks');

  if (!tasks.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><p>No tasks assigned yet.</p>${isT ? `<button class="btn btn-primary mt-2" onclick="closeModal('modal-student-detail');openAddTaskFor('${studentId}')">+ Create Task</button>` : ''}</div>`;
  } else {
    body.innerHTML = tasks.map(task => {
      const status = getTaskStatus(task);
      const subs = task.submissions || [];
      return `
        <div class="student-task-item">
          <div class="student-task-item-header">
            <div class="student-task-item-title">${escHtml(task.title)}</div>
            ${getStatusLabel(task)}
          </div>
          <div style="font-size:11px;color:var(--text-2);margin-bottom:8px">
            ${task.description ? `<div>${escHtml(task.description)}</div>` : ''}
            ${task.dueDate ? `<div>Due: ${formatDate(task.dueDate)}</div>` : ''}
          </div>
          ${status !== 'approved' ? `
          <div class="upload-zone" style="padding:12px"
            onclick="openUploadConfirm('${task.id}', '${studentId}')"
            ondragover="handleDragOver(event,'modal-${task.id}')"
            ondragleave="handleDragLeave(event,'modal-${task.id}')"
            ondrop="handleDrop(event,'${task.id}')">
            <div>📸 Xác nhận và upload ảnh bài tập</div>
            <input type="file" id="modal-fi-${task.id}" accept="image/*" multiple style="display:none"
              onchange="handleFileUpload(event,'${task.id}');refreshStudentDetail('${studentId}')" />
          </div>` : ''}
          ${subs.length > 0 ? `
          <div class="image-grid" style="margin-top:8px">
            ${subs.map((sub, idx) => `
              <div class="img-thumb-wrap" onclick="openImageViewer('${sub.data}','${escHtml(task.title)}')">
                <img src="${sub.data}" alt="Submission ${idx + 1}" />
                ${status !== 'approved' ? `<button class="img-thumb-remove" onclick="removeSubmission(event,'${task.id}',${idx});refreshStudentDetail('${studentId}')">✕</button>` : ''}}
              </div>
            `).join('')}
          </div>` : ''}
          ${isT && status === 'submitted' ? `
          <div style="margin-top:8px">
            <button class="btn-approve" onclick="approveTask('${task.id}');refreshStudentDetail('${studentId}')">Approve Homework</button>
          </div>` : ''}
          ${isT && status === 'approved' ? `<div style="margin-top:8px"><button class="btn-approve approved" disabled>Approved</button></div>` : ''}
        </div>
      `;
    }).join('');
  }

  openModal('modal-student-detail');
}

function refreshStudentDetail(studentId) {
  openStudentDetail(studentId);
  renderView(currentView);
}

function openStudentDetailForTask(studentId) {
  navigateTo('tasks');
  const sel = document.getElementById('task-filter-student');
  if (sel) sel.value = studentId;
  applyTaskFilters();
}

// ── UPLOAD CONFIRMATION ────────────────────────────────────
function openUploadConfirm(taskId, studentDetailId = null) {
  // Students must confirm first — teachers cannot upload
  if (isTeacher()) return;
  pendingUploadTaskId = { taskId, studentDetailId };
  const task = state.tasks.find(t => t.id === taskId);
  document.getElementById('upload-confirm-task-name').textContent = task ? task.title : 'this task';
  openModal('modal-upload-confirm');
}

function doConfirmedUpload() {
  closeModal('modal-upload-confirm');
  if (!pendingUploadTaskId) return;
  const { taskId, studentDetailId } = pendingUploadTaskId;
  pendingUploadTaskId = null;
  const inputId = studentDetailId ? `modal-fi-${taskId}` : `file-input-${taskId}`;
  const fi = document.getElementById(inputId);
  if (fi) fi.click();
}

// ── UPLOADS ────────────────────────────────────────────────
function handleFileUpload(event, taskId) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  processFiles(files, taskId);
  event.target.value = '';
}

async function processFiles(files, taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  if (!task.submissions) task.submissions = [];

  let loaded = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file.', 'error');
      continue;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgData = e.target.result;
      task.submissions.push({ data: imgData, date: new Date().toISOString() });
      loaded++;
      if (task.status === 'approved') task.status = 'submitted';

      if (isCloudEnabled && supabaseClient) {
        try {
          const { data: subData, error: subErr } = await supabaseClient.from('submissions').insert([{
            task_id: task.id,
            student_id: task.studentId,
            image_url: imgData
          }]).select();
          if (subErr) {
            console.warn('Cloud submission failed:', subErr);
          } else if (subData && subData[0]) {
            const lastSub = task.submissions[task.submissions.length - 1];
            if (lastSub) lastSub.id = subData[0].id;
          }
          await supabaseClient.from('tasks').update({ status: task.status }).eq('id', task.id);
        } catch (err) {
          console.warn('Cloud submission failed:', err);
        }
      }

      if (loaded === files.length) {
        saveState();
        renderView(currentView);
        toast(`Đã thêm ${files.length} ảnh! Bấm "Nộp bài" để gửi cho giáo viên.`, 'info');
      }
    };
    reader.readAsDataURL(file);
  }
}

async function removeSubmission(event, taskId, idx) {
  event.stopPropagation();
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.submissions) return;

  const sub = task.submissions[idx];
  task.submissions.splice(idx, 1);
  if (task.submissions.length === 0 && task.status === 'approved') task.status = 'pending';

  if (isCloudEnabled && supabaseClient && sub && sub.id) {
    await supabaseClient.from('submissions').delete().eq('id', sub.id);
  }

  saveState();
  renderView(currentView);
  toast('Đã xóa ảnh.', 'info');
}

function handleDragOver(event, id) {
  event.preventDefault();
  const el = document.getElementById(`drop-${id}`);
  if (el) el.classList.add('drag-over');
}
function handleDragLeave(event, id) {
  const el = document.getElementById(`drop-${id}`);
  if (el) el.classList.remove('drag-over');
}
function handleDrop(event, taskId) {
  event.preventDefault();
  const el = document.getElementById(`drop-${taskId}`);
  if (el) el.classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length) processFiles(files, taskId);
}

// ── SUBMIT HOMEWORK (Student official submission) ──────────
function submitHomework(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.submissions || task.submissions.length === 0) {
    toast('Vui lòng upload ảnh trước khi nộp bài!', 'error');
    return;
  }
  if (isTeacher()) return;

  task.status = 'submitted';
  task.submittedAt = new Date().toISOString();

  if (isCloudEnabled && supabaseClient) {
    supabaseClient.from('tasks').update({ status: 'submitted' }).eq('id', task.id)
      .then(({ error }) => { if (error) console.warn('Cloud submit error:', error); });
  }

  saveState();
  closeModal('modal-student-detail');
  renderView(currentView);
  toast('📨 Bài đã được nộp cho giáo viên! Hãy đợi duyệt.', 'success');
}

// ── APPROVE TASK ───────────────────────────────────────────
async function approveTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = 'approved';
  task.approvedAt = new Date().toISOString();

  if (isCloudEnabled && supabaseClient) {
    await supabaseClient.from('tasks').update({
      status: 'approved',
      approved_at: task.approvedAt
    }).eq('id', task.id);
  }

  saveState();
  renderView(currentView);
  toast('Homework approved! Streak updated 🔥', 'success');
}

// ── IMAGE VIEWER ───────────────────────────────────────────
function openImageViewer(src, caption) {
  document.getElementById('viewer-img').src = src;
  document.getElementById('viewer-caption').textContent = caption || '';
  openModal('modal-image-viewer');
}

// ── ADD / EDIT STUDENT ─────────────────────────────────────
function openAddStudent() {
  document.getElementById('modal-student-title').textContent = 'Add New Student';
  document.getElementById('input-student-name').value = '';
  document.getElementById('input-student-grade').value = '';
  document.getElementById('input-student-passcode').value = '0000';
  document.getElementById('input-student-id').value = '';
  selectedColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  renderColorPicker();
  openModal('modal-student');
}

function editStudent(id) {
  const student = state.students.find(s => s.id === id);
  if (!student) return;
  document.getElementById('modal-student-title').textContent = 'Edit Student';
  document.getElementById('input-student-name').value = student.name;
  document.getElementById('input-student-grade').value = student.grade || '';
  document.getElementById('input-student-passcode').value = student.pin || '0000';
  document.getElementById('input-student-id').value = student.id;
  selectedColor = student.color || AVATAR_COLORS[0];
  renderColorPicker();
  openModal('modal-student');
}

function renderColorPicker() {
  document.getElementById('color-picker').innerHTML = AVATAR_COLORS.map(c => `
    <div class="color-swatch ${c === selectedColor ? 'selected' : ''}"
      style="background:${c}" onclick="selectColor('${c}')"></div>
  `).join('');
}

function selectColor(color) {
  selectedColor = color;
  renderColorPicker();
}

async function saveStudent() {
  const name = document.getElementById('input-student-name').value.trim();
  const grade = document.getElementById('input-student-grade').value.trim();
  const pin = document.getElementById('input-student-passcode').value.trim() || '0000';
  const id = document.getElementById('input-student-id').value;
  if (!name) { toast('Please enter a student name.', 'error'); return; }

  if (id) {
    const student = state.students.find(s => s.id === id);
    if (student) { student.name = name; student.grade = grade; student.pin = pin; student.color = selectedColor; }
    if (isCloudEnabled && supabaseClient) {
      const { error } = await supabaseClient.from('students').update({ name, grade, pin, color: selectedColor }).eq('id', id);
      if (error) {
        console.error('Supabase update student error:', error);
        toast(`Lỗi lưu học sinh: ${error.message}`, 'error');
      }
    }
    toast('Student updated!', 'success');
  } else {
    const newStudentId = uid();
    const newStudent = { id: newStudentId, name, grade, pin, color: selectedColor, createdAt: new Date().toISOString() };
    state.students.push(newStudent);
    if (isCloudEnabled && supabaseClient) {
      const { data, error } = await supabaseClient.from('students').insert([{ id: newStudentId, name, grade, pin, color: selectedColor }]).select();
      if (error) {
        console.error('Supabase insert student error:', error);
        toast(`Lỗi lưu học sinh: ${error.message}`, 'error');
      } else if (data && data[0]) {
        newStudent.id = data[0].id;
      }
    }
    toast('Student added!', 'success');
  }
  saveState();
  closeModal('modal-student');
  renderView(currentView);
  if (currentView !== 'tasks') renderTasks();
}

function confirmDeleteStudent(id) {
  const student = state.students.find(s => s.id === id);
  document.getElementById('confirm-message').textContent =
    `Delete "${student?.name}"? This will also remove their assignments.`;
  pendingDeleteFn = async () => {
    state.students = state.students.filter(s => s.id !== id);
    state.tasks = state.tasks.filter(t => t.studentId !== id);
    if (state.currentUser && state.currentUser.studentId === id) {
      state.currentUser = null;
    }

    if (isCloudEnabled && supabaseClient) {
      await supabaseClient.from('students').delete().eq('id', id);
    }

    saveState();
    renderView(currentView);
    toast('Student deleted.', 'info');
    closeModal('modal-confirm');
  };
  openModal('modal-confirm');
}

// ── ADD / EDIT TASK ────────────────────────────────────────
function openAddTask() {
  const sel = document.getElementById('input-task-student');
  sel.innerHTML = state.students.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
  if (!state.students.length) { toast('Please add a student first!', 'error'); return; }
  document.getElementById('modal-task-title').textContent = 'Create Assignment';
  document.getElementById('input-task-title').value = '';
  document.getElementById('input-task-desc').value = '';
  document.getElementById('input-task-id').value = '';
  document.getElementById('input-task-due').value = '';
  const recurChk = document.getElementById('input-task-recurring');
  if (recurChk) recurChk.checked = false;
  openModal('modal-task');
}

function openAddTaskFor(studentId) {
  openAddTask();
  document.getElementById('input-task-student').value = studentId;
}

function editTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  const sel = document.getElementById('input-task-student');
  sel.innerHTML = state.students.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
  document.getElementById('modal-task-title').textContent = 'Edit Assignment';
  document.getElementById('input-task-title').value = task.title;
  document.getElementById('input-task-desc').value = task.description || '';
  document.getElementById('input-task-student').value = task.studentId;
  document.getElementById('input-task-due').value = task.dueDate || '';
  document.getElementById('input-task-id').value = task.id;
  const recurChk = document.getElementById('input-task-recurring');
  if (recurChk) recurChk.checked = !!task.isRecurring;
  openModal('modal-task');
}

async function saveTask() {
  const title = document.getElementById('input-task-title').value.trim();
  const description = document.getElementById('input-task-desc').value.trim();
  const studentId = document.getElementById('input-task-student').value;
  const dueDate = document.getElementById('input-task-due').value;
  const id = document.getElementById('input-task-id').value;
  const recurChk = document.getElementById('input-task-recurring');
  const isRecurring = recurChk ? recurChk.checked : false;
  if (!title) { toast('Please enter a task title.', 'error'); return; }
  if (!studentId) { toast('Please select a student.', 'error'); return; }

  if (id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      task.title = title;
      task.description = description;
      task.studentId = studentId;
      task.dueDate = dueDate;
      task.isRecurring = isRecurring;
    }
    if (isCloudEnabled && supabaseClient) {
      const { error } = await supabaseClient.from('tasks').update({
        title,
        description,
        student_id: studentId,
        due_date: dueDate || null,
        is_recurring: isRecurring
      }).eq('id', id);
      if (error) {
        console.error('Supabase update task error:', error);
        toast(`Lỗi lưu Supabase: ${error.message}`, 'error');
      }
    }
    toast('Task updated!', 'success');
  } else {
    const newTaskId = uid();
    const newTask = {
      id: newTaskId,
      title,
      description,
      studentId,
      dueDate,
      isRecurring,
      status: 'pending',
      submissions: [],
      createdAt: new Date().toISOString()
    };
    state.tasks.push(newTask);
    if (isCloudEnabled && supabaseClient) {
      const { data, error } = await supabaseClient.from('tasks').insert([{
        id: newTaskId,
        title,
        description,
        student_id: studentId,
        due_date: dueDate || null,
        is_recurring: isRecurring
      }]).select();
      if (error) {
        console.error('Supabase insert task error:', error);
        toast(`Lỗi lưu Supabase: ${error.message}`, 'error');
      } else if (data && data[0]) {
        newTask.id = data[0].id;
      }
    }
    toast(isRecurring ? 'Daily recurring task created! 🔁' : 'Assignment created!', 'success');
  }
  saveState();
  closeModal('modal-task');
  renderView(currentView);
  if (currentView !== 'tasks') renderTasks();
}

function confirmDeleteTask(id) {
  const task = state.tasks.find(t => t.id === id);
  document.getElementById('confirm-message').textContent = `Delete assignment "${task?.title}"?`;
  pendingDeleteFn = async () => {
    state.tasks = state.tasks.filter(t => t.id !== id);

    if (isCloudEnabled && supabaseClient) {
      await supabaseClient.from('tasks').delete().eq('id', id);
    }

    saveState();
    renderView(currentView);
    toast('Assignment deleted.', 'info');
    closeModal('modal-confirm');
  };
  openModal('modal-confirm');
}

// ── GLOBAL SEARCH ──────────────────────────────────────────
function handleGlobalSearch(q) {
  if (!q) return;
  const lq = q.toLowerCase();
  if (isTeacher()) {
    const matchedStudent = state.students.find(s => s.name.toLowerCase().includes(lq));
    if (matchedStudent) {
      navigateTo('students');
      document.getElementById('student-search').value = q;
      renderStudents(q);
      return;
    }
  }
  navigateTo('tasks');
}

// ── SEED DEMO DATA (Student: Khải, PIN: 0000) ───────────────
function seedDemoData() {
  const existingKhai = state.students.find(s => s.name === 'Khải');
  if (!existingKhai) {
    const khhaiStudent = {
      id: uid(),
      name: 'Khải',
      grade: 'English Student',
      pin: '0000',
      color: '#d96b43',
      createdAt: new Date().toISOString()
    };
    state.students = [khhaiStudent];

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    state.tasks = [
      {
        id: uid(),
        title: 'English Reading & Writing Unit 1',
        description: 'Complete the comprehension exercises on pages 10-15 and upload clear photos of your work.',
        studentId: khhaiStudent.id,
        dueDate: today,
        status: 'pending',
        submissions: [],
        createdAt: new Date().toISOString()
      },
      {
        id: uid(),
        title: 'Vocabulary & Spelling Practice',
        description: 'Write down 15 new target words with their meanings and example sentences.',
        studentId: khhaiStudent.id,
        dueDate: tomorrow,
        status: 'pending',
        submissions: [],
        createdAt: new Date().toISOString()
      }
    ];
    saveState();
  }
}

// ── INIT ───────────────────────────────────────────────────
function init() {
  loadState();
  initSupabase();
  seedDemoData();

  if (isCloudEnabled) {
    syncFromCloud();
  }

  // Sidebar date
  const dateEl = document.getElementById('sidebar-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // Nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  // User switch buttons
  const switchUserBtn = document.getElementById('btn-switch-user');
  if (switchUserBtn) {
    switchUserBtn.addEventListener('click', openLoginDialog);
  }

  const loginModalBtn = document.getElementById('btn-login-modal');
  if (loginModalBtn) {
    loginModalBtn.addEventListener('click', openLoginDialog);
  }

  const doLoginBtn = document.getElementById('btn-do-login');
  if (doLoginBtn) doLoginBtn.addEventListener('click', handleDoLogin);

  // Primary add
  const addPrimaryBtn = document.getElementById('btn-add-primary');
  if (addPrimaryBtn) {
    addPrimaryBtn.addEventListener('click', () => {
      if (currentView === 'students') openAddStudent();
      else if (currentView === 'tasks') openAddTask();
      else openAddTask();
    });
  }

  // Student view add & search
  const addStudentBtn = document.getElementById('btn-add-student');
  if (addStudentBtn) addStudentBtn.addEventListener('click', openAddStudent);

  const studentSearchInput = document.getElementById('student-search');
  if (studentSearchInput) studentSearchInput.addEventListener('input', e => renderStudents(e.target.value));

  // Task view add & filter
  const addTaskBtn = document.getElementById('btn-add-task');
  if (addTaskBtn) addTaskBtn.addEventListener('click', openAddTask);

  const taskFilterStudent = document.getElementById('task-filter-student');
  if (taskFilterStudent) taskFilterStudent.addEventListener('change', applyTaskFilters);

  const taskFilterStatus = document.getElementById('task-filter-status');
  if (taskFilterStatus) taskFilterStatus.addEventListener('change', applyTaskFilters);

  // Modal saves
  const saveStudentBtn = document.getElementById('btn-save-student');
  if (saveStudentBtn) saveStudentBtn.addEventListener('click', saveStudent);

  const saveTaskBtn = document.getElementById('btn-save-task');
  if (saveTaskBtn) saveTaskBtn.addEventListener('click', saveTask);

  const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => pendingDeleteFn && pendingDeleteFn());

  // Close modals
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.modal === 'modal-login' && !isLoggedIn()) {
        toast('Please log in first.', 'info');
        return;
      }
      closeModal(btn.dataset.modal);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        if (overlay.id === 'modal-login' && !isLoggedIn()) return;
        closeModal(overlay.id);
      }
    });
  });

  // Search input
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleGlobalSearch(e.target.value.trim());
    });
  }

  // Initial login check
  if (!isLoggedIn()) {
    updateRoleUI();
    openLoginDialog();
  } else {
    navigateTo('dashboard');
  }
}

document.addEventListener('DOMContentLoaded', init);
