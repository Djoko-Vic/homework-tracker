/* =========================================================
   HomeworkHub — app.js (Supabase Realtime Cloud Sync + Local Fallback)
   ========================================================= */

'use strict';

const STORAGE_KEY = 'homeworkhub_retro_v7';
const FEE_STORAGE_KEY = 'homeworkhub_fee_tracker_v1';
const FEE_INITIAL = 1000000;
const FEE_PER_ASSIGNMENT = -2500;
const FEE_STREAK_LOST = 10000;
const FEE_LATE_REGULAR = 10000;   // +10,000đ if regular task is overdue & not submitted
const FEE_LATE_DAILY   = 5000;    // +5,000đ  if daily task has no submission today
const TEACHER_PASSWORD = '2992006bot1';

const AVATAR_COLORS = [
  '#b4533a', '#3d6585', '#3f7a56', '#8a6a2f', '#6b5b8a', '#5a6e6a'
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
      console.log('Supabase Cloud Connected!');
    } catch (e) {
      console.warn('Failed to init Supabase:', e);
      isCloudEnabled = false;
    }
  }
}

// These functions kept for compatibility with any remaining HTML references
function saveSupabaseConfig() { closeModal('modal-supabase-config'); }
function useOfflineLocalStorage() { closeModal('modal-supabase-config'); }

// ── SVG ICONS SYSTEM (DESIGN.md Rule #9: Clean, Crisp, Zero-Dependency) ──
const UI_ICONS = {
  check: `<svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`,
  error: `<svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info: `<svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  fire: `<svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 23c-4.97 0-9-3.8-9-8.5 0-3.32 2.05-6.52 4.45-8.86.64-.62 1.66-.46 2.08.31.78 1.43 1.95 2.65 3.32 3.4 1.25-2.58 1.13-5.26.15-7.53-.29-.68.21-1.44.92-1.49.52-.04 1.05.02 1.58.17 3.5 1.02 6.5 4.54 6.5 8.5 0 7.9-5.02 14-10 14zm-1.5-3.5c3.04 0 5.5-2.24 5.5-5 0-1.8-1.05-3.6-2.5-4.73-.42-.33-1.02-.17-1.22.33-.4 1.01-1.08 1.9-1.98 2.55-.45.32-1.07.13-1.26-.39-.42-1.14-.54-2.18-.4-3.11-1.46 1.4-2.64 3.23-2.64 5.35 0 2.76 2.46 5 4.5 5z"/></svg>`,
  camera: `<svg class="ui-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  clock: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  repeat: `<svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
  users: `<svg class="ui-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  book: `<svg class="ui-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  wallet: `<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  inbox: `<svg class="ui-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  sparkle: `<svg class="ui-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  file: `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  download: `<svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  task: `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`
};

// ── STORAGE & FILE CONSTANTS ──────────────────────────────
const BUCKET_NAME = 'homework-files';
const MAX_FILE_SIZE_CLOUD = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE_LOCAL = 2 * 1024 * 1024;  // 2 MB

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
let dashTableLimit = 8;         // Task 1b master table pagination limit
let tasksViewLimit = 10;        // Task 1b tasks view pagination limit
let taskFormAttachments = [];   // Task 2a teacher task attachments in modal

// ── PENDING-REVIEW SINGLE SOURCE OF TRUTH (Task 1a) ─────────
/**
 * A task is "pending review" if:
 * 1. The student exists in state.students (not deleted/orphaned).
 * 2. If student role is active, belongs to the logged-in student.
 * 3. For recurring tasks: Today's instance has a submission created today, task.status is 'submitted', and today is NOT approved.
 * 4. For regular tasks: Student has submitted (task.status === 'submitted' and has submissions or files), and teacher has not approved (task.status !== 'approved').
 */
function isTaskPendingReview(task) {
  if (!task) return false;
  const student = state.students.find(s => s.id === task.studentId);
  if (!student) return false;

  if (task.isRecurring) {
    const hasToday = hasSubmissionToday(task) || hasSubmittedFilesToday(task);
    const isApprovedToday = hasApprovalToday(task);
    return hasToday && task.status === 'submitted' && !isApprovedToday;
  } else {
    const hasSubs = hasAnySubmissions(task);
    return hasSubs && task.status === 'submitted' && task.status !== 'approved';
  }
}

function getPendingReviewTasks(forCurrentUser = true) {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;
  return state.tasks.filter(task => {
    if (forCurrentUser && !isT && task.studentId !== currentStudentId) return false;
    return isTaskPendingReview(task);
  });
}

function getTodaySubmissionsCount(task) {
  if (!task) return 0;
  const today = todayKey();
  let count = 0;
  if (task.submissions) {
    count += task.submissions.filter(sub => {
      const d = new Date(sub.date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return k === today;
    }).length;
  }
  if (task.submittedFiles) {
    count += task.submittedFiles.filter(f => {
      const d = new Date(f.uploadedAt || f.date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return k === today;
    }).length;
  }
  return count;
}

function hasSubmittedFilesToday(task) {
  if (!task || !task.submittedFiles || task.submittedFiles.length === 0) return false;
  const today = todayKey();
  return task.submittedFiles.some(f => {
    const d = new Date(f.uploadedAt || f.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return k === today;
  });
}

function hasAnySubmissions(task) {
  if (!task) return false;
  const hasPhotos = task.submissions && task.submissions.length > 0;
  const hasFiles = task.submittedFiles && task.submittedFiles.length > 0;
  return hasPhotos || hasFiles;
}

function hasAnySubmissionsToday(task) {
  return hasSubmissionToday(task) || hasSubmittedFilesToday(task);
}

// ── FILE ATTACHMENTS & STORAGE HELPERS (Task 2) ─────────────
function sanitizeFileName(name) {
  if (!name) return 'file';
  return name.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 60);
}

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function validateFileSize(file) {
  const isCloud = isCloudEnabled && supabaseClient;
  const maxBytes = isCloud ? MAX_FILE_SIZE_CLOUD : MAX_FILE_SIZE_LOCAL;
  const maxLabel = isCloud ? '10 MB' : '2 MB (Chế độ ngoại tuyến)';
  if (file.size > maxBytes) {
    toast(`Tệp "${escHtml(file.name)}" vượt quá dung lượng tối đa cho phép (${maxLabel}).`, 'error');
    return false;
  }
  return true;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFileStorage(file, folder = 'attachments') {
  if (!validateFileSize(file)) return null;
  const safeName = sanitizeFileName(file.name);

  if (isCloudEnabled && supabaseClient) {
    try {
      const cleanPath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${safeName}`;
      const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(cleanPath, file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.warn('Supabase storage upload error:', error);
        toast('Lưu ý: Nếu chưa tạo bucket "homework-files", vui lòng chạy file supabase-migration.sql trên Supabase!', 'info');
        if (file.size <= MAX_FILE_SIZE_LOCAL) {
          const base64 = await readFileAsBase64(file);
          return { id: uid(), name: safeName, size: file.size, type: file.type, path_or_url: base64, uploadedAt: new Date().toISOString() };
        }
        return null;
      }

      const { data: urlData } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(cleanPath);

      return {
        id: uid(),
        name: safeName,
        size: file.size,
        type: file.type,
        path_or_url: urlData ? urlData.publicUrl : cleanPath,
        storagePath: cleanPath,
        uploadedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Storage upload error:', err);
      if (file.size <= MAX_FILE_SIZE_LOCAL) {
        const base64 = await readFileAsBase64(file);
        return { id: uid(), name: safeName, size: file.size, type: file.type, path_or_url: base64, uploadedAt: new Date().toISOString() };
      }
      return null;
    }
  } else {
    // Local offline storage fallback
    const base64 = await readFileAsBase64(file);
    return {
      id: uid(),
      name: safeName,
      size: file.size,
      type: file.type,
      path_or_url: base64,
      uploadedAt: new Date().toISOString()
    };
  }
}

async function deleteFileStorage(fileObj) {
  if (!fileObj) return;
  if (isCloudEnabled && supabaseClient && fileObj.storagePath) {
    try {
      await supabaseClient.storage.from(BUCKET_NAME).remove([fileObj.storagePath]);
    } catch (e) {
      console.warn('Error deleting cloud file:', e);
    }
  }
}

function getFileIcon(fileName = '', mimeType = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext)) {
    return `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`;
  }
  if (['doc', 'docx'].includes(ext)) {
    return `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h8M12 13v8"/></svg>`;
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="8" y="12" width="8" height="6"/></svg>`;
  }
  if (['mp3', 'm4a', 'wav', 'ogg'].includes(ext)) {
    return `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="14" r="2"/></svg>`;
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
    return UI_ICONS.camera;
  }
  return `<svg class="ui-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
}

// ── FEE TRACKER STATE ──────────────────────────────────────
let feeState = {
  balance: FEE_INITIAL,
  log: [],               // Array of { id, student_id, amount, balance_after, type, reason, created_at, date }
  studentStreaks: {},    // { [studentId]: lastStreak } — tracks active streaks to detect true drops to 0
  lateCharged: {},       // { [taskId]: ISOString } — marks that a regular task was penalized for being overdue
  dailyCharged: {},      // { [`${taskId}__${dateKey}`]: ISOString } — marks that a daily task was penalized for dateKey
  rewardedApprovals: {}  // { [`${taskId}__${dateKey}`]: ISOString } — marks that an approval was rewarded
};

function loadFeeState() {
  const raw = localStorage.getItem(FEE_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      feeState.balance = typeof parsed.balance === 'number' ? parsed.balance : FEE_INITIAL;
      feeState.log = Array.isArray(parsed.log) ? parsed.log : [];
      feeState.studentStreaks = parsed.studentStreaks || {};
      feeState.lateCharged = parsed.lateCharged || {};
      feeState.dailyCharged = parsed.dailyCharged || {};
      feeState.rewardedApprovals = parsed.rewardedApprovals || {};
    } catch (e) {
      feeState = {
        balance: FEE_INITIAL,
        log: [],
        studentStreaks: {},
        lateCharged: {},
        dailyCharged: {},
        rewardedApprovals: {}
      };
    }
  }
}

function saveFeeState() {
  localStorage.setItem(FEE_STORAGE_KEY, JSON.stringify(feeState));
}

function adjustFee(amount, reason, type = 'manual', studentId = null) {
  const newBalance = feeState.balance + amount;
  feeState.balance = newBalance;
  const nowIso = new Date().toISOString();
  const entry = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('fee-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
    student_id: studentId,
    amount,
    balance_after: newBalance,
    type,
    reason,
    created_at: nowIso,
    date: nowIso
  };

  feeState.log.unshift(entry);
  if (feeState.log.length > 100) feeState.log = feeState.log.slice(0, 100);
  saveFeeState();
  renderFeeWidget();

  // Async sync to Supabase fee_logs table
  if (isCloudEnabled && supabaseClient) {
    supabaseClient.from('fee_logs').insert([{
      id: entry.id,
      student_id: entry.student_id,
      amount: entry.amount,
      balance_after: entry.balance_after,
      type: entry.type,
      reason: entry.reason,
      created_at: entry.created_at
    }]).then(({ error }) => {
      if (error && error.code !== 'PGRST205') {
        console.warn('Supabase fee_logs insert notice:', error.message);
      }
    }).catch(err => console.warn('Supabase fee_logs network notice:', err));
  }
}

function resetFeeBalance() {
  const defaultNote = `Thanh toán học phí & reset về 1,000,000đ (Dư trước: ${formatVND(feeState.balance)})`;
  const note = prompt('Ghi chú thanh toán / nhận tiền học phí (hoặc nhấn OK để dùng mặc định):', defaultNote);
  if (note === null) return; // Người dùng nhấn Huỷ
  const prevBal = feeState.balance;
  feeState.balance = FEE_INITIAL;
  const reason = note.trim() || defaultNote;
  adjustFee(0, reason, 'payment');
  toast('Đã ghi nhận thanh toán & đặt lại về 1,000,000đ!', 'success');
}

function manualAdjustFee(sign) {
  const input = document.getElementById('fee-manual-input');
  const reasonInput = document.getElementById('fee-manual-reason');
  if (!input) return;
  const raw = parseFloat(input.value.replace(/[^0-9.]/g, ''));
  if (!raw || raw <= 0) { toast('Nhập số tiền hợp lệ!', 'error'); return; }
  const amount = sign * Math.round(raw);
  const reason = (reasonInput && reasonInput.value.trim()) || (sign > 0 ? 'Cộng tay' : 'Trừ tay');
  adjustFee(amount, reason, 'manual');
  input.value = '';
  if (reasonInput) reasonInput.value = '';
  toast(`${sign > 0 ? '+' : ''}${formatVND(amount)} đã được ghi nhận`, sign > 0 ? 'success' : 'info');
}

function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function renderFeeWidget() {
  const widget = document.getElementById('fee-widget');
  if (!widget) return;

  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;

  const bal = feeState.balance;
  const tuitionBadge = document.getElementById('badge-nav-tuition');
  if (tuitionBadge) tuitionBadge.textContent = formatVND(bal);

  const balColor = bal >= 800000 ? 'var(--ok)' : bal >= 500000 ? 'var(--wait)' : 'var(--danger)';
  const balBg   = bal >= 800000 ? 'var(--ok-bg)' : bal >= 500000 ? 'var(--wait-bg)' : 'var(--danger-bg)';

  // If student is logged in, show transactions relevant to them or general resets
  const displayLogs = (!isT && currentStudentId)
    ? feeState.log.filter(l => !l.student_id || l.student_id === currentStudentId)
    : feeState.log;

  const PREVIEW_COUNT = 6;
  const totalLog = displayLogs.length;

  const TYPE_BADGES = {
    reward: '<span class="fee-badge fee-badge-reward">Thưởng nộp bài</span>',
    penalty_streak: '<span class="fee-badge fee-badge-streak">Mất streak</span>',
    penalty_late: '<span class="fee-badge fee-badge-late">Trễ hạn</span>',
    payment: '<span class="fee-badge fee-badge-pay">Thanh toán</span>',
    reset: '<span class="fee-badge fee-badge-reset">Reset</span>',
    manual: '<span class="fee-badge fee-badge-manual">Điều chỉnh</span>'
  };

  function buildLogHtml(entries) {
    if (!entries.length) return `<div class="fee-log-empty">Chưa có giao dịch nào được ghi nhận</div>`;
    return entries.map(entry => {
      const sign = entry.amount > 0 ? '+' : '';
      const col = entry.amount > 0 ? 'var(--danger)' : entry.amount < 0 ? 'var(--ok)' : 'var(--text)';
      const d = new Date(entry.created_at || entry.date);
      const timeStr = !isNaN(d) ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      const dateStr = !isNaN(d) ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
      const badge = TYPE_BADGES[entry.type] || TYPE_BADGES.manual;

      return `<div class="fee-log-item">
        <div class="fee-log-item-left">
          <div class="fee-log-meta">
            ${badge}
            <span class="fee-log-date">${timeStr ? timeStr + ' ' : ''}${dateStr}</span>
          </div>
          <span class="fee-log-reason">${escHtml(entry.reason)}</span>
        </div>
        <div class="fee-log-item-right">
          <span class="fee-log-amount" style="color:${col}">${sign}${entry.amount !== 0 ? formatVND(entry.amount) : '0đ'}</span>
          ${typeof entry.balance_after === 'number' ? `<span class="fee-log-bal-after">Số dư: ${formatVND(entry.balance_after)}</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  const previewHtml = buildLogHtml(displayLogs.slice(0, PREVIEW_COUNT));
  const hasMore = totalLog > PREVIEW_COUNT;

  widget.innerHTML = `
    <div class="fee-widget-header">
      <span class="fee-widget-title">${UI_ICONS.wallet} Học phí & Quỹ học bổng</span>
      ${isT 
        ? `<button class="fee-reset-btn" id="btn-fee-reset" type="button" title="Đã nhận tiền — đặt lại số dư về 1,000,000đ">Nhận thanh toán / Reset</button>`
        : `<span class="fee-read-only-pill">${UI_ICONS.info} Chế độ xem học sinh (Chỉ đọc)</span>`}
    </div>
    <div class="fee-balance" style="color:${balColor};background:${balBg}">
      ${formatVND(bal)}
    </div>
    <div class="fee-rules">
      <span>Nộp bài: <strong>-2,500đ</strong></span>
      <span>Mất streak: <strong>+10,000đ</strong></span>
      <span>Trễ bài thường: <strong>+10,000đ</strong></span>
      <span>Trễ hằng ngày: <strong>+5,000đ</strong></span>
    </div>
    ${isT ? `
    <div class="fee-manual-wrap">
      <input type="number" id="fee-manual-input" class="fee-manual-input" placeholder="Số tiền (đ)…" min="0" />
      <input type="text" id="fee-manual-reason" class="fee-manual-reason" placeholder="Lý do cộng/trừ (không bắt buộc)" />
      <div class="fee-manual-btns">
        <button class="fee-manual-btn fee-manual-add" id="btn-fee-add" type="button" title="Cộng tiền phạt / phát sinh">+ Cộng</button>
        <button class="fee-manual-btn fee-manual-sub" id="btn-fee-sub" type="button" title="Trừ tiền thưởng / thanh toán">− Trừ</button>
      </div>
    </div>
    ` : ''}
    <div class="fee-log-title-row">
      <span class="fee-log-title-text">${!isT ? `Lịch sử giao dịch của bạn (${totalLog})` : 'Lịch sử giao dịch học phí'}</span>
      ${hasMore ? `<button class="fee-log-expand-btn" id="btn-fee-log-expand" type="button">Xem thêm (${totalLog - PREVIEW_COUNT})</button>` : ''}
    </div>
    <div class="fee-log" id="fee-log-body">${previewHtml}</div>
    ${hasMore ? `<div class="fee-log-more-wrap" id="fee-log-more" style="display:none">${buildLogHtml(displayLogs.slice(PREVIEW_COUNT))}</div>` : ''}
  `;

  if (isT) {
    const resetBtn = document.getElementById('btn-fee-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetFeeBalance);
    const addBtn = document.getElementById('btn-fee-add');
    if (addBtn) addBtn.addEventListener('click', () => manualAdjustFee(1));
    const subBtn = document.getElementById('btn-fee-sub');
    if (subBtn) subBtn.addEventListener('click', () => manualAdjustFee(-1));
    // Allow Enter key on input
    const inp = document.getElementById('fee-manual-input');
    if (inp) inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') manualAdjustFee(-1);
    });
  }

  // Expand/collapse older history
  const expandBtn = document.getElementById('btn-fee-log-expand');
  const moreWrap = document.getElementById('fee-log-more');
  if (expandBtn && moreWrap) {
    expandBtn.addEventListener('click', () => {
      const isExpanded = moreWrap.style.display !== 'none';
      moreWrap.style.display = isExpanded ? 'none' : 'block';
      expandBtn.textContent = isExpanded
        ? `Xem thêm (${totalLog - PREVIEW_COUNT})`
        : 'Thu gọn ▲';
    });
  }
}

// ── PERSISTENCE ────────────────────────────────────────────
function saveState() {
  // Strip base64 image data before saving to localStorage to prevent quota errors.
  // Images are already stored on Supabase — only URLs (http/https) are kept locally.
  const stateToSave = {
    students: state.students,
    tasks: state.tasks.map(t => ({
      ...t,
      submissions: (t.submissions || []).map(sub => ({
        ...sub,
        // Drop base64 data blobs; keep only remote URLs
        data: (sub.data && sub.data.startsWith('http')) ? sub.data : null
      })).filter(sub => sub.data)
    }))
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    // If still over quota, clear and retry
    console.warn('localStorage quota exceeded, clearing old data and retrying...', e);
    localStorage.removeItem(STORAGE_KEY);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave)); } catch (_) {}
  }
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

// ── CLOUD SYNC WITH SUPABASE ────────────────────────────────
let isSyncing = false;

async function syncFromCloud() {
  if (!isCloudEnabled || !supabaseClient) return;
  if (isSyncing) return; // prevent concurrent syncs
  isSyncing = true;

  try {
    // 1. Fetch Students
    const { data: dbStudents, error: errS } = await supabaseClient.from('students').select('*');
    if (errS) {
      console.error('Error fetching students from Supabase:', errS);
    } else if (dbStudents && dbStudents.length > 0) {
      // Only overwrite students if Supabase actually returned records
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

    // Only overwrite tasks if Supabase returned a non-empty list OR we have no local tasks.
    // This prevents a failed/empty Supabase response from wiping out locally-stored tasks.
    if (dbTasks && !errT && (dbTasks.length > 0 || state.tasks.length === 0)) {
      state.tasks = dbTasks.map(t => {
        const subs = (dbSubs || [])
          .filter(sub => sub.task_id === t.id)
          .map(sub => ({ data: sub.image_url, date: sub.created_at, id: sub.id }));

        // Parse approvalHistory stored as JSON in the cloud
        let approvalHistory = [];
        if (t.approval_history) {
          try {
            approvalHistory = typeof t.approval_history === 'string'
              ? JSON.parse(t.approval_history)
              : (Array.isArray(t.approval_history) ? t.approval_history : []);
          } catch (e) { approvalHistory = []; }
        }

        // Parse attachments and submitted_files
        let attachments = [];
        if (t.attachments) {
          try {
            attachments = typeof t.attachments === 'string'
              ? JSON.parse(t.attachments)
              : (Array.isArray(t.attachments) ? t.attachments : []);
          } catch (e) { attachments = []; }
        }

        let submittedFiles = [];
        if (t.submitted_files) {
          try {
            submittedFiles = typeof t.submitted_files === 'string'
              ? JSON.parse(t.submitted_files)
              : (Array.isArray(t.submitted_files) ? t.submitted_files : []);
          } catch (e) { submittedFiles = []; }
        }

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          studentId: t.student_id,
          dueDate: t.due_date || '',
          status: t.status,
          isRecurring: !!t.is_recurring,
          approvedAt: t.approved_at,
          approvalHistory,
          attachments,
          submittedFiles,
          submissions: subs,
          createdAt: t.created_at
        };
      });
    } else if (dbTasks && !errT && dbTasks.length === 0 && state.tasks.length > 0) {
      // Supabase returned empty but we have local tasks — keep local, don't overwrite
      console.warn('Supabase returned 0 tasks but local state has tasks — keeping local data.');
    }

    // 4. Fetch Fee Logs from Supabase
    try {
      const { data: dbFeeLogs, error: errFee } = await supabaseClient
        .from('fee_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!errFee && dbFeeLogs && dbFeeLogs.length > 0) {
        feeState.log = dbFeeLogs.map(l => ({
          id: l.id,
          student_id: l.student_id,
          amount: l.amount,
          balance_after: l.balance_after,
          type: l.type || 'manual',
          reason: l.reason,
          created_at: l.created_at,
          date: l.created_at
        }));
        if (typeof dbFeeLogs[0].balance_after === 'number') {
          feeState.balance = dbFeeLogs[0].balance_after;
        }
        saveFeeState();
        renderFeeWidget();
      } else if (errFee && errFee.code !== 'PGRST205') {
        console.warn('Supabase fee_logs fetch notice:', errFee.message);
      }
    } catch (feeErr) {
      console.warn('Supabase fee_logs sync notice:', feeErr);
    }

    saveState();
    renderView(currentView);
    // Run late-fee & streak checks after data is fresh
    if (isTeacher()) {
      setTimeout(() => { checkStreakLosses(); checkLateFees(); }, 200);
    }
  } catch (err) {
    console.error('Cloud Sync Error:', err);
  } finally {
    isSyncing = false;
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

// Parse a date-only string (YYYY-MM-DD) as local time instead of UTC.
// new Date("2026-09-05") parses as UTC midnight → Sep 4 evening in +07:00.
// This helper avoids that off-by-one-day bug.
function parseDateLocal(iso) {
  if (!iso) return null;
  // If it's a date-only string (YYYY-MM-DD), parse as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = parseDateLocal(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(iso) {
  if (!iso) return false;
  const d = parseDateLocal(iso);
  // A task is overdue only if the due date's local midnight has fully passed (i.e. not today, not future)
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d < todayMidnight;
}

function isToday(iso) {
  if (!iso) return false;
  const d = parseDateLocal(iso);
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
  const icons = { success: UI_ICONS.check, error: UI_ICONS.error, info: UI_ICONS.info };
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
    const avatarEl = document.getElementById('sidebar-user-avatar');
    if (avatarEl) {
      avatarEl.textContent = '?';
      avatarEl.style.background = 'var(--bg3)';
    }
    const nameEl = document.getElementById('sidebar-user-name');
    if (nameEl) nameEl.textContent = 'Not Logged In';
    const roleEl = document.getElementById('sidebar-user-role');
    if (roleEl) roleEl.textContent = 'Please Login';
    return;
  }

  document.body.classList.remove('unauthenticated');
  const user = state.currentUser;
  const isT = isTeacher();

  // Profile chip in Top Navigation
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');

  if (isT) {
    if (avatarEl) {
      avatarEl.textContent = 'T';
      avatarEl.style.background = 'rgba(31, 28, 24, 0.08)';
    }
    if (nameEl) nameEl.textContent = 'Giáo viên';
    if (roleEl) roleEl.textContent = 'Admin';
  } else {
    const s = state.students.find(st => st.id === user.studentId);
    if (avatarEl) {
      avatarEl.textContent = s ? initials(s.name) : 'S';
      avatarEl.style.background = s && s.color ? s.color : 'var(--info)';
    }
    if (nameEl) nameEl.textContent = s ? s.name : 'Học sinh';
    if (roleEl) roleEl.textContent = s ? (s.grade || 'Học sinh') : 'Học sinh';
  }

  // Teacher-only elements
  document.querySelectorAll('.teacher-only').forEach(el => {
    if (isT) el.classList.remove('teacher-only-hide');
    else el.classList.add('teacher-only-hide');
  });

  // Nav tasks label
  const navTasksLabel = document.getElementById('nav-tasks-label');
  if (navTasksLabel) {
    navTasksLabel.textContent = isT ? 'Bài tập' : 'Bài tập của tôi';
  }
  const mobNavTasksLabel = document.getElementById('mob-nav-tasks-label');
  if (mobNavTasksLabel) {
    mobNavTasksLabel.textContent = isT ? 'Bài tập' : 'Bài của tôi';
  }

  // Update Top Navigation Badges
  const badgePending = document.getElementById('badge-nav-pending');
  if (badgePending) {
    const pendingList = getPendingReviewTasks(true);
    const pendingCount = pendingList.length;
    badgePending.textContent = pendingCount > 0 ? `${pendingCount} chờ` : '0 chờ';
  }

  const badgeStudents = document.getElementById('badge-nav-students');
  if (badgeStudents) {
    badgeStudents.textContent = state.students.length;
  }

  const badgeTasks = document.getElementById('badge-nav-tasks');
  if (badgeTasks) {
    const taskCount = isT ? state.tasks.length : state.tasks.filter(t => t.studentId === user.studentId).length;
    badgeTasks.textContent = taskCount;
  }

  const badgeStreak = document.getElementById('badge-nav-streak');
  if (badgeStreak) {
    if (isT) {
      const maxStreak = Math.max(0, ...state.students.map(s => getStudentStreak(s.id).streak));
      badgeStreak.textContent = `${maxStreak}🔥`;
    } else {
      const s = state.students.find(st => st.id === user.studentId);
      const streak = s ? getStudentStreak(s.id).streak : 0;
      badgeStreak.textContent = `${streak}🔥`;
    }
  }

  const badgeTuition = document.getElementById('badge-nav-tuition');
  if (badgeTuition) {
    badgeTuition.textContent = formatVND(feeState.balance);
  }

  // Welcome banner
  const heading = document.getElementById('welcome-heading');
  const subtext = document.getElementById('welcome-subtext');
  const bannerStreak = document.getElementById('banner-streak-val');

  if (isT) {
    if (heading) heading.textContent = 'Welcome back, Teacher!';
    if (subtext) subtext.textContent = 'Overview of all student assignments, homework uploads, and streaks.';
    const maxStreak = Math.max(0, ...state.students.map(s => getStudentStreak(s.id).streak));
    if (bannerStreak) bannerStreak.textContent = maxStreak;
  } else {
    const s = state.students.find(st => st.id === user.studentId);
    if (heading) heading.textContent = `Welcome back, ${s ? s.name : 'Student'}!`;
    if (subtext) subtext.textContent = 'Here are your homework assignments to complete and upload images for.';
    const streak = s ? getStudentStreak(s.id).streak : 0;
    if (bannerStreak) bannerStreak.textContent = streak;
  }
}

let _isLoginInProgress = false;

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
    setTimeout(() => {
      const pin = document.getElementById('input-student-pin');
      if (pin) pin.focus();
    }, 60);
  } else {
    studentWrap.classList.add('hidden');
    teacherWrap.classList.remove('hidden');
    setTimeout(() => {
      const pass = document.getElementById('input-teacher-pass');
      if (pass) pass.focus();
    }, 60);
  }
}

function openLoginDialog() {
  selectLoginRole('teacher');
  document.getElementById('input-teacher-pass').value = '';
  document.getElementById('input-student-pin').value = '';
  openModal('modal-login');
  setTimeout(() => {
    const pass = document.getElementById('input-teacher-pass');
    if (pass) pass.focus();
  }, 100);
}

async function handleDoLogin() {
  if (_isLoginInProgress) return;
  const doLoginBtn = document.getElementById('btn-do-login');
  const prevText = doLoginBtn ? doLoginBtn.textContent : '';

  try {
    _isLoginInProgress = true;
    if (doLoginBtn) {
      doLoginBtn.disabled = true;
      doLoginBtn.textContent = 'Đang đăng nhập…';
    }

    if (selectedRoleInModal === 'teacher') {
      const pass = document.getElementById('input-teacher-pass').value.trim();
      if (pass !== TEACHER_PASSWORD) {
        toast('Mật khẩu giáo viên không đúng!', 'error');
        const passInput = document.getElementById('input-teacher-pass');
        if (passInput) { passInput.focus(); passInput.select(); }
        return;
      }
      state.currentUser = { role: 'teacher', studentId: null, name: 'Teacher' };
      updateRoleUI();
      closeModal('modal-login');
      renderView(currentView);
      toast('Đăng nhập thành công với vai trò Giáo viên!', 'success');
      setTimeout(() => { checkStreakLosses(); checkLateFees(); }, 500);
    } else {
      const select = document.getElementById('login-student-select');
      const studentId = select ? select.value : null;
      if (!studentId) { toast('Vui lòng chọn tài khoản học sinh.', 'error'); return; }

      const student = state.students.find(s => s.id === studentId);
      const pin = document.getElementById('input-student-pin').value.trim();

      if (!student || (student.pin && pin !== student.pin)) {
        toast('Mã PIN không chính xác! (Mặc định: 0000)', 'error');
        const pinInput = document.getElementById('input-student-pin');
        if (pinInput) { pinInput.focus(); pinInput.select(); }
        return;
      }

      state.currentUser = { role: 'student', studentId: studentId, name: student ? student.name : 'Student' };
      updateRoleUI();
      closeModal('modal-login');
      renderView(currentView);
      toast(`Xin chào ${student ? student.name : 'học sinh'}!`, 'success');
    }
  } catch (err) {
    console.error('Login error:', err);
    toast('Lỗi đăng nhập: ' + err.message, 'error');
  } finally {
    _isLoginInProgress = false;
    if (doLoginBtn) {
      doLoginBtn.disabled = false;
      doLoginBtn.textContent = prevText || 'Login Now';
    }
  }
}

// ── NAVIGATION (Layout B) ──────────────────────────────────
function navigateTo(view) {
  if (!isLoggedIn()) {
    openLoginDialog();
    return;
  }
  if (!isTeacher() && view === 'students') {
    toast('Chỉ giáo viên mới có quyền xem danh sách quản lý học sinh.', 'info');
    return;
  }
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) viewEl.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view);
  });

  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = {
      dashboard: 'Dashboard',
      students: 'Quản lý học sinh',
      tasks: isTeacher() ? 'Danh sách bài tập' : 'Bài tập của tôi',
      streaks: 'Bảng xếp hạng Streak',
      tuition: 'Học phí & Quỹ học bổng'
    }[view] || 'HomeworkHub';
  }

  renderView(view);
}

function renderView(view) {
  updateRoleUI();
  if (!isLoggedIn()) return;
  if (view === 'dashboard') renderDashboard();
  if (view === 'students') renderStudents();
  if (view === 'tasks') renderTasks();
  if (view === 'streaks') renderStreaks();
  if (view === 'tuition') renderTuition();
}

function renderTuition() {
  renderFeeWidget();
}

// ── GLOBAL COMMAND PALETTE (Ctrl+K) ─────────────────────────
let cmdSelectedIndex = 0;
let cmdCurrentItems = [];

function openCmd() {
  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');
  if (!overlay || !input) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  input.value = '';
  cmdSelectedIndex = 0;
  renderCmdResults('');
  setTimeout(() => input.focus(), 50);
}

function closeCmd() {
  const overlay = document.getElementById('cmd-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

function renderCmdResults(query) {
  const container = document.getElementById('cmd-results');
  if (!container) return;
  const q = (query || '').trim().toLowerCase();
  const isT = isTeacher();
  const items = [];

  // 1. Quick Actions
  const actions = [
    { type: 'action', title: 'Tới Dashboard', desc: 'Xem tổng quan và bài nộp gần đây', icon: '📊', run: () => navigateTo('dashboard') },
    { type: 'action', title: 'Tới Bài tập / Assignments', desc: 'Xem toàn bộ danh sách bài tập', icon: '📝', run: () => navigateTo('tasks') },
    { type: 'action', title: 'Tới Streak Tracker', desc: 'Xem chuỗi học tập của học sinh', icon: '🔥', run: () => navigateTo('streaks') },
    { type: 'action', title: 'Tới Quản lý Học phí', desc: 'Kiểm tra số dư và lịch sử giao dịch', icon: '💳', run: () => navigateTo('tuition') },
    { type: 'action', title: 'Đổi tài khoản / Switch Role', desc: 'Chuyển đổi vai trò Giáo viên / Học sinh', icon: '🔄', run: () => openLoginDialog() },
  ];
  if (isT) {
    actions.unshift(
      { type: 'action', title: '+ Thêm bài tập mới', desc: 'Giao bài tập cho học sinh', icon: '➕', run: () => openAddTask() },
      { type: 'action', title: '+ Thêm học sinh mới', desc: 'Đăng ký hồ sơ học sinh mới', icon: '👤', run: () => openAddStudent() }
    );
  }

  const matchedActions = actions.filter(a => !q || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
  if (matchedActions.length) {
    items.push({ isHeader: true, label: 'Hành động nhanh' });
    matchedActions.forEach(a => items.push(a));
  }

  // 2. Students
  if (state.students && state.students.length) {
    const matchedStudents = state.students.filter(s => !q || s.name.toLowerCase().includes(q) || (s.grade && s.grade.toLowerCase().includes(q)));
    if (matchedStudents.length) {
      items.push({ isHeader: true, label: 'Học sinh' });
      matchedStudents.forEach(s => {
        items.push({
          type: 'student',
          title: s.name,
          desc: `${s.grade || 'Học sinh'} • PIN: ${s.pin || '0000'}`,
          icon: '🎓',
          run: () => {
            if (isT) {
              navigateTo('students');
              openStudentDetail(s.id);
            } else {
              navigateTo('students');
            }
          }
        });
      });
    }
  }

  // 3. Tasks
  if (state.tasks && state.tasks.length) {
    const matchedTasks = state.tasks.filter(t => !q || t.title.toLowerCase().includes(q) || (t.desc && t.desc.toLowerCase().includes(q)));
    if (matchedTasks.length) {
      items.push({ isHeader: true, label: 'Bài tập' });
      matchedTasks.slice(0, 8).forEach(t => {
        const student = state.students.find(s => s.id === t.studentId);
        items.push({
          type: 'task',
          title: t.title,
          desc: `${student ? student.name : 'Chưa giao'} • Trạng thái: ${t.status || 'pending'}`,
          icon: t.status === 'approved' ? '✅' : '📌',
          run: () => {
            navigateTo('tasks');
          }
        });
      });
    }
  }

  cmdCurrentItems = items.filter(it => !it.isHeader);
  if (cmdSelectedIndex >= cmdCurrentItems.length) cmdSelectedIndex = 0;

  if (!cmdCurrentItems.length) {
    container.innerHTML = `<div class="cmd-empty">Không tìm thấy kết quả nào phù hợp với "<strong>${escHtml(query)}</strong>"</div>`;
    return;
  }

  let itemCounter = 0;
  container.innerHTML = items.map(item => {
    if (item.isHeader) {
      return `<div class="cmd-section-label">${item.label}</div>`;
    }
    const idx = itemCounter++;
    const isSelected = idx === cmdSelectedIndex;
    return `
      <div class="cmd-item ${isSelected ? 'selected' : ''}" data-cmd-idx="${idx}">
        <div class="cmd-item-icon">${item.icon}</div>
        <div class="cmd-item-info">
          <div class="cmd-item-title">${escHtml(item.title)}</div>
          <div class="cmd-item-desc">${escHtml(item.desc)}</div>
        </div>
        <div class="cmd-item-shortcut"><kbd>↵</kbd></div>
      </div>
    `;
  }).join('');

  // Wire item clicks
  container.querySelectorAll('.cmd-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-cmd-idx'), 10);
      executeCmdItem(idx);
    });
  });
}

function executeCmdItem(idx) {
  if (cmdCurrentItems[idx] && typeof cmdCurrentItems[idx].run === 'function') {
    closeCmd();
    cmdCurrentItems[idx].run();
  }
}

// ── DASHBOARD: TWO-COLUMN MASTER-DETAIL (Layout B) ──────────
let dashActiveFilter = 'all';
let dashSearchQuery = '';
let selectedDashTaskId = null;

function renderDashboard() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;

  // 1. Setup Master Filter Tabs
  const filterTabsContainer = document.getElementById('dash-filter-tabs');
  if (filterTabsContainer) {
    const tabs = filterTabsContainer.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === dashActiveFilter);
      tab.onclick = () => {
        dashActiveFilter = tab.dataset.filter;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        renderDashTable();
      };
    });
  }

  // 2. Setup Quick Search input
  const searchInput = document.getElementById('dash-quick-search');
  if (searchInput) {
    searchInput.value = dashSearchQuery;
    searchInput.oninput = (e) => {
      dashSearchQuery = e.target.value.trim().toLowerCase();
      renderDashTable();
    };
  }

  // 3. Setup Close Detail Button (for mobile drawer mode)
  const closeDetailBtn = document.getElementById('btn-close-detail');
  if (closeDetailBtn) {
    closeDetailBtn.onclick = () => {
      const detailEl = document.getElementById('dashboard-detail');
      if (detailEl) detailEl.classList.remove('open');
    };
  }

  // 4. Render Sections
  renderDashHero();
  renderDashMetrics();
  renderDashTable();
}

function renderDashHero() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;
  const cardsContainer = document.getElementById('dash-action-cards');
  const countBadge = document.getElementById('dash-urgent-badge');
  const heroTitle = document.getElementById('dash-hero-title');
  if (!cardsContainer) return;

  // Filter urgent items
  let urgentItems = [];

  if (isT) {
    if (heroTitle) heroTitle.textContent = 'Bài tập cần chấm điểm & Hạn chót';

    // 1. Pending review tasks from getPendingReviewTasks (Single Source of Truth)
    const pendingTasks = getPendingReviewTasks(true);
    pendingTasks.forEach(task => {
      const student = state.students.find(s => s.id === task.studentId);
      if (!student) return;
      const lastPhoto = task.submissions && task.submissions.length ? task.submissions[task.submissions.length - 1] : null;
      const lastFile = task.submittedFiles && task.submittedFiles.length ? task.submittedFiles[task.submittedFiles.length - 1] : null;
      const subDate = (lastPhoto && lastPhoto.date) || (lastFile && (lastFile.uploadedAt || lastFile.date)) || task.submittedAt || task.createdAt;

      urgentItems.push({
        type: 'submission',
        priority: 1,
        sortDate: new Date(subDate || 0).getTime(),
        task,
        student,
        sub: lastPhoto,
        file: lastFile,
        badge: 'Chờ duyệt',
        badgeClass: 'chip-pending-review',
        timeStr: subDate ? relativeTime(subDate) : 'Vừa xong'
      });
    });

    // 2. Regular tasks that are overdue
    state.tasks.forEach(task => {
      if (task.isRecurring) return;
      const student = state.students.find(s => s.id === task.studentId);
      if (!student) return;
      const isApproved = task.status === 'approved';
      const hasSubs = hasAnySubmissions(task);
      if (isOverdue(task.dueDate) && !isApproved && !hasSubs) {
        urgentItems.push({
          type: 'overdue',
          priority: 2,
          sortDate: new Date(task.dueDate).getTime(),
          task,
          student,
          sub: null,
          file: null,
          badge: 'Trễ hạn',
          badgeClass: 'chip-overdue',
          timeStr: `Hạn: ${formatDate(task.dueDate)}`
        });
      }
    });

    // 3. Regular tasks due soonest
    state.tasks.forEach(task => {
      if (task.isRecurring) return;
      const student = state.students.find(s => s.id === task.studentId);
      if (!student) return;
      const isApproved = task.status === 'approved';
      const hasSubs = hasAnySubmissions(task);
      if (!isOverdue(task.dueDate) && !isApproved && !hasSubs && task.dueDate) {
        urgentItems.push({
          type: 'due_soon',
          priority: 3,
          sortDate: new Date(task.dueDate).getTime(),
          task,
          student,
          sub: null,
          file: null,
          badge: 'Sắp tới hạn',
          badgeClass: 'chip-pending',
          timeStr: `Hạn: ${formatDate(task.dueDate)}`
        });
      }
    });

    // Sort: priority 1 (pending review: oldest submission first), priority 2 (overdue), priority 3 (due soon)
    urgentItems.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.sortDate - b.sortDate;
    });
  } else {
    // Student portal hero: tasks due today or needing upload
    if (heroTitle) heroTitle.textContent = 'Bài tập cần hoàn thành hôm nay';
    state.tasks.filter(t => t.studentId === currentStudentId).forEach(task => {
      const student = state.students.find(s => s.id === task.studentId);
      if (!student) return;
      const isDone = task.isRecurring ? hasAnySubmissionsToday(task) : (task.status === 'submitted' || task.status === 'approved');
      if (!isDone) {
        urgentItems.push({
          type: 'todo',
          priority: isOverdue(task.dueDate) && !task.isRecurring ? 1 : 2,
          sortDate: task.dueDate ? new Date(task.dueDate).getTime() : 0,
          task,
          student,
          badge: task.isRecurring ? 'Hôm nay' : (isOverdue(task.dueDate) ? 'Quá hạn' : 'Đến hạn'),
          badgeClass: isOverdue(task.dueDate) && !task.isRecurring ? 'chip-overdue' : 'chip-pending',
          timeStr: task.isRecurring ? 'Lặp lại hằng ngày' : (task.dueDate ? formatDate(task.dueDate) : 'Chưa có hạn')
        });
      }
    });
    urgentItems.sort((a, b) => a.priority - b.priority || a.sortDate - b.sortDate);
  }

  // Update badge count
  if (countBadge) {
    countBadge.textContent = `${urgentItems.length} mục cần xử lý`;
  }
  const filterPendingTabCount = document.getElementById('dash-count-pending');
  if (filterPendingTabCount) {
    filterPendingTabCount.textContent = getPendingReviewTasks(true).length;
  }

  if (!urgentItems.length) {
    cardsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 22px; text-align: center; color: var(--text-2); background: var(--bg); border-radius: var(--radius-sm); border: 1px dashed var(--border);">
        <div style="font-size: 22px; margin-bottom: 6px;">🎉</div>
        <strong style="font-size: 13px; color: var(--text);">Tất cả bài tập đã được xử lý hoàn tất!</strong>
        <p style="font-size: 12px; color: var(--text-3); margin-top: 2px;">Không có bài nộp nào đang chờ duyệt hoặc bị trễ hạn.</p>
      </div>
    `;
    return;
  }

  // Render at most 6 action cards (Task 1b)
  const visibleItems = urgentItems.slice(0, 6);
  let cardsHtml = visibleItems.map(item => {
    const { task, student, badge, badgeClass, timeStr, sub, file } = item;
    const isSelected = selectedDashTaskId === task.id;
    const thumbImg = sub ? sub.data : '';
    return `
      <div class="action-card ${isSelected ? 'selected' : ''}" data-task-id="${task.id}" onclick="selectDashboardTask('${task.id}')">
        <div class="action-card-top">
          <div class="action-card-student">
            <div class="action-card-av" style="background: ${student.color || 'var(--ink)'}">
              ${initials(student.name)}
            </div>
            <span>${escHtml(student.name)}</span>
          </div>
          <span class="status-chip ${badgeClass}">${badge}</span>
        </div>
        <div class="action-card-body">
          ${thumbImg ? `
            <div class="action-card-thumb" onclick="event.stopPropagation(); openImageViewer('${thumbImg}', '${escHtml(task.title)} — ${escHtml(student.name)}')">
              <img src="${thumbImg}" alt="Submission thumbnail" />
            </div>
          ` : file ? `
            <div class="action-card-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--info);background:var(--info-bg);">
              ${getFileIcon(file.name, file.type)}
            </div>
          ` : `
            <div class="action-card-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--text-3);">
              ${UI_ICONS.book}
            </div>
          `}
          <div class="action-card-meta">
            <div class="action-card-task-title">${escHtml(task.title)}</div>
            <div class="action-card-time">${timeStr}</div>
          </div>
        </div>
        <div class="action-card-foot">
          <span style="font-size: 11px; color: var(--text-3);">${task.isRecurring ? 'Bài hằng ngày' : 'Bài thường'}</span>
          <button class="action-btn-pill" type="button">
            ${isT && (sub || file) ? 'Chấm bài →' : 'Xem chi tiết →'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  // If more than 6 exist, add "Xem tất cả (N)" button card (Task 1b)
  if (urgentItems.length > 6) {
    cardsHtml += `
      <div class="action-card action-card-view-all" onclick="navigateToTasksWithFilter('submitted')">
        <div class="action-card-view-all-inner">
          <div class="action-card-view-all-icon">${UI_ICONS.task}</div>
          <div class="action-card-view-all-text">
            <strong>Xem tất cả (${urgentItems.length})</strong>
            <span>Chuyển sang danh sách bài tập →</span>
          </div>
        </div>
      </div>
    `;
  }

  cardsContainer.innerHTML = cardsHtml;
}

function navigateToTasksWithFilter(statusFilter) {
  navigateTo('tasks');
  const sel = document.getElementById('task-filter-status');
  if (sel) {
    sel.value = statusFilter || 'all';
    applyTaskFilters();
  }
}

function renderDashMetrics() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;
  const container = document.getElementById('dash-metrics-strip');
  if (!container) return;

  if (isT) {
    const totalStudents = state.students.length;
    const totalTasks = state.tasks.length;
    const pendingReview = getPendingReviewTasks(true).length;
    const approved = state.tasks.filter(t => t.isRecurring ? hasApprovalToday(t) : t.status === 'approved').length;
    const maxStreak = Math.max(0, ...state.students.map(s => getStudentStreak(s.id).streak));

    container.innerHTML = `
      <div class="metric-pill">
        <div class="metric-val" style="color: var(--text);">${totalStudents}</div>
        <div class="metric-label">Học sinh</div>
      </div>
      <div class="metric-pill">
        <div class="metric-val" style="color: var(--info);">${totalTasks}</div>
        <div class="metric-label">Tổng bài tập</div>
      </div>
      <div class="metric-pill">
        <div class="metric-val" style="color: var(--wait);">${pendingReview}</div>
        <div class="metric-label">Chờ chấm điểm</div>
      </div>
      <div class="metric-pill">
        <div class="metric-val" style="color: var(--ok);">${approved}</div>
        <div class="metric-label">Đã duyệt</div>
      </div>
      <div class="metric-pill clickable" onclick="navigateTo('streaks')">
        <div class="metric-val" style="color: var(--accent);">${maxStreak} ngày 🔥</div>
        <div class="metric-label">Top Streak</div>
      </div>
      <div class="metric-pill clickable" onclick="navigateTo('tuition')">
        <div class="metric-val" style="color: ${feeState.balance >= 800000 ? 'var(--ok)' : 'var(--danger)'}; font-size: 15px;">
          ${formatVND(feeState.balance)}
        </div>
        <div class="metric-label">Học phí & Quỹ →</div>
      </div>
    `;
  } else {
    const myTasks = state.tasks.filter(t => t.studentId === currentStudentId);
    const totalTasks = myTasks.length;
    const pendingReview = getPendingReviewTasks(true).length;
    const approved = myTasks.filter(t => t.isRecurring ? hasApprovalToday(t) : t.status === 'approved').length;
    const { streak } = getStudentStreak(currentStudentId);

    container.innerHTML = `
      <div class="metric-pill clickable" onclick="navigateTo('streaks')">
        <div class="metric-val" style="color: var(--accent);">${streak} ngày 🔥</div>
        <div class="metric-label">Chuỗi học tập</div>
      </div>
      <div class="metric-pill">
        <div class="metric-val" style="color: var(--info);">${totalTasks}</div>
        <div class="metric-label">Bài được giao</div>
      </div>
      <div class="metric-pill">
        <div class="metric-val" style="color: var(--wait);">${pendingReview}</div>
        <div class="metric-label">Chờ chấm bài</div>
      </div>
      <div class="metric-pill">
        <div class="metric-val" style="color: var(--ok);">${approved}</div>
        <div class="metric-label">Đã được duyệt</div>
      </div>
    `;
  }
}

function updateDashFilterTabCounts() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;
  const userTasks = state.tasks.filter(t => isT || t.studentId === currentStudentId);

  const allCount = userTasks.length;
  const pendingReviewCount = userTasks.filter(t => isTaskPendingReview(t)).length;
  const approvedCount = userTasks.filter(t => t.isRecurring ? hasApprovalToday(t) : t.status === 'approved').length;
  const overdueCount = userTasks.filter(t => !t.isRecurring && isOverdue(t.dueDate) && !isTaskPendingReview(t) && t.status !== 'approved').length;
  const todoCount = Math.max(0, allCount - pendingReviewCount - approvedCount - overdueCount);

  const elAll = document.getElementById('dash-count-all');
  if (elAll) elAll.textContent = allCount;
  const elPending = document.getElementById('dash-count-pending');
  if (elPending) elPending.textContent = pendingReviewCount;
  const elTodo = document.getElementById('dash-count-todo');
  if (elTodo) elTodo.textContent = todoCount;
  const elApp = document.getElementById('dash-count-approved');
  if (elApp) elApp.textContent = approvedCount;
  const elOverdue = document.getElementById('dash-count-overdue');
  if (elOverdue) elOverdue.textContent = overdueCount;
}

function renderDashTable() {
  const isT = isTeacher();
  const currentStudentId = state.currentUser ? state.currentUser.studentId : null;
  const body = document.getElementById('dash-table-body');
  if (!body) return;

  updateDashFilterTabCounts();

  // Filter tasks based on role, activeFilter, and search query
  let tasks = state.tasks.filter(t => {
    if (!isT && t.studentId !== currentStudentId) return false;
    const student = state.students.find(s => s.id === t.studentId);
    const studentName = student ? student.name.toLowerCase() : '';
    const taskTitle = (t.title || '').toLowerCase();
    const taskDesc = (t.desc || t.description || '').toLowerCase();

    // Search query filter
    if (dashSearchQuery) {
      if (!taskTitle.includes(dashSearchQuery) && !taskDesc.includes(dashSearchQuery) && !studentName.includes(dashSearchQuery)) {
        return false;
      }
    }

    // Tab filter using Single Source of Truth
    const status = getTaskStatus(t);
    const isPendingRev = isTaskPendingReview(t);
    const isApproved = t.isRecurring ? hasApprovalToday(t) : t.status === 'approved';

    if (dashActiveFilter === 'pending-review') {
      return isPendingRev;
    }
    if (dashActiveFilter === 'pending') {
      return !isPendingRev && !isApproved && status !== 'overdue';
    }
    if (dashActiveFilter === 'approved') {
      return isApproved;
    }
    if (dashActiveFilter === 'overdue') {
      return (status === 'overdue' || (isOverdue(t.dueDate) && !t.isRecurring)) && !isPendingRev && t.status !== 'approved';
    }
    return true; // 'all'
  });

  // Sort tasks: pending-review first, then due today/newest, then rest
  tasks.sort((a, b) => {
    const aPending = isTaskPendingReview(a);
    const bPending = isTaskPendingReview(b);
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  if (!tasks.length) {
    body.innerHTML = `
      <div style="padding: 32px 16px; text-align: center; color: var(--text-3); font-size: 13px;">
        Không tìm thấy bài tập nào theo bộ lọc hiện tại.
      </div>
    `;
    if (!selectedDashTaskId) renderDashDetail(null);
    return;
  }

  // Auto-select first item if none is selected or selected item is no longer in list
  if (!selectedDashTaskId || !tasks.some(t => t.id === selectedDashTaskId)) {
    selectedDashTaskId = tasks[0].id;
  }

  // Pagination limit (Task 1b: default 8 rows)
  const visibleTasks = tasks.slice(0, dashTableLimit);

  let rowsHtml = visibleTasks.map(task => {
    const student = state.students.find(s => s.id === task.studentId);
    const isSelected = task.id === selectedDashTaskId;
    const isRecurring = task.isRecurring;
    const isPendingRev = isTaskPendingReview(task);
    const isApproved = isRecurring ? hasApprovalToday(task) : task.status === 'approved';
    const overdue = !isRecurring && isOverdue(task.dueDate) && !isApproved && !hasAnySubmissions(task);

    let chipClass = 'chip-pending';
    let chipText = 'Đang làm';
    if (isPendingRev) {
      chipClass = 'chip-pending-review';
      const count = isRecurring ? getTodaySubmissionsCount(task) : ((task.submissions?.length || 0) + (task.submittedFiles?.length || 0));
      chipText = count > 0 ? `${count} bài chờ duyệt` : 'Chờ duyệt';
    } else if (isApproved) {
      chipClass = 'chip-approved';
      chipText = 'Đã duyệt';
    } else if (overdue) {
      chipClass = 'chip-overdue';
      chipText = 'Trễ hạn';
    }

    const dueStr = isRecurring ? 'Hôm nay' : (task.dueDate ? formatDate(task.dueDate) : '—');

    return `
      <div class="master-row ${isSelected ? 'selected' : ''}" data-task-id="${task.id}" onclick="selectDashboardTask('${task.id}')">
        <div class="col-task-title">
          <span class="col-task-name">${escHtml(task.title)}</span>
          <span class="col-task-sub">${task.desc || task.description ? escHtml((task.desc || task.description).slice(0, 48)) : (isRecurring ? 'Lặp lại hằng ngày' : 'Bài tập thông thường')}</span>
        </div>
        <div class="col-student">
          <div class="col-student-av" style="background:${student ? (student.color || 'var(--ink)') : 'var(--text-3)'}">
            ${student ? initials(student.name) : '?'}
          </div>
          <span>${student ? escHtml(student.name) : '—'}</span>
        </div>
        <div class="col-due ${overdue ? 'overdue' : ''}">
          ${dueStr}
        </div>
        <div class="col-status-wrap">
          <span class="status-chip ${chipClass}">${chipText}</span>
        </div>
      </div>
    `;
  }).join('');

  if (tasks.length > dashTableLimit) {
    rowsHtml += `
      <div class="dash-table-more-wrap">
        <button class="btn btn-secondary btn-sm" id="btn-dash-table-more" type="button">
          Xem thêm (${tasks.length - dashTableLimit} bài tập)
        </button>
      </div>
    `;
  }

  body.innerHTML = rowsHtml;

  const moreBtn = document.getElementById('btn-dash-table-more');
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      dashTableLimit += 8;
      renderDashTable();
    });
  }

  // Render detail for selected task
  renderDashDetail(selectedDashTaskId);
}

function selectDashboardTask(taskId) {
  selectedDashTaskId = taskId;
  document.querySelectorAll('.action-card').forEach(c => {
    c.classList.toggle('selected', c.getAttribute('data-task-id') === taskId);
  });
  document.querySelectorAll('.master-row').forEach(r => {
    r.classList.toggle('selected', r.getAttribute('data-task-id') === taskId);
  });

  renderDashDetail(taskId);

  const detailEl = document.getElementById('dashboard-detail');
  if (detailEl && window.innerWidth <= 1024) {
    detailEl.classList.add('open');
  }
}

function getTaskImageGallery(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.submissions || !task.submissions.length) return [];
  const student = state.students.find(s => s.id === task.studentId);
  const studentName = student ? student.name : '';
  return task.submissions.map((sub, idx) => ({
    src: sub.data,
    caption: `${task.title} — ${studentName} (${idx + 1}/${task.submissions.length})`
  }));
}

function renderDashDetail(taskId) {
  const container = document.getElementById('dash-detail-body');
  const titleEl = document.getElementById('detail-task-title');
  const eyebrowEl = document.getElementById('detail-eyebrow');
  if (!container) return;

  if (!taskId) {
    if (titleEl) titleEl.textContent = 'Chọn một bài tập';
    container.innerHTML = `
      <div class="detail-empty-state">
        <div style="font-size: 28px;">📋</div>
        <strong style="font-size: 13px; color: var(--text);">Chưa chọn bài tập</strong>
        <p style="font-size: 12px; color: var(--text-3); max-width: 220px;">
          Bấm vào bất kỳ bài tập nào ở danh sách bên trái để xem ảnh nộp, hướng dẫn và chấm điểm.
        </p>
      </div>
    `;
    return;
  }

  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  const student = state.students.find(s => s.id === task.studentId);
  const isT = isTeacher();
  const isRecurring = task.isRecurring;
  const hasPhotos = task.submissions && task.submissions.length > 0;
  const hasFiles = task.submittedFiles && task.submittedFiles.length > 0;
  const hasAnySub = hasPhotos || hasFiles;
  const isApproved = isRecurring ? hasApprovalToday(task) : task.status === 'approved';
  const overdue = !isRecurring && isOverdue(task.dueDate) && !isApproved && !hasAnySub;
  const isPendingReview = isTaskPendingReview(task);

  if (titleEl) titleEl.textContent = task.title;
  if (eyebrowEl) eyebrowEl.textContent = isRecurring ? 'Bài tập lặp lại hằng ngày' : 'Bài tập thông thường';

  let statusBadge = ``;
  if (isPendingReview) {
    statusBadge = `<span class="status-chip chip-pending-review">Chờ thầy chấm điểm</span>`;
  } else if (isApproved) {
    statusBadge = `<span class="status-chip chip-approved">Đã phê duyệt</span>`;
  } else if (overdue) {
    statusBadge = `<span class="status-chip chip-overdue">Quá hạn</span>`;
  } else {
    statusBadge = `<span class="status-chip chip-pending">Đang thực hiện</span>`;
  }

  const gallery = getTaskImageGallery(task.id);
  const photosHtml = hasPhotos ? task.submissions.map((sub, i) => `
    <div class="detail-gallery-thumb" onclick="openImageViewer('${sub.data}', '${escHtml(task.title)} — ${student ? escHtml(student.name) : ''} (${i + 1}/${task.submissions.length})', ${i}, getTaskImageGallery('${task.id}'))">
      <img src="${sub.data}" alt="Submission image ${i + 1}" />
    </div>
  `).join('') : '';

  const { streak } = student ? getStudentStreak(student.id) : { streak: 0 };

  const taskAttachments = task.attachments || [];
  const submittedFiles = task.submittedFiles || [];

  container.innerHTML = `
    <!-- Status & Student Info -->
    <div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px;">
        <span class="detail-section-label">Học sinh</span>
        ${statusBadge}
      </div>
      <div class="detail-student-card">
        <div class="detail-student-av" style="background:${student ? (student.color || 'var(--ink)') : 'var(--text-3)'}">
          ${student ? initials(student.name) : '?'}
        </div>
        <div class="detail-student-info" style="flex:1;">
          <strong>${student ? escHtml(student.name) : 'Chưa gán'}</strong>
          <span>${student ? escHtml(student.grade || 'Học sinh') : ''} • Streak: ${streak} ngày 🔥</span>
        </div>
        ${isT && student ? `
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('students'); openStudentDetail('${student.id}');" type="button" style="font-size:11px; padding: 4px 8px;">
            Hồ sơ →
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Due date & info pills -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div style="padding: 10px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm);">
        <div class="detail-section-label">Hạn nộp</div>
        <strong style="font-size: 13px; color: ${overdue ? 'var(--danger)' : 'var(--text)'};">
          ${isRecurring ? 'Hôm nay (hằng ngày)' : (task.dueDate ? formatDate(task.dueDate) : 'Không có')}
        </strong>
      </div>
      <div style="padding: 10px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm);">
        <div class="detail-section-label">Đã nộp</div>
        <strong style="font-size: 13px; color: var(--text);">
          ${task.submissions ? task.submissions.length : 0} ảnh • ${submittedFiles.length} tệp
        </strong>
      </div>
    </div>

    <!-- Instructions / Description -->
    <div>
      <div class="detail-section-label">Nội dung & Yêu cầu</div>
      <div class="detail-desc-box">
        ${task.desc || task.description ? escHtml(task.desc || task.description) : '<em style="color:var(--text-3)">Không có ghi chú thêm.</em>'}
      </div>
      ${taskAttachments.length > 0 ? `
        <div style="margin-top: 10px;">
          <div class="detail-section-label" style="margin-bottom:6px;">Tệp đính kèm (${taskAttachments.length})</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${taskAttachments.map(att => `
              <a class="attachment-chip" href="${att.path_or_url}" target="_blank" download="${escHtml(att.name)}" title="${escHtml(att.name)}">
                ${getFileIcon(att.name)}
                <span class="attachment-name">${escHtml(att.name)}</span>
                <span class="attachment-size">(${formatFileSize(att.size)})</span>
                ${UI_ICONS.download}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Uploaded Photos Gallery -->
    <div>
      <div class="detail-photos-header">
        <span class="detail-section-label">Ảnh bài nộp (${task.submissions ? task.submissions.length : 0})</span>
        ${hasPhotos ? `<span style="font-size: 11px; color: var(--text-3);">Bấm vào ảnh để phóng to</span>` : ''}
      </div>
      ${hasPhotos ? `
        <div class="detail-gallery">
          ${photosHtml}
        </div>
      ` : `
        <div style="padding: 14px 12px; text-align: center; background: var(--bg); border: 1px dashed var(--border); border-radius: var(--radius-sm); color: var(--text-3); font-size: 12px;">
          Chưa có ảnh nào được tải lên cho bài tập này.
        </div>
      `}
    </div>

    <!-- Uploaded Documents / Files -->
    <div>
      <div class="detail-photos-header">
        <span class="detail-section-label">Tệp tài liệu bài nộp (${submittedFiles.length})</span>
      </div>
      ${hasFiles ? `
        <div class="submitted-files-list">
          ${submittedFiles.map((sf, idx) => `
            <div class="submitted-file-row">
              <div class="submitted-file-info">
                ${getFileIcon(sf.name)}
                <span class="submitted-file-name" title="${escHtml(sf.name)}">${escHtml(sf.name)}</span>
                <span class="submitted-file-size">(${formatFileSize(sf.size)})</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <a class="btn btn-secondary btn-sm" href="${sf.path_or_url}" target="_blank" download="${escHtml(sf.name)}" style="font-size:11px; padding:3px 8px;">
                  ${UI_ICONS.download} Tải về
                </a>
                ${!isT && !isApproved ? `
                  <button class="btn btn-ghost btn-sm" onclick="removeSubmittedFile(event, '${task.id}', ${idx})" style="color:var(--danger); font-size:11px; padding:3px 6px;" title="Xóa tệp này">✕</button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="padding: 12px; text-align: center; background: var(--bg); border: 1px dashed var(--border); border-radius: var(--radius-sm); color: var(--text-3); font-size: 12px;">
          Chưa có tệp tài liệu nào được nộp.
        </div>
      `}
    </div>

    <!-- Actions / Grading Area -->
    <div class="detail-actions">
      ${isT ? `
        ${isPendingReview ? `
          <button class="btn-approve-lg" type="button" onclick="approveTask('${task.id}');">
            ${UI_ICONS.check} Phê duyệt bài nộp (+ Thưởng nộp bài)
          </button>
        ` : isApproved ? `
          <button class="btn-approve-lg disabled" type="button" disabled>
            ${UI_ICONS.check} Đã được phê duyệt
          </button>
        ` : `
          <button class="btn btn-secondary" type="button" onclick="openEditTask('${task.id}');" style="width: 100%; justify-content: center;">
            Chỉnh sửa nội dung bài tập
          </button>
        `}
      ` : `
        <!-- Student Upload Actions -->
        ${!isApproved ? `
          <label class="btn-approve-lg" style="cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>📷 Chụp ảnh / Tải tệp bài làm lên</span>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp3,.m4a,.wav,image/*" multiple style="display:none;" onchange="handleFileUpload(event, '${task.id}');" />
          </label>
          ${hasAnySub && task.status !== 'submitted' ? `
            <button class="btn-submit-homework" onclick="submitHomework('${task.id}')" style="margin-top:8px; width:100%; justify-content:center;">
              Nộp bài cho thầy
            </button>
          ` : ''}
        ` : `
          <div style="padding: 10px; background: var(--ok-bg); color: var(--ok); border-radius: var(--radius-sm); font-size: 12.5px; font-weight: 700; text-align: center;">
            ${UI_ICONS.check} Bài tập này đã được thầy giáo chấm điểm và duyệt!
          </div>
        `}
      `}
    </div>
  `;
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
          <div class="empty-state-icon">${UI_ICONS.users}</div>
          <p>${state.students.length ? 'Không tìm thấy học sinh nào phù hợp.' : 'Chưa có học sinh nào. Hãy thêm học sinh đầu tiên!'}</p>
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
          <div class="student-avatar" style="background:${student.color || 'var(--ink)'}">${initials(student.name)}</div>
          <div class="student-info-main">
            <div class="student-card-name">${escHtml(student.name)}</div>
            <div class="student-card-grade">${escHtml(student.grade || 'Học sinh')} • PIN: <code>${escHtml(student.pin || '0000')}</code></div>
          </div>
          <div class="student-streak-pill">${UI_ICONS.fire} ${stats.streak} ngày</div>
        </div>

        <div class="student-progress-section">
          <div class="student-progress-labels">
            <span>Tiến độ hoàn thành</span>
            <strong>${stats.submitted}/${stats.total} bài (${progress}%)</strong>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar" style="width:${progress}%;background:${student.color || 'var(--ink)'};"></div>
          </div>
        </div>

        <div class="student-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-primary btn-sm" onclick="openStudentDetail('${student.id}')">Xem bài tập →</button>
          <button class="btn btn-secondary btn-sm" onclick="editStudent('${student.id}')">Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteStudent('${student.id}')" title="Xóa học sinh">Xóa</button>
        </div>
      </div>
    `;
  }).join('');
}

// ── TASKS VIEW ─────────────────────────────────────────────
function renderTasks() {
  const sel = document.getElementById('task-filter-student');
  const prevVal = sel.value;
  sel.innerHTML = '<option value="all">Tất cả học sinh</option>' +
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
        <div class="empty-state-icon">${UI_ICONS.book}</div>
        <p>${state.tasks.length ? 'Không có bài tập nào phù hợp bộ lọc.' : 'Chưa có bài tập nào được giao!'}</p>
      </div>`;
    return;
  }

  const paged = filtered.slice(0, tasksViewLimit);
  list.innerHTML = paged.map(task => renderTaskCard(task)).join('');

  if (filtered.length > tasksViewLimit) {
    list.innerHTML += `
      <div class="dash-table-more-wrap" style="grid-column: 1/-1; margin-top: 14px; text-align: center;">
        <button class="btn btn-secondary" id="btn-tasks-more" type="button">
          Xem thêm (${filtered.length - tasksViewLimit} bài tập)
        </button>
      </div>
    `;
    setTimeout(() => {
      const moreBtn = document.getElementById('btn-tasks-more');
      if (moreBtn) {
        moreBtn.onclick = () => {
          tasksViewLimit += 10;
          applyTaskFilters();
        };
      }
    }, 0);
  }

  paged.forEach(task => {
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

function getPastDateKey(daysAgo = 1) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function hasSubmissionOnDate(task, dateKey) {
  if (!task.submissions || task.submissions.length === 0) return false;
  return task.submissions.some(sub => {
    const d = new Date(sub.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return k === dateKey;
  });
}

// Returns true if a specific date's submission was approved (backward-compat with old 'date' field)
function isDateApproved(task, dateKey) {
  if (!task.approvalHistory || !task.approvalHistory.length) return false;
  return task.approvalHistory.some(a => (a.submissionDate || a.date) === dateKey);
}

// Legacy helper — still used by streak/fee logic
function hasApprovalToday(task) {
  return isDateApproved(task, todayKey());
}

// ── RECURRING DAY GROUPS ────────────────────────────────────
// Returns an array of day objects for a recurring task, newest first.
// Each group: { dateKey, label, subs, dayStatus, isToday, submitted }
// dayStatus: 'approved' | 'submitted' | 'draft' | 'pending'
function getRecurringDayGroups(task) {
  const today = todayKey();
  const allSubs = task.submissions || [];

  // Group submissions by day
  const byDay = {}; // dateKey -> [subs]
  allSubs.forEach(sub => {
    const d = new Date(sub.date);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!byDay[k]) byDay[k] = [];
    byDay[k].push(sub);
  });

  // Always include today
  if (!byDay[today]) byDay[today] = [];

  // Sort keys newest-first
  const keys = Object.keys(byDay).sort().reverse();

  return keys.map(dateKey => {
    const subs = byDay[dateKey];
    const isToday = dateKey === today;
    const approved = isDateApproved(task, dateKey);

    let dayStatus;
    if (approved) {
      dayStatus = 'approved';
    } else if (subs.length === 0) {
      dayStatus = 'pending';
    } else {
      // Check if these subs were officially submitted (task.status = 'submitted' and
      // the submission happened on this day)
      const anySubmittedOnThisDay = subs.some(sub => {
        const d = new Date(sub.date);
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        return k === dateKey;
      });
      if (anySubmittedOnThisDay && task.status === 'submitted' && !isToday) {
        // Prior day that was submitted and awaiting teacher approval
        dayStatus = 'submitted';
      } else if (anySubmittedOnThisDay && task.status === 'submitted' && isToday) {
        dayStatus = 'submitted';
      } else {
        dayStatus = 'draft';
      }
    }

    // Format label
    const [y, m, dd] = dateKey.split('-');
    const dateObj = new Date(+y, +m - 1, +dd);
    const label = isToday
      ? `Hôm nay (${dateObj.toLocaleDateString('vi-VN', { day:'numeric', month:'numeric' })})`
      : `${dateObj.toLocaleDateString('vi-VN', { weekday:'short', day:'numeric', month:'numeric' })}`;

    return { dateKey, label, subs, dayStatus, isToday };
  });
}

function getTaskStatus(task) {
  // For recurring tasks, getTaskStatus returns the overall state
  // (used for non-rendering purposes like streak counting)
  if (task.isRecurring) {
    if (hasSubmissionToday(task)) {
      if (task.status === 'submitted') return 'submitted';
      return 'draft';
    }
    if (task.status === 'submitted' && (task.submissions || []).length > 0) return 'submitted';
    if (hasApprovalToday(task)) return 'approved';
    return 'pending';
  }
  if (task.status === 'approved') return 'approved';
  if (task.status === 'submitted') return 'submitted';
  // Has photos but student hasn't clicked Submit yet
  if (task.submissions && task.submissions.length > 0) return 'draft';
  if (isOverdue(task.dueDate)) return 'overdue';
  return 'pending';
}
function getStatusLabel(task) {
  const s = getTaskStatus(task);
  const labels = {
    approved: `${UI_ICONS.check} Approved`,
    submitted: `${UI_ICONS.inbox} Submitted`,
    draft:    `${UI_ICONS.camera} Photos Added`,
    pending:  `${UI_ICONS.clock} Not Done`,
    overdue:  `Overdue`,
  };
  const recurBadge = task.isRecurring ? `<span class="badge-recurring">${UI_ICONS.repeat} Daily</span> ` : '';
  return `${recurBadge}<span class="status-chip chip-${s}">${labels[s] || s}</span>`;
}

function openDayGroupViewer(taskId, dateKey, subIdx) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  const groups = getRecurringDayGroups(task);
  const grp = groups.find(g => g.dateKey === dateKey);
  if (!grp || !grp.subs || !grp.subs.length) return;
  const student = state.students.find(s => s.id === task.studentId);
  const studentName = student ? student.name : '';
  const gallery = grp.subs.map((s, idx) => ({
    src: s.data,
    caption: `${task.title} — ${studentName} [${grp.label}] (${idx + 1}/${grp.subs.length})`
  }));
  const current = gallery[subIdx] || gallery[0];
  openImageViewer(current.src, current.caption, subIdx, gallery);
}

function openTaskSubmissionViewer(taskId, subIdx) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.submissions || !task.submissions.length) return;
  const gallery = getTaskImageGallery(taskId);
  const current = gallery[subIdx] || gallery[0];
  openImageViewer(current.src, current.caption, subIdx, gallery);
}

function toggleOlderDays(containerId, toggleBtnId, count) {
  const container = document.getElementById(containerId);
  const btn = document.getElementById(toggleBtnId);
  if (!container || !btn) return;
  const isHidden = container.style.display === 'none';
  if (isHidden) {
    container.style.display = 'block';
    btn.textContent = 'Thu gọn các ngày trước ▲';
  } else {
    container.style.display = 'none';
    btn.textContent = `Xem các ngày trước (${count}) ▼`;
  }
}

// ── RENDER ONE DAY-GROUP CARD for a recurring task ─────────
function renderRecurringDayCard(task, group, studentName, isModal = false) {
  const { dateKey, label, subs, dayStatus, isToday } = group;
  const isT = isTeacher();
  const allSubs = task.submissions || [];

  const dayFiles = (task.submittedFiles || []).filter(f => {
    const d = new Date(f.date || f.uploadedAt);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === dateKey;
  });

  const canUpload = !isT && isToday && dayStatus !== 'submitted' && dayStatus !== 'approved';
  const canSubmit = !isT && isToday && (subs.length > 0 || dayFiles.length > 0) && dayStatus === 'draft';

  const statusLabels = {
    approved: `<span class="status-chip chip-approved">${UI_ICONS.check} Đã duyệt</span>`,
    submitted: `<span class="status-chip chip-submitted">${UI_ICONS.clock} Chờ duyệt</span>`,
    draft:    `<span class="status-chip chip-draft">${UI_ICONS.camera} Chưa nộp</span>`,
    pending:  `<span class="status-chip chip-pending">${UI_ICONS.clock} Chưa làm</span>`,
  };

  const uploadId = isModal ? `modal-fi-${task.id}` : `file-input-${task.id}`;

  return `
    <div class="recurring-day-card ${isToday ? 'recurring-day-today' : 'recurring-day-past'}" data-date="${dateKey}">
      <div class="recurring-day-header">
        <span class="recurring-day-label">${label}</span>
        <span>${statusLabels[dayStatus] || dayStatus}</span>
      </div>
      ${dayStatus === 'approved' ? `<div class="approved-notice" style="margin:8px 0 0">${UI_ICONS.check} Đã được thầy duyệt!</div>` : ''}
      ${isT && dayStatus === 'submitted' ? `<div class="teacher-waiting-note draft-note" style="margin:8px 0">${UI_ICONS.camera} Học sinh đã nộp — chờ bạn duyệt</div>` : ''}
      ${isT && dayStatus === 'pending' ? `<div class="teacher-waiting-note" style="margin:8px 0">${UI_ICONS.clock} Học sinh chưa làm bài ngày này.</div>` : ''}
      ${isT && dayStatus === 'draft' ? `<div class="teacher-waiting-note draft-note" style="margin:8px 0">${UI_ICONS.camera} Học sinh có bài làm nhưng chưa nộp chính thức.</div>` : ''}

      ${canUpload ? `
      <div class="upload-zone" id="drop-${task.id}-${dateKey}"
        onclick="${isModal ? `document.getElementById('${uploadId}')?.click()` : `openUploadConfirm('${task.id}')`}"
        ondragover="handleDragOver(event,'${task.id}-${dateKey}')"
        ondragleave="handleDragLeave(event,'${task.id}-${dateKey}')"
        ondrop="handleDrop(event,'${task.id}')">
        <div>${UI_ICONS.camera} Chụp ảnh hoặc tải tệp bài làm hôm nay</div>
        <div style="font-size:11px;margin-top:4px;color:var(--text-3)">${(subs.length > 0 || dayFiles.length > 0) ? 'Thêm ảnh/tệp hoặc bấm nộp bài bên dưới' : 'Click hoặc kéo thả ảnh/tệp vào đây'}</div>
        <input type="file" id="${uploadId}" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp3,.m4a,.wav,image/*" multiple style="display:none" onchange="handleFileUpload(event, '${task.id}'); ${isModal ? `refreshStudentDetail('${task.studentId}');` : ''}" />
      </div>` : ''}

      ${subs.length > 0 ? `
      <div class="image-grid" style="margin-top:8px">
        ${subs.map((sub, sIdx) => `
          <div class="img-thumb-wrap" onclick="openDayGroupViewer('${task.id}', '${dateKey}', ${sIdx})">
            <img src="${sub.data}" alt="Submission" />
            ${canUpload ? `<button class="img-thumb-remove" onclick="removeSubmission(event,'${task.id}',${allSubs.indexOf(sub)}); ${isModal ? `refreshStudentDetail('${task.studentId}');` : ''}">✕</button>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      ${dayFiles.length > 0 ? `
      <div class="submitted-files-list" style="margin-top:8px">
        ${dayFiles.map(sf => `
          <div class="submitted-file-row">
            <div class="submitted-file-info">
              ${getFileIcon(sf.name)}
              <span class="submitted-file-name" title="${escHtml(sf.name)}">${escHtml(sf.name)}</span>
              <span class="submitted-file-size">(${formatFileSize(sf.size)})</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <a class="btn btn-secondary btn-sm" href="${sf.path_or_url}" target="_blank" download="${escHtml(sf.name)}" style="font-size:11px; padding:3px 8px;">
                ${UI_ICONS.download} Tải về
              </a>
              ${canUpload ? `<button class="btn btn-ghost btn-sm" onclick="removeSubmittedFile(event, '${task.id}', ${(task.submittedFiles || []).indexOf(sf)}); ${isModal ? `refreshStudentDetail('${task.studentId}');` : ''}" style="color:var(--danger); font-size:11px; padding:3px 6px;" title="Xóa tệp">✕</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>` : ''}

      ${canSubmit ? `
      <div class="submit-homework-bar">
        <div class="submit-homework-hint">Xem lại ảnh/tệp rồi bấm nộp bài</div>
        <button class="btn-submit-homework" onclick="submitHomework('${task.id}'); ${isModal ? `refreshStudentDetail('${task.studentId}');` : ''}">Nộp bài cho thầy</button>
      </div>` : ''}
      ${!isT && isToday && dayStatus === 'submitted' ? `<div class="submitted-notice">${UI_ICONS.clock} Đã nộp — đang chờ thầy duyệt!</div>` : ''}
      ${isT && dayStatus === 'submitted' ? `
      <div style="margin-top:10px">
        <button class="btn-approve" onclick="approveTask('${task.id}','${dateKey}'); ${isModal ? `refreshStudentDetail('${task.studentId}');` : ''}">${UI_ICONS.check} Phê duyệt ngày này</button>
      </div>` : ''}
    </div>
  `;
}

function renderRecurringDayCardsList(task, groups, studentName, isModal = false) {
  const visibleGroups = groups.slice(0, 7);
  const olderGroups = groups.slice(7);
  const prefix = isModal ? `older-modal-${task.id}` : `older-task-${task.id}`;
  const containerId = `${prefix}-list`;
  const toggleBtnId = `${prefix}-btn`;

  let html = visibleGroups.map(g => renderRecurringDayCard(task, g, studentName, isModal)).join('');

  if (olderGroups.length > 0) {
    html += `
      <div class="older-days-toggle-wrap">
        <button class="btn btn-secondary btn-sm" id="${toggleBtnId}" type="button" onclick="toggleOlderDays('${containerId}', '${toggleBtnId}', ${olderGroups.length})">
          Xem các ngày trước (${olderGroups.length}) ▼
        </button>
      </div>
      <div class="older-days-container" id="${containerId}" style="display:none; margin-top:8px;">
        ${olderGroups.map(g => renderRecurringDayCard(task, g, studentName, isModal)).join('')}
      </div>
    `;
  }
  return html;
}

function renderTaskCard(task) {
  const student = state.students.find(s => s.id === task.studentId);
  const isT = isTeacher();
  const taskAttachments = task.attachments || [];

  // ── DAILY RECURRING: render grouped cards with 7-day cutoff ──
  if (task.isRecurring) {
    const groups = getRecurringDayGroups(task);
    const dayCardsHtml = renderRecurringDayCardsList(task, groups, student ? student.name : '');
    const { streak } = student ? getStudentStreak(student.id) : { streak: 0 };
    const todayStatus = getTaskStatus(task);

    return `
      <div class="task-card" id="task-card-${task.id}">
        <div class="task-card-header">
          <div>
            <div class="task-card-title">
              <span class="badge-recurring">${UI_ICONS.repeat} Hằng ngày</span>
              ${escHtml(task.title)}
            </div>
            <div class="task-card-meta">
              ${student ? `<span>Học sinh: <strong>${escHtml(student.name)}</strong></span>` : ''}
              <span>Streak: <strong>${streak} ngày 🔥</strong></span>
              <span>Trạng thái: <strong>${todayStatus === 'approved' ? 'Đã duyệt hôm nay' : todayStatus === 'submitted' ? 'Chờ duyệt hôm nay' : 'Đang làm'}</strong></span>
            </div>
          </div>
          <div class="task-card-actions">
            ${isT ? `
            <button class="btn btn-ghost btn-sm" onclick="editTask('${task.id}')">Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteTask('${task.id}')">Xóa</button>` : ''}
          </div>
        </div>
        <div class="task-card-body">
          ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}

          ${taskAttachments.length > 0 ? `
            <div style="margin: 8px 0 12px 0;">
              <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:5px;">Tệp đính kèm bài tập (${taskAttachments.length}):</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${taskAttachments.map(att => `
                  <a class="attachment-chip" href="${att.path_or_url}" target="_blank" download="${escHtml(att.name)}" title="${escHtml(att.name)}">
                    ${getFileIcon(att.name)}
                    <span class="attachment-name">${escHtml(att.name)}</span>
                    <span class="attachment-size">(${formatFileSize(att.size)})</span>
                    ${UI_ICONS.download}
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="recurring-day-list">
            ${dayCardsHtml}
          </div>
        </div>
      </div>
    `;
  }

  // ── REGULAR (non-recurring) task ─────────────────
  const status = getTaskStatus(task);
  const allSubs = task.submissions || [];
  const subs = allSubs;
  const subFiles = task.submittedFiles || [];
  const hasAnySub = subs.length > 0 || subFiles.length > 0;
  const isApproved = status === 'approved';
  const isPendingReview = isTaskPendingReview(task);

  const canUpload = !isT && !isApproved && status !== 'submitted';
  const canSubmit = !isT && status === 'draft' && hasAnySub;

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
            ${task.dueDate ? `<span>Hạn nộp: ${formatDate(task.dueDate)}</span>` : ''}
            <span>${subs.length} ảnh • ${subFiles.length} tệp đã nộp</span>
          </div>
        </div>
        <div class="task-card-actions">
          ${isT && (status === 'submitted' || isPendingReview) ? `<button class="btn-approve" onclick="approveTask('${task.id}')">${UI_ICONS.check} Duyệt bài</button>` : ''}
          ${isT && isApproved ? `<button class="btn-approve approved" disabled>${UI_ICONS.check} Đã duyệt</button>` : ''}
          ${isT ? `
          <button class="btn btn-ghost btn-sm" onclick="editTask('${task.id}')">Sửa</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteTask('${task.id}')">Xóa</button>` : ''}
        </div>
      </div>
      <div class="task-card-body">
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}

        ${taskAttachments.length > 0 ? `
          <div style="margin: 8px 0 12px 0;">
            <div style="font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:5px;">Tệp đính kèm bài tập (${taskAttachments.length}):</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${taskAttachments.map(att => `
                <a class="attachment-chip" href="${att.path_or_url}" target="_blank" download="${escHtml(att.name)}" title="${escHtml(att.name)}">
                  ${getFileIcon(att.name)}
                  <span class="attachment-name">${escHtml(att.name)}</span>
                  <span class="attachment-size">(${formatFileSize(att.size)})</span>
                  ${UI_ICONS.download}
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${isT && status === 'pending' ? `<div class="teacher-waiting-note">${UI_ICONS.clock} Học sinh chưa tải ảnh hoặc tệp bài tập nào lên.</div>` : ''}
        ${isT && status === 'draft' ? `<div class="teacher-waiting-note draft-note">${UI_ICONS.camera} Học sinh đã thêm bài nhưng chưa nộp chính thức.</div>` : ''}

        ${canUpload ? `
        <div class="upload-zone" id="drop-${task.id}"
          onclick="openUploadConfirm('${task.id}')"
          ondragover="handleDragOver(event,'${task.id}')"
          ondragleave="handleDragLeave(event,'${task.id}')"
          ondrop="handleDrop(event,'${task.id}')">
          <div>${UI_ICONS.camera} Chụp ảnh hoặc tải tệp bài làm của bạn</div>
          <div style="font-size:11px;margin-top:4px;color:var(--text-3)">${hasAnySub ? 'Thêm ảnh/tệp hoặc bấm nộp bài bên dưới' : 'Click hoặc kéo thả ảnh/tệp vào đây'}</div>
          <input type="file" id="file-input-${task.id}" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp3,.m4a,.wav,image/*" multiple style="display:none" />
        </div>` : ''}

        ${subs.length > 0 ? `
        <div class="image-grid" style="margin-top:8px;">
          ${subs.map((sub, sIdx) => `
            <div class="img-thumb-wrap" onclick="openTaskSubmissionViewer('${task.id}', ${sIdx})">
              <img src="${sub.data}" alt="Bài làm" />
              ${canUpload ? `<button class="img-thumb-remove" onclick="removeSubmission(event,'${task.id}',${allSubs.indexOf(sub)})">✕</button>` : ''}
            </div>
          `).join('')}
        </div>` : ''}

        ${subFiles.length > 0 ? `
        <div class="submitted-files-list" style="margin-top:8px;">
          ${subFiles.map((sf, fIdx) => `
            <div class="submitted-file-row">
              <div class="submitted-file-info">
                ${getFileIcon(sf.name)}
                <span class="submitted-file-name" title="${escHtml(sf.name)}">${escHtml(sf.name)}</span>
                <span class="submitted-file-size">(${formatFileSize(sf.size)})</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <a class="btn btn-secondary btn-sm" href="${sf.path_or_url}" target="_blank" download="${escHtml(sf.name)}" style="font-size:11px; padding:3px 8px;">
                  ${UI_ICONS.download} Tải về
                </a>
                ${canUpload ? `<button class="btn btn-ghost btn-sm" onclick="removeSubmittedFile(event, '${task.id}', ${fIdx})" style="color:var(--danger); font-size:11px; padding:3px 6px;" title="Xóa tệp này">✕</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>` : ''}

        ${canSubmit ? `
        <div class="submit-homework-bar" style="margin-top:10px;">
          <div class="submit-homework-hint">Xem lại ảnh/tệp rồi bấm nộp bài</div>
          <button class="btn-submit-homework" onclick="submitHomework('${task.id}')">Nộp bài cho thầy</button>
        </div>` : ''}
        ${!isT && status === 'submitted' ? `<div class="submitted-notice">${UI_ICONS.clock} Đã nộp bài — đang chờ thầy duyệt!</div>` : ''}
        ${!isT && isApproved ? `<div class="approved-notice">${UI_ICONS.check} Bài tập đã được duyệt! Rất tốt 🎉</div>` : ''}
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
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">${UI_ICONS.fire}</div><p>Chưa có chuỗi học tập nào được ghi nhận!</p></div>`;
    return;
  }

  const sorted = list
    .map(s => ({ student: s, ...getStudentStreak(s.id), stats: getStudentStats(s.id), activity: getLast30DaysActivity(s.id) }))
    .sort((a, b) => b.streak - a.streak);

  grid.innerHTML = sorted.map(item => {
    const calHtml = item.activity.map(day => `
      <div class="cal-day ${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''}" title="${day.date.toLocaleDateString('vi-VN')}"></div>
    `).join('');

    return `
      <div class="streak-card">
        <div class="student-card-header">
          <div class="student-avatar" style="background:${item.student.color}">${initials(item.student.name)}</div>
          <div>
            <div class="student-card-name">${escHtml(item.student.name)}</div>
            <div class="student-card-grade">${escHtml(item.student.grade || 'Học sinh')}</div>
          </div>
        </div>

        <div class="streak-big">
          <div class="streak-fire">${UI_ICONS.fire}</div>
          <div>
            <div class="streak-count">${item.streak}</div>
            <div class="streak-count-label">Ngày liên tục</div>
          </div>
        </div>

        <div class="streak-mini-stats">
          <div class="streak-mini-stat">
            <div class="streak-mini-stat-val" style="color:var(--info)">${item.stats.total}</div>
            <div class="streak-mini-stat-lbl">Bài tập</div>
          </div>
          <div class="streak-mini-stat">
            <div class="streak-mini-stat-val" style="color:var(--wait)">${item.stats.submitted}</div>
            <div class="streak-mini-stat-lbl">Đã nộp</div>
          </div>
          <div class="streak-mini-stat">
            <div class="streak-mini-stat-val" style="color:var(--ok)">${item.stats.approved}</div>
            <div class="streak-mini-stat-lbl">Đã duyệt</div>
          </div>
        </div>

        <div>
          <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;">30 ngày gần nhất</div>
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
      <div style="color:var(--text-2);font-size:12px;display:flex;align-items:center;gap:4px;margin-top:2px;">
        ${escHtml(student.grade || '')} • <span style="display:inline-flex;align-items:center;gap:3px;color:var(--accent);font-weight:700;">${UI_ICONS.fire} ${streak} Day Streak</span>
      </div>
    </div>
  `;

  const body = document.getElementById('modal-student-tasks');

  if (!tasks.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${UI_ICONS.task}</div><p>No tasks assigned yet.</p>${isT ? `<button class="btn btn-primary mt-2" onclick="closeModal('modal-student-detail');openAddTaskFor('${studentId}')">+ Create Task</button>` : ''}</div>`;
  } else {
    body.innerHTML = tasks.map(task => {
      const taskAttachments = task.attachments || [];

      // ── Recurring: render per-day sections with 7-day limit ──
      if (task.isRecurring) {
        const groups = getRecurringDayGroups(task);
        const dayHtml = renderRecurringDayCardsList(task, groups, student.name, true);
        return `
          <div class="student-task-item">
            <div class="student-task-item-header">
              <div class="student-task-item-title"><span class="badge-recurring">${UI_ICONS.repeat} Hằng ngày</span> ${escHtml(task.title)}</div>
            </div>
            ${task.description ? `<div style="font-size:11px;color:var(--text-2);margin-bottom:6px">${escHtml(task.description)}</div>` : ''}

            ${taskAttachments.length > 0 ? `
              <div style="margin: 6px 0 10px 0;">
                <div style="font-size:10px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Tệp đính kèm (${taskAttachments.length}):</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                  ${taskAttachments.map(att => `
                    <a class="attachment-chip" href="${att.path_or_url}" target="_blank" download="${escHtml(att.name)}" title="${escHtml(att.name)}">
                      ${getFileIcon(att.name)}
                      <span class="attachment-name">${escHtml(att.name)}</span>
                      <span class="attachment-size">(${formatFileSize(att.size)})</span>
                      ${UI_ICONS.download}
                    </a>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${dayHtml}
          </div>
        `;
      }

      // ── Regular task ──
      const status = getTaskStatus(task);
      const allSubs = task.submissions || [];
      const subs = allSubs;
      const subFiles = task.submittedFiles || [];
      const hasAnySub = subs.length > 0 || subFiles.length > 0;
      const isApproved = status === 'approved';
      const isPendingReview = isTaskPendingReview(task);
      const canUpload = !isT && !isApproved && status !== 'submitted';
      const canSubmit = !isT && status === 'draft' && hasAnySub;

      return `
        <div class="student-task-item">
          <div class="student-task-item-header">
            <div class="student-task-item-title">${escHtml(task.title)}</div>
            ${getStatusLabel(task)}
          </div>
          <div style="font-size:11px;color:var(--text-2);margin-bottom:8px">
            ${task.description ? `<div>${escHtml(task.description)}</div>` : ''}
            ${task.dueDate ? `<div>Hạn nộp: ${formatDate(task.dueDate)}</div>` : ''}
            <div>Đã nộp: <strong>${subs.length} ảnh • ${subFiles.length} tệp</strong></div>
          </div>

          ${taskAttachments.length > 0 ? `
            <div style="margin: 6px 0 10px 0;">
              <div style="font-size:10px; font-weight:700; color:var(--text-3); text-transform:uppercase; margin-bottom:4px;">Tệp đính kèm (${taskAttachments.length}):</div>
              <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${taskAttachments.map(att => `
                  <a class="attachment-chip" href="${att.path_or_url}" target="_blank" download="${escHtml(att.name)}" title="${escHtml(att.name)}">
                    ${getFileIcon(att.name)}
                    <span class="attachment-name">${escHtml(att.name)}</span>
                    <span class="attachment-size">(${formatFileSize(att.size)})</span>
                    ${UI_ICONS.download}
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${canUpload ? `
          <div class="upload-zone" style="padding:12px"
            onclick="document.getElementById('modal-fi-${task.id}')?.click()"
            ondragover="handleDragOver(event,'modal-${task.id}')"
            ondragleave="handleDragLeave(event,'modal-${task.id}')"
            ondrop="handleDrop(event,'${task.id}')">
            <div>${UI_ICONS.camera} Click để upload ảnh hoặc tệp bài làm</div>
            <div style="font-size:11px;margin-top:4px;color:var(--text-3)">${hasAnySub ? 'Thêm ảnh/tệp hoặc bấm nộp bài bên dưới' : 'Click hoặc kéo thả ảnh/tệp vào đây'}</div>
            <input type="file" id="modal-fi-${task.id}" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp3,.m4a,.wav,image/*" multiple style="display:none"
              onchange="handleFileUpload(event,'${task.id}');refreshStudentDetail('${studentId}')" />
          </div>` : ''}

          ${subs.length > 0 ? `
          <div class="image-grid" style="margin-top:8px">
            ${subs.map((sub, sIdx) => `
              <div class="img-thumb-wrap" onclick="openTaskSubmissionViewer('${task.id}', ${sIdx})">
                <img src="${sub.data}" alt="Submission" />
                ${canUpload ? `<button class="img-thumb-remove" onclick="removeSubmission(event,'${task.id}',${allSubs.indexOf(sub)});refreshStudentDetail('${studentId}')">✕</button>` : ''}
              </div>
            `).join('')}
          </div>` : ''}

          ${subFiles.length > 0 ? `
          <div class="submitted-files-list" style="margin-top:8px">
            ${subFiles.map((sf, fIdx) => `
              <div class="submitted-file-row">
                <div class="submitted-file-info">
                  ${getFileIcon(sf.name)}
                  <span class="submitted-file-name" title="${escHtml(sf.name)}">${escHtml(sf.name)}</span>
                  <span class="submitted-file-size">(${formatFileSize(sf.size)})</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <a class="btn btn-secondary btn-sm" href="${sf.path_or_url}" target="_blank" download="${escHtml(sf.name)}" style="font-size:11px; padding:3px 8px;">
                    ${UI_ICONS.download} Tải về
                  </a>
                  ${canUpload ? `<button class="btn btn-ghost btn-sm" onclick="removeSubmittedFile(event, '${task.id}', ${fIdx});refreshStudentDetail('${studentId}')" style="color:var(--danger); font-size:11px; padding:3px 6px;" title="Xóa tệp này">✕</button>` : ''}
                </div>
              </div>
            `).join('')}
          </div>` : ''}

          ${canSubmit ? `
          <div class="submit-homework-bar" style="margin-top:10px;">
            <div class="submit-homework-hint">Xem lại ảnh/tệp rồi bấm nộp bài</div>
            <button class="btn-submit-homework" onclick="submitHomework('${task.id}');refreshStudentDetail('${studentId}')">${UI_ICONS.upload} Nộp bài cho thầy</button>
          </div>` : ''}

          ${!isT && status === 'submitted' ? `<div class="submitted-notice" style="margin-top:8px;">${UI_ICONS.clock} Đã nộp bài — đang chờ thầy duyệt!</div>` : ''}
          ${!isT && isApproved ? `<div class="approved-notice" style="margin-top:8px;">${UI_ICONS.check} Bài tập đã được duyệt! Rất tốt 🎉</div>` : ''}

          ${isT && (status === 'submitted' || isPendingReview) ? `
          <div style="margin-top:8px">
            <button class="btn-approve" onclick="approveTask('${task.id}');refreshStudentDetail('${studentId}')">${UI_ICONS.check} Phê duyệt bài tập</button>
          </div>` : ''}
          ${isT && isApproved ? `<div style="margin-top:8px"><button class="btn-approve approved" disabled>${UI_ICONS.check} Đã duyệt</button></div>` : ''}
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

// ── UPLOAD (No confirmation popup — direct file picker) ───
function openUploadConfirm(taskId, studentDetailId = null) {
  // Teachers cannot upload
  if (isTeacher()) return;
  // Bypass popup — open file picker directly
  const inputId = studentDetailId ? `modal-fi-${taskId}` : `file-input-${taskId}`;
  const fi = document.getElementById(inputId);
  if (fi) fi.click();
}

function doConfirmedUpload() {
  // Legacy stub kept in case referenced elsewhere
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
  if (!task.submittedFiles) task.submittedFiles = [];

  const limitMb = isCloudEnabled ? MAX_FILE_SIZE_CLOUD : MAX_FILE_SIZE_LOCAL;
  let addedPhotos = 0;
  let addedFiles = 0;

  for (const file of files) {
    if (!validateFileSize(file)) {
      toast(`Tệp "${file.name}" vượt quá giới hạn ${limitMb} MB!`, 'error');
      continue;
    }

    if (file.type.startsWith('image/')) {
      try {
        const imgData = await readFileAsBase64(file);
        const newSub = {
          id: uid(),
          data: imgData,
          name: sanitizeFileName(file.name),
          date: new Date().toISOString()
        };
        task.submissions.push(newSub);
        addedPhotos++;

        if (isCloudEnabled && supabaseClient) {
          try {
            const { data: subData, error: subErr } = await supabaseClient.from('submissions').insert([{
              task_id: task.id,
              student_id: task.studentId,
              image_url: imgData
            }]).select();
            if (!subErr && subData && subData[0]) {
              newSub.id = subData[0].id;
            }
          } catch (cloudErr) {
            console.warn('Cloud submission insert error:', cloudErr);
          }
        }
      } catch (err) {
        console.error('Error reading image file:', err);
      }
    } else {
      // Non-image document / audio / file
      try {
        const uploadedMeta = await uploadFileStorage(file);
        uploadedMeta.date = new Date().toISOString();
        task.submittedFiles.push(uploadedMeta);
        addedFiles++;

        if (isCloudEnabled && supabaseClient) {
          try {
            await supabaseClient.from('tasks').update({
              submitted_files: JSON.stringify(task.submittedFiles)
            }).eq('id', task.id);
          } catch (cloudErr) {
            console.warn('Cloud file update error:', cloudErr);
          }
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        toast(`Không thể tải lên tệp "${file.name}"`, 'error');
      }
    }
  }

  if (addedPhotos > 0 || addedFiles > 0) {
    // When student uploads new content, reset approved status to draft
    if (task.status === 'approved' || task.status === 'pending') {
      task.status = 'draft';
    }
    if (isCloudEnabled && supabaseClient) {
      supabaseClient.from('tasks').update({ status: task.status }).eq('id', task.id)
        .then(() => {}).catch(err => console.warn(err));
    }

    saveState();
    renderView(currentView);

    const parts = [];
    if (addedPhotos > 0) parts.push(`${addedPhotos} ảnh`);
    if (addedFiles > 0) parts.push(`${addedFiles} tệp`);
    toast(`Đã thêm ${parts.join(' và ')}! Bấm "Nộp bài cho thầy" khi sẵn sàng.`, 'info');
  }
}

async function removeSubmission(event, taskId, idx) {
  if (event) event.stopPropagation();
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.submissions) return;

  const sub = task.submissions[idx];
  task.submissions.splice(idx, 1);

  if (!hasAnySubmissions(task) && task.status === 'approved') {
    task.status = 'pending';
  } else if (!hasAnySubmissions(task) && task.status === 'draft') {
    task.status = 'pending';
  }

  if (isCloudEnabled && supabaseClient && sub && sub.id) {
    await supabaseClient.from('submissions').delete().eq('id', sub.id);
  }

  saveState();
  renderView(currentView);
  toast('Đã gỡ ảnh bài nộp.', 'info');
}

async function removeSubmittedFile(event, taskId, idx) {
  if (event) event.stopPropagation();
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || !task.submittedFiles) return;

  const fileMeta = task.submittedFiles[idx];
  if (fileMeta) {
    await deleteFileStorage(fileMeta);
  }
  task.submittedFiles.splice(idx, 1);

  if (!hasAnySubmissions(task) && task.status === 'approved') {
    task.status = 'pending';
  } else if (!hasAnySubmissions(task) && task.status === 'draft') {
    task.status = 'pending';
  }

  if (isCloudEnabled && supabaseClient) {
    try {
      await supabaseClient.from('tasks').update({
        submitted_files: JSON.stringify(task.submittedFiles),
        status: task.status
      }).eq('id', task.id);
    } catch (cloudErr) {
      console.warn('Cloud update submitted_files error:', cloudErr);
    }
  }

  saveState();
  renderView(currentView);
  toast('Đã xóa tệp bài nộp.', 'info');
}


// ── APPROVE TASK ───────────────────────────────────────────
// submissionDate: the dateKey (YYYY-MM-DD) of the day being approved.
// For non-recurring tasks, omit — it defaults to today.
async function approveTask(taskId, submissionDate) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  const nowIso = new Date().toISOString();

  if (task.isRecurring) {
    const dateKey = submissionDate || todayKey();
    if (!task.approvalHistory) task.approvalHistory = [];
    // Avoid duplicate approval for same day
    if (!isDateApproved(task, dateKey)) {
      task.approvalHistory.push({ submissionDate: dateKey, approvedAt: nowIso });
    }
    if (task.approvalHistory.length > 60) task.approvalHistory = task.approvalHistory.slice(-60);
    // Check if any other days are still pending — if not, reset status to 'pending'
    const stillPending = (task.submissions || []).some(sub => {
      const d = new Date(sub.date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return !isDateApproved(task, k);
    });
    task.status = stillPending ? 'submitted' : 'pending';
  } else {
    task.status = 'approved';
  }
  task.approvedAt = nowIso;

  if (isCloudEnabled && supabaseClient) {
    await supabaseClient.from('tasks').update({
      status: task.status,
      approved_at: nowIso,
      approval_history: JSON.stringify(task.approvalHistory || [])
    }).eq('id', task.id);
  }

  // Fee tracker: deduct 2,500đ per completed assignment (reward at most once per task/date)
  feeState.rewardedApprovals = feeState.rewardedApprovals || {};
  const rewardKey = `${task.id}__${submissionDate || 'single'}`;
  if (!feeState.rewardedApprovals[rewardKey]) {
    feeState.rewardedApprovals[rewardKey] = new Date().toISOString();
    const student = state.students.find(s => s.id === task.studentId);
    const studentName = student ? student.name : 'Học sinh';
    const subLabel = submissionDate ? ` (${submissionDate})` : '';
    adjustFee(FEE_PER_ASSIGNMENT, `${studentName} hoàn thành bài: ${task.title.slice(0, 24)}${subLabel}`, 'reward', task.studentId);
  }

  saveState();
  renderView(currentView);
  toast('Bài đã được duyệt!', 'success');
}

// ── IMAGE VIEWER (Task 3) ───────────────────────────────────
let _viewerState = {
  scale: 1,
  x: 0,
  y: 0,
  rotation: 0
};
let _viewerSrc = '';
let _viewerGallery = [];
let _viewerIndex = 0;
let _isViewerPanning = false;
let _panStartX = 0;
let _panStartY = 0;
let _viewerPointers = new Map();
let _initialPinchDist = null;
let _initialPinchScale = 1;
let _pinchCenter = { x: 0, y: 0 };

function _applyViewerTransform(animate = false) {
  const img = document.getElementById('viewer-img');
  const zoomVal = document.getElementById('viewer-zoom-val');
  if (!img) return;
  img.style.transition = animate ? 'transform 0.15s ease' : 'none';
  img.style.transform = `translate(${_viewerState.x}px, ${_viewerState.y}px) scale(${_viewerState.scale}) rotate(${_viewerState.rotation}deg)`;
  if (zoomVal) {
    zoomVal.textContent = `${Math.round(_viewerState.scale * 100)}%`;
  }
}

function openImageViewer(src, caption, index = 0, gallery = null) {
  _viewerSrc = src;
  _viewerGallery = Array.isArray(gallery) && gallery.length > 0 ? gallery : [{ src, caption }];
  _viewerIndex = Math.max(0, Math.min(index, _viewerGallery.length - 1));
  _showCurrentImage(false);
  openModal('modal-image-viewer');
}

function _showCurrentImage(animate = false) {
  const item = _viewerGallery[_viewerIndex] || { src: _viewerSrc, caption: '' };
  _viewerSrc = item.src;
  _viewerState = { scale: 1, x: 0, y: 0, rotation: 0 };
  const img = document.getElementById('viewer-img');
  if (img) img.src = item.src;
  const cap = document.getElementById('viewer-caption');
  if (cap) cap.textContent = item.caption || '';

  const prevBtn = document.getElementById('viewer-btn-prev');
  const nextBtn = document.getElementById('viewer-btn-next');
  if (prevBtn) prevBtn.style.display = _viewerGallery.length > 1 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = _viewerGallery.length > 1 ? 'flex' : 'none';

  _applyViewerTransform(animate);
}

function viewerPrevImage() {
  if (_viewerGallery.length <= 1) return;
  _viewerIndex = (_viewerIndex - 1 + _viewerGallery.length) % _viewerGallery.length;
  _showCurrentImage(true);
}

function viewerNextImage() {
  if (_viewerGallery.length <= 1) return;
  _viewerIndex = (_viewerIndex + 1) % _viewerGallery.length;
  _showCurrentImage(true);
}

function viewerReset() {
  _viewerState = { scale: 1, x: 0, y: 0, rotation: 0 };
  _applyViewerTransform(true);
}

function viewerZoomIn() {
  _viewerState.scale = Math.min(8, Math.round((_viewerState.scale + 0.25) * 100) / 100);
  _applyViewerTransform(true);
}

function viewerZoomOut() {
  _viewerState.scale = Math.max(0.5, Math.round((_viewerState.scale - 0.25) * 100) / 100);
  _applyViewerTransform(true);
}

function viewerRotateCW() {
  _viewerState.rotation = (_viewerState.rotation + 90) % 360;
  _applyViewerTransform(true);
}

function viewerRotateCCW() {
  _viewerState.rotation = (_viewerState.rotation - 90 + 360) % 360;
  _applyViewerTransform(true);
}

function viewerDownload() {
  if (!_viewerSrc) return;
  const a = document.createElement('a');
  a.href = _viewerSrc;
  const cap = document.getElementById('viewer-caption')?.textContent || 'homework';
  a.download = cap.replace(/[^a-z0-9一-鿿À-ɏ _-]/gi, '_').slice(0, 60) + '.jpg';
  a.click();
}

function handleViewerWheel(e) {
  e.preventDefault();
  const wrap = document.getElementById('viewer-img-wrap');
  if (!wrap) return;

  const factor = e.deltaY < 0 ? 1.15 : 0.87;
  const oldScale = _viewerState.scale;
  const newScale = Math.min(8, Math.max(0.5, oldScale * factor));
  if (newScale === oldScale) return;

  const rect = wrap.getBoundingClientRect();
  const cx = e.clientX - (rect.left + rect.width / 2);
  const cy = e.clientY - (rect.top + rect.height / 2);

  const px = (cx - _viewerState.x) / oldScale;
  const py = (cy - _viewerState.y) / oldScale;

  _viewerState.x = cx - px * newScale;
  _viewerState.y = cy - py * newScale;
  _viewerState.scale = newScale;

  _applyViewerTransform(false);
}

function initViewerGestures() {
  const wrap = document.getElementById('viewer-img-wrap');
  if (!wrap) return;

  wrap.addEventListener('wheel', handleViewerWheel, { passive: false });

  wrap.addEventListener('pointerdown', e => {
    _viewerPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}

    if (_viewerPointers.size === 1) {
      _isViewerPanning = true;
      _panStartX = e.clientX - _viewerState.x;
      _panStartY = e.clientY - _viewerState.y;
      wrap.classList.add('panning');
    } else if (_viewerPointers.size === 2) {
      _isViewerPanning = false;
      const [p1, p2] = Array.from(_viewerPointers.values());
      _initialPinchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      _initialPinchScale = _viewerState.scale;
      _pinchCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }
  });

  wrap.addEventListener('pointermove', e => {
    if (!_viewerPointers.has(e.pointerId)) return;
    _viewerPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (_viewerPointers.size === 1 && _isViewerPanning) {
      if (_viewerState.scale > 1) {
        _viewerState.x = e.clientX - _panStartX;
        _viewerState.y = e.clientY - _panStartY;
        _applyViewerTransform(false);
      }
    } else if (_viewerPointers.size === 2 && _initialPinchDist) {
      const [p1, p2] = Array.from(_viewerPointers.values());
      const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const scaleFactor = currentDist / _initialPinchDist;
      const newScale = Math.min(8, Math.max(0.5, _initialPinchScale * scaleFactor));
      const rect = wrap.getBoundingClientRect();
      const cx = _pinchCenter.x - (rect.left + rect.width / 2);
      const cy = _pinchCenter.y - (rect.top + rect.height / 2);
      const px = (cx - _viewerState.x) / _viewerState.scale;
      const py = (cy - _viewerState.y) / _viewerState.scale;
      _viewerState.x = cx - px * newScale;
      _viewerState.y = cy - py * newScale;
      _viewerState.scale = newScale;
      _applyViewerTransform(false);
    }
  });

  const endPointer = e => {
    _viewerPointers.delete(e.pointerId);
    if (_viewerPointers.size < 2) _initialPinchDist = null;
    if (_viewerPointers.size === 0) {
      _isViewerPanning = false;
      wrap.classList.remove('panning');
    }
  };

  wrap.addEventListener('pointerup', endPointer);
  wrap.addEventListener('pointercancel', endPointer);

  // Double-click toggles between fit-to-screen and 2.5x
  wrap.addEventListener('dblclick', e => {
    if (_viewerState.scale > 1.2) {
      viewerReset();
    } else {
      const rect = wrap.getBoundingClientRect();
      const cx = e.clientX - (rect.left + rect.width / 2);
      const cy = e.clientY - (rect.top + rect.height / 2);
      const newScale = 2.5;
      const px = (cx - _viewerState.x) / _viewerState.scale;
      const py = (cy - _viewerState.y) / _viewerState.scale;
      _viewerState.x = cx - px * newScale;
      _viewerState.y = cy - py * newScale;
      _viewerState.scale = newScale;
      _applyViewerTransform(true);
    }
  });
}

function handleViewerBackdropClick(e) {
  if (e.target === document.getElementById('modal-image-viewer')) {
    closeModal('modal-image-viewer');
  }
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
        toast(`Error saving student: ${error.message}`, 'error');
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
        toast(`Error saving student: ${error.message}`, 'error');
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
    const studentTasks = state.tasks.filter(t => t.studentId === id);
    for (const t of studentTasks) {
      if (t.attachments) {
        for (const att of t.attachments) await deleteFileStorage(att);
      }
      if (t.submittedFiles) {
        for (const sf of t.submittedFiles) await deleteFileStorage(sf);
      }
    }

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

function handleRecurringToggle() {
  const recurChk = document.getElementById('input-task-recurring');
  const dueGroup = document.getElementById('form-group-task-due');
  const dueInput = document.getElementById('input-task-due');
  if (recurChk && dueGroup) {
    if (recurChk.checked) {
      dueGroup.classList.add('hidden');
      if (dueInput) dueInput.value = '';
    } else {
      dueGroup.classList.remove('hidden');
    }
  }
}

// ── TASK ATTACHMENTS (Teacher side) ────────────────────────
function renderTaskFormAttachments() {
  const listEl = document.getElementById('task-attachments-list');
  if (!listEl) return;
  if (!taskFormAttachments.length) {
    listEl.innerHTML = '';
    return;
  }
  listEl.innerHTML = taskFormAttachments.map((f, i) => `
    <div class="file-item">
      <div class="file-item-info">
        ${getFileIcon(f.name)}
        <span class="file-item-name" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
        <span class="file-item-size">(${formatFileSize(f.size)})</span>
      </div>
      <button class="file-item-remove" type="button" onclick="removeTaskFormAttachment(${i})" title="Gỡ tệp này">✕</button>
    </div>
  `).join('');
}

async function removeTaskFormAttachment(index) {
  const removed = taskFormAttachments.splice(index, 1)[0];
  if (removed) {
    await deleteFileStorage(removed);
  }
  renderTaskFormAttachments();
}

async function handleTaskAttachmentsInput(files) {
  if (!files || !files.length) return;
  const dropZone = document.getElementById('task-attach-drop-zone');
  const hint = document.getElementById('task-attach-hint');
  const prevHint = hint ? hint.textContent : '';
  if (dropZone) dropZone.classList.add('uploading');
  if (hint) hint.textContent = 'Đang tải tệp lên...';
  const saveBtn = document.getElementById('btn-save-task');
  if (saveBtn) saveBtn.disabled = true;

  try {
    const limit = isCloudEnabled ? MAX_FILE_SIZE_CLOUD : MAX_FILE_SIZE_LOCAL;
    for (const file of Array.from(files)) {
      if (!validateFileSize(file)) {
        toast(`Tệp "${file.name}" vượt quá giới hạn (${limit} MB)!`, 'error');
        continue;
      }
      const uploaded = await uploadFileStorage(file);
      taskFormAttachments.push(uploaded);
    }
  } catch (err) {
    console.error('Error attaching file:', err);
    toast('Lỗi khi tải tệp lên!', 'error');
  } finally {
    if (dropZone) dropZone.classList.remove('uploading');
    if (hint) hint.textContent = prevHint || 'Kéo thả hoặc click để chọn tệp';
    if (saveBtn) saveBtn.disabled = false;
    renderTaskFormAttachments();
  }
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
  handleRecurringToggle();
  taskFormAttachments = [];
  renderTaskFormAttachments();
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
  document.getElementById('input-task-desc').value = task.desc || task.description || '';
  document.getElementById('input-task-student').value = task.studentId;
  document.getElementById('input-task-due').value = task.dueDate || '';
  document.getElementById('input-task-id').value = task.id;
  const recurChk = document.getElementById('input-task-recurring');
  if (recurChk) recurChk.checked = !!task.isRecurring;
  handleRecurringToggle();
  taskFormAttachments = task.attachments ? JSON.parse(JSON.stringify(task.attachments)) : [];
  renderTaskFormAttachments();
  openModal('modal-task');
}

function openEditTask(id) {
  editTask(id);
}

async function saveTask() {
  const title = document.getElementById('input-task-title').value.trim();
  const description = document.getElementById('input-task-desc').value.trim();
  const studentId = document.getElementById('input-task-student').value;
  const recurChk = document.getElementById('input-task-recurring');
  const isRecurring = recurChk ? recurChk.checked : false;
  const dueDate = isRecurring ? '' : document.getElementById('input-task-due').value;
  const id = document.getElementById('input-task-id').value;
  if (!title) { toast('Please enter a task title.', 'error'); return; }
  if (!studentId) { toast('Please select a student.', 'error'); return; }

  const attachmentsCopy = [...taskFormAttachments];

  if (id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      task.title = title;
      task.description = description;
      task.studentId = studentId;
      task.dueDate = dueDate;
      task.isRecurring = isRecurring;
      task.attachments = attachmentsCopy;
    }
    if (isCloudEnabled && supabaseClient) {
      const { error } = await supabaseClient.from('tasks').update({
        title,
        description,
        student_id: studentId,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        attachments: JSON.stringify(attachmentsCopy)
      }).eq('id', id);
      if (error) {
        console.error('Supabase update task error:', error);
        if (error.message && error.message.includes('attachments')) {
          toast('Cần cập nhật cấu trúc Supabase: vui lòng chạy supabase-migration.sql', 'error');
        } else {
          toast(`Lỗi lưu lên cloud: ${error.message}`, 'error');
        }
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
      submittedFiles: [],
      attachments: attachmentsCopy,
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
        is_recurring: isRecurring,
        attachments: JSON.stringify(attachmentsCopy)
      }]).select();
      if (error) {
        console.error('Supabase insert task error:', error);
        if (error.message && error.message.includes('attachments')) {
          toast('Cần cập nhật cấu trúc Supabase: vui lòng chạy supabase-migration.sql', 'error');
        } else {
          toast(`Lỗi lưu lên cloud: ${error.message}`, 'error');
        }
      } else if (data && data[0]) {
        newTask.id = data[0].id;
      }
    }
    toast(isRecurring ? 'Daily recurring task created!' : 'Assignment created!', 'success');
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
    if (task) {
      if (task.attachments) {
        for (const att of task.attachments) await deleteFileStorage(att);
      }
      if (task.submittedFiles) {
        for (const sf of task.submittedFiles) await deleteFileStorage(sf);
      }
    }

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

// ── STREAK LOSS DETECTION (ACCURATE ALGORITHM) ─────────────────
// Only charges when an ACTIVE streak (>= 1 day) drops to 0.
// Never repeatedly charges students who are already at streak 0.
function checkStreakLosses() {
  if (!isTeacher()) return;
  if (!state.students || !state.students.length) return;

  feeState.studentStreaks = feeState.studentStreaks || {};

  state.students.forEach(s => {
    const { streak } = getStudentStreak(s.id);
    const prev = feeState.studentStreaks[s.id];

    // Case: student previously had an active streak (>= 1) and now streak is 0
    if (typeof prev === 'number' && prev >= 1 && streak === 0) {
      adjustFee(FEE_STREAK_LOST, `${s.name} mất chuỗi streak (${prev} ngày → 0)`, 'penalty_streak', s.id);
      toast(`${s.name} đã mất streak (${prev} ngày)! +10,000đ`, 'info');
    }

    // Always update stored streak
    feeState.studentStreaks[s.id] = streak;
  });
  saveFeeState();
}

// ── LATE FEE DETECTION (ACCURATE ALGORITHM) ────────────────────
// Charges +10,000đ ONCE per overdue regular task (past due date, not submitted/approved).
// Charges +5,000đ ONCE for missed daily tasks of YESTERDAY (never penalizes current day in progress).
function checkLateFees() {
  if (!isTeacher()) return;
  if (!state.tasks || !state.tasks.length) return;

  feeState.lateCharged = feeState.lateCharged || {};
  feeState.dailyCharged = feeState.dailyCharged || {};

  const yesterday = getPastDateKey(1);

  state.tasks.forEach(task => {
    const student = state.students.find(s => s.id === task.studentId);
    const studentName = student ? student.name : 'Học sinh';

    if (task.isRecurring) {
      // DAILY RECURRING TASK:
      // Only evaluate completed past days (yesterday). NEVER penalize for today while today is in progress!
      const dailyChargeKey = `${task.id}__${yesterday}`;
      if (!feeState.dailyCharged[dailyChargeKey]) {
        const hadSubmissionYesterday = hasSubmissionOnDate(task, yesterday);
        const wasApprovedYesterday = isDateApproved(task, yesterday);
        const taskCreatedDate = task.createdAt ? task.createdAt.slice(0, 10) : '';

        // Only penalize if the task was active on/before yesterday, and yesterday had no submission
        if (taskCreatedDate && taskCreatedDate <= yesterday && !hadSubmissionYesterday && !wasApprovedYesterday) {
          feeState.dailyCharged[dailyChargeKey] = new Date().toISOString();
          saveFeeState();
          adjustFee(FEE_LATE_DAILY, `${studentName} chưa làm bài hằng ngày (${yesterday}): ${task.title.slice(0, 24)}`, 'penalty_late', task.studentId);
          toast(`${studentName} trễ bài hằng ngày hôm qua! +5,000đ`, 'info');
        }
      }
    } else {
      // REGULAR TASK:
      // Charge +10,000đ ONCE when overdue and neither submitted nor approved.
      if (feeState.lateCharged[task.id]) return; // Already charged once for this task

      const status = getTaskStatus(task);
      if ((status === 'overdue' || (isOverdue(task.dueDate) && status === 'pending')) &&
          status !== 'submitted' && status !== 'approved') {
        feeState.lateCharged[task.id] = new Date().toISOString();
        saveFeeState();
        adjustFee(FEE_LATE_REGULAR, `${studentName} trễ hạn bài tập: ${task.title.slice(0, 24)}`, 'penalty_late', task.studentId);
        toast(`${studentName} trễ hạn bài tập! +10,000đ`, 'info');
      }
    }
  });
}

// ── INIT ───────────────────────────────────────────────────
function init() {
  loadState();
  loadFeeState();
  initSupabase();
  seedDemoData();

  if (isCloudEnabled) {
    syncFromCloud();
  }

  // Render fee widget on init
  renderFeeWidget();

  // Check streaks & late fees periodically (every 60s)
  setInterval(() => {
    if (isTeacher()) {
      checkStreakLosses();
      checkLateFees();
    }
  }, 60000);

  // Sidebar date
  const dateEl = document.getElementById('sidebar-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  // Mobile drawer navigation toggle
  const mobileNavBtn = document.getElementById('btn-mobile-nav');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebar = document.getElementById('sidebar');

  function toggleMobileNav(force) {
    if (!sidebar) return;
    const shouldOpen = force !== undefined ? force : !sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', shouldOpen);
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active', shouldOpen);
    if (mobileNavBtn) mobileNavBtn.setAttribute('aria-expanded', String(shouldOpen));
  }

  if (mobileNavBtn) {
    mobileNavBtn.addEventListener('click', () => toggleMobileNav());
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => toggleMobileNav(false));
  }

  // Nav items (both Top Navigation and Mobile Bottom Tabs)
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.view);
    });
  });

  // Command Palette trigger & keyboard shortcuts
  const cmdTriggerBtn = document.getElementById('cmd-trigger-btn');
  if (cmdTriggerBtn) cmdTriggerBtn.addEventListener('click', openCmd);

  const cmdEscBtn = document.getElementById('cmd-esc-btn');
  if (cmdEscBtn) cmdEscBtn.addEventListener('click', closeCmd);

  const cmdInput = document.getElementById('cmd-input');
  if (cmdInput) {
    cmdInput.addEventListener('input', e => {
      cmdSelectedIndex = 0;
      renderCmdResults(e.target.value);
    });
    cmdInput.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (cmdCurrentItems.length > 0) {
          cmdSelectedIndex = (cmdSelectedIndex + 1) % cmdCurrentItems.length;
          renderCmdResults(cmdInput.value);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdCurrentItems.length > 0) {
          cmdSelectedIndex = (cmdSelectedIndex - 1 + cmdCurrentItems.length) % cmdCurrentItems.length;
          renderCmdResults(cmdInput.value);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCmdItem(cmdSelectedIndex);
      } else if (e.key === 'Escape') {
        closeCmd();
      }
    });
  }

  const cmdOverlay = document.getElementById('cmd-overlay');
  if (cmdOverlay) {
    cmdOverlay.addEventListener('click', e => {
      if (e.target === cmdOverlay) closeCmd();
    });
  }

  // Global keyboard shortcuts (Command palette + Image viewer controls)
  document.addEventListener('keydown', e => {
    const isViewerOpen = document.getElementById('modal-image-viewer')?.classList.contains('active');
    if (isViewerOpen) {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        viewerZoomIn();
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        viewerZoomOut();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        viewerReset();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (_viewerGallery.length > 1) {
          viewerPrevImage();
        } else {
          _viewerState.x += 40;
          _applyViewerTransform(false);
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (_viewerGallery.length > 1) {
          viewerNextImage();
        } else {
          _viewerState.x -= 40;
          _applyViewerTransform(false);
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        _viewerState.y += 40;
        _applyViewerTransform(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        _viewerState.y -= 40;
        _applyViewerTransform(false);
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      openCmd();
    }
    if (e.key === 'Escape') {
      if (isViewerOpen) closeModal('modal-image-viewer');
      closeCmd();
    }
  });

  // User switch buttons
  const switchUserBtn = document.getElementById('btn-switch-user');
  if (switchUserBtn) {
    switchUserBtn.addEventListener('click', openLoginDialog);
  }

  const doLoginBtn = document.getElementById('btn-do-login');
  if (doLoginBtn) doLoginBtn.addEventListener('click', handleDoLogin);

  // Role selector buttons
  const roleTeacherBtn = document.getElementById('role-btn-teacher');
  if (roleTeacherBtn) roleTeacherBtn.addEventListener('click', () => selectLoginRole('teacher'));

  const roleStudentBtn = document.getElementById('role-btn-student');
  if (roleStudentBtn) roleStudentBtn.addEventListener('click', () => selectLoginRole('student'));

  // Task 4: Login modal Enter key listener (with Vietnamese IME protection)
  function handleLoginEnter(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDoLogin();
    }
  }
  const teacherPassInput = document.getElementById('input-teacher-pass');
  if (teacherPassInput) teacherPassInput.addEventListener('keydown', handleLoginEnter);

  const studentPinInput = document.getElementById('input-student-pin');
  if (studentPinInput) studentPinInput.addEventListener('keydown', handleLoginEnter);

  const loginStudentSelect = document.getElementById('login-student-select');
  if (loginStudentSelect) loginStudentSelect.addEventListener('keydown', handleLoginEnter);

  // Supabase config modal buttons & Enter key
  const useOfflineBtn = document.getElementById('btn-use-offline');
  if (useOfflineBtn) useOfflineBtn.addEventListener('click', useOfflineLocalStorage);

  const saveCloudBtn = document.getElementById('btn-save-cloud');
  if (saveCloudBtn) saveCloudBtn.addEventListener('click', saveSupabaseConfig);

  function handleSupabaseEnter(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      saveSupabaseConfig();
    }
  }
  const supaUrlInput = document.getElementById('input-supabase-url');
  if (supaUrlInput) supaUrlInput.addEventListener('keydown', handleSupabaseEnter);

  const supaKeyInput = document.getElementById('input-supabase-key');
  if (supaKeyInput) supaKeyInput.addEventListener('keydown', handleSupabaseEnter);

  // Image viewer toolbar controls & gesture setup
  initViewerGestures();

  const viewerPrevBtn = document.getElementById('viewer-btn-prev');
  if (viewerPrevBtn) viewerPrevBtn.addEventListener('click', viewerPrevImage);

  const viewerNextBtn = document.getElementById('viewer-btn-next');
  if (viewerNextBtn) viewerNextBtn.addEventListener('click', viewerNextImage);

  const viewerResetBtn = document.getElementById('viewer-btn-reset');
  if (viewerResetBtn) viewerResetBtn.addEventListener('click', viewerReset);

  const viewerZoomOutBtn = document.getElementById('viewer-btn-zoom-out');
  if (viewerZoomOutBtn) viewerZoomOutBtn.addEventListener('click', viewerZoomOut);

  const viewerZoomInBtn = document.getElementById('viewer-btn-zoom-in');
  if (viewerZoomInBtn) viewerZoomInBtn.addEventListener('click', viewerZoomIn);

  const viewerRotateCCWBtn = document.getElementById('viewer-btn-rotate-ccw');
  if (viewerRotateCCWBtn) viewerRotateCCWBtn.addEventListener('click', viewerRotateCCW);

  const viewerRotateCWBtn = document.getElementById('viewer-btn-rotate-cw');
  if (viewerRotateCWBtn) viewerRotateCWBtn.addEventListener('click', viewerRotateCW);

  const viewerDownloadBtn = document.getElementById('viewer-btn-download');
  if (viewerDownloadBtn) viewerDownloadBtn.addEventListener('click', viewerDownload);

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

  const recurCheckbox = document.getElementById('input-task-recurring');
  if (recurCheckbox) recurCheckbox.addEventListener('change', handleRecurringToggle);

  // Modal saves & Enter key in single-line inputs
  const saveStudentBtn = document.getElementById('btn-save-student');
  if (saveStudentBtn) saveStudentBtn.addEventListener('click', saveStudent);

  function handleStudentEnter(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      saveStudent();
    }
  }
  const studentNameInput = document.getElementById('input-student-name');
  if (studentNameInput) studentNameInput.addEventListener('keydown', handleStudentEnter);
  const studentGradeInput = document.getElementById('input-student-grade');
  if (studentGradeInput) studentGradeInput.addEventListener('keydown', handleStudentEnter);
  const studentPassInput = document.getElementById('input-student-passcode');
  if (studentPassInput) studentPassInput.addEventListener('keydown', handleStudentEnter);

  const saveTaskBtn = document.getElementById('btn-save-task');
  if (saveTaskBtn) saveTaskBtn.addEventListener('click', saveTask);

  function handleTaskEnter(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTask();
    }
  }
  const taskTitleInput = document.getElementById('input-task-title');
  if (taskTitleInput) taskTitleInput.addEventListener('keydown', handleTaskEnter);
  const taskDueInput = document.getElementById('input-task-due');
  if (taskDueInput) taskDueInput.addEventListener('keydown', handleTaskEnter);

  // Task attachments in #modal-task
  const taskFilesInput = document.getElementById('input-task-files');
  if (taskFilesInput) {
    taskFilesInput.addEventListener('change', e => {
      handleTaskAttachmentsInput(e.target.files);
      e.target.value = '';
    });
  }

  const btnSelectTaskFiles = document.getElementById('btn-select-task-files');
  if (btnSelectTaskFiles) {
    btnSelectTaskFiles.addEventListener('click', e => {
      e.stopPropagation();
      taskFilesInput?.click();
    });
  }

  const taskDropZone = document.getElementById('task-attach-drop-zone');
  if (taskDropZone) {
    taskDropZone.addEventListener('click', () => {
      taskFilesInput?.click();
    });
    taskDropZone.addEventListener('dragover', e => {
      e.preventDefault();
      taskDropZone.classList.add('drag-over');
    });
    taskDropZone.addEventListener('dragleave', () => {
      taskDropZone.classList.remove('drag-over');
    });
    taskDropZone.addEventListener('drop', e => {
      e.preventDefault();
      taskDropZone.classList.remove('drag-over');
      if (e.dataTransfer.files) handleTaskAttachmentsInput(e.dataTransfer.files);
    });
  }

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
