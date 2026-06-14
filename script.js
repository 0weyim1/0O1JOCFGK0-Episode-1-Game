const gridDisplay = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const gameOverDisplay = document.getElementById('game-over');

let board = [];
let score = 0;
let highScore = 0;

let newTileCoords = null;
let mergedTileCoords = [];

// --- CUSTOM PHRASES DICTIONARY ---
const tileTextMap = {
    2: ["God","Jesus","እግዚአብሔር","Holy sprit","Allah","Yahweh","Deity","Almighty","Eternal"],
    4: ["Respect","Revere","Reverence","Venerate","Esteem","Deify","Deference","Favor","Regard"],
    8: ["Beautiful","Aesthetic","Gorgeous","ቆንጆ", "Stunning","Cute","Marvelous","Pretty"],
    16:["Speed","The magnitude of Velocity","ፍጥነት","ከወወ","Swiftness","Haste","Hurry","Fleetness","Hie"],
         32:   ["5 - 3÷2(3 - 2)×3 + 1", "1.5",  "ላእላዩ 3 እና ታህታዩ 2 የሆነ ቁጥር", "3/2", "1 1/2"],
    64: ["Extraneous","Irrelevant","Unrelated","Unconnected","Inapplicable","Peripheral","Immaterial"],
    128: ["Provocative","Annoying","Irritating","Goading","Vexing","Galling","Exasperating"],
   256:["Brusque","Curt","Abrupt","Blunt","Short","Sharp","Terse","Brisk","Crisp","Clipped","Monosyllabic","Indelicate","Tactless","Offhand","Snappish","Peremptory"],
    512: ["Momentum","(mass)x(velocity)","The force required to bring the object to a stop in a unit length of time"],
    1024: ["a/b + c/d",  "(ad + bc) / bd, b != 0 and d != 0"],
    2048: ["LOVE"]
};

function createBoard() {
    board = Array(4).fill(null).map(() => Array(4).fill(0));
    score = 0;
    document.getElementById('score').innerHTML = score;
    
    // Reset the text back to default Game Over just in case they won the last round
    gameOverDisplay.querySelector('p').innerHTML = "Game Over!";
    gameOverDisplay.classList.add('hidden');
    
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
    if (!gridDisplay) return;
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
                
                tile.setAttribute('data-value', value);

                // Safe Pastel Color Logic
                let colorSeed = (r * 45 + c * 75 + value * 11) % 360;
                tile.style.backgroundColor = `hsl(${colorSeed}, 75%, 75%)`;
                tile.style.color = '#4f4943';
                
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
        arr[i] *= 2; // This is where 1024 becomes 2048!
        score += arr[i];
        document.getElementById('score').innerHTML = score;
        
        if (arr[i] === 2048) {
            triggerVictory();
        }
        // ----------------------------------------

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
            if (isVertical) {
                mergedTileCoords.push({ r: finalIdx, c: colIndex });
            } else {
                mergedTileCoords.push({ r: rowIndex, c: finalIdx });
            }
        }
    }

    while (compressed.length < 4) {
        compressed.push(0);
    }
    return compressed;
}

function moveLeft() {
    for (let r = 0; r < 4; r++) {
        board[r] = slideRow(board[r], r, false, false);
    }
}

function moveRight() {
    for (let r = 0; r < 4; r++) {
        board[r] = slideRow(board[r].reverse(), r, false, true).reverse();
    }
}

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

// Keyboard Input Engine
document.addEventListener('keyup', (e) => {
    let boardStringBefore = JSON.stringify(board);

    if (e.key === 'ArrowLeft') moveLeft();
    else if (e.key === 'ArrowRight') moveRight();
    else if (e.key === 'ArrowUp') moveUp();
    else if (e.key === 'ArrowDown') moveDown();
    else return;

    let boardStringAfter = JSON.stringify(board);

    if (boardStringBefore !== boardStringAfter) {
        generateTile();
        updateDisplay();
        checkGameOver();
    }
});

// Mobile Swipe Engine
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

// Prevent the screen from scrolling/bouncing when touching the game grid
gridDisplay.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

function handleSwipe() {
    let xDiff = touchEndX - touchStartX;
    let yDiff = touchEndY - touchStartY;
    const threshold = 40; 
    
    let boardStringBefore = JSON.stringify(board);

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (Math.abs(xDiff) > threshold) {
            if (xDiff > 0) moveRight();
            else moveLeft();
        } else return;
    } else {
        if (Math.abs(yDiff) > threshold) {
            if (yDiff > 0) moveDown();
            else moveUp();
        } else return;
    }

    let boardStringAfter = JSON.stringify(board);

    if (boardStringBefore !== boardStringAfter) {
        generateTile();
        updateDisplay();
        checkGameOver();
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
    if (gameOverDisplay) gameOverDisplay.classList.remove('hidden');
}

function resetGame() {
    createBoard();
}

// Start Game
createBoard();
function triggerVictory() {
    // Change the text inside the Game Over screen to celebrate the win
    gameOverDisplay.querySelector('p').innerHTML = "You Win! 🎉";
    // Show the overlay screen immediately
    gameOverDisplay.classList.remove('hidden');
}
// Global lock against any screen pulling/elastic bouncing on mobile
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
