import { validateRoster, newRun, applyAnswer, requestId } from './functions/domain.js';

// Entirely fictional. Demo edits/progress live in memory and disappear on reload.
export const FICTIONAL_ROSTER = [
  ['Alanoud', 'Bloom'], ['Alanoud', 'Meadow'], ['Sarah', 'River'], ['Sarah', 'Sunny'],
  ['Yara', 'Petal'], ['Yara', 'Green'], ['Mina', 'Daisy'], ['Lina', 'Clover'],
  ['Nora', 'Fern'], ['Hana', 'Rose'], ['Maya', 'Spring'], ['Lily', 'Garden'],
  ['Ella', 'Leaf'], ['Zoe', 'Poppy'], ['Ava', 'Brook'], ['Ruby', 'Sky'],
  ['Ivy', 'Tulip'], ['Aria', 'Rain'], ['Emma', 'Willow'], ['Isla', 'Sun'],
  ['Sara', 'Pearl'], ['Mila', 'Mint']
].map(([firstName, familyName], i) => ({ id: `fictional-${i + 1}`, firstName, familyName }));

export function createDemoApi() {
  let students = validateRoster(structuredClone(FICTIONAL_ROSTER)).map(s => ({ ...s, runs: [] }));
  let selected; let run; let teacher = false; let joined = false;
  return {
    demo: true,
    async login() { teacher = true; selected = null; joined = false; },
    async logout() { teacher = false; selected = null; joined = false; run = null; },
    async dashboard() { if (!teacher) throw new Error('Open the fictional teacher dashboard first.'); return { classroom: { active: true }, students: structuredClone(students) }; },
    async rotate() { if (!teacher) throw new Error('Teacher only.'); return { code: 'FLOWER22' }; },
    async manage(data) {
      if (!teacher) throw new Error('Teacher only.');
      if (data.action === 'import') students = validateRoster([...students, ...data.rows.map(row => ({ ...row, id: requestId(), runs: [] }))]);
      if (data.action === 'edit') students = validateRoster(students.map(s => s.id === data.studentId ? { ...s, ...data.row } : s));
      if (data.action === 'remove') students = validateRoster(students.filter(s => s.id !== data.studentId));
    },
    async join(code) {
      if (code.trim().toUpperCase() !== 'FLOWER22') throw new Error('That code did not work. Try FLOWER22 in the fictional demo.');
      joined = true;
      return { students: students.map(({ id, displayName }) => ({ id, displayName })) };
    },
    async select(studentId) {
      if (!joined) throw new Error('Enter the classroom code first.');
      selected = students.find(s => s.id === studentId);
      if (!selected) throw new Error('Choose a name again.');
      return { displayName: selected.displayName };
    },
    async begin() {
      if (!selected) throw new Error('Choose your daisy first.');
      run = { ...newRun('fictional-device', 'fictional-class', selected.id, new Date().toISOString()), id: requestId() };
      selected.runs.unshift(run);
      return { runId: run.id };
    },
    async answer(input) {
      const result = applyAnswer(run, input, new Date().toISOString());
      Object.assign(run, result.run);
      return result.response;
    },
    async finish() { run.status = 'completed'; run.completedAt = new Date().toISOString(); return { saved: true }; }
  };
}
