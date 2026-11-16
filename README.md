# Eric's Arcade

A small home for browser games at https://ericicaza.github.io/.

## Anti-Connections

Find four outsiders among eight words. Four words form a connected set: each of their six pairs makes a different familiar word or phrase, rather than all four belonging to one category. The other four are the intended outliers. Select four words and submit a guess. Each attempt reports only how many selections are correct, without identifying them. Find all four within three guesses to win. The answers are revealed after a win or after the third unsuccessful guess. After either outcome, select two of the four connected words to see an explanation of their connection; all six pairs are available to explore.

The first release contains one curated board. Replay starts another round of that same board; this is not a daily puzzle. The game runs entirely in the browser without an API key or backend, and saves the current round on the player's device. See [DATA.md](DATA.md) for the board data and rules.

## Local development

With Python 3 installed, run `python -m http.server 4173 --bind 127.0.0.1` from this directory, then open http://127.0.0.1:4173/. Use an HTTP server because the game loads JavaScript modules.

Run the game engine checks with `npm test` (Node.js 20 or newer). There are no runtime npm dependencies or build steps.

## Publish

GitHub Pages serves the `main` branch from the repository root. Pushing a commit to `main` updates the site. `.nojekyll` keeps the files unchanged.

## Add another game

Put its static files in `games/<game-name>/`, give it a link back to the homepage, and add a playable entry to `index.html`. Keep paths relative so local previews and GitHub Pages both work.
