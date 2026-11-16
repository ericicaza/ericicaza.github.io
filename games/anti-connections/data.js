// A curated puzzle. The answer follows this board's word-pair rule, not an
// embedding score or a claim that these words can never share an association.
export const BOARD_ID = 'six-links-v3';
export const WORDS = Object.freeze([
  'FIRE', 'QUOTIENT', 'LIGHT', 'TUBA',
  'HICCUP', 'HOUSE', 'PARSNIP', 'WORK',
]);
export const ANSWER_IDS = Object.freeze([1, 3, 4, 6]);
export const RELATED_IDS = Object.freeze([0, 2, 5, 7]);
export const CONNECTION = 'Six pairwise links';
export const MAX_GUESSES = 3;
export const PICK_COUNT = 4;
export const PAIR_CONNECTIONS = Object.freeze([
  Object.freeze({ ids: Object.freeze([0, 2]), explanation: 'FIRE + LIGHT makes FIRELIGHT: the glow given off by flames.' }),
  Object.freeze({ ids: Object.freeze([0, 5]), explanation: 'FIRE + HOUSE makes FIREHOUSE: a station where firefighters and fire engines are based.' }),
  Object.freeze({ ids: Object.freeze([0, 7]), explanation: 'FIRE + WORK makes FIREWORK: a pyrotechnic device that produces a burst of light, color, or sound.' }),
  Object.freeze({ ids: Object.freeze([2, 5]), explanation: 'LIGHT + HOUSE makes LIGHTHOUSE: a tower with a light that guides or warns ships.' }),
  Object.freeze({ ids: Object.freeze([2, 7]), explanation: 'LIGHT + WORK makes LIGHT WORK: an easy task requiring little effort. To make light work of something is to do it easily.' }),
  Object.freeze({ ids: Object.freeze([5, 7]), explanation: 'HOUSE + WORK makes HOUSEWORK: domestic chores such as cleaning and laundry.' }),
]);
