# Anti-Connections puzzle notes

This is a curated eight-word puzzle. Pick the four outliers in at most three guesses. Each submitted guess must contain exactly four different words. Feedback gives only the number of correct selections, from 0 to 4; it does not identify which selected words are correct. Repeating the same four words in another order does not use a guess.

The round ends with a win when all four selections are correct, including on the third guess. Otherwise, the third accepted guess ends the round with a loss. Further submissions are locked until a new round begins. The interface reveals the answer only after the round ends.

## Board 001 answer

The four linked distractors are **FIRE, LIGHT, HOUSE, WORK**. Every pair has a different conventional word or phrase with a specific meaning:

- FIRE + LIGHT → **firelight**: the glow from flames.
- FIRE + HOUSE → **firehouse**: a station for firefighters and fire engines.
- FIRE + WORK → **firework**: a pyrotechnic device producing light, color, or sound.
- LIGHT + HOUSE → **lighthouse**: a tower whose light guides or warns ships.
- LIGHT + WORK → **light work**: an easy task requiring little effort.
- HOUSE + WORK → **housework**: domestic chores such as cleaning and laundry.

The four intended outliers are **QUOTIENT, TUBA, HICCUP, PARSNIP**: a mathematical result, a musical instrument, an involuntary bodily action, and a root vegetable. They do not form the intended six-link network. This is a curated puzzle rule, not a claim that these words have no conceivable associations with one another or with the other choices.

After the round, the pair inspector explains all six possible pairs within the linked group. The links lead to six distinct meanings; the words are not four members of one topic category. Most links are compound words and one is a phrase, so the game does not claim to demonstrate six different linguistic mechanisms. There is no model-generated association or correctness feedback for individual words during play.

The fixed board ID is `six-links-v3`. Its display order deliberately mixes distractors and outliers. Restarting replays the same puzzle rather than generating a new answer.

## Implementation

The game uses a fixed answer set, not word embeddings, cosine similarity, or a 0–100 arrangement score. The previous embedding data and generator have been retired so they cannot overwrite this puzzle.

All gameplay runs in the browser. Local persistence stores the board ID and guess history. On restoration, the engine validates each selection and recomputes correctness, win/loss status, and remaining guesses. Serialized feedback and counters are ignored. Invalid histories or saved progress for another board start a fresh round.

The answer is part of this static website's source code and these notes. It is hidden by the game interface during play; this is a casual puzzle, not a system that conceals the answer from someone inspecting the source. No model download, account, or API key is required to play.
