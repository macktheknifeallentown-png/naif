const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { chromium } = require('playwright');
const firebaseMode = process.argv.includes('--firebase');
const endings = ['ch', 'ch', 'tch', 'tch', 'ch', 'ch'];
const root = require('node:path').resolve(__dirname, '..');
let browser, server;
async function game(page, start = 0) {
  await page.locator('#practice').waitFor({ state: 'visible' });
  for (let i = start; i < 6; i++) {
    assert.equal(await page.locator('#progress-label').textContent(), `Word ${i + 1} of 6`);
    assert.equal(await page.locator('#picture svg').count(), 1);
    if (i === 0) {
      await page.locator('[data-ending="tch"]').click();
      await page.locator('#feedback').filter({ hasText: 'Try again' }).waitFor();
    }
    if (i === 1) await page.locator('#hint').click();
    if (i % 2) {
      await page.locator('#type-mode').click();
      await page.locator('#ending-input').fill(endings[i].toUpperCase());
      if (i === 3) await page.locator('#ending-input').press('Enter');
      else await page.locator('#check-ending').click();
    } else {
      await page.locator('#choose-mode').click();
      await page.locator(`[data-ending="${endings[i]}"]`).click();
    }
    await page.locator('#feedback').filter({ hasText: 'Great job' }).waitFor();
    assert.equal(await page.locator('#garden-count').textContent(), `🌼 ${i + 1} / 6`);
    await page.locator('#next').click();
  }
  assert.equal(await page.locator('.sentence').textContent(), 'I have lunch on the bench.');
  await page.locator('#finish').click();
  await page.locator('#celebration').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.reward-garden span').count(), 6);
}
async function join(page, code, name) {
  await page.locator('#start').click();
  await page.locator('#class-code').fill(code);
  await page.locator('#join-class').click();
  await page.getByRole('button', { name, exact: true }).click();
  await page.locator('#practice').waitFor({ state: 'visible' });
}
async function main() {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  if (!firebaseMode) {
    const context = await browser.newContext({ offline: true, viewport: { width: 1280, height: 1000 } });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    const requests = []; page.on('request', r => requests.push(r.url()));
    const html = fs.readFileSync(root + '/preview/index.html', 'utf8');
    await page.setContent(html);
    await page.locator('#mode-notice').filter({ hasText: 'Fictional demo' }).waitFor();
    assert.equal(await page.locator('#start').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(40, 112, 79)');
    await page.locator('#start').click();
    await page.locator('#class-code').fill('wrong'); await page.locator('#join-class').click();
    await page.locator('#app-status').filter({ hasText: 'did not work' }).waitFor();
    await page.locator('#class-code').fill('FLOWER22'); await page.locator('#join-class').click();
    assert.equal(await page.locator('.student-daisy').count(), 22);
    assert.equal(await page.getByRole('button', { name: 'Alanoud Bloom', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Sarah River', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Yara Petal', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Mina', exact: true }).count(), 1);
    await page.screenshot({ path: '/tmp/daisy-student-picker.png', fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '/tmp/daisy-student-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Sarah River', exact: true }).click();
    await game(page);
    await page.locator('#teacher-link').click(); await page.locator('#demo-teacher').click();
    const card = page.locator('.student-record').filter({ has: page.getByRole('heading', { name: 'Sarah River', exact: true }) });
    assert.match(await card.textContent(), /4\/6.*7 attempts/);
    assert.match(await card.textContent(), /rich/); assert.match(await card.textContent(), /such/);
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.screenshot({ path: '/tmp/daisy-teacher-dashboard.png', fullPage: true });
    await page.getByRole('button', { name: 'Edit Mina', exact: true }).click();
    await page.locator('#edit-first').fill('Mimi'); await page.locator('#save-roster').click();
    await page.getByRole('heading', { name: 'Mimi', exact: true }).waitFor();
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Remove Mimi', exact: true }).click();
    await page.getByRole('heading', { name: 'Mimi', exact: true }).waitFor({ state: 'detached' });
    await page.locator('#add-students').click(); await page.locator('#roster-text').fill('Nina,Testflower');
    await page.locator('#preview-roster').click(); await page.locator('#import-preview').filter({ hasText: 'Nina' }).waitFor();
    await page.locator('#roster-file').setInputFiles({ name: 'fictional.csv', mimeType: 'text/csv', buffer: Buffer.from('firstName,familyName\nNina,Testflower') });
    await page.locator('#preview-roster').click(); await page.locator('#import-preview').filter({ hasText: 'Nina' }).waitFor();
    await page.locator('#save-roster').click(); await page.getByRole('heading', { name: 'Nina', exact: true }).waitFor();
    assert.equal(await page.locator('.student-record').count(), 22);
    await page.locator('#teacher-signout').click();
    await join(page, 'FLOWER22', 'Nina');
    await page.locator('#change-student').click();
    assert.equal(await page.locator('#access-screen').isVisible(), true);
    // The same file must work in an opaque, script-enabled embedded preview.
    const embedded = await context.newPage(); embedded.on('pageerror', e => errors.push(e.message));
    await embedded.setContent('<iframe sandbox="allow-scripts" style="width:100%;height:1500px"></iframe>');
    await embedded.locator('iframe').evaluate((f, content) => f.srcdoc = content, html);
    const frame = embedded.frameLocator('iframe');
    await frame.locator('#mode-notice').filter({ hasText: 'Fictional demo' }).waitFor();
    await join(frame, 'FLOWER22', 'Mina');
    await frame.locator('[data-ending="ch"]').click();
    await frame.locator('#feedback').filter({ hasText: 'Great job' }).waitFor();
    assert.deepEqual(requests, []); assert.deepEqual(errors, []);
    console.log('PASS: offline single-file demo, 22 daisy buttons, duplicate names, complete game, dashboard metrics, edit/remove/import, mobile, and sandboxed preview.');
    await context.close(); return;
  }
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  const req = createRequire(root + '/functions/package.json');
  const { initializeApp } = req('firebase-admin/app'); const { getAuth } = req('firebase-admin/auth'); const { getFirestore } = req('firebase-admin/firestore');
  const admin = initializeApp({ projectId: 'demo-daisy-sounds' }, 'browser-seed');
  const email = `fictional-teacher-${Date.now()}@example.test`, password = 'Fictional-browser-password-42';
  const teacher = await getAuth(admin).createUser({ email, password, emailVerified: true });
  await getFirestore(admin).doc('teachers/' + teacher.uid).set({ enabled: true });
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175', '--strictPort'], { cwd: root, env: { ...process.env, VITE_APP_MODE: 'firebase', VITE_USE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: 'demo-daisy-sounds' }, stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch('http://127.0.0.1:5175')).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); }
  assert(ready, 'emulator web app started');
  const teacherContext = await browser.newContext(); const teacherPage = await teacherContext.newPage(); teacherPage.on('pageerror', e => errors.push(e.message));
  async function login(page) {
    await page.goto('http://127.0.0.1:5175'); await page.locator('#teacher-link').click();
    await page.locator('#teacher-email').fill(email); await page.locator('#teacher-password').fill(password);
    await page.locator('#teacher-signin').click(); await page.locator('#teacher-dashboard').waitFor({ state: 'visible' });
  }
  await login(teacherPage); await teacherPage.locator('#rotate-code').click();
  await teacherPage.locator('#classroom-code-output').filter({ hasText: 'Classroom code:' }).waitFor();
  const code = (await teacherPage.locator('#classroom-code-output').textContent()).match(/Classroom code: ([A-Z2-9]+)/)[1];
  await teacherPage.locator('#add-students').click();
  await teacherPage.locator('#sample-roster').click(); await teacherPage.locator('#preview-roster').click();
  await teacherPage.locator('#save-roster').click();
  await teacherPage.locator('#dashboard-summary').filter({ hasText: '22 / 22' }).waitFor();
  const childContext = await browser.newContext(); const childPage = await childContext.newPage(); childPage.on('pageerror', e => errors.push(e.message));
  await childPage.goto('http://127.0.0.1:5175'); await join(childPage, code, 'Alanoud Bloom');
  // No success/reward may be shown until the answer is saved. Then retry the
  // same request after a simulated lost connection without counting it twice.
  await childPage.route('**/us-central1/recordAnswer', route => route.abort('failed'));
  await childPage.locator('[data-ending="ch"]').click();
  await childPage.locator('#feedback').filter({ hasText: 'not saved yet' }).waitFor();
  assert.equal(await childPage.locator('#garden-count').textContent(), '🌼 0 / 6');
  await childPage.unroute('**/us-central1/recordAnswer');
  await childPage.locator('[data-ending="ch"]').click();
  await childPage.locator('#feedback').filter({ hasText: 'Great job' }).waitFor();
  await childPage.locator('#next').click();
  await game(childPage, 1);
  await teacherPage.locator('#refresh-dashboard').click();
  const card = teacherPage.locator('.student-record').filter({ has: teacherPage.getByRole('heading', { name: 'Alanoud Bloom', exact: true }) });
  await card.filter({ hasText: 'Completed' }).waitFor();
  // Initial failed ch request is retried first; it was not a wrong attempt.
  assert.match(await card.textContent(), /5\/6.*6 attempts/);
  const secondContext = await browser.newContext(); const secondTeacher = await secondContext.newPage();
  await login(secondTeacher);
  assert.match(await secondTeacher.locator('.student-record').filter({ has: secondTeacher.getByRole('heading', { name: 'Alanoud Bloom', exact: true }) }).textContent(), /Completed/);
  assert.deepEqual(errors, []);
  console.log('PASS: Firebase teacher login, 22-name import, anonymous student session, network retry, saved progress, and independent second-device teacher login reads the same Firestore record.');
  await teacherContext.close(); await childContext.close(); await secondContext.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (server) server.kill('SIGTERM'); });
