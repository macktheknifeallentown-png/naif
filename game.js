'use strict';

const words = [
  { word: 'rich', stem: 'ri', ending: 'ch', picture: 'money', label: 'A money bag and gold coins', context: 'Lots of money!', spoken: 'Rich. Lots of money. Rich.' },
  { word: 'such', stem: 'su', ending: 'ch', picture: 'cake', label: 'A big birthday cake with candles', context: 'Such a big cake!', spoken: 'Such. Such a big cake! Such.' },
  { word: 'catch', stem: 'ca', ending: 'tch', picture: 'catch', label: 'A girl catching a ball in her hands', context: 'Catch the ball!', spoken: 'Catch. Catch the ball! Catch.' },
  { word: 'patch', stem: 'pa', ending: 'tch', picture: 'pants', label: 'Blue pants with a stitched yellow patch on one knee', context: 'A patch on my pants.', spoken: 'Patch. A patch on my pants. Patch.' },
  { word: 'lunch', stem: 'lun', ending: 'ch', picture: 'lunch', label: 'Lunch with a sandwich, an apple, and a drink', context: 'Time to eat!', spoken: 'Lunch. Time to eat! Lunch.' },
  { word: 'bench', stem: 'ben', ending: 'ch', picture: 'bench', label: 'A wooden park bench', context: 'A place to sit.', spoken: 'Bench. A place to sit. Bench.' }
];

// Original inline drawings keep the game usable without image downloads.
const drawings = {
  money: `<path d="M79 40 65 15l31 6 17-9 20 8-15 23" fill="#e9b553"/><path d="M76 43C59 61 37 87 48 121c9 27 87 29 105 1 15-26-10-62-32-79Z" fill="#f4c96d"/><path d="m76 43 45 0" stroke="#7a6133" stroke-width="6" stroke-linecap="round"/><text x="99" y="108" text-anchor="middle" font-size="51" font-family="Arial" font-weight="bold" fill="#6d5735">$</text><g fill="#ffdb67" stroke="#bd9138" stroke-width="2"><ellipse cx="151" cy="136" rx="22" ry="8"/><ellipse cx="151" cy="128" rx="22" ry="8"/><ellipse cx="166" cy="116" rx="18" ry="7"/></g>`,
  cake: `<path d="M42 126v-51h116v51" fill="#f0aaa9"/><path d="M42 83q10 21 20 0 10 21 20 0 10 21 20 0 10 21 20 0 10 21 20 0 9 15 16 0v-12H42Z" fill="#fff7e1"/><rect x="57" y="48" width="86" height="25" rx="7" fill="#efc873"/><path d="M57 53q13 13 25 0 13 13 25 0 18 13 36 0" fill="none" stroke="#fff7e1" stroke-width="8"/><g stroke="#548d89" stroke-width="6"><path d="M76 49V33m24 16V26m24 23V33"/></g><g fill="#e9a43c"><path d="M76 32q-10-8 0-18 10 10 0 18m24-7q-10-8 0-18 10 10 0 18m24 7q-10-8 0-18 10 10 0 18"/></g><path d="M29 129h142" stroke="#537f6c" stroke-width="7" stroke-linecap="round"/><g fill="#d16c78"><circle cx="64" cy="110" r="4"/><circle cx="101" cy="110" r="4"/><circle cx="137" cy="110" r="4"/></g>`,
  catch: `<path d="M63 59Q38 12 80 15q38-9 36 39l-9 30H63Z" fill="#554133"/><path d="m51 130 10-42q15-15 38-2l18 44" fill="#dd8290"/><path d="m68 130-4 18m35-18 6 18" stroke="#375e65" stroke-width="12" stroke-linecap="round"/><circle cx="82" cy="52" r="25" fill="#c68e66"/><path d="M58 43q4-34 40-19l11 21q-26-1-31-13-4 14-20 11" fill="#554133"/><circle cx="74" cy="52" r="2.3" fill="#302e2b"/><circle cx="91" cy="52" r="2.3" fill="#302e2b"/><path d="M77 63q7 7 13-1" stroke="#713f39" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="m99 91 29-19 11-17m-77 35 46-14 25-22" stroke="#c68e66" stroke-width="11" stroke-linecap="round" fill="none"/><circle cx="145" cy="39" r="23" fill="#edaf50"/><path d="M123 36q24-3 40 13M143 17q-9 23 4 44" stroke="#bc7338" stroke-width="2" fill="none"/><path d="m172 15 10-6m-7 23 13-1" stroke="#7d9e88" stroke-width="3" stroke-linecap="round"/>`,
  pants: `<path d="M51 17h97l-4 59 7 70-43 2-10-63-9 63H46l8-72Z" fill="#739fc3" stroke="#466f91" stroke-width="3"/><path d="M52 31h95M99 18v64M61 33q0 24-10 27m84-27q-1 23 10 27" fill="none" stroke="#466f91" stroke-width="3"/><circle cx="99" cy="25" r="3" fill="#f6d16c"/><rect x="108" y="85" width="35" height="39" rx="4" fill="#f1cb6d" transform="rotate(-7 125 105)"/><rect x="111" y="88" width="29" height="33" rx="2" fill="none" stroke="#9b7631" stroke-width="2" stroke-dasharray="4 3" transform="rotate(-7 125 105)"/>`,
  lunch: `<rect x="28" y="63" width="146" height="77" rx="17" fill="#91b6a0"/><rect x="36" y="71" width="130" height="59" rx="12" fill="#e7edcf"/><path d="m45 112 43-62 40 62Z" fill="#f2d7a0" stroke="#c69854" stroke-width="4" stroke-linejoin="round"/><path d="m51 108 37-46 32 46" fill="none" stroke="#8aaa55" stroke-width="5"/><path d="m60 99 28-32 24 32" fill="none" stroke="#db8c72" stroke-width="4"/><path d="M126 83c-18-17-30 5-22 23 9 19 17 9 21 11 19 8 33-43 1-34" fill="#da7871"/><path d="m124 83 3-13" stroke="#6b6542" stroke-width="4"/><path d="M126 75q8-16 19-7-6 10-19 7" fill="#5c9261"/><path d="m143 51 5-23 14 4" fill="none" stroke="#7f9eac" stroke-width="4"/><path d="M132 43h31l-4 46h-22Z" fill="#f2bc62"/><path d="M137 48h21" stroke="#fff1c7" stroke-width="3"/>`,
  bench: `<path d="M35 141q62-12 131 0" stroke="#b1c99a" stroke-width="9" stroke-linecap="round"/><g stroke="#47675d" stroke-width="7" stroke-linecap="round"><path d="M54 49v83m92-83v83m-94-32-8 38m102-38 9 38"/></g><g fill="#c68d57" stroke="#9d6b40" stroke-width="2"><rect x="34" y="39" width="131" height="19" rx="4"/><rect x="34" y="63" width="131" height="19" rx="4"/><path d="m35 90 129 0 11 18H25Z"/></g><path d="M31 83v17m137-17v17" stroke="#47675d" stroke-width="6" stroke-linecap="round"/>`
};

const $ = id => document.getElementById(id);
let current = 0;
let earned = 0;
let solved = false;
let mode = 'choose';
let speechTimer;
let hinted = false;
let answerPending = false;
let gameVersion = 0;

function picture(name, label) {
  return `<svg viewBox="0 0 200 160" role="img" aria-label="${label}"><ellipse cx="100" cy="84" rx="89" ry="72" fill="#f0f1e1"/>${drawings[name]}</svg>`;
}

function speak(text) {
  const status = $('audio-status');
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    status.textContent = 'Sound is not available in this browser. Read the words, or ask a grown-up to help you listen.';
    return;
  }
  clearTimeout(speechTimer);
  status.textContent = '';
  const unavailable = () => { status.textContent = 'No sound? Turn up your volume and try Listen. If it is still quiet, ask a grown-up for help.'; };
  // Embedded previews may expose speech APIs but refuse calls to them.
  // Listening is optional: a restricted voice must never stop the game.
  try {
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(text);
    message.lang = 'en-US';
    message.rate = 0.78;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-US') || voices.find(v => /^en[-_]/i.test(v.lang));
    if (voice) message.voice = voice;
    message.onstart = () => clearTimeout(speechTimer);
    message.onerror = event => {
      clearTimeout(speechTimer);
      if (!['canceled', 'interrupted'].includes(event.error)) unavailable();
    };
    speechTimer = setTimeout(unavailable, 5000);
    window.speechSynthesis.speak(message);
  } catch {
    clearTimeout(speechTimer);
    unavailable();
  }
}

function showScreen(id) {
  if (!['practice', 'sentence-screen', 'celebration'].includes(id)) gameVersion++;
  for (const screen of document.querySelectorAll('.screen')) screen.hidden = screen.id !== id;
  window.scrollTo({ top: 0, behavior: 'instant' });
  const heading = $(id).querySelector('h1');
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function renderWord() {
  const item = words[current];
  solved = false;
  hinted = false;
  answerPending = false;
  $('progress-label').textContent = `Word ${current + 1} of ${words.length}`;
  $('garden-count').textContent = `🌼 ${earned} / ${words.length}`;
  $('progress-fill').style.width = `${earned / words.length * 100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', earned);
  $('round-kind').textContent = current < 4 ? 'SPELLING WORD' : 'SENTENCE WORD';
  $('picture').innerHTML = picture(item.picture, item.label);
  $('context').textContent = item.context;
  $('word').innerHTML = `<span>${item.stem}</span><span class="gap" aria-hidden="true">?</span>`;
  $('word').setAttribute('aria-label', `${item.stem.split('').join(', ')}, missing ending`);
  $('ending-input').value = '';
  $('ending-input').disabled = false;
  $('typing').querySelector('button').disabled = false;
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('hint').hidden = false;
  $('next').hidden = true;
  $('next').innerHTML = current === words.length - 1 ? 'Read a sentence <span aria-hidden="true">→</span>' : 'Next word <span aria-hidden="true">→</span>';
  document.querySelectorAll('.ending').forEach(button => { button.disabled = false; button.classList.remove('correct'); });
  setMode(mode);
}

function setMode(selected) {
  mode = selected;
  $('choose-mode').setAttribute('aria-pressed', mode === 'choose');
  $('type-mode').setAttribute('aria-pressed', mode === 'type');
  $('choices').hidden = mode !== 'choose';
  $('typing').hidden = mode !== 'type';
  $('answer-instruction').textContent = mode === 'choose' ? 'Choose the ending.' : 'Type ch or tch. Then press Check.';
}

async function checkAnswer(answer) {
  if (solved || answerPending) return;
  answerPending = true;
  const version = gameVersion;
  const item = words[current];
  let result;
  try {
    result = await window.daisyClassroom.answer({ word: item.word, answer: answer.trim().toLowerCase(), hinted });
  } catch (error) {
    if (version !== gameVersion) return;
    $('feedback').className = 'feedback retry';
    $('feedback').textContent = 'Your answer is not saved yet. Check your connection and choose again to retry.';
    answerPending = false;
    return;
  }
  if (version !== gameVersion) return;
  answerPending = false;
  if (!result.correct) {
    $('feedback').className = 'feedback retry';
    $('feedback').textContent = 'Try again! Listen, or show the word.';
    speak(`Try again. The word is ${item.word}.`);
    if (mode === 'type') { $('ending-input').focus(); $('ending-input').select(); }
    return;
  }
  solved = true;
  earned += 1;
  $('word').innerHTML = `<span>${item.stem}</span><span class="filled">${item.ending}</span>`;
  $('word').setAttribute('aria-label', item.word);
  $('feedback').className = 'feedback success';
  $('feedback').textContent = '🌼 Great job! You grew a daisy!';
  $('garden-count').textContent = `🌼 ${earned} / ${words.length}`;
  $('progress-fill').style.width = `${earned / words.length * 100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', earned);
  document.querySelectorAll('.ending').forEach(button => { button.disabled = true; button.classList.toggle('correct', button.dataset.ending === item.ending); });
  $('ending-input').disabled = true;
  $('typing').querySelector('button').disabled = true;
  $('hint').hidden = true;
  $('next').hidden = false;
  speak(`Great job! ${item.word}! You grew a daisy.`);
  // Bring the next step into view on small screens, too.
  $('next').focus();
}

function start() {
  gameVersion++;
  $('finish').disabled = false;
  current = 0;
  earned = 0;
  mode = 'choose';
  renderWord();
  showScreen('practice');
  speak('Let’s play! Listen to the word. Then choose the ending. ' + words[0].spoken);
}

$('start').addEventListener('click', () => document.dispatchEvent(new CustomEvent('daisy:request-play')));
$('home').addEventListener('click', () => {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch { /* A preview can block audio while the rest of the game works. */ }
  clearTimeout(speechTimer);
  $('audio-status').textContent = '';
  showScreen('welcome');
});
$('play-again').addEventListener('click', () => document.dispatchEvent(new CustomEvent('daisy:request-play')));
$('hear-intro').addEventListener('click', () => speak('Let’s grow a daisy garden! C H and T C H can make the same sound. Listen: rich, catch. Listen to each word. Choose or type the missing ending. You can try again, or show the word for help.'));
$('listen-word').addEventListener('click', () => speak(words[current].spoken));
$('choose-mode').addEventListener('click', () => setMode('choose'));
$('type-mode').addEventListener('click', () => { setMode('type'); if (!solved) $('ending-input').focus(); });
document.querySelectorAll('.ending').forEach(button => button.addEventListener('click', () => checkAnswer(button.dataset.ending)));
$('typing').addEventListener('submit', event => { event.preventDefault(); checkAnswer($('ending-input').value); });
// Some embedded viewers forbid form submission, even without a destination.
// Check directly so both the big button and Enter work in those viewers.
$('check-ending').addEventListener('click', () => checkAnswer($('ending-input').value));
$('ending-input').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    checkAnswer(event.currentTarget.value);
  }
});
$('hint').addEventListener('click', () => {
  hinted = true;
  const item = words[current];
  $('feedback').className = 'feedback';
  $('feedback').textContent = `${item.word} — choose ${item.ending}. You can do it!`;
  speak(`${item.word}. The ending is ${item.ending.split('').join(', ')}. Now you try.`);
});
$('next').addEventListener('click', () => {
  if (!solved) return;
  if (current < words.length - 1) {
    current += 1;
    renderWord();
    showScreen('practice');
    speak(words[current].spoken);
  } else {
    showScreen('sentence-screen');
    speak('Let’s read together. I have lunch on the bench.');
  }
});
$('lunch-picture').innerHTML = picture('lunch', words[4].label);
$('bench-picture').innerHTML = picture('bench', words[5].label);
$('listen-sentence').addEventListener('click', () => speak('I have lunch on the bench.'));
$('finish').addEventListener('click', async () => {
  if ($('finish').disabled) return;
  $('finish').disabled = true;
  const version = gameVersion;
  $('save-status').textContent = 'Saving your daisies…';
  try {
    await window.daisyClassroom.finish();
  } catch {
    if (version !== gameVersion) return;
    $('save-status').textContent = 'Not saved yet. Check your connection, then tap See my garden to try again.';
    $('finish').disabled = false;
    return;
  }
  if (version !== gameVersion) return;
  $('finish').disabled = false;
  $('save-status').textContent = '';
  showScreen('celebration');
  speak('Great job, sound explorer! You finished all six words. Your garden is blooming!');
});
$('listen-review').addEventListener('click', () => speak('Rich. Such. Catch. Patch. Lunch. Bench. C H and T C H can make the same sound.'));

export { showScreen, start as startGame };
