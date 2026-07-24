/* ===== Polyglot Crossword — Game Logic ===== */

(() => {
  'use strict';

  // ===== State =====
  const state = {
    puzzles: null,       // puzzle data for all languages
    lang: 'en',          // current language
    puzzle: null,        // current puzzle object
    userGrid: null,      // 2D array of user input
    cellEls: null,       // 2D array of cell DOM elements
    inputEls: null,      // 2D array of input DOM elements
    selRow: -1,          // selected cell row
    selCol: -1,          // selected cell col
    direction: 'across', // 'across' | 'down'
    timerStart: 0,
    timerInterval: null,
    solved: false,
    revealedCells: new Set(),  // cells revealed by user
  };

  // ===== DOM refs =====
  const $grid = document.getElementById('grid');
  const $acrossClues = document.getElementById('acrossClues');
  const $downClues = document.getElementById('downClues');
  const $timer = document.getElementById('timer');
  const $progress = document.getElementById('progress');
  const $currentClueLabel = document.getElementById('currentClueLabel');
  const $modalOverlay = document.getElementById('modalOverlay');
  const $modalText = document.getElementById('modalText');
  const $modalStats = document.getElementById('modalStats');
  const $hiddenInput = document.getElementById('hiddenInput');
  const $howtoOverlay = document.getElementById('howtoOverlay');

  // ===== Language metadata =====
  const LANG_META = {
    en: { name: 'English',  nativeName: 'English',  cellType: 'letter' },
    es: { name: 'Spanish',  nativeName: 'Español',  cellType: 'letter' },
    zh: { name: 'Chinese',  nativeName: '中文',      cellType: 'char'   },
    fr: { name: 'French',   nativeName: 'Français', cellType: 'letter' },
  };

  // ===== UI text (localized) =====
  const I18N = {
    en: {
      howtoBtn: "❓ How to Play",
      check: "Check", reveal: "Reveal", clear: "Clear", hint: "Hint",
      tapToStart: "Tap a cell to start solving",
      solvedTitle: "Solved!", solvedText: "You completed the puzzle!",
      close: "Close", gotIt: "Got it!", dontShow: "Don't show again",
    },
    es: {
      howtoBtn: "❓ Cómo jugar",
      check: "Comprobar", reveal: "Revelar", clear: "Borrar", hint: "Pista",
      tapToStart: "Toca una casilla para empezar",
      solvedTitle: "¡Resuelto!", solvedText: "¡Completaste el rompecabezas!",
      close: "Cerrar", gotIt: "¡Entendido!", dontShow: "No mostrar de nuevo",
    },
    zh: {
      howtoBtn: "❓ 玩法说明",
      check: "检查", reveal: "揭示", clear: "清空", hint: "提示",
      tapToStart: "点击格子开始填字",
      solvedTitle: "完成！", solvedText: "你解开了这道谜题！",
      close: "关闭", gotIt: "明白了", dontShow: "不再自动显示",
    },
    fr: {
      howtoBtn: "❓ Comment jouer",
      check: "Vérifier", reveal: "Révéler", clear: "Effacer", hint: "Indice",
      tapToStart: "Touchez une case pour commencer",
      solvedTitle: "Résolu !", solvedText: "Vous avez complété la grille !",
      close: "Fermer", gotIt: "Compris !", dontShow: "Ne plus afficher",
    },
  };

  // ===== How-to-play content (localized) =====
  const HOWTO = {
    en: {
      title: "How to Play",
      intro: "Fill the grid with words from four languages — easier than it looks!",
      steps: [
        { icon: "🎯", t: "Goal", d: "Fill every white cell with the correct letter so all the words are complete." },
        { icon: "👆", t: "Select a cell", d: "Tap any white square. Tap it again to switch between Across (→) and Down (↓)." },
        { icon: "⌨️", t: "Type letters", d: "Use your keyboard, or the on-screen keyboard on a phone. (Chinese puzzle uses pinyin/IME.)" },
        { icon: "➡️", t: "Move around", d: "Arrow keys or Tab move between cells and words. Press Space to flip direction." },
        { icon: "🧩", t: "Read the clues", d: "Across (→) and Down (↓) lists are on the right. The numbers match the small numbers on the grid." },
        { icon: "🛠️", t: "Need help?", d: "Check = verify, Reveal = show current word, Hint = fill one letter, Clear = reset all." },
        { icon: "🌍", t: "Switch language", d: "Pick EN / ES / 中文 / FR anytime from the top to play a different puzzle." },
        { icon: "🏆", t: "Win", d: "Fill every cell correctly and the puzzle is solved!" },
      ],
    },
    es: {
      title: "Cómo jugar",
      intro: "Rellena la cuadrícula con palabras en cuatro idiomas. ¡Más fácil de lo que parece!",
      steps: [
        { icon: "🎯", t: "Meta", d: "Rellena cada casilla blanca con la letra correcta para completar todas las palabras." },
        { icon: "👆", t: "Elige una casilla", d: "Toca cualquier casilla blanca. Tócala de nuevo para cambiar entre Horizontal (→) y Vertical (↓)." },
        { icon: "⌨️", t: "Escribe", d: "Usa tu teclado o el teclado en pantalla del móvil. (El puzzle en chino usa pinyin/IME.)" },
        { icon: "➡️", t: "Muévete", d: "Las flechas o Tab mueven entre casillas y palabras. Pulsa Espacio para cambiar de dirección." },
        { icon: "🧩", t: "Lee las pistas", d: "Las listas Horizontal (→) y Vertical (↓) están a la derecha. Los números coinciden con los de la cuadrícula." },
        { icon: "🛠️", t: "¿Necesitas ayuda?", d: "Comprobar = verificar, Revelar = mostrar palabra, Pista = una letra, Borrar = reiniciar." },
        { icon: "🌍", t: "Cambia de idioma", d: "Elige EN / ES / 中文 / FR arriba para jugar a otro puzzle." },
        { icon: "🏆", t: "Gana", d: "¡Rellena todas las casillas correctamente y resuelto!" },
      ],
    },
    zh: {
      title: "玩法说明",
      intro: "用四种语言填字——比看起来简单！",
      steps: [
        { icon: "🎯", t: "目标", d: "把每个白色格子填入正确的字（用拼音或输入法），让所有词语都完整。" },
        { icon: "👆", t: "选格子", d: "点击任意白色格子；再点一次可在横向（→）和纵向（↓）之间切换。" },
        { icon: "⌨️", t: "输入", d: "用键盘，或在手机上用屏幕键盘填写。（中文谜题用拼音/输入法。）" },
        { icon: "➡️", t: "移动", d: "方向键或 Tab 在格子与词语间移动；按空格切换方向。" },
        { icon: "🧩", t: "看提示", d: "右侧是横向（→）和纵向（↓）提示，格子上的小数字与提示编号对应。" },
        { icon: "🛠️", t: "需要帮助", d: "检查=核对；揭示=显示当前词；提示=填一个字；清空=全部清除。" },
        { icon: "🌍", t: "切换语言", d: "顶部随时选择 EN / ES / 中文 / FR 玩不同的谜题。" },
        { icon: "🏆", t: "通关", d: "所有格子都填对，谜题就解开啦！" },
      ],
    },
    fr: {
      title: "Comment jouer",
      intro: "Remplissez la grille avec des mots en quatre langues. Plus simple qu’il n’y paraît !",
      steps: [
        { icon: "🎯", t: "But", d: "Remplissez chaque case blanche avec la bonne lettre pour compléter tous les mots." },
        { icon: "👆", t: "Choisir", d: "Touchez une case blanche. Retouchez pour basculer entre Horizontal (→) et Vertical (↓)." },
        { icon: "⌨️", t: "Saisir", d: "Utilisez votre clavier ou le clavier à l’écran du téléphone. (Le puzzle chinois utilise pinyin/IME.)" },
        { icon: "➡️", t: "Se déplacer", d: "Les flèches ou Tab déplacent entre cases et mots. Espace inverse le sens." },
        { icon: "🧩", t: "Lire les indices", d: "Les listes Horizontal (→) et Vertical (↓) sont à droite. Les numéros correspondent à ceux de la grille." },
        { icon: "🛠️", t: "Besoin d’aide ?", d: "Vérifier = contrôler, Révéler = montrer le mot, Indice = une lettre, Effacer = réinitialiser." },
        { icon: "🌍", t: "Changer de langue", d: "Choisissez EN / ES / 中文 / FR en haut pour un autre puzzle." },
        { icon: "🏆", t: "Gagner", d: "Remplissez toutes les cases correctement pour résoudre la grille !" },
      ],
    },
  };

  // ===== Init =====
  async function init() {
    try {
      const res = await fetch('puzzles.json');
      state.puzzles = await res.json();
    } catch (e) {
      // Fallback: try embedded (in case fetch fails)
      console.error('Failed to load puzzles.json:', e);
      $currentClueLabel.textContent = 'Error loading puzzles. Make sure puzzles.json is present.';
      return;
    }
    bindEvents();
    loadPuzzle('en');

    // Show how-to on first visit (unless the user opted out)
    if (!localStorage.getItem('polyglot_howto_dontshow')) {
      showHowto();
    }
  }

  // ===== Load puzzle for a language =====
  function loadPuzzle(lang) {
    state.lang = lang;
    state.puzzle = state.puzzles[lang];
    const p = state.puzzle;
    const rows = p.rows;
    const cols = p.cols;

    // Init user grid
    state.userGrid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push('');
      }
      state.userGrid.push(row);
    }

    state.revealedCells = new Set();
    state.solved = false;
    state.selRow = -1;
    state.selCol = -1;
    state.direction = 'across';

    // Set grid class for Chinese
    $grid.className = 'grid' + (lang === 'zh' ? ' lang-zh' : '');
    $grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;

    // Build cell grid
    $grid.innerHTML = '';
    state.cellEls = [];
    state.inputEls = [];

    for (let r = 0; r < rows; r++) {
      const cellRow = [];
      const inputRow = [];
      for (let c = 0; c < cols; c++) {
        const sol = p.solution[r][c];
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (sol) {
          cell.classList.add('active');
          const num = p.cellNumbers[r][c];
          if (num > 0) {
            const numEl = document.createElement('span');
            numEl.className = 'cell-number';
            numEl.textContent = num;
            cell.appendChild(numEl);
          }
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.autocomplete = 'off';
          input.spellcheck = false;
          input.dataset.row = r;
          input.dataset.col = c;
          input.setAttribute('aria-label', `Row ${r+1}, Column ${c+1}`);
          cell.appendChild(input);
          inputRow.push(input);
        } else {
          inputRow.push(null);
        }

        $grid.appendChild(cell);
        cellRow.push(cell);
      }
      state.cellEls.push(cellRow);
      state.inputEls.push(inputRow);
    }

    // Build clues
    renderClues();

    // Update UI
    updateProgress();
    resetTimer();
    startTimer();

    // Auto-select first across clue
    if (p.across.length > 0) {
      selectCell(p.across[0].row, p.across[0].col, 'across');
    }

    updateCurrentClueBar();
    updateUIText();
  }

  // ===== Render clues =====
  function renderClues() {
    const p = state.puzzle;
    $acrossClues.innerHTML = '';
    $downClues.innerHTML = '';

    p.across.forEach(clue => {
      const li = createClueItem(clue, 'across');
      $acrossClues.appendChild(li);
    });

    p.down.forEach(clue => {
      const li = createClueItem(clue, 'down');
      $downClues.appendChild(li);
    });
  }

  function createClueItem(clue, direction) {
    const li = document.createElement('li');
    li.className = 'clue-item';
    li.dataset.number = clue.number;
    li.dataset.direction = direction;

    const num = document.createElement('span');
    num.className = 'clue-num';
    num.textContent = clue.number + '.';

    const text = document.createElement('span');
    text.className = 'clue-text';
    text.textContent = clue.clue;

    li.appendChild(num);
    li.appendChild(text);

    li.addEventListener('click', () => {
      selectCell(clue.row, clue.col, direction);
    });

    return li;
  }

  // ===== Cell selection =====
  function selectCell(row, col, direction) {
    if (!state.cellEls[row] || !state.cellEls[row][col]) return;
    if (!state.cellEls[row][col].classList.contains('active')) return;

    // Toggle direction if clicking same cell
    if (state.selRow === row && state.selCol === col && direction === undefined) {
      state.direction = state.direction === 'across' ? 'down' : 'across';
    } else if (direction) {
      state.direction = direction;
    }

    state.selRow = row;
    state.selCol = col;

    // Clear previous selection
    document.querySelectorAll('.cell.selected, .cell.highlighted')
      .forEach(el => {
        el.classList.remove('selected', 'highlighted');
      });

    // Highlight current word
    let word = findWordAt(row, col, state.direction);
    // If no word in current direction, auto-switch to the other direction
    if (!word) {
      state.direction = state.direction === 'across' ? 'down' : 'across';
      word = findWordAt(row, col, state.direction);
    }
    if (word) {
      word.cells.forEach(([r, c]) => {
        state.cellEls[r][c].classList.add('highlighted');
      });
    }

    // Select current cell
    state.cellEls[row][col].classList.remove('highlighted');
    state.cellEls[row][col].classList.add('selected');

    // Focus the real cell input so the on-screen keyboard appears on mobile
    const input = state.inputEls[row][col];
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
    }

    // Update clue highlighting
    highlightClue(word);

    updateCurrentClueBar();
  }

  // ===== Find word at position =====
  function findWordAt(row, col, direction) {
    const p = state.puzzle;
    if (!p.solution[row] || !p.solution[row][col]) return null;

    if (direction === 'across') {
      // Find start (go left until block)
      let startCol = col;
      while (startCol > 0 && p.solution[row][startCol - 1]) startCol--;
      // Find end
      let endCol = col;
      while (endCol + 1 < p.cols && p.solution[row][endCol + 1]) endCol++;

      if (endCol === startCol) return null; // single cell, not a word

      const cells = [];
      for (let c = startCol; c <= endCol; c++) cells.push([row, c]);

      // Find the clue number
      const num = p.cellNumbers[row][startCol];
      const clue = p.across.find(c => c.number === num);
      return { cells, clue, direction: 'across' };
    } else {
      let startRow = row;
      while (startRow > 0 && p.solution[startRow - 1][col]) startRow--;
      let endRow = row;
      while (endRow + 1 < p.rows && p.solution[endRow + 1][col]) endRow++;

      if (endRow === startRow) return null;

      const cells = [];
      for (let r = startRow; r <= endRow; r++) cells.push([r, col]);

      const num = p.cellNumbers[startRow][col];
      const clue = p.down.find(c => c.number === num);
      return { cells, clue, direction: 'down' };
    }
  }

  // ===== Highlight active clue =====
  function highlightClue(word) {
    document.querySelectorAll('.clue-item.active')
      .forEach(el => el.classList.remove('active'));

    if (word && word.clue) {
      const selector = `.clue-item[data-number="${word.clue.number}"][data-direction="${word.direction}"]`;
      const el = document.querySelector(selector);
      if (el) {
        el.classList.add('active');
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  // ===== Update current clue bar =====
  function updateCurrentClueBar() {
    const word = findWordAt(state.selRow, state.selCol, state.direction);
    if (word && word.clue) {
      const arrow = word.direction === 'across' ? '→' : '↓';
      $currentClueLabel.textContent = `${word.clue.number} ${arrow} ${word.clue.clue}`;
    } else {
      $currentClueLabel.textContent = I18N[state.lang].tapToStart;
    }
  }

  // ===== Input handling =====
  function handleInput(row, col, value) {
    if (!state.userGrid[row]) return;

    // Take last character (for Chinese IME or multi-char paste)
    const ch = value.slice(-1);
    if (!ch) return;

    state.userGrid[row][col] = ch;
    const input = state.inputEls[row][col];
    if (input) input.value = ch;

    // Remove check states
    state.cellEls[row][col].classList.remove('correct', 'incorrect');

    // Advance to next cell
    advance();
    updateProgress();
    checkCompletion();
  }

  function handleBackspace(row, col) {
    if (state.userGrid[row][col]) {
      // Clear current cell
      state.userGrid[row][col] = '';
      const input = state.inputEls[row][col];
      if (input) input.value = '';
      state.cellEls[row][col].classList.remove('correct', 'incorrect');
      updateProgress();
    } else {
      // Go back to previous cell
      retreat();
      const r = state.selRow, c = state.selCol;
      if (state.userGrid[r] && state.userGrid[r][c]) {
        state.userGrid[r][c] = '';
        const input = state.inputEls[r][c];
        if (input) input.value = '';
        state.cellEls[r][c].classList.remove('correct', 'incorrect');
        updateProgress();
      }
    }
  }

  function advance() {
    const word = findWordAt(state.selRow, state.selCol, state.direction);
    if (!word) return;

    const cells = word.cells;
    const idx = cells.findIndex(([r, c]) => r === state.selRow && c === state.selCol);
    if (idx === -1) return;

    // Find next empty cell in the word
    for (let i = idx + 1; i < cells.length; i++) {
      const [r, c] = cells[i];
      if (!state.userGrid[r][c]) {
        selectCell(r, c);
        return;
      }
    }
    // All filled after current — just go to next cell
    if (idx + 1 < cells.length) {
      selectCell(cells[idx + 1][0], cells[idx + 1][1]);
    }
  }

  function retreat() {
    const word = findWordAt(state.selRow, state.selCol, state.direction);
    if (!word) return;

    const cells = word.cells;
    const idx = cells.findIndex(([r, c]) => r === state.selRow && c === state.selCol);
    if (idx > 0) {
      selectCell(cells[idx - 1][0], cells[idx - 1][1]);
    }
  }

  // ===== Keyboard navigation =====
  function handleKeyDown(e) {
    const key = e.key;
    const r = state.selRow, c = state.selCol;
    if (r < 0) return;

    // Skip during IME composition (Chinese input)
    if (e.isComposing || key === 'Process') return;

    // Printable Latin letters — handle directly (prevents cursor issues)
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      e.preventDefault();
      handleInput(r, c, key.toUpperCase());
      return;
    }

    if (key === 'ArrowLeft') {
      e.preventDefault();
      if (state.direction === 'down') {
        state.direction = 'across';
        updateSelection();
      } else {
        moveSelection(0, -1);
      }
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      if (state.direction === 'down') {
        state.direction = 'across';
        updateSelection();
      } else {
        moveSelection(0, 1);
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      if (state.direction === 'across') {
        state.direction = 'down';
        updateSelection();
      } else {
        moveSelection(-1, 0);
      }
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      if (state.direction === 'across') {
        state.direction = 'down';
        updateSelection();
      } else {
        moveSelection(1, 0);
      }
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleBackspace(r, c);
    } else if (key === 'Tab') {
      e.preventDefault();
      nextWord(e.shiftKey ? -1 : 1);
    } else if (key === ' ') {
      e.preventDefault();
      state.direction = state.direction === 'across' ? 'down' : 'across';
      updateSelection();
    }
  }

  function moveSelection(dr, dc) {
    let r = state.selRow + dr;
    let c = state.selCol + dc;
    const p = state.puzzle;
    while (r >= 0 && r < p.rows && c >= 0 && c < p.cols) {
      if (p.solution[r] && p.solution[r][c]) {
        selectCell(r, c);
        return;
      }
      r += dr;
      c += dc;
    }
  }

  function updateSelection() {
    if (state.selRow >= 0) {
      selectCell(state.selRow, state.selCol);
    }
  }

  function nextWord(dir) {
    const allClues = [
      ...state.puzzle.across.map(c => ({ ...c, dir: 'across' })),
      ...state.puzzle.down.map(c => ({ ...c, dir: 'down' })),
    ];

    const currentWord = findWordAt(state.selRow, state.selCol, state.direction);
    let currentIdx = -1;
    if (currentWord && currentWord.clue) {
      currentIdx = allClues.findIndex(c =>
        c.number === currentWord.clue.number && c.dir === currentWord.direction
      );
    }

    let nextIdx = currentIdx + dir;
    if (nextIdx >= allClues.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = allClues.length - 1;

    const next = allClues[nextIdx];
    selectCell(next.row, next.col, next.dir);
  }

  // ===== Check / Reveal / Clear / Hint =====
  function checkAnswers() {
    const p = state.puzzle;
    for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        if (p.solution[r][c]) {
          const input = state.userGrid[r][c];
          if (input) {
            const cell = state.cellEls[r][c];
            cell.classList.remove('correct', 'incorrect');
            if (input.toUpperCase() === p.solution[r][c].toUpperCase()) {
              cell.classList.add('correct');
            } else {
              cell.classList.add('incorrect');
            }
          }
        }
      }
    }
  }

  function revealWord() {
    const word = findWordAt(state.selRow, state.selCol, state.direction);
    if (!word) return;

    word.cells.forEach(([r, c]) => {
      state.userGrid[r][c] = state.puzzle.solution[r][c];
      state.revealedCells.add(`${r},${c}`);
      const input = state.inputEls[r][c];
      if (input) input.value = state.puzzle.solution[r][c];
      state.cellEls[r][c].classList.remove('correct', 'incorrect');
      state.cellEls[r][c].classList.add('revealed');
    });
    updateProgress();
    checkCompletion();
  }

  function clearAll() {
    if (!confirm('Clear all answers?')) return;
    const p = state.puzzle;
    for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        if (p.solution[r][c]) {
          state.userGrid[r][c] = '';
          const input = state.inputEls[r][c];
          if (input) input.value = '';
          state.cellEls[r][c].classList.remove('correct', 'incorrect', 'revealed');
        }
      }
    }
    state.revealedCells.clear();
    updateProgress();
  }

  function hint() {
    const word = findWordAt(state.selRow, state.selCol, state.direction);
    if (!word) return;

    // Find first empty cell in the word
    for (const [r, c] of word.cells) {
      if (!state.userGrid[r][c]) {
        state.userGrid[r][c] = state.puzzle.solution[r][c];
        state.revealedCells.add(`${r},${c}`);
        const input = state.inputEls[r][c];
        if (input) input.value = state.puzzle.solution[r][c];
        state.cellEls[r][c].classList.add('revealed');
        updateProgress();
        checkCompletion();
        return;
      }
    }
    // All filled — reveal a wrong one
    for (const [r, c] of word.cells) {
      if (state.userGrid[r][c].toUpperCase() !== state.puzzle.solution[r][c].toUpperCase()) {
        state.userGrid[r][c] = state.puzzle.solution[r][c];
        state.revealedCells.add(`${r},${c}`);
        const input = state.inputEls[r][c];
        if (input) input.value = state.puzzle.solution[r][c];
        state.cellEls[r][c].classList.remove('correct', 'incorrect');
        state.cellEls[r][c].classList.add('revealed');
        updateProgress();
        checkCompletion();
        return;
      }
    }
  }

  // ===== Progress tracking =====
  function updateProgress() {
    const p = state.puzzle;
    const allWords = [...p.across, ...p.down];
    let solved = 0;

    allWords.forEach(clue => {
      if (isWordSolved(clue)) solved++;
    });

    $progress.textContent = `${solved}/${allWords.length}`;

    // Update clue solved state
    document.querySelectorAll('.clue-item').forEach(el => {
      const num = parseInt(el.dataset.number);
      const dir = el.dataset.direction;
      const clue = dir === 'across'
        ? p.across.find(c => c.number === num)
        : p.down.find(c => c.number === num);
      if (clue && isWordSolved(clue)) {
        el.classList.add('solved');
      } else {
        el.classList.remove('solved');
      }
    });
  }

  function isWordSolved(clue) {
    const p = state.puzzle;
    const dir = p.across.includes(clue) ? 'across' : 'down';
    const dr = dir === 'across' ? 0 : 1;
    const dc = dir === 'across' ? 1 : 0;
    for (let i = 0; i < clue.length; i++) {
      const r = clue.row + dr * i;
      const c = clue.col + dc * i;
      if (state.userGrid[r][c].toUpperCase() !== p.solution[r][c].toUpperCase()) {
        return false;
      }
    }
    return true;
  }

  function checkCompletion() {
    const p = state.puzzle;
    for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        if (p.solution[r][c]) {
          if (state.userGrid[r][c].toUpperCase() !== p.solution[r][c].toUpperCase()) {
            return;
          }
        }
      }
    }
    // All correct!
    onSolved();
  }

  function onSolved() {
    if (state.solved) return;
    state.solved = true;
    stopTimer();

    const elapsed = formatTime(Date.now() - state.timerStart);
    const revealed = state.revealedCells.size;
    const total = countActiveCells();

    document.getElementById('modalOverlay').querySelector('.modal-title').textContent = I18N[state.lang].solvedTitle;
    $modalText.textContent = I18N[state.lang].solvedText;
    $modalStats.innerHTML = `
      ⏱ Time: <strong>${elapsed}</strong><br>
      ✏️ Cells filled: <strong>${total}</strong><br>
      💡 Hints used: <strong>${revealed}</strong>
    `;
    $modalOverlay.classList.add('show');
  }

  function countActiveCells() {
    const p = state.puzzle;
    let count = 0;
    for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        if (p.solution[r][c]) count++;
      }
    }
    return count;
  }

  // ===== Timer =====
  function startTimer() {
    state.timerStart = Date.now();
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function resetTimer() {
    stopTimer();
    $timer.textContent = '00:00';
  }

  function updateTimer() {
    const elapsed = Date.now() - state.timerStart;
    $timer.textContent = formatTime(elapsed);
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // ===== How-to-play =====
  function renderHowto() {
    const h = HOWTO[state.lang];
    if (!h) return;
    document.getElementById('howtoTitle').textContent = h.title;
    document.getElementById('howtoIntro').textContent = h.intro;
    const ul = document.getElementById('howtoSteps');
    ul.innerHTML = '';
    h.steps.forEach(s => {
      const li = document.createElement('li');
      li.className = 'howto-step';
      const icon = document.createElement('span');
      icon.className = 'howto-icon';
      icon.textContent = s.icon;
      const body = document.createElement('span');
      body.className = 'howto-body';
      const strong = document.createElement('strong');
      strong.textContent = s.t;
      const desc = document.createElement('span');
      desc.textContent = s.d;
      body.appendChild(strong);
      body.appendChild(desc);
      li.appendChild(icon);
      li.appendChild(body);
      ul.appendChild(li);
    });
  }

  function showHowto() {
    renderHowto();
    const cb = document.getElementById('howtoDontShow');
    if (cb) cb.checked = !!localStorage.getItem('polyglot_howto_dontshow');
    $howtoOverlay.classList.add('show');
  }

  function hideHowto() {
    $howtoOverlay.classList.remove('show');
  }

  function updateUIText() {
    const t = I18N[state.lang];
    if (!t) return;
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set('btnHowto', t.howtoBtn);
    set('btnCheck', t.check);
    set('btnReveal', t.reveal);
    set('btnClear', t.clear);
    set('btnHint', t.hint);
    set('howtoDontShowLabel', t.dontShow);
    set('howtoClose', t.gotIt);
    set('modalClose', t.close);
    if (state.selRow < 0) {
      $currentClueLabel.textContent = t.tapToStart;
    }
  }

  // ===== Mobile detection =====
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  // ===== Event binding =====
  function bindEvents() {
    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPuzzle(lang);
        if ($howtoOverlay.classList.contains('show')) renderHowto();
      });
    });

    // Grid: mousedown on cells (use mousedown + preventDefault to avoid
    // focus/click double-firing that toggles direction on every click)
    $grid.addEventListener('mousedown', (e) => {
      const cell = e.target.closest('.cell.active');
      if (!cell) return;
      e.preventDefault(); // prevent default focus, we focus manually
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      selectCell(row, col);
    });

    // Grid: input events (typing — mainly for Chinese IME and mobile keyboards)
    $grid.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT') {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        if (e.target.value) {
          handleInput(row, col, e.target.value);
        }
      }
    });

    // Clear input before IME composition to avoid stale characters
    $grid.addEventListener('compositionstart', (e) => {
      if (e.target.tagName === 'INPUT') {
        e.target.value = '';
      }
    });

    // Grid: keydown on inputs (navigation, backspace, etc.)
    $grid.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') {
        handleKeyDown(e);
      }
    });

    // Buttons
    document.getElementById('btnCheck').addEventListener('click', checkAnswers);
    document.getElementById('btnReveal').addEventListener('click', revealWord);
    document.getElementById('btnClear').addEventListener('click', clearAll);
    document.getElementById('btnHint').addEventListener('click', hint);
    document.getElementById('modalClose').addEventListener('click', () => {
      $modalOverlay.classList.remove('show');
    });
    $modalOverlay.addEventListener('click', (e) => {
      if (e.target === $modalOverlay) $modalOverlay.classList.remove('show');
    });

    // How-to-play modal
    document.getElementById('btnHowto').addEventListener('click', showHowto);
    document.getElementById('howtoClose').addEventListener('click', hideHowto);
    document.getElementById('howtoCloseX').addEventListener('click', hideHowto);
    $howtoOverlay.addEventListener('click', (e) => {
      if (e.target === $howtoOverlay) hideHowto();
    });
    const dontShow = document.getElementById('howtoDontShow');
    dontShow.addEventListener('change', (e) => {
      if (e.target.checked) localStorage.setItem('polyglot_howto_dontshow', '1');
      else localStorage.removeItem('polyglot_howto_dontshow');
    });

    // Hidden input for mobile
    $hiddenInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val && state.selRow >= 0) {
        handleInput(state.selRow, state.selCol, val);
        e.target.value = '';
      }
    });

    // Prevent zoom on double tap (mobile)
    document.addEventListener('dblclick', (e) => e.preventDefault());
  }

  // ===== Start =====
  init();
})();
