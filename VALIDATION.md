# Validation of the classroom update

All test accounts, names, and projects were fictional. No Firebase production
project was configured, no app deployed, and no billing account enabled.

| Check | Result |
| --- | --- |
| Roster and scoring unit tests | 6 passed; 0 failed/skipped |
| Real Auth, Firestore, and Functions emulator security suite | Passed with independent teachers and children |
| Offline, self-contained demo browser test | Passed; no asset requests or uncaught JavaScript errors |
| Firebase browser integration test | Passed; a second teacher browser reads the saved student result |
| Demo and configured Firebase builds | Passed; production Firebase build used fictional public configuration only |
| Hosting configuration guard | Correctly rejected missing configuration/demo mode |
| JavaScript syntax and Git whitespace checks | Passed |
| Production dependency audit, frontend and Functions | 0 reported vulnerabilities at verification time |

The security suite tests unapproved and unverified teachers, anonymous access,
cross-teacher and cross-student reads, direct Firestore writes, choosing the
same student name from a different identity, score/word spoofing, duplicate
submission retries, 22-student capacity, edit preserving progress, recursive
deletion, classroom-code rotation, and immediate revocation of teacher grants.

Browser coverage includes the 22 daisy buttons and duplicate-name labels,
wrong codes, all six phonics words, hints and wrong answers, choice and typing
controls, the sentence, rewards and celebration, teacher sign-in, bulk import,
edit/removal, phone layout, and a script-enabled opaque preview frame. Firebase
coverage includes a failed answer save followed by an idempotent retry, plus
cross-browser persistence with no teacher login in the student browser.

## Test environment details

Host Node was 24.19.0; Functions target Node 22 for deployment. Firestore was
Google's official Cloud SDK emulator 1.22.0 with Java 21, using its supported
classpath entry point and rules flag. The Cloud SDK component archive's SHA-256
was verified against Google's official component manifest. The Firebase CLI's
usual emulator download host was unavailable in this cloud environment, so the
SDK distribution was used without altering checksums or disabling TLS checks.
Auth and Functions used Firebase CLI 15.34.0 with the external local Firestore
host explicitly configured. All used `demo-daisy-sounds`. Expected emulator
warnings about host Node/runtime mismatch and the separately started Firestore
instance did not prevent the actual rule and callable tests from executing.

The root dependency override pins patched `@grpc/grpc-js` 1.14.6 because the
Firebase SDK's Node Firestore dependency range otherwise selected an older
release with published advisories. The browser application uses Auth and
Functions; Firestore Node APIs are exercised by the security tests.

## Still required before a real classroom

Production teacher provisioning, email verification delivery, App Check,
authorized domains, actual HTTPS Hosting, school-approved data location, and
cross-device testing against the real project have not been performed.
Emulators deliberately skip App Check and require no billing. Online Functions
deployment needs an approved billing plan; no such approval was assumed.
Use the setup guide and fictional data for those checks before any real roster.
