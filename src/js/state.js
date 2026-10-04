/* eslint-disable prefer-const -- reassigned across modules; prefer-const can't see that */
// Shared canvas, game state, and cross-module flags.
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameState = {
    currency: 0,
    rows: 2,
    cols: 2,
    maxRows: 2,
    maxCols: 2,
    pieceWidth: 60,
    pieceHeight: 60,
    tabSize: 14,
    autoPlacers: 0,
    autoSpeedLevel: 1,
    autoTimer: 0,
    activeSection: null,
    puzzleImage: null,
    imageLoaded: false,
    prestigeCurrency: 0,
    payoutMultiplier: 1.0,
    prestigeUpgrades: {
        snap: 0,
        headStart: 0,
        swift: 0,
        tokens: 0,
        mastery: 0,
        discount: 0,
        guide: 0,
    },
};

let puzzle = null;
let particles = [];

let BOARD_WIDTH = gameState.rows * gameState.pieceWidth;
let BOARD_HEIGHT = gameState.cols * gameState.pieceHeight;
let BOARD_X = 0;
let BOARD_Y = 0;

let isDragging = false;
let draggedPiece = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let lastDailyDate = "";
let activeSkin = "midnight";
let autoStrategy = "random";
let puzzleStartTime = 0;
let musicVolume = 0.35;
let musicMuted = false;
let sfxMuted = false;

const stats = {
    piecesPlaced: 0,
    puzzlesCompleted: 0,
    prestiges: 0,
    lifetimePieces: 0,
    fastestMs: 0,
    maxCells: 0,
};

const skins = { midnight: true };
const achievements = {}; // id: true once unlocked
const challenges = {}; // id: true once won
const buffs = { reward: 0, shards: 0, snap: 0, speed: 0, headstart: 0 };
const runLog = []; // completed prestige runs, newest first
let runStartedAt = Date.now();

const THEMES = {
    midnight: { name: "Midnight", bg: "#1a1a2e", mat: "#2a2a4a", cost: 0 },
    forest: { name: "Forest", bg: "#122019", mat: "#1d3a2c", cost: 5 },
    sunset: { name: "Sunset", bg: "#2e1a1a", mat: "#4a2b2b", cost: 5 },
    ocean: { name: "Ocean", bg: "#10202e", mat: "#1a3448", cost: 5 },
};
