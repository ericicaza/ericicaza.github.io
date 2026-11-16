import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, BOARD_ID, ANSWER_IDS, RELATED_IDS, PAIR_CONNECTIONS, CONNECTION } from '../games/anti-connections/data.js';
import { MAX_GUESSES, PICK_COUNT, createGame, evaluateGuess, submitGuess, restoreGame, isRoundOver, getRoundAnswer, explainPair } from '../games/anti-connections/engine.js';

const fruitIds = [0, 2, 5, 7];
const answer = [1, 3, 4, 6];
const attempt = (state, ids) => {
  const result = submitGuess(state, ids);
  assert.equal(result.accepted, true, result.error);
  assert.equal(result.error, null);
  return result.state;
};

test('board contains four fruits and the four intended outliers', () => {
  assert.equal(WORDS.length, 8);
  assert.equal(new Set(WORDS).size, 8);
  assert.equal(CONNECTION, 'Fruits');
  assert.deepEqual(RELATED_IDS, fruitIds);
  assert.deepEqual(fruitIds.map((id) => WORDS[id]), ['APRICOT', 'MANGO', 'PLUM', 'LEMON']);
  assert.deepEqual(ANSWER_IDS.map((id) => WORDS[id]), ['TUBA', 'SUBPOENA', 'NEBULA', 'SOMERSAULT']);
  assert.equal(MAX_GUESSES, 3);
  assert.equal(PICK_COUNT, 4);
});

test('feedback counts every possible number correct without exposing per-word flags', () => {
  for (let count = 0; count <= 4; count++) {
    const selected = [...answer.slice(0, count), ...fruitIds.slice(0, 4 - count)];
    const result = evaluateGuess(selected);
    assert.equal(result.valid, true);
    assert.equal(result.correct, count);
    assert.deepEqual(Object.keys(result).sort(), ['correct', 'error', 'ids', 'valid']);
    assert.deepEqual(evaluateGuess([...selected].reverse()), result, 'selection order is irrelevant');
  }
});

test('third guess can win, and the finished round rejects further attempts', () => {
  let state = attempt(createGame(), fruitIds);
  state = attempt(state, [0, 1, 2, 3]);
  assert.equal(state.status, 'playing');
  assert.equal(state.remainingGuesses, 1);
  assert.equal(getRoundAnswer(state), null);
  state = attempt(state, answer);
  assert.equal(state.status, 'won');
  assert.equal(state.remainingGuesses, 0);
  assert.equal(isRoundOver(state), true);
  assert.deepEqual(getRoundAnswer(state), { ids: answer, relatedIds: fruitIds, connection: 'Fruits' });
  const locked = submitGuess(state, [0, 1, 2, 4]);
  assert.equal(locked.accepted, false);
  assert.deepEqual(locked.state, state);
});

test('three unsuccessful guesses lose and a fourth cannot change the result', () => {
  let state = createGame();
  for (const ids of [fruitIds, [0, 1, 2, 3], [1, 3, 4, 7]]) state = attempt(state, ids);
  assert.deepEqual(state.guesses.map((guess) => guess.correct), [0, 2, 3]);
  assert.equal(state.status, 'lost');
  assert.equal(state.remainingGuesses, 0);
  assert.ok(getRoundAnswer(state));
  const fourth = submitGuess(state, answer);
  assert.equal(fourth.accepted, false);
  assert.deepEqual(fourth.state, state);
});

test('early wins also lock the round and reveal only after completion', () => {
  const initial = createGame();
  assert.equal(getRoundAnswer(initial), null);
  assert.equal(isRoundOver(initial), false);
  const won = attempt(initial, answer);
  assert.equal(won.status, 'won');
  assert.equal(won.guesses.length, 1);
  assert.equal(won.remainingGuesses, 2);
  assert.equal(submitGuess(won, fruitIds).accepted, false);
  assert.ok(getRoundAnswer(won));
});

test('invalid selections and repeated sets consume no guesses', () => {
  const state = attempt(createGame(), [0, 1, 2, 3]);
  const invalid = [null, '0123', [], [1, 3, 4], [0, 1, 2, 3, 4], [1, 1, 3, 4], [-1, 1, 3, 4], [1, 3, 4, 8], ['1', 3, 4, 6], [1.5, 3, 4, 6], [NaN, 3, 4, 6], [1, 3, 4, ,]];
  for (const ids of invalid) {
    const result = submitGuess(state, ids);
    assert.equal(result.accepted, false);
    assert.equal(typeof result.error, 'string');
    assert.deepEqual(result.state, state);
  }
  const duplicate = submitGuess(state, [3, 2, 1, 0]);
  assert.equal(duplicate.accepted, false);
  assert.match(duplicate.error, /already tried/);
  assert.deepEqual(duplicate.state, state);
});

test('reducers do not mutate caller-owned state or selection arrays', () => {
  const state = createGame();
  const initial = structuredClone(state);
  const selected = [6, 4, 3, 1];
  const result = submitGuess(state, selected);
  assert.deepEqual(state, initial);
  assert.deepEqual(selected, [6, 4, 3, 1]);
  result.state.guesses[0].ids[0] = 99;
  assert.deepEqual(createGame(), initial);
  assert.deepEqual(ANSWER_IDS, answer);
});

test('restoration recomputes feedback and status instead of trusting saved fields', () => {
  let state = attempt(createGame(), fruitIds);
  state = attempt(state, [0, 1, 2, 3]);
  const forged = { ...state, status: 'won', remainingGuesses: 123, guesses: state.guesses.map((guess) => ({ ids: [...guess.ids].reverse(), correct: 4 })) };
  assert.deepEqual(restoreGame(forged), state);
  const won = attempt(state, answer);
  assert.deepEqual(restoreGame({ ...won, status: 'playing', remainingGuesses: 3 }), won);
  const lost = attempt(state, [1, 3, 4, 7]);
  assert.deepEqual(restoreGame({ ...lost, status: 'playing', remainingGuesses: 3 }), lost);
  assert.deepEqual(restoreGame(JSON.parse(JSON.stringify(won))), won);
});

test('corrupt, duplicate, stale and impossible saved histories reset safely', () => {
  const initial = createGame();
  const validGuess = { ids: [0, 1, 2, 3], correct: 2 };
  const invalidStates = [
    null, undefined, 'not JSON', {},
    { ...initial, boardId: 'first-orbit-v1' },
    { ...initial, version: 1 },
    { ...initial, guesses: {} },
    { ...initial, guesses: [null] },
    { ...initial, guesses: [{ ids: [0, 1, 2, 8] }] },
    { ...initial, guesses: [validGuess, { ids: [3, 2, 1, 0] }] },
    { ...initial, guesses: [{ ids: answer }, validGuess] },
    { ...initial, guesses: [validGuess, validGuess, validGuess, validGuess] },
  ];
  for (const saved of invalidStates) assert.deepEqual(restoreGame(saved), initial);
  assert.equal(initial.boardId, BOARD_ID);
});

test('all six related-word pairs have order-independent factual explanations', () => {
  assert.equal(PAIR_CONNECTIONS.length, 6);
  const found = new Set();
  for (let i = 0; i < fruitIds.length - 1; i++) {
    for (let j = i + 1; j < fruitIds.length; j++) {
      const ids = [fruitIds[i], fruitIds[j]];
      const explanation = explainPair(ids);
      assert.equal(typeof explanation, 'string');
      assert.ok(explanation.includes(WORDS[ids[0]]) && explanation.includes(WORDS[ids[1]]));
      assert.equal(explainPair([...ids].reverse()), explanation);
      found.add(ids.join(','));
    }
  }
  assert.deepEqual(new Set(PAIR_CONNECTIONS.map((pair) => pair.ids.join(','))), found);
});

test('invalid pairs and pairs including outliers have no explanation', () => {
  for (const ids of [null, [], [0], [0, 2, 5], [0, 0], [0, 1], [1, 3], [0, 8], ['0', 2], [0, 2.5], [0, ,]]) {
    assert.equal(explainPair(ids), null);
  }
});
