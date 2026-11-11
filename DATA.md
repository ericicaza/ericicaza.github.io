# Anti-Connections scoring data

The first board uses these original example words: APRICOT, TUBA, SUBPOENA, NEBULA, MANGO, CELLO, VERDICT, QUASAR, PLUM, OBOE, AFFIDAVIT, GALAXY, LEMON, HARP, INJUNCTION, PULSAR.

The numbers in `games/anti-connections/data.js` are measured cosine similarities, generated locally with [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). Its official model card declares the [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0). The site distributes only the small derived similarity matrix, not model weights.

- Model revision: `1110a243fdf4706b3f48f1d95db1a4f5529b4d41`.
- Generation: Python 3.11.4, PyTorch 2.2.0+cpu, Transformers 4.38.2, NumPy 1.26.4; model in evaluation mode.
- Input: each isolated word in lowercase, without a prompt or category label.
- Pooling: mean over tokens, respecting the attention mask, followed by L2 normalization, as shown in the model's official example.
- Output: 384-dimensional vectors, converted to a symmetric cosine matrix rounded to seven decimal places. The diagonal is set to exactly 1.
- Reproduce: install `torch` and `transformers`, then run `python scripts/prepare-embeddings.py`. For the closest numerical reproduction, use the versions above; minor floating-point differences can occur with other hardware or library versions. Model files are downloaded to the standard Hugging Face cache, outside this repository.

For four words, there are six unordered pairs. A group's cost is `0.75 × mean(pair cosine similarities) + 0.25 × max(pair cosine similarity)`. The board cost is the average of the four group costs. Lower cost is better. The strongest-pair term discourages hiding an obvious relationship among distant words.

The engine computes the exact minimum and maximum board cost using dynamic programming over subsets. Its search covers every four-way partition into groups of four, with the smallest remaining word anchoring each group to avoid duplicate orderings. The displayed board score is `100 × (worst cost − current cost) / (worst cost − best cost)`, clamped to 0–100. A score of 100 means the best arrangement under this fixed model and rule; several arrangements can tie. Reordering rows or words inside a row does not affect the score.

The hint function finds the best improving single swap. A local optimum can require multiple swaps to improve; a missing single-swap hint does not imply a globally optimal board.

The model is intended for sentences and short paragraphs; using it for isolated words is an experimental game mechanic. Cosine similarity is not an objective measure of meaning and can miss wordplay, alternate senses, and human associations. No claim is made that a winning board is universally the least related set of words. Browser play uses only the bundled matrix, with no model download, account, API key, or network inference.
