import { WORDS, SIMILARITIES } from './data.js';

const SIZE = WORDS.length;
const FULL_MASK = (1 << SIZE) - 1;
const EPSILON = 1e-9;
let cachedOptimization;

function isWord(word) {
  return Number.isInteger(word) && word >= 0 && word < SIZE;
}

export function validateArrangement(groups) {
  if (!Array.isArray(groups) || groups.length !== 4) return false;
  if (!groups.every(group => Array.isArray(group) && group.length === 4 && group.every(isWord))) return false;
  return new Set(groups.flat()).size === SIZE;
}

function assertArrangement(groups) {
  if (!validateArrangement(groups)) throw new TypeError('Use every word exactly once in four groups of four.');
}

export function scoreGroup(words) {
  if (!Array.isArray(words) || words.length !== 4 || !words.every(isWord) || new Set(words).size !== 4) {
    throw new TypeError('A group must contain four different word indices.');
  }
  const pairs = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      pairs.push({ a: words[i], b: words[j], similarity: SIMILARITIES[words[i]][words[j]] });
    }
  }
  pairs.sort((a, b) => b.similarity - a.similarity || a.a - b.a || a.b - b.b);
  const meanSimilarity = pairs.reduce((sum, pair) => sum + pair.similarity, 0) / 6;
  const maxSimilarity = pairs[0].similarity;
  return {
    words: [...words], meanSimilarity, maxSimilarity,
    objective: 0.75 * meanSimilarity + 0.25 * maxSimilarity,
    pairs, strongestPair: { ...pairs[0] },
  };
}

const groupCosts = new Float64Array(FULL_MASK + 1);
for (let a = 0; a < SIZE - 3; a++) {
  for (let b = a + 1; b < SIZE - 2; b++) {
    for (let c = b + 1; c < SIZE - 1; c++) {
      for (let d = c + 1; d < SIZE; d++) {
        groupCosts[(1 << a) | (1 << b) | (1 << c) | (1 << d)] = scoreGroup([a, b, c, d]).objective;
      }
    }
  }
}

function wordsForMask(mask) {
  const words = [];
  for (let word = 0; word < SIZE; word++) if (mask & (1 << word)) words.push(word);
  return words;
}

// Every partition appears exactly once: each next group contains the smallest
// unused word. Memoizing the remaining mask gives an exact result, not a heuristic.
function computeOptimization() {
  const minima = new Float64Array(FULL_MASK + 1).fill(NaN);
  const maxima = new Float64Array(FULL_MASK + 1).fill(NaN);
  const minimumChoice = new Uint16Array(FULL_MASK + 1);
  const maximumChoice = new Uint16Array(FULL_MASK + 1);
  minima[0] = maxima[0] = 0;

  function solve(mask) {
    if (!Number.isNaN(minima[mask])) return;
    const first = mask & -mask;
    const rest = wordsForMask(mask ^ first);
    let minimum = Infinity;
    let maximum = -Infinity;
    for (let a = 0; a < rest.length - 2; a++) {
      for (let b = a + 1; b < rest.length - 1; b++) {
        for (let c = b + 1; c < rest.length; c++) {
          const group = first | (1 << rest[a]) | (1 << rest[b]) | (1 << rest[c]);
          const remaining = mask ^ group;
          solve(remaining);
          const low = groupCosts[group] + minima[remaining];
          const high = groupCosts[group] + maxima[remaining];
          if (low < minimum) { minimum = low; minimumChoice[mask] = group; }
          if (high > maximum) { maximum = high; maximumChoice[mask] = group; }
        }
      }
    }
    minima[mask] = minimum;
    maxima[mask] = maximum;
  }

  function reconstruct(choice) {
    let mask = FULL_MASK;
    const groups = [];
    while (mask) {
      const group = choice[mask];
      groups.push(wordsForMask(group));
      mask ^= group;
    }
    return groups;
  }

  solve(FULL_MASK);
  return {
    groups: reconstruct(minimumChoice), objective: minima[FULL_MASK] / 4, score: 100,
    worstObjective: maxima[FULL_MASK] / 4, worstGroups: reconstruct(maximumChoice),
  };
}

function optimum() {
  cachedOptimization ??= computeOptimization();
  return cachedOptimization;
}

export function optimizeBoard() {
  const result = optimum();
  return { ...result, groups: result.groups.map(group => [...group]), worstGroups: result.worstGroups.map(group => [...group]) };
}

function scoreFromObjective(objective) {
  const { objective: best, worstObjective: worst } = optimum();
  const span = worst - best;
  return span < EPSILON ? 100 : Math.max(0, Math.min(100, 100 * (worst - objective) / span));
}

export function scoreArrangement(groups) {
  assertArrangement(groups);
  const groupResults = groups.map(scoreGroup);
  const objective = groupResults.reduce((sum, group) => sum + group.objective, 0) / 4;
  const { objective: optimumObjective, worstObjective } = optimum();
  return {
    score: scoreFromObjective(objective), objective, groups: groupResults,
    optimumObjective, worstObjective, gap: Math.max(0, objective - optimumObjective),
    isOptimal: Math.abs(objective - optimumObjective) < EPSILON,
  };
}

export function shuffledGroups(seed = 1) {
  const text = String(seed);
  let state = 2166136261;
  for (let i = 0; i < text.length; i++) state = Math.imul(state ^ text.charCodeAt(i), 16777619);
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const words = Array.from({ length: SIZE }, (_, index) => index);
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return Array.from({ length: 4 }, (_, index) => words.slice(index * 4, index * 4 + 4));
}

export function bestSwap(groups) {
  assertArrangement(groups);
  const before = scoreArrangement(groups);
  let bestObjective = before.objective;
  let result = null;
  for (let firstGroup = 0; firstGroup < 3; firstGroup++) {
    for (let secondGroup = firstGroup + 1; secondGroup < 4; secondGroup++) {
      for (let firstIndex = 0; firstIndex < 4; firstIndex++) {
        for (let secondIndex = 0; secondIndex < 4; secondIndex++) {
          const next = groups.map(group => [...group]);
          const a = { group: firstGroup, index: firstIndex, word: next[firstGroup][firstIndex] };
          const b = { group: secondGroup, index: secondIndex, word: next[secondGroup][secondIndex] };
          [next[firstGroup][firstIndex], next[secondGroup][secondIndex]] = [b.word, a.word];
          const objective = next.reduce((sum, group) => sum + scoreGroup(group).objective, 0) / 4;
          if (objective < bestObjective - EPSILON) {
            bestObjective = objective;
            const afterScore = scoreFromObjective(objective);
            result = { a, b, groups: next, beforeScore: before.score, afterScore, improvement: afterScore - before.score, objective };
          }
        }
      }
    }
  }
  return result;
}
