# Eric's Arcade

A small home for browser games at https://ericicaza.github.io/.

## Anti-Connections

Arrange sixteen words into four groups of four that are as unrelated as possible. Select two words in different rows to swap them, check your score, and use pair feedback to improve your arrangement. The first board uses the fruit, instrument, legal, and astronomy words from the original game concept.

Scores use real, precomputed word embeddings. The game runs entirely in the browser without an API key or backend. Progress and personal bests are saved on the player's device. See [DATA.md](DATA.md) for the model, scoring formula, attribution, and reproducibility instructions.

## Local development

With Python 3 installed, run `python -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173/. Use an HTTP server because the game loads JavaScript modules.

Run the game engine checks with `npm test` (Node.js 20 or newer). There are no runtime npm dependencies or build steps.

## Publish

GitHub Pages serves the `main` branch from the repository root. Pushing a commit to `main` updates the site. `.nojekyll` keeps the files unchanged.

## Add another game

Put its static files in `games/<game-name>/`, give it a link back to the homepage, and add a playable entry to `index.html`. Keep paths relative so local previews and GitHub Pages both work.
