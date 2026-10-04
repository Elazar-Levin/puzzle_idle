const FLAT = 0;
const TAB = 1;
const BLANK = -1;

const complement = (edge) => (edge === TAB ? BLANK : TAB);

function randomEdgeParams() {
    return {
        tabScale: 0.7 + Math.random() * 0.15,
        neckWidth: 0.18 + Math.random() * 0.15,
        headScale: 0.9 + Math.random() * 0.35,
        asymmetry: (Math.random() - 0.5) * 0.1,
    };
}

class JigsawPiece {
    constructor(row, col, edges, edgeParams) {
        this.row = row;
        this.col = col;
        this.edges = edges; // { top, right, bottom, left }
        this.edgeParams = edgeParams; // { top, right, bottom, left } - shared with neighbors
        this.x = 0;
        this.y = 0;
        this.placed = false;
        this.id = `${row}-${col}`;
        this.isAnimating = false;
        this.animTargetX = 0;
        this.animTargetY = 0;
        this.trail = [];
    }

    isBorder() {
        return (
            this.edges.top === FLAT ||
            this.edges.right === FLAT ||
            this.edges.bottom === FLAT ||
            this.edges.left === FLAT
        );
    }

    isCorner() {
        const flatCount = [this.edges.top, this.edges.right, this.edges.bottom, this.edges.left].filter(
            (e) => e === FLAT,
        ).length;
        return flatCount === 2;
    }
}

function generatePuzzleEdges(rows, cols) {
    const hEdges = [];
    const vEdges = [];
    const hParams = [];
    const vParams = [];

    for (let r = 0; r <= rows; r++) {
        hEdges[r] = [];
        hParams[r] = [];
        for (let c = 0; c < cols; c++) {
            if (r === 0 || r === rows) {
                hEdges[r][c] = FLAT;
            } else {
                hEdges[r][c] = Math.random() < 0.5 ? TAB : BLANK;
                hParams[r][c] = randomEdgeParams();
            }
        }
    }

    for (let r = 0; r < rows; r++) {
        vEdges[r] = [];
        vParams[r] = [];
        for (let c = 0; c <= cols; c++) {
            if (c === 0 || c === cols) {
                vEdges[r][c] = FLAT;
            } else {
                vEdges[r][c] = Math.random() < 0.5 ? TAB : BLANK;
                vParams[r][c] = randomEdgeParams();
            }
        }
    }

    return { hEdges, vEdges, hParams, vParams };
}
