import { WORDS, BOARD_ID, ANSWER_IDS, RELATED_IDS, PAIR_CONNECTIONS, CONNECTION, MAX_GUESSES, PICK_COUNT } from './data.js?v=2';

export { MAX_GUESSES, PICK_COUNT } from './data.js?v=2';

const STATE_VERSION = 2;
const answerSet = new Set(ANSWER_IDS);
const guessKey = (ids) => ids.join(',');

export function createGame() {
  return {
    version: STATE_VERSION,
    boardId: BOARD_ID,
    guesses: [],
    status: 'playing',
    remainingGuesses: MAX_GUESSES,
  };
}

// Only the total is returned: there are no per-word correctness flags.
export function evaluateGuess(ids) {
  const invalid = (error) => ({ valid: false, ids: null, correct: null, error });
  if (!Array.isArray(ids) || ids.length !== PICK_COUNT) {
    return invalid(`Choose exactly ${PICK_COUNT} words before submitting.`);
  }
  const values = [...ids];
  if (!values.every((id) => Number.isInteger(id) && id >= 0 && id < WORDS.length)) {
    return invalid('Choose words from this board.');
  }
  if (new Set(values).size !== PICK_COUNT) {
    return invalid(`Choose ${PICK_COUNT} different words.`);
  }
  const canonicalIds = values.sort((a, b) => a - b);
  return {
    valid: true,
    ids: canonicalIds,
    correct: canonicalIds.filter((id) => answerSet.has(id)).length,
    error: null,
  };
}

function appendGuess(state, evaluation) {
  const guesses = [...state.guesses, { ids: [...evaluation.ids], correct: evaluation.correct }];
  const status = evaluation.correct === PICK_COUNT ? 'won'
    : guesses.length === MAX_GUESSES ? 'lost' : 'playing';
  return { ...state, guesses, status, remainingGuesses: MAX_GUESSES - guesses.length };
}

// Saved feedback, status and attempt counters are never trusted. Replaying only
// validated unique selections reconstructs all derived state from this board.
export function restoreGame(saved) {
  let state = createGame();
  if (!saved || typeof saved !== 'object' || saved.version !== STATE_VERSION
    || saved.boardId !== BOARD_ID || !Array.isArray(saved.guesses)
    || saved.guesses.length > MAX_GUESSES) return state;

  const seen = new Set();
  for (const guess of saved.guesses) {
    if (state.status !== 'playing' || !guess || typeof guess !== 'object') return createGame();
    const evaluation = evaluateGuess(guess.ids);
    if (!evaluation.valid) return createGame();
    const key = guessKey(evaluation.ids);
    if (seen.has(key)) return createGame();
    seen.add(key);
    state = appendGuess(state, evaluation);
  }
  return state;
}

export function submitGuess(currentState, ids) {
  const state = restoreGame(currentState);
  const reject = (error) => ({ state, accepted: false, error });
  if (state.status !== 'playing') return reject('This round is over. Start a new round to play again.');

  const evaluation = evaluateGuess(ids);
  if (!evaluation.valid) return reject(evaluation.error);
  const key = guessKey(evaluation.ids);
  if (state.guesses.some((guess) => guessKey(guess.ids) === key)) {
    return reject('You already tried those four words. Choose a different combination.');
  }
  return { state: appendGuess(state, evaluation), accepted: true, error: null };
}

export function isRoundOver(state) {
  return restoreGame(state).status !== 'playing';
}

// Presentation code can use this gate to avoid displaying the answer mid-round.
export function getRoundAnswer(state) {
  if (!isRoundOver(state)) return null;
  return { ids: [...ANSWER_IDS], relatedIds: [...RELATED_IDS], connection: CONNECTION };
}

// The UI enables this inspector only after the round; unrelated or invalid pairs
// never receive a made-up explanation.
export function explainPair(ids) {
  if (!Array.isArray(ids) || ids.length !== 2) return null;
  const values = [...ids];
  if (!values.every((id) => Number.isInteger(id) && RELATED_IDS.includes(id)) || values[0] === values[1]) return null;
  values.sort((a, b) => a - b);
  return PAIR_CONNECTIONS.find((pair) => pair.ids[0] === values[0] && pair.ids[1] === values[1])?.explanation ?? null;
}
