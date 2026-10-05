class JigsawPuzzle {
    constructor(rows, cols, pieceWidth, pieceHeight) {
        this.rows = rows;
        this.cols = cols;
        this.pieceWidth = pieceWidth;
        this.pieceHeight = pieceHeight;
        this.pieces = [];
        this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
        this.generatePieces();
    }

    generatePieces() {
        const { hEdges, vEdges, hParams, vParams } = generatePuzzleEdges(this.rows, this.cols);

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const edges = {
                    top: r === 0 ? FLAT : complement(hEdges[r][c]),
                    bottom: r === this.rows - 1 ? FLAT : hEdges[r + 1][c],
                    left: c === 0 ? FLAT : complement(vEdges[r][c]),
                    right: c === this.cols - 1 ? FLAT : vEdges[r][c + 1],
                };

                const edgeParams = {
                    top: r === 0 ? null : hParams[r][c],
                    bottom: r === this.rows - 1 ? null : hParams[r + 1][c],
                    left: c === 0 ? null : vParams[r][c],
                    right: c === this.cols - 1 ? null : vParams[r][c + 1],
                };

                const piece = new JigsawPiece(r, c, edges, edgeParams);
                this.pieces.push(piece);
                this.grid[r][c] = piece;
            }
        }
    }

    scramble(canvasWidth, canvasHeight) {
        // Measure the live UI panel so Pieces never spawn behind it.
        const uiEl = document.getElementById("ui-overlay");
        const uiRect = uiEl ? uiEl.getBoundingClientRect() : { left: 0, top: 0, right: 240, bottom: 220 };
        const margin = 10;

        this.pieces.forEach(piece => {
            let validPosition = false;
            let rx = 0;
            let ry = 0;

            // Keep randomizing until the position clears the UI panel.
            while (!validPosition) {
                const maxX = canvasWidth - this.pieceWidth - 30;
                const maxY = canvasHeight - this.pieceHeight - 30;

                rx = 15 + Math.random() * Math.max(15, maxX);
                ry = 15 + Math.random() * Math.max(15, maxY);

                const overlapsUI =
                    rx < uiRect.right + margin &&
                    rx + this.pieceWidth > uiRect.left - margin &&
                    ry < uiRect.bottom + margin &&
                    ry + this.pieceHeight > uiRect.top - margin;

                if (!overlapsUI) {
                    validPosition = true;
                }
            }

            piece.x = rx;
            piece.y = ry;
            piece.placed = false;
            piece.isAnimating = false;
            piece.trail = [];
        });
    }

    getPiece(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {return null;}
        return this.grid[row][col];
    }

    getNeighbors(piece) {
        const neighbors = [];
        const { row, col } = piece;

        const top = this.getPiece(row - 1, col);
        const right = this.getPiece(row, col + 1);
        const bottom = this.getPiece(row + 1, col);
        const left = this.getPiece(row, col - 1);

        if (top) {neighbors.push({ piece: top, direction: "top" });}
        if (right) {neighbors.push({ piece: right, direction: "right" });}
        if (bottom) {neighbors.push({ piece: bottom, direction: "bottom" });}
        if (left) {neighbors.push({ piece: left, direction: "left" });}

        return neighbors;
    }

    launchAutoPieces() {
        const launchCooldown = getLaunchCooldownTrack();
        if (gameState.autoTimer < launchCooldown) {return;}

        gameState.autoTimer = 0;

        const currentFlyingCount = this.pieces.filter(p => p.isAnimating).length;
        const openFlightSlots = gameState.autoPlacers - currentFlyingCount;
        if (openFlightSlots <= 0) {return;}

        const availablePieces = this.pieces.filter(p => !p.placed && !p.isAnimating && p !== draggedPiece);

        // Honor the chosen auto-placer strategy: prefer border/corner pieces first.
        let pool = availablePieces;
        if (autoStrategy === "edges") {
            const edgesOnly = pool.filter(p => p.isBorder());
            if (edgesOnly.length > 0) {pool = edgesOnly;}
        } else if (autoStrategy === "corners") {
            const cornersOnly = pool.filter(p => p.isCorner());
            const edgesOnly = pool.filter(p => p.isBorder());
            if (cornersOnly.length > 0) {pool = cornersOnly;} else if (edgesOnly.length > 0) {pool = edgesOnly;}
        } else if (autoStrategy === "sections" && gameState.imageLoaded && gameState.puzzleImage) {
            // Tag pieces on first use so buckets exist.
            if (!pool[0] || pool[0].sectionId === undefined) {
                tagPieceColors(gameState.puzzleImage);
            }

            // Stick to the locked section until it is fully placed.
            if (gameState.activeSection !== null) {
                const remaining = pool.filter(p => p.sectionId === gameState.activeSection);
                if (remaining.length > 0) {
                    pool = remaining;
                } else {
                    gameState.activeSection = null;
                }
            }

            // No locked section yet (or finished one): pick the largest
            // remaining contiguous color section and lock it in.
            if (gameState.activeSection === null) {
                const counts = {};
                for (const p of pool) {
                    const key = p.sectionId === undefined ? -1 : p.sectionId;
                    counts[key] = (counts[key] || 0) + 1;
                }
                let bestKey = null;
                let bestCount = 0;
                for (const key of Object.keys(counts)) {
                    if (counts[key] > bestCount) {bestCount = counts[key]; bestKey = key;}
                }
                if (bestKey !== null) {
                    gameState.activeSection = Number(bestKey);
                    pool = pool.filter(p => (p.sectionId === undefined ? -1 : p.sectionId) === Number(bestKey));
                }
            }
        }

        // If the strategy whittles the pool down below the flight slots,
        // top it up with the remaining pieces so every placer fires.
        if (pool.length < openFlightSlots) {
            const extras = availablePieces.filter(p => !pool.includes(p));
            pool = pool.concat(extras);
        }

        const PiecesToLaunch = Math.min(openFlightSlots, pool.length);

        for (let i = 0; i < PiecesToLaunch; i++) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const piece = pool.splice(randomIndex, 1)[0];

            piece.animTargetX = BOARD_X + piece.col * gameState.pieceWidth;
            piece.animTargetY = BOARD_Y + piece.row * gameState.pieceHeight;
            piece.isAnimating = true;

            // Bring the flying piece to the top of the render stack.
            const index = this.pieces.indexOf(piece);
            if (index > -1) {
                this.pieces.splice(index, 1);
                this.pieces.push(piece);
            }
        }
    }

    updateFlyingPieces() {
        this.pieces.forEach(piece => {
            if (!piece.isAnimating) {return;}

            const speedLevel = gameState.autoSpeedLevel - 1;
            const swiftFactor = 1 + 0.15 * (prestigeLevel("swift") + (buffs.speed || 0));
            const easeSpeed = 0.12 * (1 + 0.3 * speedLevel) * swiftFactor;
            piece.x += (piece.animTargetX - piece.x) * easeSpeed;
            piece.y += (piece.animTargetY - piece.y) * easeSpeed;

            // Record recent positions for the soft trail effect.
            piece.trail.push({ x: piece.x, y: piece.y });
            if (piece.trail.length > 10) {piece.trail.shift();}

            if (Math.hypot(piece.animTargetX - piece.x, piece.animTargetY - piece.y) < 0.5) {
                piece.x = piece.animTargetX;
                piece.y = piece.animTargetY;
                piece.isAnimating = false;
                piece.placed = true;
                piece.trail = [];
                stats.piecesPlaced++;

                // Sink placed Pieces below the loose ones in the render stack.
                const index = this.pieces.indexOf(piece);
                if (index > -1) {
                    this.pieces.splice(index, 1);
                    this.pieces.unshift(piece);
                }

                if (this.pieces.every(p => p.placed)) {
                    const reward = getCompletionReward(gameState.rows, gameState.cols);
                    gameState.currency += reward;
                    recordPuzzleComplete(reward);
                    playComplete();
                    const headStartBonus = getHeadStartBonus();
                    if (headStartBonus > 0) {
                        spawnTextParticle(BOARD_X + BOARD_WIDTH / 2 - 40, BOARD_Y + BOARD_HEIGHT / 2 + 30, `+${headStartBonus} Pieces`);
                    }
                    gameState.currency += headStartBonus;
                    
                    const centerX = BOARD_X + (gameState.cols * gameState.pieceWidth) / 2 - 40;
                    const centerY = BOARD_Y + (gameState.rows * gameState.pieceHeight) / 2;
                    spawnTextParticle(centerX, centerY, `+${reward} Pieces`);

                    setTimeout(initNewPuzzle, 600);
                }

                updateUI();
            }
        });
    }

    update(dt) {
        if (gameState.autoPlacers > 0) {
            gameState.autoTimer += dt;
            this.launchAutoPieces();
        }

        this.updateFlyingPieces();
    }
}
