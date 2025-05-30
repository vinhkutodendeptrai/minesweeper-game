let board = [];
let rows = 8;
let columns = 8;
let minesCount = 5;
let minesLocation = [];
let tilesClicked = 0;
let gameOver = false;
let history = [];
let previewTiles = [];

window.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});

window.onload = function () {
    startGame();
    document.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.key === "z") {
            undo();
        }
    });
};

function setMines(safeZone) {
    let minesLeft = minesCount;
    while (minesLeft > 0) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * columns);
        let id = r + "-" + c;
        if (!minesLocation.includes(id) && !safeZone.includes(id)) {
            minesLocation.push(id);
            minesLeft--;
        }
    }
}

function startGame() {
    document.getElementById("mines-count").innerText = minesCount;
    document.getElementById("undo-button").addEventListener("click", undo);

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("div");
            tile.id = r + "-" + c;
            tile.addEventListener("mouseup", clickTile);
            tile.addEventListener("mousedown", e => handleMouseDown(e, tile));
            document.getElementById("board").append(tile);
            row.push(tile);
        }
        board.push(row);
    }
}

function saveBoardState() {
    const state = {
        tiles: board.map(row => row.map(tile => ({
            id: tile.id,
            text: tile.innerText,
            classList: [...tile.classList],
            backgroundColor: tile.style.backgroundColor
        }))),
        tilesClicked: tilesClicked
    };
    history.push(state);
}

function undo() {
    if (history.length === 0) return;

    const state = history.pop();
    tilesClicked = state.tilesClicked;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const tile = board[r][c];
            const saved = state.tiles[r][c];

            tile.innerText = saved.text;
            tile.className = "";
            saved.classList.forEach(cls => tile.classList.add(cls));
            tile.style.backgroundColor = saved.backgroundColor;
        }
    }

    gameOver = false;
    document.getElementById("mines-count").innerText =
        tilesClicked === rows * columns - minesCount ? "Cleared" : minesCount;

    const modal = document.getElementById("game-over-modal");
    modal.classList.add("hidden");
}

function clickTile(e) {
    if (gameOver || this.classList.contains("tile-clicked")) return;
    
    let tile = this;
    
    if (e.button === 0) {
        if (tile.innerText === "🚩") return;
        if (minesLocation.length === 0) {
            const safeZoneTiles = [tile.id];
            setMines(safeZoneTiles);
        }
        if (minesLocation.includes(tile.id)) {
            saveBoardState();
            gameOver = true;
            revealMines();
            return;
        }
        
        saveBoardState();
        let [r, c] = tile.id.split("-").map(Number);
        checkMine(r, c);
    }

    if (e.button === 2) {
        saveBoardState();
        if (tile.innerText === "") {
            tile.innerText = "🚩";
        } else if (tile.innerText === "🚩") {
            tile.innerText = "";
        }
        return;
    }

}

function revealMines() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let tile = board[r][c];
            if (minesLocation.includes(tile.id)) {
                tile.innerText = "💣";
                tile.style.backgroundColor = "red";
            }
        }
    }
    showGameOverModal();
}

function showGameOverModal() {
    const modal = document.getElementById("game-over-modal");
    modal.classList.remove("hidden");

    document.getElementById("undo-modal-btn").onclick = function () {
        modal.classList.add("hidden");
        undo();
    };

    document.getElementById("retry-btn").onclick = function () {
        modal.classList.add("hidden");
        restartGame();
    };
}

function restartGame() {
    const boardElement = document.getElementById("board");
    boardElement.innerHTML = "";

    board = [];
    minesLocation = [];
    tilesClicked = 0;
    gameOver = false;
    history = [];
    previewTiles = [];

    startGame();
}

function checkMine(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= columns) return;
    if (board[r][c].classList.contains("tile-clicked")) return;

    board[r][c].classList.add("tile-clicked");
    tilesClicked++;

    let minesFound = 0;

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            minesFound += checkTile(r + dr, c + dc);
        }
    }

    if (minesFound > 0) {
        board[r][c].innerText = minesFound;
        board[r][c].classList.add("x" + minesFound);
    } else {
        board[r][c].innerText = "";
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                checkMine(r + dr, c + dc);
            }
        }
    }

    if (tilesClicked === rows * columns - minesCount) {
        for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const tile = board[r][c];
            if (!tile.classList.contains("tile-clicked")) {
                tile.innerText = "🚩";
            }
        }
    }
        document.getElementById("mines-count").innerText = "Cleared";
        gameOver = true;
    }
}

function checkTile(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= columns) return 0;
    return minesLocation.includes(`${r}-${c}`) ? 1 : 0;
}

window.addEventListener("mouseup", () => {
    previewTiles.forEach(tile => tile.classList.remove("preview"));
    previewTiles = [];
});

function handleMouseDown(e, tile) {
    if (e.buttons === 3) {
        e.preventDefault();
        const [r, c] = tile.id.split("-").map(Number);
        const number = parseInt(tile.innerText);

        if (!tile.classList.contains("tile-clicked") || isNaN(number)) return;

        const neighbors = getNeighbors(r, c);
        const flaggedCount = neighbors.filter(n => n.innerText === "🚩").length;

        if (flaggedCount === number) {
            saveBoardState();
            neighbors.forEach(n => {
                if (!n.classList.contains("tile-clicked") && n.innerText !== "🚩") {
                    const [nr, nc] = n.id.split("-").map(Number);
                    if (minesLocation.includes(n.id)) {
                        gameOver = true;
                        revealMines();
                    } else {
                        checkMine(nr, nc);
                    }
                }
            });
        } else {
            previewTiles = neighbors.filter(n =>
                !n.classList.contains("tile-clicked") && n.innerText !== "🚩"
            );
            previewTiles.forEach(n => n.classList.add("preview"));
        }
    }
}

function getNeighbors(r, c) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            let nr = r + dr;
            let nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < columns) {
                neighbors.push(board[nr][nc]);
            }
        }
    }
    return neighbors;
}