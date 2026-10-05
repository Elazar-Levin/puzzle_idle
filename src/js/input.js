function getPointerPos(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    };
}

function onPointerDown(e) {
    ensureAudio();
    const pos = getPointerPos(e);

    for (let i = puzzle.pieces.length - 1; i >= 0; i--) {
        const piece = puzzle.pieces[i];
        if (piece.placed) {continue;}

        if (pos.x >= piece.x && pos.x <= piece.x + gameState.pieceWidth &&
            pos.y >= piece.y && pos.y <= piece.y + gameState.pieceHeight) {

            const wasAnimating = piece.isAnimating;
            piece.isAnimating = false;
            draggedPiece = piece;
            isDragging = true;
            dragOffsetX = pos.x - piece.x;
            dragOffsetY = pos.y - piece.y;

            // Bring the grabbed piece to the top of the render stack.
            puzzle.pieces.splice(i, 1);
            puzzle.pieces.push(draggedPiece);

            if (wasAnimating) {
                gameState.autoTimer = getLaunchCooldownTrack();
                puzzle.launchAutoPieces();
            }
            break;
        }
    }
}

function onPointerMove(e) {
    if (!isDragging || !draggedPiece) {return;}

    const pos = getPointerPos(e);
    draggedPiece.x = pos.x - dragOffsetX;
    draggedPiece.y = pos.y - dragOffsetY;
}

function onPointerUp() {
    if (isDragging && draggedPiece) {
        const targetX = BOARD_X + draggedPiece.col * gameState.pieceWidth;
        const targetY = BOARD_Y + draggedPiece.row * gameState.pieceHeight;

        const distance = Math.hypot(draggedPiece.x - targetX, draggedPiece.y - targetY);

        if (distance < getSnapRadius()) {
            draggedPiece.x = targetX;
            draggedPiece.y = targetY;
            draggedPiece.placed = true;
            stats.piecesPlaced++;

            // Sunken snapped Pieces below loose ones in the render stack.
            const index = puzzle.pieces.indexOf(draggedPiece);
            if (index > -1) {
                puzzle.pieces.splice(index, 1);
                puzzle.pieces.unshift(draggedPiece);
            }

            const isPuzzleComplete = puzzle.pieces.every(p => p.placed);
            if (isPuzzleComplete) {
                const reward = getCompletionReward(gameState.rows, gameState.cols);
                gameState.currency += reward;
                recordPuzzleComplete(reward);
                playComplete();
                const headStartBonus = getHeadStartBonus();
                if (headStartBonus > 0) {
                    spawnTextParticle(BOARD_X + BOARD_WIDTH / 2 - 40, BOARD_Y + BOARD_HEIGHT / 2 + 30, `+${headStartBonus} Pieces`);
                }
                gameState.currency += headStartBonus;

                const centerX = BOARD_X + BOARD_WIDTH / 2 - 40;
                const centerY = BOARD_Y + BOARD_HEIGHT / 2;
                spawnTextParticle(centerX, centerY, `+${reward} Pieces`);

                updateUI();

                setTimeout(initNewPuzzle, 50);
            }
        }
    }

    isDragging = false;
    draggedPiece = null;
}

canvas.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

canvas.addEventListener("touchstart", onPointerDown, { passive: true });
window.addEventListener("touchmove", onPointerMove, { passive: true });
window.addEventListener("touchend", onPointerUp);
