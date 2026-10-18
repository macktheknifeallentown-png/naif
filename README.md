# Daisy Sounds — Grade 1 Phonics Garden

A colorful browser game for **rich, such, catch, patch**, with **lunch** and
**bench** and the sentence “I have lunch on the bench.” Pictures, English speech,
big buttons, hints, unlimited retries, and six daisy rewards help beginning readers.

## Try it with fictional students

1. Open **[preview/index.html](preview/index.html)** on GitHub.
2. Click **Download raw file** (the down arrow), save it, and open it in Chrome.
3. Press **Let’s play**, enter **FLOWER22**, and choose a daisy name.
4. Use **Teacher → Try the fictional dashboard** to explore My Students.

This one-file preview includes all styles, pictures, and JavaScript. It uses
**22 fictional names only**. Its teacher page is a public demo; it is not a
private login. Demo edits and scores stay in memory and reset when the page
reloads. Use fictional names only. No server or programming is needed to try it.
If a built-in preview blocks scripts, use the downloaded file in Chrome.

## Private online classroom (prepared, not deployed)

**[Follow the beginner Firebase setup guide](FIREBASE-SETUP.md)** step by step.
Do not enter real students until the actual HTTPS site and access checks pass.
No paid services or deployments have been activated.

- Student code entry and large, colorful daisy name buttons.
- First names only; repeated first names show their family names too.
- Firebase Email/Password teacher login, verified email, and an admin-approved
  teacher account. Anonymous child authentication requires no child emails.
- My Students: paste/import up to 22 names, preview, edit, and permanently remove.
- Individual server-saved sessions, completion dates, first-try scores, attempt
  counts, daisy totals, and words needing practice. The teacher sees the latest
  25 sessions per student; older sessions remain saved.
- Firestore denies all student reads of saved records and all client writes.
  Trusted callable functions gate the picker with a hashed, rotatable code,
  validate scoring, and require owning sessions. Production requires App Check.
- A different teacher cannot read this classroom. A student cannot retrieve
  another session’s scores, even by choosing the same displayed name.

A shared code plus a name picker does not prove who is using the device; it
cannot prevent choosing the wrong name. See **[the security design](SECURITY.md)**.
The real Firebase site needs a trusted backend. Cloud Functions deployment
requires a billing-enabled Firebase plan; approval is required before enabling
billing, paid services, or deployment. The fictional demo and local emulators
need no billing. Do not put a real roster, password, or classroom code in GitHub,
.env files, chat, public source files, or Classera attachments.

## Project files

- `index.html`, `styles.css`, `game.js`: the existing phonics game, extended with
  student screens and saved-answer hooks.
- `classroom.js`, `classroom.css`: name selection and teacher dashboard.
- `demo-api.js`: fictional, memory-only demonstration.
- `firebase-api.js`: Firebase Authentication and callable client.
- `functions/`: trusted backend and shared roster/scoring validation.
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`: private-data rules,
  indexes, emulator settings, and Hosting setup. Hosting serves only `dist/`.
- `preview/index.html`: generated, self-contained fictional demo.
- `tools/build-demo.js`, `tools/build_preview.py`: regenerate the demo/downloads.
- `tests/`: roster/scoring tests, real-emulator authorization tests, and browser
  tests for the demo and Firebase workflows.

The source application now uses Vite and Firebase packages; open the generated
`preview/index.html` for a standalone demo. Developer scripts in `package.json`
cover development, builds, local emulators, and tests. Install both the root and
Functions dependencies using their committed lockfiles. Local emulator tests
use only the `demo-daisy-sounds` project, never a production project. Java 21+
is needed for Firestore tests. Configure CHROMIUM_PATH for browser tests if
Chromium is installed somewhere other than /usr/bin/chromium.

English speech comes from the browser/device and can require an internet
connection. If speech is missing or blocked, the game shows help and keeps
working. Check Listen on the actual classroom devices before independent use.
