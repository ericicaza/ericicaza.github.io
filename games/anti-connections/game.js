import { WORDS, BOARD_ID, MAX_GUESSES, PICK_COUNT } from './data.js?v=3';
import { createGame, submitGuess, restoreGame, getRoundAnswer, explainPair } from './engine.js?v=3';

const $ = (id) => document.getElementById(id);
const storageKey = `erics-arcade:anti-connections:${BOARD_ID}`;
const validIds = (ids, limit) => Array.isArray(ids) && ids.length <= limit
  && new Set(ids).size === ids.length && ids.every(id => Number.isInteger(id) && id >= 0 && id < WORDS.length);
const shuffled = (ids) => {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
let state = createGame();
let selected = [];
let order = shuffled(WORDS.map((_, id) => id));
let pair = [];
let exploredPairs = new Set();
let saved = null;
try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { /* Play also works without storage. */ }
if (saved?.boardId === BOARD_ID && saved.version === 2) {
  state = restoreGame(saved);
  if (validIds(saved.order, WORDS.length) && saved.order.length === WORDS.length) order = saved.order;
  if (state.status === 'playing' && validIds(saved.selected, PICK_COUNT)) selected = saved.selected;
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...state, selected, order }));
    $('storage-note').textContent = 'Your round is saved in this browser.';
  } catch { $('storage-note').textContent = 'Storage is unavailable. Keep this tab open to retain your round.'; }
}
function announce(message, focus = false) {
  $('status').textContent = message;
  if (focus) $('status').focus({ preventScroll: true });
}
function renderBoard(focusId = null) {
  const answer = getRoundAnswer(state);
  const fragment = document.createDocumentFragment();
  for (const id of order) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'word-tile';
    button.dataset.word = id;
    button.textContent = WORDS[id];
    button.setAttribute('aria-pressed', String(!answer && selected.includes(id)));
    button.disabled = Boolean(answer);
    if (answer) {
      const isOutsider = answer.ids.includes(id);
      button.classList.add(isOutsider ? 'is-outsider' : 'is-related');
      const label = document.createElement('span');
      label.className = 'tile-role';
      label.textContent = isOutsider ? 'Outsider' : 'Connected';
      button.append(label);
    }
    button.addEventListener('click', () => {
      if (state.status !== 'playing') return;
      if (selected.includes(id)) selected = selected.filter(value => value !== id);
      else if (selected.length < PICK_COUNT) selected.push(id);
      else { announce('Four words are already selected. Deselect one to choose another.'); return; }
      render(id);
      save();
      announce(selected.length === PICK_COUNT ? 'Four words selected. Ready to submit your guess.' : `${selected.length} of four words selected.`);
    });
    fragment.append(button);
  }
  $('board').replaceChildren(fragment);
  if (focusId !== null) $('board').querySelector(`[data-word="${focusId}"]`)?.focus({ preventScroll: true });
}
function renderAttempts() {
  $('no-attempts').hidden = state.guesses.length > 0;
  $('attempts').replaceChildren(...state.guesses.map((guess, index) => {
    const row = document.createElement('li');
    row.className = 'attempt';
    const number = document.createElement('span');
    number.className = 'attempt-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const words = document.createElement('span');
    words.className = 'attempt-words';
    words.textContent = guess.ids.map(id => WORDS[id]).join(' · ');
    const count = document.createElement('span');
    count.className = 'attempt-count';
    count.textContent = `${guess.correct} of 4`;
    const caption = document.createElement('small');
    caption.textContent = 'correct';
    count.append(caption);
    row.append(number, words, count);
    return row;
  }));
}
function renderPairs(focusId = null) {
  const answer = getRoundAnswer(state);
  if (!answer) return;
  $('related-words').replaceChildren(...answer.relatedIds.map(id => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'related-word';
    button.dataset.pairWord = id;
    button.textContent = WORDS[id];
    button.setAttribute('aria-pressed', String(pair.includes(id)));
    button.addEventListener('click', () => {
      if (!getRoundAnswer(state)) return;
      if (pair.includes(id)) pair = pair.filter(value => value !== id);
      else pair = pair.length === 2 ? [id] : [...pair, id];
      renderPairs(id);
    });
    return button;
  }));
  const explanation = explainPair(pair);
  if (explanation) {
    exploredPairs.add([...pair].sort((a, b) => a - b).join(','));
    $('pair-title').textContent = pair.map(id => WORDS[id]).join(' + ');
    $('pair-explanation').textContent = explanation;
  } else {
    $('pair-title').textContent = pair.length ? `${WORDS[pair[0]]} + …` : 'Pick a pair to explore';
    $('pair-explanation').textContent = pair.length ? 'Now choose one more related word.' : 'There are six different pairs to check.';
  }
  $('pair-progress').textContent = `${exploredPairs.size} of 6 pairs explored${exploredPairs.size === 6 ? ' — every pair connects.' : ''}`;
  if (focusId !== null) $('related-words').querySelector(`[data-pair-word="${focusId}"]`)?.focus({ preventScroll: true });
}
function renderReveal() {
  const answer = getRoundAnswer(state);
  $('reveal').hidden = !answer;
  if (!answer) { $('related-words').replaceChildren(); $('outsiders').replaceChildren(); return; }
  $('outcome-copy').textContent = state.status === 'won'
    ? `You found all four in ${state.guesses.length} ${state.guesses.length === 1 ? 'guess' : 'guesses'}. Now investigate the four you left behind.`
    : 'That was your third guess. Here are the outsiders and the six connections between the other four words.';
  const domains = { QUOTIENT: 'Result of division', TUBA: 'Musical instrument', HICCUP: 'Involuntary diaphragm spasm', PARSNIP: 'Root vegetable' };
  $('outsiders').replaceChildren(...answer.ids.map(id => {
    const row = document.createElement('div');
    row.className = 'outsider-entry';
    const word = document.createElement('strong');
    word.textContent = WORDS[id];
    const meaning = document.createElement('span');
    meaning.textContent = domains[WORDS[id]];
    row.append(word, meaning);
    return row;
  }));
  $('connection-name').textContent = answer.connection;
  renderPairs();
}
function render(focusId = null) {
  const ended = state.status !== 'playing';
  renderBoard(focusId);
  renderAttempts();
  $('selection-count').textContent = ended ? 'Round complete' : `${selected.length} / 4 selected`;
  $('submit').disabled = ended || selected.length !== PICK_COUNT;
  $('clear').disabled = ended || selected.length === 0;
  $('shuffle').disabled = ended;
  $('action-note').textContent = ended ? 'Explore the connections below.' : 'Choose exactly four words.';
  $('round-label').textContent = ended ? 'ROUND COMPLETE' : 'GUESSES LEFT';
  $('remaining').textContent = ended ? (state.status === 'won' ? 'Found them!' : 'Revealed') : String(state.remainingGuesses);
  $('remaining').classList.toggle('finished', ended);
  $('guess-dots').replaceChildren(...Array.from({ length: MAX_GUESSES }, (_, i) => {
    const dot = document.createElement('span');
    if (i < state.guesses.length) dot.className = 'used';
    return dot;
  }));
  $('round-caption').textContent = ended ? (state.status === 'won'
    ? `Solved in ${state.guesses.length} of ${MAX_GUESSES} guesses.` : 'Three guesses used. Take a look at the connections.')
    : 'Find all four outsiders before your guesses run out.';
  $('share').hidden = !ended;
  $('replay').hidden = !ended;
  renderReveal();
}

$('submit').addEventListener('click', () => {
  const result = submitGuess(state, selected);
  if (!result.accepted) { announce(result.error); return; }
  state = result.state;
  const count = state.guesses.at(-1).correct;
  if (state.status !== 'playing') selected = [];
  render(); save();
  announce(state.status === 'won' ? '4 of 4 correct! You found the outsiders. Explore the related words below.'
    : state.status === 'lost' ? `${count} of 4 correct. All three guesses used. The answer and pair connections are now revealed below.`
    : `${count} of 4 correct. ${state.remainingGuesses} ${state.remainingGuesses === 1 ? 'guess' : 'guesses'} left. Change your selection and try again.`, true);
});
$('clear').addEventListener('click', () => {
  if (state.status !== 'playing') return;
  selected = []; render(); save(); announce('Selection cleared. Choose four words.');
});
$('shuffle').addEventListener('click', () => {
  if (state.status !== 'playing') return;
  order = shuffled(order); render(); save(); announce('Words shuffled. Your selection and guesses are unchanged.');
});
$('replay').addEventListener('click', () => {
  if (state.status === 'playing') return;
  state = createGame(); selected = []; pair = []; exploredPairs = new Set(); order = shuffled(order);
  render(); save(); announce('Same board, a fresh round. You have three guesses.', true);
  $('game').scrollIntoView({ block: 'start', behavior: 'auto' });
});
$('how-to-play').addEventListener('click', () => {
  $('rules').open = true;
  $('rules').scrollIntoView({ block: 'center', behavior: 'auto' });
  $('rules').querySelector('summary').focus({ preventScroll: true });
});
$('share').addEventListener('click', () => {
  if (state.status === 'playing') return;
  $('share-text').value = `Anti-Connections · Board 001\n${state.status === 'won' ? `Solved in ${state.guesses.length}/3 guesses` : 'Out of guesses (3/3)'}\n${state.guesses.map((g, i) => `Guess ${i + 1}: ${g.correct}/4 correct`).join('\n')}\n${location.href.split(/[?#]/)[0]}`;
  $('share-message').textContent = 'Share your result without giving away the words.';
  $('copy-share').textContent = 'Copy result';
  $('share-dialog').showModal();
});
$('copy-share').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('share-text').value);
    $('copy-share').textContent = 'Copied!';
    $('share-message').textContent = 'Copied! Your result is ready to share.';
  } catch {
    $('share-message').textContent = 'Select the text below and copy it using your keyboard or browser.';
    $('share-text').focus(); $('share-text').select();
  }
});
$('close-share').addEventListener('click', () => $('share-dialog').close());
render(); save();
if (state.guesses.length) announce(state.status === 'playing'
  ? `Welcome back. Your ${state.guesses.length} ${state.guesses.length === 1 ? 'guess is' : 'guesses are'} saved. ${state.remainingGuesses} remaining.`
  : 'Your completed round is saved. Explore the pair connections below, or play this board again.');
