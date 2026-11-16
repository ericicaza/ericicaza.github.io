// A curated puzzle. The answer follows this board's category rule, not an
// embedding score or a claim that these words can never share an association.
export const BOARD_ID = 'four-outliers-v2';
export const WORDS = Object.freeze([
  'APRICOT', 'TUBA', 'MANGO', 'SUBPOENA',
  'NEBULA', 'PLUM', 'SOMERSAULT', 'LEMON',
]);
export const ANSWER_IDS = Object.freeze([1, 3, 4, 6]);
export const RELATED_IDS = Object.freeze([0, 2, 5, 7]);
export const CONNECTION = 'Fruits';
export const MAX_GUESSES = 3;
export const PICK_COUNT = 4;
export const PAIR_CONNECTIONS = Object.freeze([
  Object.freeze({ ids: Object.freeze([0, 2]), explanation: 'APRICOT and MANGO are both edible fruits that grow on trees.' }),
  Object.freeze({ ids: Object.freeze([0, 5]), explanation: 'APRICOT and PLUM are both stone fruits: each has a hard pit around its seed.' }),
  Object.freeze({ ids: Object.freeze([0, 7]), explanation: 'APRICOT and LEMON are both tree fruits used in preserves and desserts.' }),
  Object.freeze({ ids: Object.freeze([2, 5]), explanation: 'MANGO and PLUM are both fleshy fruits with a hard pit inside.' }),
  Object.freeze({ ids: Object.freeze([2, 7]), explanation: 'MANGO and LEMON are both edible fruits that grow on trees.' }),
  Object.freeze({ ids: Object.freeze([5, 7]), explanation: 'PLUM and LEMON are both tree fruits used to make jams or preserves.' }),
]);
