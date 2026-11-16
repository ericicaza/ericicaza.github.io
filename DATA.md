# Anti-Connections puzzle notes

This is a curated eight-word puzzle. Pick the four outliers in at most three guesses. Each submitted guess must contain exactly four different words. Feedback gives only the number of correct selections, from 0 to 4; it does not identify which selected words are correct. Repeating the same four words in another order does not use a guess.

The round ends with a win when all four selections are correct, including on the third guess. Otherwise, the third accepted guess ends the round with a loss. Further submissions are locked until a new round begins. The interface reveals the answer only after the round ends.

## Board 001 answer

The four related distractors are **APRICOT, MANGO, PLUM, LEMON**. Their connection is **Fruits**.

The four intended outliers are **TUBA, SUBPOENA, NEBULA, SOMERSAULT**: respectively, a musical instrument, a legal term, an astronomical object, and an acrobatic movement. They come from different domains and fall outside the fruit category. This is the board's intended category rule, not a claim that these words have no conceivable shared association.

After the round, the pair inspector explains all six possible pairs within the related group. These are curated factual descriptions: all four are tree fruits; apricots, mangoes and plums have hard pits; the notes also mention familiar culinary uses. There is no model-generated association or correctness feedback for individual words during play.

The fixed board ID is `four-outliers-v2`. Its display order deliberately mixes distractors and outliers. Restarting replays the same puzzle rather than generating a new answer.

## Implementation

The game uses a fixed answer set, not word embeddings, cosine similarity, or a 0–100 arrangement score. The previous embedding data and generator have been retired so they cannot overwrite this puzzle.

All gameplay runs in the browser. Local persistence stores the board ID and guess history. On restoration, the engine validates each selection and recomputes correctness, win/loss status, and remaining guesses. Serialized feedback and counters are ignored. Invalid histories or saved progress for another board start a fresh round.

The answer is part of this static website's source code and these notes. It is hidden by the game interface during play; this is a casual puzzle, not a system that conceals the answer from someone inspecting the source. No model download, account, or API key is required to play.
