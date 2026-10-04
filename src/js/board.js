// Board layout, resizing, and puzzle (re)generation.

function recalculateBoardScale() {
    const basePieceSize = 60;

    const rawWidth = gameState.cols * basePieceSize;
    const rawHeight = gameState.rows * basePieceSize;

    // Keep the puzzle within 75% of the window.
    const maxAllowedWidth = window.innerWidth * 0.75;
    const maxAllowedHeight = window.innerHeight * 0.75;

    let scaleX = 1;
    let scaleY = 1;

    if (rawWidth > maxAllowedWidth) {
        scaleX = maxAllowedWidth / rawWidth;
    }
    if (rawHeight > maxAllowedHeight) {
        scaleY = maxAllowedHeight / rawHeight;
    }

    // Uniform scale so the board never distorts.
    const finalScale = Math.min(scaleX, scaleY);

    gameState.pieceWidth = basePieceSize * finalScale;
    gameState.pieceHeight = basePieceSize * finalScale;
    gameState.tabSize = 14 * finalScale;

    BOARD_WIDTH = gameState.cols * gameState.pieceWidth;
    BOARD_HEIGHT = gameState.rows * gameState.pieceHeight;

    // Center the board on screen.
    BOARD_X = (window.innerWidth - BOARD_WIDTH) / 2;
    BOARD_Y = (window.innerHeight - BOARD_HEIGHT) / 2;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    recalculateBoardScale();

    if (puzzle && puzzle.pieces) {
        puzzle.pieces.forEach(piece => {
            if (piece.placed) {
                // Re-align snapped Pieces to their updated slots.
                piece.x = BOARD_X + piece.col * gameState.pieceWidth;
                piece.y = BOARD_Y + piece.row * gameState.pieceHeight;
            } else if (!piece.isAnimating) {
                // Keep loose Pieces inside the window.
                piece.x = Math.max(10, Math.min(canvas.width - gameState.pieceWidth - 10, piece.x));
                piece.y = Math.max(10, Math.min(canvas.height - gameState.pieceHeight - 10, piece.y));
            }
        });
    }

    updateUI();
}

function initNewPuzzle() {
    recalculateBoardScale();
    loadNewPuzzleImage();

    puzzle = new JigsawPuzzle(gameState.rows, gameState.cols, gameState.pieceWidth, gameState.pieceHeight);
    puzzle.scramble(canvas.width, canvas.height);
    puzzleStartTime = Date.now();
    gameState.activeSection = null;

    gameState.currency += getHeadStartBonus();
}
