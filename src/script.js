// Используем localStorage для сохранения лучшего результата
const BEST_SCORE_KEY = '2048_best_score'; для ошибки кода
const BOARD_KEY = '2048_board';

// Переменные игры
let board = [];
let score = 0;
let bestScore = parseInt(localStorage.getItem(BEST_SCORE_KEY)) || 0;
let gameWon = false;
let gameLost = false;

// Размер доски
const BOARD_SIZE = 4;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    updateBestScore();
    initializeGame();
    setupEventListeners();
});

function setupEventListeners() {
    // Клавиатура
    document.addEventListener('keydown', handleKeyPress);

    // Кнопки интерфейса
    document.getElementById('newGameBtn').addEventListener('click', newGame);
    document.getElementById('helpBtn').addEventListener('click', showRulesModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('upBtn').addEventListener('click', () => move('up'));
    document.getElementById('leftBtn').addEventListener('click', () => move('left'));
    document.getElementById('rightBtn').addEventListener('click', () => move('right'));
    document.getElementById('downBtn').addEventListener('click', () => move('down'));

    // Закрытие модалей при клике вне контента
    document.getElementById('rulesModal').addEventListener('click', (e) => {
        if (e.target.id === 'rulesModal') {
            closeModal();
        }
    });

    document.getElementById('gameOverModal').addEventListener('click', (e) => {
        if (e.target.id === 'gameOverModal') {
            document.getElementById('gameOverModal').classList.remove('show');
        }
    });

    document.getElementById('winModal').addEventListener('click', (e) => {
        if (e.target.id === 'winModal') {
            closeWinModal();
        }
    });
}

function handleKeyPress(e) {
    const key = e.key.toLowerCase();
    
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        
        if (key === 'arrowup') move('up');
        if (key === 'arrowdown') move('down');
        if (key === 'arrowleft') move('left');
        if (key === 'arrowright') move('right');
    }
}

function initializeGame() {
    board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
    score = 0;
    gameWon = false;
    gameLost = false;
    
    // Добавляем две случайные плитки
    addNewTile();
    addNewTile();
    
    updateDisplay();
}

function newGame() {
    document.getElementById('gameOverModal').classList.remove('show');
    document.getElementById('winModal').classList.remove('show');
    initializeGame();
}

function addNewTile() {
    // Найти все пустые ячейки
    const emptyCells = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === 0) {
            emptyCells.push(i);
        }
    }

    if (emptyCells.length === 0) {
        return false;
    }

    // Выбрать случайную пустую ячейку
    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // 90% шанс на 2, 10% на 4
    board[randomIndex] = Math.random() < 0.9 ? 2 : 4;
    
    return true;
}

function move(direction) {
    if (gameLost || gameWon) return;

    const originalBoard = JSON.parse(JSON.stringify(board));
    
    // Преобразуем доску в 2D для удобства обработки
    let grid = boardTo2D();

    // Применяем движение в зависимости от направления
    if (direction === 'up') {
        grid = rotateCounterClockwise(grid);
        grid = moveLeft(grid);
        grid = rotateClockwise(grid);
    } else if (direction === 'down') {
        grid = rotateClockwise(grid);
        grid = moveLeft(grid);
        grid = rotateCounterClockwise(grid);
    } else if (direction === 'left') {
        grid = moveLeft(grid);
    } else if (direction === 'right') {
        grid = rotateClockwise(rotateClockwise(grid));
        grid = moveLeft(grid);
        grid = rotateClockwise(rotateClockwise(grid));
    }

    // Преобразуем обратно в 1D доску
    board = grid2DToBoard(grid);

    // Если доска изменилась, добавляем новую плитку
    if (JSON.stringify(board) !== JSON.stringify(originalBoard)) {
        addNewTile();
    }

    updateDisplay();
    checkGameState();
}

function moveLeft(grid) {
    const newGrid = grid.map(row => compressRow(row));
    return newGrid.map(row => mergeRow(row));
}

function compressRow(row) {
    const newRow = row.filter(val => val !== 0);
    return [...newRow, ...Array(BOARD_SIZE - newRow.length).fill(0)];
}

function mergeRow(row) {
    for (let i = 0; i < BOARD_SIZE - 1; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            score += row[i];
            row[i + 1] = 0;
            
            // Проверяем победу
            if (row[i] === 2048) {
                gameWon = true;
            }
        }
    }
    return compressRow(row);
}

function boardTo2D() {
    const grid = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        grid.push(board.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE));
    }
    return grid;
}

function grid2DToBoard(grid) {
    return grid.flat();
}

function rotateClockwise(grid) {
    const newGrid = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            newGrid[j][BOARD_SIZE - 1 - i] = grid[i][j];
        }
    }
    return newGrid;
}

function rotateCounterClockwise(grid) {
    const newGrid = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            newGrid[BOARD_SIZE - 1 - j][i] = grid[i][j];
        }
    }
    return newGrid;
}

function canMove() {
    // Проверяем, есть ли пустые ячейки
    if (board.some(val => val === 0)) {
        return true;
    }

    // Проверяем, можно ли объединить плитки
    const grid = boardTo2D();
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const current = grid[i][j];
            
            // Проверяем соседей
            if ((j < BOARD_SIZE - 1 && current === grid[i][j + 1]) ||
                (i < BOARD_SIZE - 1 && current === grid[i + 1][j])) {
                return true;
            }
        }
    }

    return false;
}

function checkGameState() {
    if (gameWon && !document.getElementById('winModal').classList.contains('shown-once')) {
        document.getElementById('winModal').classList.add('show');
        document.getElementById('winModal').classList.add('shown-once');
        document.getElementById('winScore').textContent = score;
    }

    if (!canMove() && !gameWon) {
        gameLost = true;
        showGameOver();
    }
}

function showGameOver() {
    setTimeout(() => {
        document.getElementById('gameOverModal').classList.add('show');
        document.getElementById('finalScore').textContent = score;
    }, 300);
}

function closeWinModal() {
    document.getElementById('winModal').classList.remove('show');
    gameWon = false;
}

function updateDisplay() {
    renderBoard();
    updateScore();
}

function renderBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';

    for (let i = 0; i < board.length; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        
        const value = board[i];
        
        if (value !== 0) {
            tile.textContent = value;
            tile.setAttribute('data-value', value);
        }
        
        gameBoard.appendChild(tile);
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    
    // Обновляем лучший результат, если необходимо
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem(BEST_SCORE_KEY, bestScore);
        updateBestScore();
    }
}

function updateBestScore() {
    document.getElementById('best-score').textContent = bestScore;
}

function showRulesModal() {
    document.getElementById('rulesModal').classList.add('show');
}

function closeModal() {
    document.getElementById('rulesModal').classList.remove('show');
}

// Запускаем инициализацию при загрузке страницы
window.addEventListener('load', () => {
    renderBoard();
});
