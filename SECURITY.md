# Classroom authorization design

This repository contains fictional sample names only. Real rosters and scores
belong in Firestore, entered from the authenticated dashboard after live checks.

## Trust boundaries

- `teachers/{uid}`: owner-managed allowlist, boolean `enabled`. Client reads and
  writes are denied. Teacher endpoints require this grant, verified email,
  and Email/Password authentication. No public signup grants teacher rights.
- `classes/{teacherUid}` and nested `students/{id}/runs/{id}`: teacher-only reads;
  all client writes denied. Admin SDK callable functions validate every change.
- `accessCodes/{sha256}`: server-only index for random 10-character codes (50
  bits); raw codes are returned once to the teacher and never saved in source
  or localStorage. Per-UID and per-network join throttles expire after 15 minutes.
- `classVisitors/{anonymousUid}`: code-gated permission to select a name, valid
  for 15 minutes. Join returns only `{id, displayName}`, never full roster fields,
  progress, teacher email, hashes, or account grants.
- `studentSessions/{anonymousUid}`: one selected name, class version, 4-hour
  expiry. Every student operation rechecks the class version and student active
  status. Code rotation invalidates all previous visitors and sessions.
- Students cannot read Firestore records, including their selected name's past
  results. Current-run callable results require the session and owning anonymous
  UID. A second device selecting the same name cannot access the first run.
- Ordered answers, hints, attempt limits, and first-try scores are validated
  server-side. Timestamps are server-generated. The last request ID makes a lost
  answer response safe to retry once rather than adding another attempt. A
  completion is saved only after all six words; the client cannot submit a score.
- Production Functions require Firebase App Check. Emulators skip App Check
  only when Firebase sets `FUNCTIONS_EMULATOR=true`. Hosting builds reject demo
  project IDs, missing App Check configuration, and emulator mode.
- The fictional demonstration stores everything in JavaScript memory. Its
  teacher page is deliberately public and visibly labeled as a demonstration.
  It is not an authentication boundary and must never hold real names.

## Boundaries and operations

The shared code/name picker does not authenticate a child's real identity.
It protects scores from disclosure but cannot prevent wrong-name attribution.
Unique student credentials would be required to address that separately.

The teacher controls one class of up to 22 students. Imports add students
without replacing existing IDs. Repeated first names must have family names;
display labels are recalculated transactionally. Deletion first makes a
student inactive, then recursively deletes its progress and name. If cleanup
is interrupted, the student stays inactive and the teacher can retry removal;
project administrators can finish cleanup with the Admin SDK. Backup retention
is a separate project policy. Rate-limit/session docs have expiry checks but
are not automatically deleted; add an approved retention policy if required.

No server credentials, real roster, tokens, or passwords should be committed.
`.env.local`, private data, Firebase logs, dependencies, and compiled Hosting
output are ignored. Public Firebase web config is not a server secret. The
functions/ directory is deployed only as backend code; Hosting serves dist/.

Local tests cover two teachers, three child identities, direct rule bypasses,
missing grants, ownership, code rotation, spoofed scoring, deletion, and a
second teacher-browser session reading saved results. Production App Check,
authorized domains, billing controls, and cross-device HTTPS behavior require
verification in the actual school-approved project before real names are added.
