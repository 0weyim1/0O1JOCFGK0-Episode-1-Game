const gridDisplay = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const gameOverDisplay = document.getElementById('game-over');
const menuOverlay = document.getElementById('menu-overlay');

let board = [];
let score = 0;
let highScore = 0;

let newTileCoords = null;
let mergedTileCoords = [];

// Screen Swipe Gesture Variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const tileTextMap = {
    2: ["A fresh start.", "Just the beginning.", "First steps."],
    4: ["To be or not to be.", "Double trouble!", "Moving right along."],
    8: ["All that glitters is not gold.", "An octave of strength.", "Getting serious now."],
    16: ["Actions speak louder than words.", "Sweet sixteen!", "Look at you go!"],
    32: ["Knowledge is power.", "Halfway there!", "Keep pushing forward."],
    64: ["The plot thickens...", "Unstoppable force!", "Brilliant moves."],
    128: ["Reaching for the stars.", "Centurion status!", "Amazing focus."],
    256: ["A true masterclass.", "Quarter way to glory!", "Phenomenal."],
    512: ["The half-millennial mark.", "Incredible technique!", "Pure legend status."],
    1024: ["So close to perfection!", "One step from greatness.", "The final countdown."],
    2048: ["The ultimate phrase achieved!", "Victory is yours!", "You conquered 2048!"]
};

function createBoard() {
    board = Array(4).fill(null).map(() => Array(4).fill(0));
    score = 0;
    scoreDisplay.innerHTML = score;
    
    gameOverDisplay.querySelector('p').innerHTML = "Game Over!";
    gameOverDisplay.classList.add('hidden');
    menuOverlay.classList.add('hidden');
    
    highScore = localStorage.getItem('2048-highscore') ? parseInt(localStorage.getItem('2048-highscore')) : 0;
    highScoreDisplay.innerHTML = highScore;

    mergedTileCoords = [];
    generateTile();
    generateTile();
    updateDisplay();
}

function generateTile() {
    let emptyCells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) emptyCells.push({ r, c });
        }
    }
    if (emptyCells.length > 0) {
        let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
        newTileCoords = { r: randomCell.r, c: randomCell.c };
    }
}

function updateDisplay() {
    gridDisplay.innerHTML = '';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            let tile = document.createElement('div');
            tile.classList.add('tile');
            let value = board[r][c];
            
            if (value > 0) {
                let options = tileTextMap[value];
                if (options && Array.isArray(options)) {
                    let index = (r * 7 + c * 13 + value) % options.length;
                    tile.innerHTML = options[index];
                } else {
                    tile.innerHTML = value;
                }
                
                // CRITICAL FIX: Converts the dynamic variable to string so CSS selectors match values perfectly
                tile.setAttribute('data-value', value.toString());
                
                if (newTileCoords && newTileCoords.r === r && newTileCoords.c === c) {
                    tile.classList.add('tile-new');
                } else if (mergedTileCoords.some(coord => coord.r === r && coord.c === c)) {
                    tile.classList.add('tile-merged');
                }
            }
            gridDisplay.appendChild(tile);
        }
    }
    newTileCoords = null;
    mergedTileCoords = [];
}

function slideRow(row, rowIndex, isVertical, isReversed, colIndex) {
    let arr = row.filter(val => val);
    let localMerged = Array(4).fill(false);

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            scoreDisplay.innerHTML = score;
            
            // Core Win Rule Check
            if (arr[i] === 2048) triggerVictory();
            
            if (score > highScore) {
                highScore = score;
                highScoreDisplay.innerHTML = highScore;
                localStorage.setItem('2048-highscore', highScore);
            }
            
            arr[i + 1] = 0;
            localMerged[i] = true;
        }
    }
    
    let compressed = arr.filter(val => val);
    for (let i = 0; i < compressed.length; i++) {
        if (localMerged[i]) {
            let finalIdx = isReversed ? (3 - i) : i;
            if (isVertical) mergedTileCoords.push({ r: finalIdx, c: colIndex });
            else mergedTileCoords.push({ r: rowIndex, c: finalIdx });
        }
    }

    while (compressed.length < 4) compressed.push(0);
    return compressed;
}

function moveLeft() { for (let r = 0; r < 4; r++) board[r] = slideRow(board[r], r, false, false); }
function moveRight() { for (let r = 0; r < 4; r++) board[r] = slideRow(board[r].reverse(), r, false, true).reverse(); }
function moveUp() {
    for (let c = 0; c < 4; c++) {
        let row = [board[0][c], board[1][c], board[2][c], board[3][c]];
        row = slideRow(row, null, true, false, c);
        for (let r = 0; r < 4; r++) board[r][c] = row[r];
    }
}
function moveDown() {
    for (let c = 0; c < 4; c++) {
        let row = [board[0][c], board[1][c], board[2][c], board[3][c]].reverse();
        row = slideRow(row, null, true, true, c).reverse();
        for (let r = 0; r < 4; r++) board[r][c] = row[r];
    }
}

// Master Move Router
function executeMove(direction) {
    // If menu overlay instructions are open, freeze and ignore all gesture inputs
    if (!menuOverlay.classList.contains('hidden')) return; 
    
    let boardStringBefore = JSON.stringify(board);

    if (direction === 'left') moveLeft();
    else if (direction === 'right') moveRight();
    else if (direction === 'up') moveUp();
    else if (direction === 'down') moveDown();

    let boardStringAfter = JSON.stringify(board);

    if (boardStringBefore !== boardStringAfter) {
        generateTile();
        updateDisplay();
        checkGameOver();
    }
}

// Keyboard input links
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') executeMove('left');
    else if (e.key === 'ArrowRight') executeMove('right');
    else if (e.key === 'ArrowUp') executeMove('up');
    else if (e.key === 'ArrowDown') executeMove('down');
});

// --- NATIVE MOBILE TOUCH SWIPE CAPTURES ---
gridDisplay.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

gridDisplay.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;
    const threshold = 30; // Minimum sliding sweep distance in pixels to count as a deliberate move

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) executeMove('right');
            else executeMove('left');
        }
    } else {
        if (Math.abs(diffY) > threshold) {
            if (diffY > 0) executeMove('down');
            else executeMove('up');
        }
    }
}

function checkGameOver() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) return;
            if (c < 3 && board[r][c] === board[r][c + 1]) return;
            if (r < 3 && board[r][c] === board[r + 1][c]) return;
        }
    }
    gameOverDisplay.classList.remove('hidden');
}

function triggerVictory() {
    gameOverDisplay.querySelector('p').innerHTML = "You Win! 🎉";
    gameOverDisplay.classList.remove('hidden');
}

function toggleMenu() { menuOverlay.classList.toggle('hidden'); }
function resetGame() { createBoard(); }

// Global strict block preventing Safari and Chrome from elastic scrolling/dragging the background
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

createBoard();
