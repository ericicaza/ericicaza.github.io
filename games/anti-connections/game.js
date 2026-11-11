import { WORDS, BOARD_ID, MODEL_INFO } from './data.js';
import { scoreArrangement, shuffledGroups, validateArrangement, bestSwap } from './engine.js';

const $ = (id) => document.getElementById(id);
const storageKey = `erics-arcade:anti-connections:${BOARD_ID}`;
const initialGroups = shuffledGroups('first-orbit');
const cloneGroups = (groups) => groups.map((group) => [...group]);
const arrangementKey = (groups) => JSON.stringify(groups);
const validCount = (value) => Number.isInteger(value) && value >= 0 && value < 1e9;
const formatScore = (score) => score >= 100 - 1e-8 ? '100' : Math.min(99.9, score).toFixed(1);
let state = { groups: cloneGroups(initialGroups), swaps: 0, hints: 0, checkedKey: null, best: null };
let selected = null;
let hintWords = [];
let history = [];
let storageAvailable = true;
let shareText = '';

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && saved.version === 1 && validateArrangement(saved.groups)) {
    state.groups = cloneGroups(saved.groups);
    state.swaps = validCount(saved.swaps) ? saved.swaps : 0;
    state.hints = validCount(saved.hints) ? saved.hints : 0;
    state.checkedKey = saved.checkedKey === arrangementKey(state.groups) ? saved.checkedKey : null;
    if (typeof saved.best === 'number' && Number.isFinite(saved.best) && saved.best >= 0 && saved.best <= 100) state.best = saved.best;
  }
} catch {
  // Private browsing and browser storage policies must never prevent play.
  storageAvailable = false;
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...state, version: 1 }));
    storageAvailable = true;
  } catch { storageAvailable = false; }
  document.querySelector('.local-note').textContent = storageAvailable
    ? 'Your progress stays in this browser.'
    : 'Browser storage is unavailable. Keep this tab open to save your progress.';
}

function announce(message) { $('status').textContent = message; }

function snapshot() {
  history.push({ groups: cloneGroups(state.groups), swaps: state.swaps, hints: state.hints, checkedKey: state.checkedKey });
  if (history.length > 100) history.shift();
}

function renderBoard(result = null, focusWord = null) {
  const fragment = document.createDocumentFragment();
  state.groups.forEach((group, groupIndex) => {
    const section = document.createElement('div');
    section.className = 'board-group';
    const label = document.createElement('div');
    label.className = 'group-label';
    label.id = `group-label-${groupIndex}`;
    const title = document.createElement('span');
    title.textContent = `GROUP 0${groupIndex + 1}`;
    label.append(title);
    if (result) {
      const value = document.createElement('span');
      value.className = 'group-result';
      value.textContent = `Relatedness ${result.groups[groupIndex].objective.toFixed(3)}`;
      value.title = 'Lower relatedness is better. 75% average pair similarity + 25% closest pair similarity.';
      label.append(value);
    }
    const row = document.createElement('div');
    row.className = 'board-row';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-labelledby', label.id);
    group.forEach((word, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'word-tile';
      button.textContent = WORDS[word];
      button.dataset.word = word;
      button.setAttribute('aria-pressed', selected?.word === word ? 'true' : 'false');
      button.setAttribute('aria-label', `${WORDS[word]}, group ${groupIndex + 1}${selected?.word === word ? ', selected' : ''}`);
      if (hintWords.includes(word)) button.classList.add('hinted');
      button.addEventListener('click', () => chooseWord({ group: groupIndex, index, word }));
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && selected) {
          selected = null;
          renderBoard(currentResult(), word);
          announce('Selection cleared. Pick any word to begin a swap.');
        }
      });
      row.append(button);
    });
    section.append(label, row);
    if (result) {
      const pair = result.groups[groupIndex].strongestPair;
      const feedback = document.createElement('p');
      feedback.className = 'group-feedback';
      const strong = document.createElement('strong');
      strong.textContent = `${WORDS[pair.a]} + ${WORDS[pair.b]}`;
      feedback.append('Closest pair: ', strong, ` · similarity ${pair.similarity.toFixed(2)}`);
      section.append(feedback);
    }
    fragment.append(section);
  });
  $('board').replaceChildren(fragment);
  if (focusWord !== null) $('board').querySelector(`[data-word="${focusWord}"]`)?.focus({ preventScroll: true });
}

function currentResult() {
  return state.checkedKey === arrangementKey(state.groups) ? scoreArrangement(state.groups) : null;
}

function render(focusWord = null) {
  const result = currentResult();
  renderBoard(result, focusWord);
  $('move-count').textContent = `${state.swaps} ${state.swaps === 1 ? 'swap' : 'swaps'}`;
  $('undo').disabled = history.length === 0;
  $('score').textContent = result ? formatScore(result.score) : '—';
  $('score-fill').style.width = `${result?.score ?? 0}%`;
  const meter = document.querySelector('.score-track');
  meter.setAttribute('aria-valuenow', String(result ? Math.round(result.score * 10) / 10 : 0));
  meter.setAttribute('aria-valuetext', result ? `${formatScore(result.score)} out of 100` : 'Not checked yet');
  $('best-score').textContent = state.best === null ? '—' : formatScore(state.best);
  $('share').disabled = !result;
  $('check').firstChild.textContent = result ? 'Check again ' : 'Check my groups ';
  if (!result) {
    $('score-caption').innerHTML = state.best === null ? 'Less in common.<br>More points for you.' : 'A fresh arrangement.<br>Ready to check?';
  } else if (result.isOptimal) {
    $('score-caption').textContent = 'Beautifully unrelated. You found the model’s best arrangement.';
  } else if (result.score >= 90) {
    $('score-caption').textContent = 'A distant bunch. Can you get them further apart?';
  } else if (result.score >= 70) {
    $('score-caption').textContent = 'Nicely mixed. A few close pairs could move further apart.';
  } else {
    $('score-caption').textContent = 'A few things still connect. Try breaking up the closest pairs.';
  }
}

function chooseWord(choice) {
  if (!selected) {
    selected = choice;
    renderBoard(currentResult(), choice.word);
    announce(`${WORDS[choice.word]} selected. Choose a word in a different row to swap.`);
    return;
  }
  if (selected.word === choice.word) {
    selected = null;
    renderBoard(currentResult(), choice.word);
    announce('Selection cleared. Pick any word to begin a swap.');
    return;
  }
  if (selected.group === choice.group) {
    selected = choice;
    renderBoard(currentResult(), choice.word);
    announce(`${WORDS[choice.word]} selected instead. Pick a word from another row.`);
    return;
  }
  const first = selected;
  snapshot();
  [state.groups[first.group][first.index], state.groups[choice.group][choice.index]] = [choice.word, first.word];
  state.swaps++;
  state.checkedKey = null;
  selected = null;
  hintWords = [];
  render(choice.word);
  save();
  announce(`Swapped ${WORDS[first.word]} and ${WORDS[choice.word]}. Check your groups whenever you’re ready.`);
}

$('check').addEventListener('click', () => {
  const result = scoreArrangement(state.groups);
  const previousBest = state.best;
  const newBest = previousBest === null || result.score > previousBest + 1e-8;
  state.best = Math.max(previousBest ?? 0, result.score);
  state.checkedKey = arrangementKey(state.groups);
  selected = null;
  hintWords = [];
  render();
  save();
  announce(result.isOptimal
    ? '100 out of 100! You found the best arrangement for this board’s model. Share your score to challenge a friend.'
    : `${formatScore(result.score)} out of 100.${newBest && previousBest !== null ? ' A new personal best!' : ''} Each row now shows its closest pair. Try splitting those words apart.`);
});

$('undo').addEventListener('click', () => {
  const previous = history.pop();
  if (!previous) return;
  Object.assign(state, previous);
  selected = null;
  hintWords = [];
  render();
  save();
  announce('Last change undone. Your personal best is saved.');
});

$('shuffle').addEventListener('click', () => {
  snapshot();
  state.groups = shuffledGroups(`${Date.now()}-${Math.random()}`);
  state.checkedKey = null;
  selected = null;
  hintWords = [];
  render();
  save();
  announce('All 16 words shuffled into new rows. Undo will bring back the previous arrangement.');
});

$('restart').addEventListener('click', () => {
  snapshot();
  state.groups = cloneGroups(initialGroups);
  state.swaps = 0;
  state.hints = 0;
  state.checkedKey = null;
  selected = null;
  hintWords = [];
  render();
  save();
  announce('Back to the starting board. Your personal best is saved, and you can undo this reset.');
});

$('hint').addEventListener('click', () => {
  const suggestion = bestSwap(state.groups);
  selected = null;
  if (!suggestion) {
    hintWords = [];
    renderBoard(currentResult());
    announce(scoreArrangement(state.groups).isOptimal
      ? 'You already have the best arrangement for this model. Check your groups to celebrate!'
      : 'No single swap improves this arrangement. Try a two-swap experiment, or shuffle for a fresh angle.');
    return;
  }
  state.hints++;
  hintWords = [suggestion.a.word, suggestion.b.word];
  renderBoard(currentResult());
  save();
  announce(`Try swapping ${WORDS[suggestion.a.word]} in group ${suggestion.a.group + 1} with ${WORDS[suggestion.b.word]} in group ${suggestion.b.group + 1}. Those two words are marked with a star.`);
});

$('how-to-play').addEventListener('click', () => {
  $('rules').open = true;
  $('rules').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  $('rules').querySelector('summary').focus({ preventScroll: true });
});

function makeShareText() {
  const result = currentResult();
  if (!result) return '';
  const filled = Math.round(result.score / 10);
  const squares = '🟪'.repeat(filled) + '⬜'.repeat(10 - filled);
  return `Anti-Connections · Board 001\n${formatScore(result.score)}/100 ${result.isOptimal ? '✦' : ''}\n${squares}\n${state.swaps} ${state.swaps === 1 ? 'swap' : 'swaps'}${state.hints ? ` · ${state.hints} ${state.hints === 1 ? 'hint' : 'hints'}` : ''}\n${location.href.split(/[?#]/)[0]}`;
}

async function copyResult() {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(shareText);
    $('share-message').textContent = 'Copied! Send it to a friend and see how far apart they can go.';
    $('copy-share').textContent = 'Copied!';
    announce('Score copied to clipboard.');
  } catch {
    $('share-message').textContent = 'Automatic copying isn’t available here. Select the text and copy it with your browser or keyboard.';
    $('share-text').focus();
    $('share-text').select();
    $('copy-share').textContent = 'Try copying again';
  }
}

$('share').addEventListener('click', () => {
  shareText = makeShareText();
  if (!shareText) return;
  $('share-text').value = shareText;
  $('share-message').textContent = 'Copy the text below and send it to a friend.';
  $('copy-share').textContent = 'Copy score';
  $('share-dialog').showModal();
});
$('copy-share').addEventListener('click', copyResult);
$('close-share').addEventListener('click', () => $('share-dialog').close());
$('share-dialog').addEventListener('click', (event) => {
  if (event.target === $('share-dialog')) {
    const bounds = $('share-dialog').getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('share-dialog').close();
  }
});

const modelLink = document.createElement('a');
modelLink.href = MODEL_INFO.url;
modelLink.textContent = MODEL_INFO.name;
modelLink.target = '_blank';
modelLink.rel = 'noopener noreferrer';
modelLink.style.textDecoration = 'underline';
$('model-details').replaceChildren('This board uses ', modelLink, '. Row relatedness is 75% average pair similarity plus 25% closest-pair similarity. The total is scaled between this board’s exact worst arrangement (0) and best arrangement (100). Similarities are precomputed: your play stays in the browser and makes no AI service calls.');

render();
save();
if (state.checkedKey) announce('Welcome back. Your last arrangement and personal best are saved here.');
