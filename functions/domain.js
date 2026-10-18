export const MAX_STUDENTS = 22;
export const WORDS = ['rich', 'such', 'catch', 'patch', 'lunch', 'bench'];
export const ENDINGS = ['ch', 'ch', 'tch', 'tch', 'ch', 'ch'];

// randomUUID is unavailable in some opaque preview frames. getRandomValues
// remains available there and supplies the same 128 bits without a network call.
export function requestId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
}

export function cleanName(value) {
  if (typeof value !== 'string') throw new Error('Enter a name.');
  const name = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{M}][\p{L}\p{M} '\u2019.-]{0,79}$/u.test(name)) throw new Error('Names must contain letters, spaces, apostrophes, dots, or hyphens (up to 80 characters).');
  return name;
}

export function normalizeStudent(row) {
  const firstName = cleanName(row.firstName);
  if (firstName.includes(' ')) throw new Error('Put the first name in the first box and remaining names in the family name box.');
  const familyName = row.familyName?.trim() ? cleanName(row.familyName) : '';
  return { firstName, familyName };
}
const key = row => `${row.firstName} ${row.familyName}`.trim().toLocaleLowerCase('en');
export function validateRoster(rows) {
  if (!Array.isArray(rows) || rows.length > MAX_STUDENTS) throw new Error('This classroom has space for 22 students.');
  const normalized = rows.map(row => ({ ...row, ...normalizeStudent(row) }));
  const seen = new Set();
  const counts = new Map();
  for (const row of normalized) {
    if (seen.has(key(row))) throw new Error('Two students have the same full name. Add a family or middle name to tell them apart.');
    seen.add(key(row));
    const first = row.firstName.toLocaleLowerCase('en');
    counts.set(first, (counts.get(first) || 0) + 1);
  }
  for (const row of normalized) {
    if (counts.get(row.firstName.toLocaleLowerCase('en')) > 1 && !row.familyName) throw new Error(`Add a family name for each student named ${row.firstName}.`);
  }
  return normalized.map(row => ({ ...row, displayName: counts.get(row.firstName.toLocaleLowerCase('en')) > 1 ? `${row.firstName} ${row.familyName}` : row.firstName }));
}

// One full name per line, or two-column CSV/TSV: firstName,familyName.
export function parseRoster(text) {
  if (typeof text !== 'string' || text.length > 40000) throw new Error('Use a small text or CSV file (under 40 KB).');
  const rows = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  const result = rows.map(line => {
    const cells = []; let cell = ''; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"' && quoted) { cell += '"'; i++; }
      else if (c === '"') quoted = !quoted;
      else if ((c === ',' || c === '\t') && !quoted) { cells.push(cell.trim()); cell = ''; }
      else cell += c;
    }
    if (quoted) throw new Error('A CSV row has an unclosed quote.');
    cells.push(cell.trim());
    if (cells.length > 2) throw new Error('Use one full name per line, or two CSV columns: first name, family name.');
    if (cells.length === 2) return { firstName: cells[0], familyName: cells[1] };
    const [firstName, ...rest] = cells[0].split(/\s+/);
    return { firstName, familyName: rest.join(' ') };
  });
  if (result[0] && /^first\s*name$/i.test(result[0].firstName) && /^(family\s*name|last\s*name)$/i.test(result[0].familyName)) result.shift();
  if (!result.length) throw new Error('Add at least one fictional name to try the import.');
  return validateRoster(result);
}

export function newRun(ownerUid, classId, studentId, now) {
  return { ownerUid, classId, studentId, createdAt: now, updatedAt: now, completedAt: null, status: 'playing', wordIndex: 0, attempts: [], firstTryScore: 0, practiceWords: [], daisies: 0 };
}

export function applyAnswer(run, input, now) {
  if (run.lastRequestId === input.requestId) return { run, response: run.lastResponse };
  if (run.status !== 'playing' || WORDS[run.wordIndex] !== input.word) throw new Error('This word is not the next word in this game.');
  if (typeof input.answer !== 'string' || !/^[a-z]{0,3}$/.test(input.answer) || typeof input.hinted !== 'boolean') throw new Error('Choose or type a short ending.');
  if (run.attempts.length >= 120) throw new Error('This game has reached its attempt limit. Start a new game.');
  const correct = input.answer === ENDINGS[run.wordIndex];
  const previous = run.attempts.filter(a => a.word === input.word);
  const attempts = [...run.attempts, { word: input.word, answer: input.answer, correct, hinted: input.hinted, at: now }];
  const practiceWords = [...new Set([...run.practiceWords, ...(!correct || input.hinted ? [input.word] : [])])];
  const index = run.wordIndex + (correct ? 1 : 0);
  const score = run.firstTryScore + (correct && !previous.length && !input.hinted ? 1 : 0);
  const response = { correct, daisies: index, firstTryScore: score };
  return { run: { ...run, updatedAt: now, attempts, practiceWords, wordIndex: index, daisies: index, firstTryScore: score, status: index === WORDS.length ? 'words-done' : 'playing', lastRequestId: input.requestId, lastResponse: response }, response };
}
