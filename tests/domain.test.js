import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoster, validateRoster, newRun, applyAnswer, WORDS, ENDINGS } from '../functions/domain.js';
import { FICTIONAL_ROSTER } from '../demo-api.js';

test('22 fictional students: duplicate first names use family names, others stay short', () => {
  const roster = validateRoster(FICTIONAL_ROSTER);
  assert.equal(roster.length, 22);
  assert.equal(roster[0].displayName, 'Alanoud Bloom');
  assert.equal(roster[2].displayName, 'Sarah River');
  assert.equal(roster[4].displayName, 'Yara Petal');
  assert.equal(roster[6].displayName, 'Mina');
});
test('imports full-name lines, CSV headers, quotes, and spreadsheet tabs', () => {
  assert.equal(parseRoster('Mina Bloom\nLina River')[1].familyName, 'River');
  assert.equal(parseRoster('\uFEFFfirstName,familyName\r\n"Mina","Bloom"')[0].firstName, 'Mina');
  assert.equal(parseRoster('Mina\tBloom')[0].familyName, 'Bloom');
});
test('rejects overflow, ambiguous duplicate names, markup, and malformed CSV', () => {
  assert.throws(() => validateRoster([...FICTIONAL_ROSTER, { firstName: 'Extra' }]));
  assert.throws(() => parseRoster('Sarah\nSarah River'));
  assert.throws(() => parseRoster('Sarah Bloom\nSarah Bloom'));
  assert.throws(() => parseRoster('<img onerror=x>'));
  assert.throws(() => parseRoster('"Mina,Bloom'));
});
test('renaming or removing a duplicate recalculates labels without changing IDs', () => {
  const roster = validateRoster(FICTIONAL_ROSTER.filter(s => s.id !== 'fictional-2'));
  assert.equal(roster[0].id, 'fictional-1'); assert.equal(roster[0].displayName, 'Alanoud');
});
test('scores server-side, records wrong/hinted words and ignores duplicate submissions', () => {
  let run = newRun('owner', 'class', 'student', 'start');
  const wrong = { word: 'rich', answer: 'tch', hinted: false, requestId: 'first' };
  run = applyAnswer(run, wrong, 'now').run;
  assert.equal(run.wordIndex, 0); assert.equal(run.firstTryScore, 0);
  const retry = applyAnswer(run, wrong, 'later');
  assert.equal(retry.run.attempts.length, 1);
  for (let i = 0; i < 6; i++) run = applyAnswer(run, { word: WORDS[i], answer: ENDINGS[i], hinted: i === 1, requestId: 'correct' + i }, 'answer').run;
  assert.equal(run.status, 'words-done'); assert.equal(run.daisies, 6);
  assert.equal(run.firstTryScore, 4); assert.equal(run.attempts.length, 7);
  assert.deepEqual(run.practiceWords, ['rich', 'such']); assert.equal(run.completedAt, null);
});
test('cannot skip words, submit invented answers, or exceed a bounded attempt log', () => {
  const run = newRun('owner', 'class', 'student', 'start');
  assert.throws(() => applyAnswer(run, { word: 'patch', answer: 'tch', hinted: false, requestId: 'x' }, 'now'));
  assert.throws(() => applyAnswer(run, { word: 'rich', answer: '<x>', hinted: false, requestId: 'x' }, 'now'));
  run.attempts = Array(120).fill({ word: 'rich' });
  assert.throws(() => applyAnswer(run, { word: 'rich', answer: 'ch', hinted: false, requestId: 'x' }, 'now'));
});
