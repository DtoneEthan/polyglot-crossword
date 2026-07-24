# Polyglot Crossword

A multilingual crossword puzzle game supporting **English**, **Español**, **中文**, and **Français**.

## Features

- 4 language puzzles (EN / ES / ZH / FR) — switch instantly
- Interactive grid with keyboard & touch support
- Across / Down clue lists with click-to-jump
- Check answers, reveal word, hint, clear
- Live timer and progress tracker
- Completion celebration modal
- Fully responsive (desktop + mobile)
- Chinese puzzle uses character-based cells (Noto Sans SC)

## How to Play

1. Pick a language tab at the top
2. Click any cell to start — type letters (or characters for Chinese)
3. Click the same cell again to switch between Across and Down
4. Use arrow keys to navigate, Tab to jump to the next word
5. Use **Check** to mark correct/incorrect, **Reveal** to show the current word, **Hint** for one letter

## Tech

Pure static site — no build step, no dependencies.
- `index.html` — structure
- `styles.css` — styling
- `game.js` — game logic
- `puzzles.json` — generated crossword data (see `generate_puzzles.py`)

## License

MIT
