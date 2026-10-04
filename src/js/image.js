// Puzzle image loading with graceful fallback and eager preloading.
//
// Pipeline: whenever a puzzle starts, the texture downloaded during the
// PREVIOUS puzzle is swapped in, and the following one is immediately
// requested in the background. If a download isn't finished yet, the
// old texture stays on screen until the new one is ready — the board
// never blanks out.

let nextImage = null;   // texture reserved for the next puzzle
let nextReady = false;  // true once that texture has finished downloading
let nextW = 0;
let nextH = 0;

function expectedImageSize() {
    return {
        w: Math.floor(gameState.cols * gameState.pieceWidth),
        h: Math.floor(gameState.rows * gameState.pieceHeight),
    };
}

function requestImage(onReady) {
    const { w, h } = expectedImageSize();
    const randomSeed = Math.floor(Math.random() * 10000);

    const img = new Image();
    img.crossOrigin = "anonymous";

    // Handlers must be attached BEFORE src is set, or a fast/cached
    // response can fire before we start listening.
    img.onload = () => {
        tagPieceColors(img);
        onReady(img, true);
    };
    img.onerror = () => {
        console.error("Puzzle texture download failed. Falling back to solid color scheme.");
        onReady(img, false);
    };

    img.src = `https://picsum.photos/${w}/${h}?random=${randomSeed}`;
    return img;
}

// Average each piece's color from the finished image, then bucket it,
// so the auto-placer can fill "color sections" like a real puzzle.
function tagPieceColors(img) {
    try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const cx = c.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0);

        const pw = img.naturalWidth / gameState.cols;
        const ph = img.naturalHeight / gameState.rows;

        // Average color per piece.
        const avgs = [];
        for (const piece of puzzle ? puzzle.pieces : []) {
            const data = cx.getImageData(
                Math.floor(piece.col * pw + pw * 0.25),
                Math.floor(piece.row * ph + ph * 0.25),
                Math.max(1, Math.floor(pw * 0.5)),
                Math.max(1, Math.floor(ph * 0.5)),
            ).data;

            let r = 0, g = 0, b = 0, n = 0;
            for (let i = 0; i < data.length; i += 4) {
                r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
            }
            avgs.push({ piece, r: r / n, g: g / n, b: b / n });
        }

        // Spatial smoothing: blend each piece's average with its grid
        // neighbors so single-piece color noise doesn't fragment sections.
        const currentPuzzle = puzzle;
        if (currentPuzzle) {
            const smoothed = avgs.map(a => {
                const { row, col } = a.piece;
                const neighbors = [
                    currentPuzzle.getPiece(row - 1, col),
                    currentPuzzle.getPiece(row + 1, col),
                    currentPuzzle.getPiece(row, col - 1),
                    currentPuzzle.getPiece(row, col + 1),
                ].filter(Boolean);

                let r = a.r, g = a.g, b = a.b, n = 1;
                for (const nb of neighbors) {
                    const nbAvg = avgs.find(x => x.piece === nb);
                    if (nbAvg) {
                        r += nbAvg.r; g += nbAvg.g; b += nbAvg.b; n++;
                    }
                }
                return { piece: a.piece, r: r / n, g: g / n, b: b / n };
            });
            avgs.length = 0;
            avgs.push(...smoothed);
        }

        // K-means into a handful of color sections (was: naive per-channel
        // rounding, which split every piece into its own "color").
        const K = 6;
        const seeds = [];
        for (let i = 0; i < K && i < avgs.length; i++) {
            seeds.push({ ...avgs[Math.floor((i / K) * avgs.length)] });
        }
        for (let iter = 0; iter < 10; iter++) {
            const sums = seeds.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
            for (const a of avgs) {
                let best = 0, bestDist = Infinity;
                seeds.forEach((s, i) => {
                    const d = (a.r - s.r) ** 2 + (a.g - s.g) ** 2 + (a.b - s.b) ** 2;
                    if (d < bestDist) {bestDist = d; best = i;}
                });
                a.bucket = best;
                sums[best].r += a.r; sums[best].g += a.g; sums[best].b += a.b; sums[best].n++;
            }
            sums.forEach((s, i) => {
                if (s.n > 0) {
                    seeds[i].r = s.r / s.n; seeds[i].g = s.g / s.n; seeds[i].b = s.b / s.n;
                }
            });
        }

        for (const a of avgs) {
            a.piece.colorBucket = String(a.bucket);
        }

        // Group same-colored pieces into contiguous sections (flood fill
        // over grid neighbors) — this is what a human does by hand.
        let sectionId = 0;
        const seen = new Set();
        if (currentPuzzle) {
            for (const p of currentPuzzle.pieces) {
                if (seen.has(p)) {continue;}
                const stack = [p];
                seen.add(p);
                p.sectionId = sectionId;
                while (stack.length > 0) {
                    const cur = stack.pop();
                    const neighbors = [
                        currentPuzzle.getPiece(cur.row - 1, cur.col),
                        currentPuzzle.getPiece(cur.row + 1, cur.col),
                        currentPuzzle.getPiece(cur.row, cur.col - 1),
                        currentPuzzle.getPiece(cur.row, cur.col + 1),
                    ];
                    for (const nb of neighbors) {
                        if (nb && !seen.has(nb) && nb.colorBucket === cur.colorBucket) {
                            seen.add(nb);
                            nb.sectionId = sectionId;
                            stack.push(nb);
                        }
                    }
                }
                sectionId++;
            }
        }
    } catch (e) {
        console.warn("Could not sample piece colors:", e);
    }
}

function kickoffPreload() {
    const { w, h } = expectedImageSize();
    nextW = w;
    nextH = h;
    nextReady = false;
    nextImage = requestImage((img, ok) => {
        nextReady = ok;
        if (!ok) {
            nextImage = null;
        }
    });
}

function loadNewPuzzleImage() {
    const { w, h } = expectedImageSize();
    const dimsMatch = nextImage && nextW === w && nextH === h;

    if (dimsMatch && nextReady) {
        // Ready to go: instant swap.
        gameState.puzzleImage = nextImage;
        gameState.imageLoaded = true;
    } else if (dimsMatch) {
        // Still downloading — reuse that same request as the swap.
        // Keep the old texture on screen until it lands.
        const img = nextImage;
        img.onload = null;
        img.onerror = null;
        img.addEventListener("load", () => {
            gameState.puzzleImage = img;
            gameState.imageLoaded = true;
        });
        img.addEventListener("error", () => {
            console.error("Puzzle texture download failed.");
        });
        // If it somehow already completed between checks, swap now.
        if (img.complete && img.naturalWidth > 0) {
            gameState.puzzleImage = img;
            gameState.imageLoaded = true;
        }
    } else {
        // Grid size changed (upgrade/prestige): fetch a fresh one and
        // swap it in when ready, keeping the old texture visible meanwhile.
        const img = requestImage((loaded, ok) => {
            if (ok) {
                gameState.puzzleImage = loaded;
                gameState.imageLoaded = true;
            }
        });
        void img;
    }

    // Always have the following texture downloading in the background.
    nextImage = null;
    nextReady = false;
    kickoffPreload();
}
