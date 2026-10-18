import './classroom.css';
import { showScreen, startGame } from './game.js';
import { createDemoApi, FICTIONAL_ROSTER } from './demo-api.js';
import { parseRoster, validateRoster, requestId } from './functions/domain.js';

const $ = id => document.getElementById(id);
let api; let selected = null; let roster = []; let dashboard; let editing = null;
let runId; let pendingAnswer = null;
const status = text => { $('app-status').textContent = text; };
const message = error => error.message?.replace(/^Firebase:\s*/i, '') || 'Please try again.';
async function busy(button, action, localStatus) {
  if (button.disabled) return;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  (localStatus || $('app-status')).textContent = '';
  try { await action(); }
  catch (error) { (localStatus || $('app-status')).textContent = message(error); }
  finally { button.disabled = false; button.removeAttribute('aria-busy'); }
}
const bind = (id, action, localStatus) => $(id).addEventListener('click', () => busy($(id), action, localStatus));
function enter(id, button) { $(id).addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); $(button).click(); } }); }
function clearStudent() {
  selected = null; runId = null; pendingAnswer = null;
  $('playing-as').hidden = true;
  $('change-student').hidden = true;
}
async function resetStudent() {
  await api.logout(); clearStudent(); status('');
  $('class-code').value = '';
  $('student-daisies').replaceChildren();
  showScreen('access-screen');
}
async function play() {
  if (!api) { status('The classroom is not ready. Please ask your teacher.'); return; }
  if (!selected) { showScreen('access-screen'); $('class-code').focus(); return; }
  const result = await api.begin(); runId = result.runId; pendingAnswer = null;
  $('save-status').textContent = '';
  startGame();
}
window.daisyClassroom = {
  async answer(data) {
    if (!runId) throw new Error('Choose your name and start a new game.');
    // Keep the same request ID on a network retry. The server scores it once.
    pendingAnswer ||= { ...data, runId, requestId: requestId() };
    const submitted = pendingAnswer;
    const result = await api.answer(submitted);
    if (pendingAnswer === submitted) pendingAnswer = null;
    return result;
  },
  finish: () => api.finish(runId)
};
document.addEventListener('daisy:request-play', () => busy($('start'), play));

bind('join-class', async () => {
  const result = await api.join($('class-code').value);
  roster = result.students;
  const grid = $('student-daisies'); grid.replaceChildren();
  roster.forEach(student => {
    const button = document.createElement('button');
    button.className = 'student-daisy'; button.textContent = student.displayName;
    button.dataset.studentId = student.id;
    button.addEventListener('click', () => busy(button, async () => {
      // Prevent simultaneous selection of two different children.
      grid.inert = true;
      try {
        const result = await api.select(student.id);
        selected = { id: student.id, displayName: result.displayName };
        $('playing-as').textContent = `🌼 ${selected.displayName}’s garden`;
        $('playing-as').hidden = false; $('change-student').hidden = false;
        await play();
      } finally { grid.inert = false; }
    }));
    grid.append(button);
  });
  showScreen('name-screen');
});
enter('class-code', 'join-class');
bind('change-student', resetStudent);
bind('back-code', resetStudent);
bind('back-welcome', async () => showScreen('welcome'));
bind('teacher-back', async () => { await api.logout(); clearStudent(); showScreen('welcome'); });
bind('teacher-link', async () => {
  await api.logout(); clearStudent();
  $('teacher-password').value = ''; $('verify-email').hidden = true;
  showScreen('teacher-login');
});
bind('teacher-signin', async () => {
  try {
    await api.login($('teacher-email').value.trim(), $('teacher-password').value);
    $('teacher-password').value = '';
    await loadDashboard();
  } catch (error) { $('verify-email').hidden = false; throw error; }
});
enter('teacher-password', 'teacher-signin');
bind('demo-teacher', async () => { await api.login(); await loadDashboard(); });
bind('teacher-signout', async () => {
  await api.logout(); clearStudent();
  $('student-records').replaceChildren(); dashboard = null;
  $('classroom-code-output').textContent = '';
  showScreen('welcome');
});
bind('verify-email', async () => { await api.verification(); status('If you are signed in, a verification email has been sent. Open it, then sign in again.'); });
bind('reset-password', async () => {
  try { await api.reset($('teacher-email').value.trim()); } catch { /* Do not reveal whether an account exists. */ }
  status('If this email belongs to a teacher account, check its inbox for the reset link.');
});
bind('refresh-dashboard', loadDashboard);
bind('rotate-code', async () => {
  if (dashboard?.classroom && !confirm('Create a new code? All current student sessions will end, and the old code will stop working.')) return;
  const result = await api.rotate();
  await loadDashboard();
  $('classroom-code-output').textContent = `Classroom code: ${result.code}\nKeep this code inside your classroom. Copy it now; it will not be shown again after you leave.`;
});

function element(tag, text, className) {
  const node = document.createElement(tag); node.textContent = text;
  if (className) node.className = className;
  return node;
}
const date = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not completed';
const attempts = run => Array.isArray(run.attempts) ? run.attempts.length : run.attempts;
async function loadDashboard() {
  dashboard = await api.dashboard();
  showScreen('teacher-dashboard');
  $('rotate-code').textContent = dashboard.classroom ? 'Change classroom code' : 'Create classroom code';
  $('add-students').disabled = !dashboard.classroom;
  const students = dashboard.students;
  const played = students.filter(s => s.runs.length).length;
  $('dashboard-summary').textContent = `${students.length} / 22 students · ${played} have played · ${students.filter(s => s.runs.some(r => r.status === 'completed')).length} have finished a game`;
  const container = $('student-records'); container.replaceChildren();
  if (!students.length) container.append(element('p', 'Create a classroom code, then use Add Students. Start with fictional names until your online security checks pass.'));
  students.sort((a, b) => a.displayName.localeCompare(b.displayName)).forEach(student => {
    const card = element('article', '', 'student-record');
    const head = document.createElement('header');
    head.append(element('h2', student.displayName));
    const actions = element('div', '', 'record-actions');
    const edit = element('button', 'Edit'); edit.setAttribute('aria-label', `Edit ${student.displayName}`);
    edit.addEventListener('click', () => openEditor(student));
    const remove = element('button', 'Remove', 'remove'); remove.setAttribute('aria-label', `Remove ${student.displayName}`);
    remove.addEventListener('click', () => busy(remove, async () => {
      if (!confirm(`Remove ${student.displayName} and permanently delete their progress? This cannot be undone.`)) return;
      await api.manage({ action: 'remove', studentId: student.id }); await loadDashboard();
    }));
    actions.append(edit, remove); head.append(actions); card.append(head);
    if (!student.runs.length) card.append(element('p', 'Not played yet', 'never-played'));
    else {
      const latest = student.runs[0];
      card.append(element('p', `Latest game: ${latest.status === 'completed' ? 'Completed' : 'In progress'} · First-try score ${latest.firstTryScore}/6 · ${attempts(latest)} attempts · ${latest.daisies} daisies`));
      card.append(element('p', `Started: ${date(latest.createdAt)} · Completed: ${date(latest.completedAt)}`, 'date'));
      const needs = new Set(student.runs.flatMap(run => run.practiceWords));
      const practice = element('p', needs.size ? 'Words needing practice: ' : 'Words needing practice: none recorded');
      needs.forEach(word => practice.append(element('span', word, 'practice-word'))); card.append(practice);
      const details = document.createElement('details'); details.append(element('summary', `Game history (${student.runs.length})`));
      student.runs.forEach(run => details.append(element('div', `${run.status === 'completed' ? 'Completed ' + date(run.completedAt) : 'Started ' + date(run.createdAt) + ' — not completed'} · ${run.firstTryScore}/6 first try · ${attempts(run)} attempts · Practice: ${run.practiceWords.join(', ') || 'none'}`, 'game-history')));
      card.append(details);
    }
    container.append(card);
  });
}

function openEditor(student) {
  editing = student?.id || null;
  $('roster-dialog-title').textContent = editing ? 'Edit Student' : 'Add Students';
  $('bulk-editor').hidden = !!editing; $('single-editor').hidden = !editing;
  $('roster-status').textContent = ''; $('import-preview').replaceChildren();
  $('roster-text').value = ''; $('roster-file').value = '';
  $('edit-first').value = student?.firstName || ''; $('edit-family').value = student?.familyName || '';
  $('roster-dialog').showModal();
}
bind('add-students', async () => openEditor());
bind('close-roster', async () => $('roster-dialog').close());
bind('sample-roster', async () => { $('roster-text').value = FICTIONAL_ROSTER.map(s => `${s.firstName} ${s.familyName}`).join('\n'); });
$('roster-file').addEventListener('change', async event => {
  try {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 40000) throw new Error('Choose a CSV or text file under 40 KB.');
    $('roster-text').value = await file.text(); $('import-preview').replaceChildren();
  } catch (error) { $('roster-status').textContent = message(error); }
});
function importedRows() {
  const rows = parseRoster($('roster-text').value);
  validateRoster([...dashboard.students, ...rows]);
  return rows;
}
bind('preview-roster', async () => {
  const rows = importedRows(); const container = $('import-preview'); container.replaceChildren();
  container.append(element('strong', `${rows.length} students to add`));
  rows.forEach(row => container.append(element('div', `${row.firstName} ${row.familyName}`.trim())));
}, $('roster-status'));
bind('save-roster', async () => {
  if (editing) await api.manage({ action: 'edit', studentId: editing, row: { firstName: $('edit-first').value, familyName: $('edit-family').value } });
  else await api.manage({ action: 'import', rows: importedRows() });
  $('roster-dialog').close(); await loadDashboard();
}, $('roster-status'));

try {
  api = import.meta.env.VITE_APP_MODE === 'firebase' ? await (await import('./firebase-api.js')).createFirebaseApi() : createDemoApi();
  if (api.demo) {
    $('mode-notice').textContent = 'Fictional demo only · Code: FLOWER22 · No private online records · Changes reset when this page reloads.';
    $('code-help').textContent = 'Try FLOWER22. All demo names are fictional.';
    $('teacher-credentials').hidden = true; $('demo-teacher').hidden = false;
    $('teacher-login-note').textContent = 'This is a public fictional demo, not a private teacher login. Use fictional names only.';
    $('roster-help').textContent = 'Demo only: fictional names, up to 22 students. Changes stay in memory and disappear when the page reloads. Paste one full name per line, or firstName,familyName CSV.';
  } else {
    $('mode-notice').textContent = import.meta.env.VITE_USE_EMULATORS === 'true' ? 'Local Firebase emulator · Fictional data only' : '';
    $('code-help').textContent = 'Only your teacher can give you the classroom code.';
    $('sample-roster').hidden = false;
  }
  status('');
  $('start').disabled = false;
  $('teacher-link').disabled = false;
} catch (error) {
  status(message(error));
  $('start').disabled = true; $('teacher-link').disabled = true;
}
