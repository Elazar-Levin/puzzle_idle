// localStorage save/load of core progression state.

const SAVE_KEY = "puzzleIdleSaveV1";

let suppressAutosave = false;
let lastSaved = 0;

// Awards auto-placer progress earned while the page was closed.
function simulateIdle(seconds) {
    if (gameState.autoPlacers <= 0 || seconds <= 0) {return 0;}

    const elapsed = Math.min(seconds, 8 * 3600);
    const cooldown = getLaunchCooldownTrack();

    // Each cooldown cycle lands up to autoPlacers pieces; subtract a
    // couple of cycles for the initial launch/landing flight time.
    const cycles = Math.max(0, Math.floor(elapsed / cooldown) - 2);
    const placed = cycles * gameState.autoPlacers;

    const perPuzzle = gameState.rows * gameState.cols;
    const completions = Math.floor(placed / perPuzzle);
    if (completions <= 0) {return 0;}

    const reward = getCompletionReward(gameState.rows, gameState.cols) * completions;
    gameState.currency += reward;
    stats.puzzlesCompleted += completions;
    stats.lifetimePieces += reward;
    return { completions, reward };
}

function applyOfflineProgress() {
    if (!lastSaved) {return;}
    const result = simulateIdle((Date.now() - lastSaved) / 1000);
    if (result && result.completions > 0) {
        initNewPuzzle();
        showAlert(`Welcome back! Your auto-placers finished ${result.completions} puzzle${result.completions === 1 ? "" : "s"}: +${result.reward} Pieces`);
    }
}

// Called when the tab is hidden then shown again.
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        hiddenAt = Date.now();
        return;
    }
    if (hiddenAt > 0) {
        const elapsed = (Date.now() - hiddenAt) / 1000;
        hiddenAt = 0;
        const result = simulateIdle(elapsed);
        if (result && result.completions > 0) {
            // Reset the board to reflect the simulated progress.
            initNewPuzzle();
            showAlert(`Welcome back! Your auto-placers finished ${result.completions} puzzle${result.completions === 1 ? "" : "s"}: +${result.reward} Pieces`);
        }
    }
});

function saveGame() {
    if (suppressAutosave) {return;}
    try {
        const data = {
            currency: gameState.currency,
            rows: gameState.rows,
            cols: gameState.cols,
            maxRows: gameState.maxRows,
            maxCols: gameState.maxCols,
            autoPlacers: gameState.autoPlacers,
            autoSpeedLevel: gameState.autoSpeedLevel,
            prestigeCurrency: gameState.prestigeCurrency,
            payoutMultiplier: gameState.payoutMultiplier,
            prestigeUpgrades: gameState.prestigeUpgrades,
            lastSaved: Date.now(),
            stats,
            achievements,
            challenges,
            buffs,
            lastDailyDate,
            activeSkin,
            autoStrategy,
            skins,
            musicVolume,
            musicMuted,
            sfxMuted,
            runLog,
            buyAmount,
            tutorialSeen,
            prestigeTipSeen,
            challengeTipSeen,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Save failed:", e);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {return;}

        const d = JSON.parse(raw);
        if (typeof d !== "object" || d === null) {return;}

        if (typeof d.currency === "number" && d.currency >= 0) {gameState.currency = d.currency;}
        if (Number.isInteger(d.rows) && d.rows >= 2 && d.rows <= 40) {gameState.rows = d.rows;}
        if (Number.isInteger(d.cols) && d.cols >= 2 && d.cols <= 40) {gameState.cols = d.cols;}
        if (Number.isInteger(d.maxRows) && d.maxRows >= 2 && d.maxRows <= 40) {gameState.maxRows = d.maxRows;}
        if (Number.isInteger(d.maxCols) && d.maxCols >= 2 && d.maxCols <= 40) {gameState.maxCols = d.maxCols;}
        if (gameState.rows > gameState.maxRows) {gameState.rows = gameState.maxRows;}
        if (gameState.cols > gameState.maxCols) {gameState.cols = gameState.maxCols;}
        if (Number.isInteger(d.autoPlacers) && d.autoPlacers >= 0) {gameState.autoPlacers = d.autoPlacers;}
        if (Number.isInteger(d.autoSpeedLevel) && d.autoSpeedLevel >= 1) {gameState.autoSpeedLevel = d.autoSpeedLevel;}
        if (typeof d.prestigeCurrency === "number" && d.prestigeCurrency >= 0) {gameState.prestigeCurrency = d.prestigeCurrency;}
        if (typeof d.payoutMultiplier === "number" && d.payoutMultiplier >= 1) {gameState.payoutMultiplier = d.payoutMultiplier;}
        if (d.prestigeUpgrades && typeof d.prestigeUpgrades === "object") {
            for (const key of ["snap", "headStart", "swift", "tokens", "mastery", "discount", "guide"]) {
                if (Number.isInteger(d.prestigeUpgrades[key]) && d.prestigeUpgrades[key] >= 0) {
                    gameState.prestigeUpgrades[key] = d.prestigeUpgrades[key];
                }
            }
        }
        if (typeof d.lastSaved === "number" && d.lastSaved > 0) {lastSaved = d.lastSaved;}
        if (typeof d.lastDailyDate === "string") {lastDailyDate = d.lastDailyDate;}
        if (typeof d.activeSkin === "string" && THEMES[d.activeSkin]) {activeSkin = d.activeSkin;}
        if (typeof d.autoStrategy === "string") {autoStrategy = d.autoStrategy;}
        if (typeof d.musicVolume === "number" && d.musicVolume >= 0 && d.musicVolume <= 1) {musicVolume = d.musicVolume;}
        if (typeof d.musicMuted === "boolean") {musicMuted = d.musicMuted;}
        if (typeof d.sfxMuted === "boolean") {sfxMuted = d.sfxMuted;}
        if (Array.isArray(d.runLog)) {
            for (const entry of d.runLog.slice(0, 20)) {
                if (entry && typeof entry === "object" &&
                    typeof entry.index === "number" && typeof entry.shards === "number" &&
                    typeof entry.rows === "number" && typeof entry.cols === "number" &&
                    typeof entry.seconds === "number") {
                    runLog.push(entry);
                }
            }
        }
        if (typeof d.runStartedAt === "number" && d.runStartedAt > 0) {runStartedAt = d.runStartedAt;}
        if (d.buyAmount === 1 || d.buyAmount === 10 || d.buyAmount === "max") {buyAmount = d.buyAmount;}
        if (typeof d.tutorialSeen === "boolean") {tutorialSeen = d.tutorialSeen;}
        if (typeof d.prestigeTipSeen === "boolean") {prestigeTipSeen = d.prestigeTipSeen;}
        if (typeof d.challengeTipSeen === "boolean") {challengeTipSeen = d.challengeTipSeen;}
        if (d.skins && typeof d.skins === "object") {
            for (const key of Object.keys(THEMES)) {
                if (d.skins[key] === true) {skins[key] = true;}
            }
        }
        if (d.stats && typeof d.stats === "object") {
            for (const key of ["piecesPlaced", "puzzlesCompleted", "prestiges", "lifetimePieces", "fastestMs", "maxCells"]) {
                if (typeof d.stats[key] === "number" && d.stats[key] >= 0) {stats[key] = d.stats[key];}
            }
        }
        if (d.achievements && typeof d.achievements === "object") {
            for (const key of Object.keys(d.achievements)) {
                if (d.achievements[key] === true) {achievements[key] = true;}
            }
        }
        if (d.challenges && typeof d.challenges === "object") {
            for (const key of Object.keys(d.challenges)) {
                if (d.challenges[key] === true) {challenges[key] = true;}
            }
        }
        if (d.buffs && typeof d.buffs === "object") {
            for (const key of Object.keys(buffs)) {
                if (typeof d.buffs[key] === "number" && d.buffs[key] >= 0) {buffs[key] = d.buffs[key];}
            }
        }
    } catch (e) {
        console.warn("Load failed, starting fresh:", e);
    }
}

function resetSave() {
    showConfirm("Reset your save? All progress, including Prestige Shards, will be permanently deleted.", () => {
        // Block the beforeunload autosave from writing the current
        // in-memory progress back over the save we are about to delete.
        suppressAutosave = true;
        try {
            localStorage.removeItem(SAVE_KEY);
        } catch (e) {
            console.warn("Reset failed:", e);
        }
        location.reload();
    });
}
