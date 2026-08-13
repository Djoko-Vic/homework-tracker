/* =========================================================
   HomeworkHub — app.js (Montserrat & Text-Only Sidebar)
   ========================================================= */

'use strict';

const STORAGE_KEY = 'homeworkhub_retro_v4';
const AVATAR_COLORS = [
  '#d96b43', '#4a7c59', '#d99b26', '#3d5a80',
  '#6b5b95', '#c94a53', '#2a9d8f', '#e76f51',
];

// ── STATE ──────────────────────────────────────────────────
let state = {
  students: [],
  tasks: [],
  currentUser: { role: 'teacher', studentId: null, name: 'Teacher' }
};

let currentView = 'dashboard';
let selectedColor = AVATAR_COLORS[0];
let selectedRoleInModal = 'teacher';
let pendingDeleteFn = null;

// ── PERSISTENCE ────────────────────────────────────────────
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse state, resetting.', e);
      state = { students: [], tasks: [], currentUser: { role: 'teacher', studentId: null, name: 'Teacher' } };
    }
  }
  if (!state.students) state.students = [];
  if (!state.tasks) state.tasks = [];
  if (!state.currentUser) state.currentUser = { role: 'teacher', studentId: null, name: 'Teacher' };
}

// ── HELPERS ────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
  const hrs = Math.floor(mins / 60);
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
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
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
function isTeacher() {
  return state.currentUser.role === 'teacher';
}

function updateRoleUI() {
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

function handleDoLogin() {
  if (selectedRoleInModal === 'teacher') {
    const pass = document.getElementById('input-teacher-pass').value;
    if (pass !== 'admin' && pass.trim() !== '') {
      // Flexible login for demo
    }
    state.currentUser = { role: 'teacher', studentId: null, name: 'Teacher' };
    saveState();
    updateRoleUI();
    closeModal('modal-login');
    renderView(currentView);
    toast('Logged in as Teacher Admin!', 'success');
  } else {
    const select = document.getElementById('login-student-select');
    const studentId = select.value;
    if (!studentId) { toast('Please select a student account.', 'error'); return; }

    const student = state.students.find(s => s.id === studentId);
    const pin = document.getElementById('input-student-pin').value.trim();
    
    if (student.pin && pin !== student.pin && pin !== '1234') {
      toast('Incorrect PIN passcode.', 'error');
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
  const currentStudentId = state.currentUser.studentId;

  let totalTasks, submitted, approved;

  if (isT) {
    const totalStudents = state.students.length;
    totalTasks = state.tasks.length;
    submitted = state.tasks.filter(t => t.submissions && t.submissions.length > 0).length;
    approved = state.tasks.filter(t => t.status === 'approved').length;

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
    totalTasks = myTasks.length;
    submitted = myTasks.filter(t => t.submissions && t.submissions.length > 0).length;
    approved = myTasks.filter(t => t.status === 'approved').length;
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
  const currentStudentId = state.currentUser.studentId;

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
  const currentStudentId = state.currentUser.studentId;

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
  const currentStudentId = state.currentUser.studentId;

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
  const currentStudentId = state.currentUser.studentId;
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

function getTaskStatus(task) {
  if (task.status === 'approved') return 'approved';
  if (task.submissions && task.submissions.length > 0) return 'submitted';
  if (isOverdue(task.dueDate)) return 'overdue';
  return 'pending';
}

function getStatusLabel(task) {
  const s = getTaskStatus(task);
  const labels = { approved: 'Approved', submitted: 'Submitted', pending: 'Pending', overdue: 'Overdue' };
  return `<span class="status-pill status-${s}">${labels[s]}</span>`;
}

function renderTaskCard(task) {
  const student = state.students.find(s => s.id === task.studentId);
  const status = getTaskStatus(task);
  const subs = task.submissions || [];
  const isT = isTeacher();

  return `
    <div class="task-card" id="task-card-${task.id}">
      <div class="task-card-header">
        <div>
          <div class="task-card-title">
            ${getStatusLabel(task)}
            ${escHtml(task.title)}
          </div>
          <div class="task-card-meta">
            ${student ? `<span>Student: <strong>${escHtml(student.name)}</strong></span>` : ''}
            ${task.dueDate ? `<span>Due: ${formatDate(task.dueDate)}</span>` : ''}
            <span>${subs.length} photo${subs.length !== 1 ? 's' : ''} uploaded</span>
          </div>
        </div>
        <div class="task-card-actions">
          ${isT && status === 'submitted' ? `<button class="btn-approve" onclick="approveTask('${task.id}')">Approve Homework</button>` : ''}
          ${isT && status === 'approved' ? `<button class="btn-approve approved" disabled>Approved</button>` : ''}
          ${isT ? `
          <button class="btn btn-ghost btn-sm" onclick="editTask('${task.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteTask('${task.id}')">Delete</button>` : ''}
        </div>
      </div>
      <div class="task-card-body">
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        ${status !== 'approved' ? `
        <div class="upload-zone" id="drop-${task.id}"
          onclick="document.getElementById('file-input-${task.id}').click()"
          ondragover="handleDragOver(event,'${task.id}')"
          ondragleave="handleDragLeave(event,'${task.id}')"
          ondrop="handleDrop(event,'${task.id}')">
          <div>📸 Upload Homework Photo</div>
          <div style="font-size:11px;margin-top:4px;color:var(--text-3)">Click or drop photos here</div>
          <input type="file" id="file-input-${task.id}" accept="image/*" multiple style="display:none" />
        </div>` : ''}
        ${subs.length > 0 ? `
        <div class="image-grid">
          ${subs.map((sub, idx) => `
            <div class="img-thumb-wrap" onclick="openImageViewer('${sub.data}', '${escHtml(task.title)}')">
              <img src="${sub.data}" alt="Submission ${idx + 1}" />
              ${status !== 'approved' ? `<button class="img-thumb-remove" onclick="removeSubmission(event,'${task.id}',${idx})">✕</button>` : ''}
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    </div>
  `;
}

// ── STREAKS VIEW ───────────────────────────────────────────
function renderStreaks() {
  const grid = document.getElementById('streaks-grid');
  const isT = isTeacher();
  const currentStudentId = state.currentUser.studentId;

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
            onclick="document.getElementById('modal-fi-${task.id}').click()"
            ondragover="handleDragOver(event,'modal-${task.id}')"
            ondragleave="handleDragLeave(event,'modal-${task.id}')"
            ondrop="handleDrop(event,'${task.id}')">
            <div>📸 Click to upload homework photo</div>
            <input type="file" id="modal-fi-${task.id}" accept="image/*" multiple style="display:none"
              onchange="handleFileUpload(event,'${task.id}');refreshStudentDetail('${studentId}')" />
          </div>` : ''}
          ${subs.length > 0 ? `
          <div class="image-grid" style="margin-top:8px">
            ${subs.map((sub, idx) => `
              <div class="img-thumb-wrap" onclick="openImageViewer('${sub.data}','${escHtml(task.title)}')">
                <img src="${sub.data}" alt="Submission ${idx + 1}" />
                ${status !== 'approved' ? `<button class="img-thumb-remove" onclick="removeSubmission(event,'${task.id}',${idx});refreshStudentDetail('${studentId}')">✕</button>` : ''}
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

// ── UPLOADS ────────────────────────────────────────────────
function handleFileUpload(event, taskId) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  processFiles(files, taskId);
  event.target.value = '';
}

function processFiles(files, taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  if (!task.submissions) task.submissions = [];

  let loaded = 0;
  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      task.submissions.push({ data: e.target.result, date: new Date().toISOString() });
      loaded++;
      if (task.status === 'approved') task.status = 'submitted';
      if (loaded === files.length) {
        saveState();
        renderView(currentView);
        toast(`Homework image uploaded!`, 'success');
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeSubmission(event, taskId, idx) {
  event.stopPropagation();
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.submissions) return;
  task.submissions.splice(idx, 1);
  if (task.submissions.length === 0 && task.status === 'approved') task.status = 'pending';
  saveState();
  renderView(currentView);
  toast('Image deleted.', 'info');
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

// ── APPROVE TASK ───────────────────────────────────────────
function approveTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = 'approved';
  task.approvedAt = new Date().toISOString();
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
  document.getElementById('input-student-passcode').value = '1234';
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
  document.getElementById('input-student-passcode').value = student.pin || '1234';
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

function saveStudent() {
  const name = document.getElementById('input-student-name').value.trim();
  const grade = document.getElementById('input-student-grade').value.trim();
  const pin = document.getElementById('input-student-passcode').value.trim() || '1234';
  const id = document.getElementById('input-student-id').value;
  if (!name) { toast('Please enter a student name.', 'error'); return; }

  if (id) {
    const student = state.students.find(s => s.id === id);
    if (student) { student.name = name; student.grade = grade; student.pin = pin; student.color = selectedColor; }
    toast('Student updated!', 'success');
  } else {
    state.students.push({ id: uid(), name, grade, pin, color: selectedColor, createdAt: new Date().toISOString() });
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
  pendingDeleteFn = () => {
    state.students = state.students.filter(s => s.id !== id);
    state.tasks = state.tasks.filter(t => t.studentId !== id);
    if (state.currentUser.studentId === id) {
      state.currentUser = { role: 'teacher', studentId: null, name: 'Teacher' };
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
  openModal('modal-task');
}

function saveTask() {
  const title = document.getElementById('input-task-title').value.trim();
  const description = document.getElementById('input-task-desc').value.trim();
  const studentId = document.getElementById('input-task-student').value;
  const dueDate = document.getElementById('input-task-due').value;
  const id = document.getElementById('input-task-id').value;
  if (!title) { toast('Please enter a task title.', 'error'); return; }
  if (!studentId) { toast('Please select a student.', 'error'); return; }

  if (id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) { task.title = title; task.description = description; task.studentId = studentId; task.dueDate = dueDate; }
    toast('Task updated!', 'success');
  } else {
    state.tasks.push({ id: uid(), title, description, studentId, dueDate, status: 'pending', submissions: [], createdAt: new Date().toISOString() });
    toast('Assignment created!', 'success');
  }
  saveState();
  closeModal('modal-task');
  renderView(currentView);
  if (currentView !== 'tasks') renderTasks();
}

function confirmDeleteTask(id) {
  const task = state.tasks.find(t => t.id === id);
  document.getElementById('confirm-message').textContent = `Delete assignment "${task?.title}"?`;
  pendingDeleteFn = () => {
    state.tasks = state.tasks.filter(t => t.id !== id);
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

// ── SEED DEMO DATA ─────────────────────────────────────────
function seedDemoData() {
  if (state.students.length > 0) return;

  const students = [
    { id: uid(), name: 'Lily Chen', grade: 'Grade 5 English', pin: '1234', color: '#d96b43', createdAt: new Date().toISOString() },
    { id: uid(), name: 'James Park', grade: 'Grade 5 English', pin: '1234', color: '#4a7c59', createdAt: new Date().toISOString() },
    { id: uid(), name: 'Mia Santos', grade: 'Grade 4 Reading', pin: '1234', color: '#3d5a80', createdAt: new Date().toISOString() },
  ];

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const tasks = [
    { id: uid(), title: 'Reading Unit 3: Story Summary', description: 'Read pages 15-25 and upload a photo of your written summary.', studentId: students[0].id, dueDate: today, status: 'pending', submissions: [], createdAt: new Date().toISOString() },
    { id: uid(), title: 'Grammar Worksheet #4', description: 'Complete past tense exercise on page 42.', studentId: students[0].id, dueDate: tomorrow, status: 'pending', submissions: [], createdAt: new Date().toISOString() },
    { id: uid(), title: 'Vocabulary Definitions', description: 'Write down definitions for all 10 target words.', studentId: students[1].id, dueDate: yesterday, status: 'pending', submissions: [], createdAt: new Date().toISOString() },
    { id: uid(), title: 'Creative Writing Journal', description: 'Write a 1-page story about a summer trip.', studentId: students[2].id, dueDate: tomorrow, status: 'pending', submissions: [], createdAt: new Date().toISOString() },
  ];

  state.students = students;
  state.tasks = tasks;
  saveState();
}

// ── INIT ───────────────────────────────────────────────────
function init() {
  loadState();
  seedDemoData();

  // Sidebar date
  const dateEl = document.getElementById('sidebar-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // Nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  // User switch
  const switchUserBtn = document.getElementById('btn-switch-user');
  if (switchUserBtn) {
    switchUserBtn.addEventListener('click', () => {
      selectLoginRole(state.currentUser.role);
      openModal('modal-login');
    });
  }

  const loginModalBtn = document.getElementById('btn-login-modal');
  if (loginModalBtn) {
    loginModalBtn.addEventListener('click', () => {
      selectLoginRole(state.currentUser.role);
      openModal('modal-login');
    });
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
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Search input
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleGlobalSearch(e.target.value.trim());
    });
  }

  // Initial render
  navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
