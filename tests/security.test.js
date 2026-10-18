import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { initializeApp as clientApp, deleteApp } from 'firebase/app';
import { getAuth as clientAuth, connectAuthEmulator, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { FICTIONAL_ROSTER } from '../demo-api.js';
import { WORDS, ENDINGS } from '../functions/domain.js';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const projectId = 'demo-daisy-sounds';

test('real emulators: teacher authorization, student isolation, validated scoring, rotation, deletion', { timeout: 120000 }, async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080', 'Run with the demo emulators only');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  const admin = initializeApp({ projectId }, 'security-tests');
  const db = getFirestore(admin); const auth = getAuth(admin);
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  const env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules } });
  const apps = [];
  async function account(label, teacher = false, grant = true, verified = true) {
    const app = clientApp({ projectId, apiKey: 'demo-key' }, label + Date.now()); apps.push(app);
    const client = clientAuth(app); connectAuthEmulator(client, 'http://127.0.0.1:9099', { disableWarnings: true });
    if (teacher) {
      const email = label + Date.now() + '@example.test';
      const user = await auth.createUser({ email, password: 'Fictional-test-password-42', emailVerified: verified });
      if (grant) await db.doc('teachers/' + user.uid).set({ enabled: true });
      await signInWithEmailAndPassword(client, email, 'Fictional-test-password-42');
    } else await signInAnonymously(client);
    return { uid: client.currentUser.uid, token: await client.currentUser.getIdToken() };
  }
  async function call(user, name, data = {}) {
    const response = await fetch(`http://127.0.0.1:5001/${projectId}/us-central1/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ data }) });
    const body = await response.json();
    if (body.error) { const error = new Error(body.error.message); error.status = body.error.status; throw error; }
    return body.result;
  }
  try {
    const teacher = await account('teacher', true);
    const otherTeacher = await account('other', true);
    const unapproved = await account('unapproved', true, false);
    const unverified = await account('unverified', true, true, false);
    const child = await account('child'); const peer = await account('peer');
    await assert.rejects(() => call(child, 'getDashboard'));
    await assert.rejects(() => call(unapproved, 'rotateClassCode'));
    await assert.rejects(() => call(unverified, 'getDashboard'));
    await assert.rejects(() => call(child, 'selectStudent', { studentId: 'guess' }));
    const { code } = await call(teacher, 'rotateClassCode');
    await call(teacher, 'manageStudents', { action: 'import', rows: FICTIONAL_ROSTER });
    await assert.rejects(() => call(teacher, 'manageStudents', { action: 'import', rows: [{ firstName: 'Overflow', familyName: 'Fiction' }] }));
    await assert.rejects(() => call(child, 'manageStudents', { action: 'import', rows: [{ firstName: 'Wrong', familyName: 'Role' }] }));
    const dashboard = await call(teacher, 'getDashboard');
    assert.equal(dashboard.students.length, 22);
    assert.equal((await call(otherTeacher, 'getDashboard')).students.length, 0);
    const roster = (await call(child, 'joinClass', { code })).students;
    assert.equal(roster.length, 22); assert.deepEqual(Object.keys(roster[0]).sort(), ['displayName', 'id']);
    assert(roster.some(s => s.displayName === 'Sarah River'));
    await assert.rejects(() => call(peer, 'joinClass', { code: 'BADCODE222' }));
    await call(peer, 'joinClass', { code });
    const id = roster[0].id; const id2 = roster[1].id;
    await call(child, 'selectStudent', { studentId: id });
    await call(peer, 'selectStudent', { studentId: id2 });
    await assert.rejects(() => call(child, 'selectStudent', { studentId: id2 }));
    const { runId } = await call(child, 'beginRun');
    const { runId: peerRun } = await call(peer, 'beginRun');
    const runPath = `classes/${teacher.uid}/students/${id}/runs/${runId}`;
    const childDb = env.authenticatedContext(child.uid).firestore();
    const peerDb = env.authenticatedContext(peer.uid).firestore();
    const teacherDb = env.authenticatedContext(teacher.uid, { email_verified: true }).firestore();
    const otherDb = env.authenticatedContext(otherTeacher.uid, { email_verified: true }).firestore();
    await assertFails(getDoc(doc(childDb, runPath))); // Even the selected name cannot expose older scores.
    await assertFails(getDoc(doc(peerDb, runPath)));
    await assertFails(getDoc(doc(otherDb, runPath)));
    await assertFails(getDoc(doc(env.authenticatedContext(teacher.uid, { email_verified: false }).firestore(), runPath)));
    await assertFails(getDocs(collection(childDb, `classes/${teacher.uid}/students`)));
    await assertFails(setDoc(doc(childDb, `teachers/${child.uid}`), { enabled: true }));
    await assertFails(setDoc(doc(teacherDb, runPath), { firstTryScore: 999 }));
    await assertSucceeds(getDoc(doc(teacherDb, runPath)));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), runPath)));
    await assert.rejects(() => call(peer, 'recordAnswer', { runId, word: 'rich', answer: 'ch', hinted: false, requestId: 'stolen' }));
    await assert.rejects(() => call(child, 'recordAnswer', { runId, word: 'patch', answer: 'tch', hinted: false, requestId: 'skip' }));
    await assert.rejects(() => call(child, 'finishRun', { runId }));
    const wrong = { runId, word: 'rich', answer: 'tch', hinted: false, requestId: 'wrong-1' };
    await call(child, 'recordAnswer', wrong); await call(child, 'recordAnswer', wrong);
    for (let i = 0; i < 6; i++) await call(child, 'recordAnswer', { runId, word: WORDS[i], answer: ENDINGS[i], hinted: i === 1, requestId: 'answer-' + i, firstTryScore: 999 });
    await call(child, 'finishRun', { runId }); await call(child, 'finishRun', { runId });
    const saved = (await db.doc(runPath).get()).data();
    assert.equal(saved.firstTryScore, 4); assert.equal(saved.attempts.length, 7);
    assert.equal(saved.status, 'completed'); assert(saved.completedAt.toMillis() <= Date.now());
    assert.deepEqual(saved.practiceWords, ['rich', 'such']);
    await call(teacher, 'manageStudents', { action: 'edit', studentId: id, row: { firstName: 'Fictional', familyName: 'Updated' } });
    assert.equal((await db.doc(`classes/${teacher.uid}/students/${id}`).get()).data().firstName, 'Fictional');
    assert.equal((await db.doc(runPath).get()).exists, true, 'editing preserves the existing progress record');
    // A new device may choose that name but cannot retrieve this prior session.
    const third = await account('third'); await call(third, 'joinClass', { code });
    await call(third, 'selectStudent', { studentId: id });
    await assert.rejects(() => call(third, 'recordAnswer', { runId, word: 'rich', answer: 'ch', hinted: false, requestId: 'stolen2' }));
    const rotated = await call(teacher, 'rotateClassCode'); assert.notEqual(rotated.code, code);
    await assert.rejects(() => call(child, 'beginRun'));
    await assert.rejects(() => call(third, 'joinClass', { code }));
    await call(teacher, 'manageStudents', { action: 'remove', studentId: id });
    assert.equal((await db.doc(runPath).get()).exists, false);
    assert.equal((await db.doc(`classes/${teacher.uid}/students/${id}`).get()).exists, false);
    // Losing the teacher allowlist grant immediately closes reads and functions.
    await db.doc(`teachers/${teacher.uid}`).delete();
    await assertFails(getDoc(doc(teacherDb, `classes/${teacher.uid}`)));
    await assert.rejects(() => call(teacher, 'getDashboard'));
    console.log('Verified rules and actual callable endpoints with two teachers and three independent student identities.');
  } finally {
    await Promise.all(apps.map(deleteApp)); await env.cleanup();
  }
});
