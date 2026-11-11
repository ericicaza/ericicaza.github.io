import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, SIMILARITIES } from '../games/anti-connections/data.js';
import { scoreGroup, scoreArrangement, optimizeBoard, validateArrangement, shuffledGroups, bestSwap } from '../games/anti-connections/engine.js';

const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('measured cosine data is complete, symmetric and semantically plausible', () => {
  assert.equal(WORDS.length, 16);
  assert.equal(SIMILARITIES.length, 16);
  for (let i = 0; i < 16; i++) {
    assert.equal(SIMILARITIES[i].length, 16);
    near(SIMILARITIES[i][i], 1);
    for (let j = 0; j < 16; j++) {
      near(SIMILARITIES[i][j], SIMILARITIES[j][i]);
      assert.ok(SIMILARITIES[i][j] >= -1 && SIMILARITIES[i][j] <= 1);
    }
  }
  assert.ok(SIMILARITIES[0][8] > SIMILARITIES[0][2], 'apricot/plum should be closer than apricot/subpoena');
});

test('group scoring averages all six pairs and penalizes the strongest one', () => {
  const group = [0, 1, 2, 3];
  const scores = scoreGroup(group);
  const values = [SIMILARITIES[0][1], SIMILARITIES[0][2], SIMILARITIES[0][3], SIMILARITIES[1][2], SIMILARITIES[1][3], SIMILARITIES[2][3]];
  const mean = values.reduce((a, b) => a + b, 0) / 6;
  near(scores.objective, mean * 0.75 + Math.max(...values) * 0.25);
  assert.equal(scores.pairs.length, 6);
  near(scores.strongestPair.similarity, Math.max(...values));
  near(scoreGroup([...group].reverse()).objective, scores.objective);
});

test('arrangements reject duplicates, missing entries and invalid indices', () => {
  const valid = shuffledGroups('validation');
  assert.equal(validateArrangement(valid), true);
  for (const invalid of [null, [], valid.slice(0, 3), [[-1, 1, 2, 3], ...valid.slice(1)], valid.map(() => [0, 1, 2, 3])]) {
    assert.equal(validateArrangement(invalid), false);
    assert.throws(() => scoreArrangement(invalid), TypeError);
  }
});

test('exact optimizer calibrates the best to 100 and the worst to 0', () => {
  const best = optimizeBoard();
  assert.equal(validateArrangement(best.groups), true);
  assert.equal(validateArrangement(best.worstGroups), true);
  near(scoreArrangement(best.groups).score, 100);
  near(scoreArrangement(best.worstGroups).score, 0);
  assert.equal(scoreArrangement(best.groups).isOptimal, true);
  assert.equal(bestSwap(best.groups), null);
  for (let seed = 0; seed < 100; seed++) {
    const scored = scoreArrangement(shuffledGroups(seed));
    assert.ok(scored.objective >= best.objective - 1e-9 && scored.objective <= best.worstObjective + 1e-9);
  }
  best.groups[0][0] = 100;
  assert.equal(validateArrangement(optimizeBoard().groups), true, 'callers cannot corrupt cached optimizer');
});

test('score is independent of row order and tile order', () => {
  const groups = shuffledGroups('invariance');
  near(scoreArrangement(groups).score, scoreArrangement(groups.toReversed().map(group => group.toReversed())).score);
});

test('seeded shuffles and hints preserve words and leave input unchanged', () => {
  assert.deepEqual(shuffledGroups('orbit'), shuffledGroups('orbit'));
  assert.notDeepEqual(shuffledGroups('orbit'), shuffledGroups('orbit2'));
  const groups = optimizeBoard().worstGroups;
  const original = structuredClone(groups);
  const hint = bestSwap(groups);
  assert.ok(hint && hint.improvement > 0);
  assert.equal(validateArrangement(hint.groups), true);
  assert.deepEqual(groups, original);
  assert.equal(hint.groups[hint.a.group][hint.a.index], hint.b.word);
  assert.equal(hint.groups[hint.b.group][hint.b.index], hint.a.word);
  near(scoreArrangement(hint.groups).score, hint.afterScore);
});
