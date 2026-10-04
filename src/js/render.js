// Canvas rendering: piece paths, Pieces, and the full frame.

function drawEdge(ctx, x1, y1, x2, y2, edgeType, tabSize, outwardX, outwardY, params) {
    if (edgeType === FLAT) {
        ctx.lineTo(x2, y2);
        return;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(Math.atan2(dy, dx));

    const dir = edgeType === TAB ? 1 : -1;

    // Keep neighbor tabs aligned: reversed path segments flip asymmetry
    // so both Pieces anchor to the same absolute side of the grid line.
    const isClockwiseReversed = dx < -0.1 || dy < -0.1;
    const asymmetry = isClockwiseReversed ? -params.asymmetry : params.asymmetry;
    const center = 0.5 + asymmetry;

    const pX25 = (center - 0.25) * len;
    const pX30 = (center - 0.20) * len;
    const pX35 = (center - 0.15) * len;
    const pX65 = (center + 0.15) * len;
    const pX70 = (center + 0.20) * len;
    const pX75 = (center + 0.25) * len;

    const neckStart = pX35;
    const neckEnd = pX65;

    const neckWidth = tabSize * params.neckWidth;
    const headRadius = tabSize * params.headScale * params.tabScale;
    const localOutwardY = -1;

    ctx.lineTo(neckStart, 0);

    // First flare curve
    ctx.bezierCurveTo(
        neckStart, localOutwardY * neckWidth * dir,
        pX25, localOutwardY * headRadius * 0.6 * dir,
        pX35, localOutwardY * headRadius * 1.1 * dir,
    );

    // Main head bulge
    ctx.bezierCurveTo(
        pX30, localOutwardY * headRadius * 1.4 * dir,
        pX70, localOutwardY * headRadius * 1.4 * dir,
        pX65, localOutwardY * headRadius * 1.1 * dir,
    );

    // Final flare curve back to baseline
    ctx.bezierCurveTo(
        pX75, localOutwardY * headRadius * 0.6 * dir,
        neckEnd, localOutwardY * neckWidth * dir,
        neckEnd, 0,
    );

    ctx.lineTo(len, 0);
    ctx.restore();
}

function tracePiecePath(ctx, piece) {
    const x = piece.x;
    const y = piece.y;
    const w = gameState.pieceWidth;
    const h = gameState.pieceHeight;

    ctx.beginPath();
    ctx.moveTo(x, y);
    drawEdge(ctx, x, y, x + w, y, piece.edges.top, gameState.tabSize, 0, -1, piece.edgeParams.top);
    drawEdge(ctx, x + w, y, x + w, y + h, piece.edges.right, gameState.tabSize, 1, 0, piece.edgeParams.right);
    drawEdge(ctx, x + w, y + h, x, y + h, piece.edges.bottom, gameState.tabSize, 0, 1, piece.edgeParams.bottom);
    drawEdge(ctx, x, y + h, x, y, piece.edges.left, gameState.tabSize, -1, 0, piece.edgeParams.left);
    ctx.closePath();
}

function drawPiece(ctx, piece) {
    const x = piece.x;
    const y = piece.y;

    // Layer 1: image texture fill, clipped to the jigsaw shape.
    ctx.save();
    tracePiecePath(ctx, piece);

    if (gameState.imageLoaded && gameState.puzzleImage) {
        ctx.clip();

        // Offset so the full image lines up behind this piece's slot.
        const globalImgX = x - piece.col * gameState.pieceWidth;
        const globalImgY = y - piece.row * gameState.pieceHeight;
        ctx.drawImage(gameState.puzzleImage, globalImgX, globalImgY);
    } else {
        // Fallback while the texture is unavailable.
        const hue = (piece.row * 30 + piece.col * 40) % 360;
        ctx.fillStyle = `hsl(${hue}, 40%, 40%)`;
        ctx.fill();
    }
    ctx.restore();

    // Layer 2: sharp border stroke.
    ctx.save();
    tracePiecePath(ctx, piece);
    ctx.strokeStyle = "rgba(16, 16, 16, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Workspace background.
    ctx.fillStyle = THEMES[activeSkin].bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Board mat where Pieces lock into place.
    ctx.fillStyle = THEMES[activeSkin].mat;
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);

    // Guide overlay: faint preview of the completed picture over the mat.
    if (prestigeLevel("guide") >= 1 && gameState.imageLoaded && gameState.puzzleImage) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.drawImage(gameState.puzzleImage, BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);
        ctx.restore();
    }

    // Soft trails behind auto-placed pieces in flight.
    ctx.save();
    ctx.lineCap = "round";
    for (const piece of puzzle.pieces) {
        if (!piece.isAnimating || piece.trail.length < 2) {continue;}
        for (let i = 1; i < piece.trail.length; i++) {
            const a = piece.trail[i - 1];
            const b = piece.trail[i];
            ctx.strokeStyle = `rgba(255, 215, 0, ${(i / piece.trail.length) * 0.35})`;
            ctx.lineWidth = 3 + (i / piece.trail.length) * 4;
            ctx.beginPath();
            ctx.moveTo(a.x + gameState.pieceWidth / 2, a.y + gameState.pieceHeight / 2);
            ctx.lineTo(b.x + gameState.pieceWidth / 2, b.y + gameState.pieceHeight / 2);
            ctx.stroke();
        }
    }
    ctx.restore();

    for (const piece of puzzle.pieces) {
        drawPiece(ctx, piece);
    }

    // Wallet overlay, top right.
    ctx.save();
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 24px 'Segoe UI', sans-serif";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    const textStr = `Wallet: ${gameState.currency} Pieces`;
    const textWidth = ctx.measureText(textStr).width;
    ctx.fillText(textStr, canvas.width - textWidth - 30, 45);
    ctx.restore();

    updateAndDrawParticles(ctx, 0.016);
}
