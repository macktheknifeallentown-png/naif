import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { createHash, randomBytes } from 'node:crypto';
import { normalizeStudent, validateRoster, newRun, applyAnswer } from './domain.js';

initializeApp();
const db = getFirestore();
const options = { region: 'us-central1', maxInstances: 3, timeoutSeconds: 30, memory: '256MiB', enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true' };
const hash = value => createHash('sha256').update(value).digest('hex');
const now = () => Timestamp.now();
const later = minutes => Timestamp.fromMillis(Date.now() + minutes * 60000);
const fail = (code, text) => { throw new HttpsError(code, text); };
const uid = request => request.auth?.uid || fail('unauthenticated', 'Please sign in again.');
const endpoint = handler => onCall(options, async request => {
  uid(request);
  try { return await handler(request); }
  catch (error) {
    if (error instanceof HttpsError) throw error;
    // Never echo submitted roster, code, or internal exception details to a child.
    throw new HttpsError('internal', 'We could not save that change. Please try again.');
  }
});
async function teacher(request) {
  const id = uid(request);
  const grant = await db.doc(`teachers/${id}`).get();
  if (!request.auth.token.email_verified || request.auth.token.firebase?.sign_in_provider !== 'password' || grant.data()?.enabled !== true) fail('permission-denied', 'A verified, approved teacher account is required.');
  return id;
}
function requireLive(snapshot, version) {
  if (!snapshot.exists || snapshot.data().active !== true || snapshot.data().version !== version) fail('permission-denied', 'Ask your teacher for the classroom code again.');
}
function requireFresh(snapshot) {
  if (!snapshot.exists || snapshot.data().expiresAt.toMillis() <= Date.now()) fail('permission-denied', 'Your classroom session has ended. Enter the code again.');
}
function checkedName(row) {
  try { return normalizeStudent(row); }
  catch (error) { fail('invalid-argument', error.message); }
}
function checkedRoster(rows) {
  try { return validateRoster(rows); }
  catch (error) { fail('invalid-argument', error.message); }
}
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : fail('invalid-argument', 'Please select a student or game again.');

export const rotateClassCode = endpoint(async request => {
  const id = await teacher(request);
  // 50 random bits, uppercase unambiguous characters. The actual code is
  // returned once to the teacher; Firestore stores its SHA-256 hash only.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(10);
  const code = Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
  const digest = hash(code);
  await db.runTransaction(async tx => {
    const ref = db.doc(`classes/${id}`);
    const previous = await tx.get(ref);
    if (previous.data()?.codeHash) tx.delete(db.doc(`accessCodes/${previous.data().codeHash}`));
    const version = (previous.data()?.version || 0) + 1;
    tx.set(ref, { teacherUid: id, active: true, version, codeHash: digest, updatedAt: now(), rosterRevision: previous.data()?.rosterRevision || 0 });
    tx.set(db.doc(`accessCodes/${digest}`), { classId: id, version });
  });
  return { code };
});

export const manageStudents = endpoint(async request => {
  const classId = await teacher(request);
  const { action, rows, studentId } = request.data || {};
  if (!['import', 'edit', 'remove'].includes(action)) fail('invalid-argument', 'Choose a roster action.');
  const students = db.collection(`classes/${classId}/students`);
  let deletion;
  await db.runTransaction(async tx => {
    const classRef = db.doc(`classes/${classId}`);
    const classroom = await tx.get(classRef);
    if (!classroom.exists) fail('failed-precondition', 'Create your classroom code first.');
    const docs = await tx.get(students);
    const active = docs.docs.filter(d => d.data().active).map(d => ({ id: d.id, ...d.data() }));
    let next;
    if (action === 'import') {
      if (!Array.isArray(rows) || !rows.length || rows.length > 22) fail('invalid-argument', 'Import between 1 and 22 students.');
      next = [...active, ...rows.map(row => ({ ...checkedName(row), id: students.doc().id }))];
    } else {
      const target = safeId(studentId);
      if (!docs.docs.some(d => d.id === target)) fail('not-found', 'That student was already removed. Refresh the dashboard.');
      if (action === 'remove') { next = active.filter(s => s.id !== target); deletion = students.doc(target); }
      else {
        if (!active.some(s => s.id === target)) fail('not-found', 'That student has been removed.');
        next = active.map(s => s.id === target ? { id: target, ...checkedName(request.data.row || {}) } : s);
      }
    }
    const valid = checkedRoster(next);
    valid.forEach(s => tx.set(students.doc(s.id), { firstName: s.firstName, familyName: s.familyName, displayName: s.displayName, active: true }, { merge: true }));
    if (deletion) tx.set(deletion, { active: false, firstName: '', familyName: '', displayName: '', deletedAt: now() }, { merge: true });
    tx.update(classRef, { rosterRevision: (classroom.data().rosterRevision || 0) + 1 });
  });
  if (deletion) await db.recursiveDelete(deletion);
  return { saved: true };
});

export const getDashboard = endpoint(async request => {
  const id = await teacher(request);
  const classroom = await db.doc(`classes/${id}`).get();
  const snapshot = await db.collection(`classes/${id}/students`).get();
  const students = await Promise.all(snapshot.docs.filter(d => d.data().active).map(async doc => {
    const runs = await doc.ref.collection('runs').orderBy('createdAt', 'desc').limit(25).get();
    return { id: doc.id, ...doc.data(), runs: runs.docs.map(run => {
      const data = run.data();
      return { id: run.id, status: data.status, createdAt: data.createdAt?.toDate().toISOString(), completedAt: data.completedAt?.toDate().toISOString() || null, firstTryScore: data.firstTryScore, daisies: data.daisies, attempts: data.attempts.length, practiceWords: data.practiceWords };
    }) };
  }));
  return { classroom: classroom.exists ? { active: classroom.data().active } : null, students };
});

async function throttle(request) {
  // Both per-account and per-network limits; do not retain IP addresses.
  const keys = ['uid:' + uid(request), 'ip:' + (request.rawRequest.ip || 'unknown')].map(hash);
  await db.runTransaction(async tx => {
    const refs = keys.map(key => db.doc(`joinLimits/${key}`));
    const docs = await Promise.all(refs.map(ref => tx.get(ref)));
    const limit = [8, 100]; // The class may share a school network.
    docs.forEach((doc, i) => {
      const fresh = doc.data()?.expiresAt?.toMillis() > Date.now();
      if (fresh && doc.data().count >= limit[i]) fail('resource-exhausted', 'Too many code tries. Ask your teacher and wait 15 minutes.');
    });
    docs.forEach((doc, i) => {
      const fresh = doc.data()?.expiresAt?.toMillis() > Date.now();
      tx.set(refs[i], { count: fresh ? doc.data().count + 1 : 1, expiresAt: fresh ? doc.data().expiresAt : later(15) });
    });
  });
}

export const joinClass = endpoint(async request => {
  if (request.auth.token.firebase?.sign_in_provider !== 'anonymous') fail('permission-denied', 'Sign out of the teacher account before joining as a student.');
  await throttle(request);
  const code = String(request.data?.code || '').toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z2-9]{10}$/.test(code)) fail('permission-denied', 'That code did not work. Ask your teacher and try again.');
  const access = await db.doc(`accessCodes/${hash(code)}`).get();
  if (!access.exists) fail('permission-denied', 'That code did not work. Ask your teacher and try again.');
  const { classId, version } = access.data();
  // Recheck version inside the same transaction that grants code-gated access.
  return db.runTransaction(async tx => {
    requireLive(await tx.get(db.doc(`classes/${classId}`)), version);
    const roster = await tx.get(db.collection(`classes/${classId}/students`));
    tx.set(db.doc(`classVisitors/${uid(request)}`), { classId, version, expiresAt: later(15) });
    return { students: roster.docs.filter(d => d.data().active).map(d => ({ id: d.id, displayName: d.data().displayName })) };
  });
});

export const selectStudent = endpoint(async request => {
  const user = uid(request);
  return db.runTransaction(async tx => {
    const visitor = await tx.get(db.doc(`classVisitors/${user}`));
    requireFresh(visitor);
    const { classId, version } = visitor.data();
    requireLive(await tx.get(db.doc(`classes/${classId}`)), version);
    const studentId = safeId(request.data?.studentId);
    const student = await tx.get(db.doc(`classes/${classId}/students/${studentId}`));
    if (!student.data()?.active) fail('permission-denied', 'Choose an available name.');
    const session = await tx.get(db.doc(`studentSessions/${user}`));
    if (session.exists && session.data().studentId !== studentId) fail('permission-denied', 'Use Change student to choose a different name.');
    tx.set(db.doc(`studentSessions/${user}`), { classId, studentId, version, expiresAt: later(240) });
    return { displayName: student.data().displayName };
  });
});

async function studentSession(tx, request) {
  const session = await tx.get(db.doc(`studentSessions/${uid(request)}`));
  requireFresh(session);
  const data = session.data();
  requireLive(await tx.get(db.doc(`classes/${data.classId}`)), data.version);
  const student = await tx.get(db.doc(`classes/${data.classId}/students/${data.studentId}`));
  if (!student.data()?.active) fail('permission-denied', 'Ask your teacher to check your name.');
  return data;
}

export const beginRun = endpoint(async request => db.runTransaction(async tx => {
  const session = await studentSession(tx, request);
  const ref = db.collection(`classes/${session.classId}/students/${session.studentId}/runs`).doc();
  tx.create(ref, newRun(uid(request), session.classId, session.studentId, now()));
  return { runId: ref.id };
}));

export const recordAnswer = endpoint(async request => db.runTransaction(async tx => {
  const session = await studentSession(tx, request);
  const runId = safeId(request.data?.runId);
  const requestId = safeId(request.data?.requestId);
  const ref = db.doc(`classes/${session.classId}/students/${session.studentId}/runs/${runId}`);
  const snapshot = await tx.get(ref);
  if (!snapshot.exists || snapshot.data().ownerUid !== uid(request)) fail('permission-denied', 'This game belongs to a different session. Start a new game.');
  let result;
  try { result = applyAnswer(snapshot.data(), { ...request.data, requestId }, now()); }
  catch (error) { fail('failed-precondition', error.message); }
  tx.set(ref, result.run);
  return result.response;
}));

export const finishRun = endpoint(async request => db.runTransaction(async tx => {
  const session = await studentSession(tx, request);
  const ref = db.doc(`classes/${session.classId}/students/${session.studentId}/runs/${safeId(request.data?.runId)}`);
  const run = await tx.get(ref);
  if (!run.exists || run.data().ownerUid !== uid(request)) fail('permission-denied', 'This game belongs to a different session.');
  if (!['words-done', 'completed'].includes(run.data().status)) fail('failed-precondition', 'Finish all six words first.');
  if (run.data().status !== 'completed') tx.update(ref, { status: 'completed', completedAt: now(), updatedAt: now() });
  return { saved: true };
}));
