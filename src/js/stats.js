// Stats, daily bonus, and achievements.

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function recordPuzzleComplete(reward) {
    stats.puzzlesCompleted++;
    stats.piecesPlaced += gameState.rows * gameState.cols;
    stats.lifetimePieces += reward;

    if (puzzleStartTime > 0) {
        const elapsed = Date.now() - puzzleStartTime;
        if (stats.fastestMs === 0 || elapsed < stats.fastestMs) {
            stats.fastestMs = elapsed;
        }
    }

    // Daily bonus: first puzzle completed each day pays shards.
    if (lastDailyDate !== todayStr()) {
        lastDailyDate = todayStr();
        gameState.prestigeCurrency += 5;
        recomputePayoutMultiplier();
        showAlert("Daily bonus claimed: +5 Shards!");
    }

    tickChallenges();
    checkAchievements();
    saveGame();
}

const ACHIEVEMENTS = [
    { id: "place50", name: "Getting Started", desc: "Place 50 pieces", test: () => stats.piecesPlaced >= 50 },
    { id: "place500", name: "Piece Collector", desc: "Place 500 pieces", test: () => stats.piecesPlaced >= 500 },
    { id: "complete10", name: "Puzzle Solver", desc: "Complete 10 puzzles", test: () => stats.puzzlesCompleted >= 10 },
    { id: "complete50", name: "Puzzle Master", desc: "Complete 50 puzzles", test: () => stats.puzzlesCompleted >= 50 },
    { id: "prestige1", name: "Rebirth", desc: "Prestige once", test: () => stats.prestiges >= 1 },
    { id: "auto3", name: "Automation Age", desc: "Own 3 auto-placers", test: () => gameState.autoPlacers >= 3 },
    { id: "big6", name: "Cramped Quarters", desc: "Reach a 6x6 grid", test: () => gameState.rows * gameState.cols >= 36 },
    { id: "fast30", name: "Speed Demon", desc: "Finish a puzzle in under 30s", test: () => stats.fastestMs > 0 && stats.fastestMs < 30000 },
    { id: "place2000", name: "Sandwich Artist", desc: "Place 2,000 pieces", test: () => stats.piecesPlaced >= 2000 },
    { id: "complete100", name: "Completionist", desc: "Complete 100 puzzles", test: () => stats.puzzlesCompleted >= 100 },
    { id: "lifetime1k", name: "High Roller", desc: "Earn 1,000 pieces in total", test: () => stats.lifetimePieces >= 1000 },
    { id: "auto5", name: "Factory Floor", desc: "Own 5 auto-placers", test: () => gameState.autoPlacers >= 5 },
];

const CHALLENGE_UNLOCK_CELLS = 500;

// Timed challenges: each is started manually and must be won before the
// deadline. A win grants its permanent buff (even across prestiges).
const CHALLENGES = [
    { id: "blitz25", name: "Blitz", desc: "Place 25 pieces in 60s", duration: 60000, target: 25, counter: "piecesPlaced", buff: { key: "reward", label: "+10% pieces earned" } },
    { id: "quick45", name: "Efficient Hands", desc: "Complete a puzzle in 45s", duration: 45000, target: 1, counter: "puzzlesCompleted", buff: { key: "shards", label: "+10% shards" } },
    { id: "party60", name: "Piece Party", desc: "Place 60 pieces in 90s", duration: 90000, target: 60, counter: "piecesPlaced", buff: { key: "snap", label: "+5px snap radius" } },
    { id: "spree100", name: "Earnings Spree", desc: "Earn 100 pieces in 60s", duration: 60000, target: 100, counter: "lifetimePieces", buff: { key: "speed", label: "auto-placers 10% faster" } },
    { id: "marathon2", name: "Marathon", desc: "Complete 2 puzzles in 3 minutes", duration: 180000, target: 2, counter: "puzzlesCompleted", buff: { key: "headstart", label: "+25 pieces per puzzle start" } },
];

let activeChallenge = null; // { id, endsAt, baseline }

function challengeProgress(c) {
    if (!activeChallenge || activeChallenge.id !== c.id) {return 0;}
    return (stats[c.counter] || 0) - activeChallenge.baseline;
}

function challengeTarget(c) {
    // Scale targets to the max board size so they stay challenging
    // instead of becoming trivial at 500+ cells.
    const scale = Math.max(1, Math.floor((gameState.maxRows * gameState.maxCols) / 500));
    return c.target * scale;
}

function startChallenge(id) {
    if (activeChallenge || stats.maxCells < CHALLENGE_UNLOCK_CELLS) {return;}

    const c = CHALLENGES.find(x => x.id === id);
    if (!c || challenges[id]) {return;}

    activeChallenge = {
        id,
        endsAt: Date.now() + c.duration,
        baseline: stats[c.counter] || 0,
    };
    updateUI();
}

function tickChallenges() {
    if (!activeChallenge) {return;}

    const c = CHALLENGES.find(x => x.id === activeChallenge.id);
    if (!c) {activeChallenge = null; return;}

    if (challengeProgress(c) >= challengeTarget(c)) {
        // WIN — apply the permanent buff.
        challenges[c.id] = true;
        buffs[c.buff.key] = (buffs[c.buff.key] || 0) + 1;
        activeChallenge = null;
        recomputePayoutMultiplier();
        saveGame();
        showAlert(`Challenge won: ${c.name}!\nPermanent buff: ${c.buff.label}`);
    } else if (Date.now() >= activeChallenge.endsAt) {
        // FAIL — no penalty, can be retried.
        activeChallenge = null;
        showAlert(`Challenge failed: ${c.name}. Better luck next time!`);
    }
    updateUI();
}

setInterval(tickChallenges, 500);

let lastChallengesSignature = "";

function renderChallenges() {
    const el = document.getElementById("challenges-list");
    const hint = document.getElementById("challenges-hint");
    const active = document.getElementById("challenge-active");
    if (!el || !hint) {return;}

    if (stats.maxCells < CHALLENGE_UNLOCK_CELLS) {
        hint.style.display = "block";
        el.innerHTML = "";
        if (active) {active.style.display = "none";}
        return;
    }

    hint.style.display = "none";

    if (active) {
        if (activeChallenge) {
            const c = CHALLENGES.find(x => x.id === activeChallenge.id);
            const left = Math.max(0, Math.ceil((activeChallenge.endsAt - Date.now()) / 1000));
            active.style.display = "block";
            active.textContent = `Active: ${c.name} — ${challengeProgress(c)}/${challengeTarget(c)} — ${left}s left`;
        } else {
            active.style.display = "none";
        }
    }

    // Guard: only rebuild the button list when something actually changed —
    // rebuilding mid-hover destroys the element under the cursor.
    const signature = CHALLENGES.map(c => challenges[c.id] ? 1 : 0).join("") + (activeChallenge ? "1" : "0");
    if (signature === lastChallengesSignature) {return;}
    lastChallengesSignature = signature;

    el.innerHTML = CHALLENGES.map(c => {
        if (challenges[c.id]) {
            return `<div class="achievement done">✓ ${c.name} — done (${c.buff.label})</div>`;
        }
        const btn = activeChallenge ? "" : `<button onclick="startChallenge('${c.id}')">Start</button>`;
        return `<div class="achievement">○ ${c.name} — ${c.desc} (need ${challengeTarget(c)}) (${c.buff.label}) ${btn}</div>`;
    }).join("");
}

function checkAchievements() {
    // Achievements only start paying out after the first prestige,
    // otherwise the early shard flow inflates the multiplier too fast.
    if (stats.prestiges < 1) {return;}

    for (const a of ACHIEVEMENTS) {
        if (!achievements[a.id] && a.test()) {
            achievements[a.id] = true;
            gameState.prestigeCurrency += 5;
            recomputePayoutMultiplier();
            showAlert(`Achievement unlocked: ${a.name} (${a.desc})\n+5 Shards`);
        }
    }
}

let lastAchievementsSignature = "";

function renderAchievements() {
    const el = document.getElementById("achievements-list");
    if (!el) {return;}

    // Skip re-render unless an achievement actually changed state.
    const signature = ACHIEVEMENTS.map(a => achievements[a.id] ? 1 : 0).join("");
    if (signature === lastAchievementsSignature) {return;}
    lastAchievementsSignature = signature;

    el.innerHTML = ACHIEVEMENTS.map(a =>
        `<div class="achievement ${achievements[a.id] ? "done" : ""}">` +
        `${achievements[a.id] ? "✓" : "○"} ${a.name} — ${a.desc}</div>`,
    ).join("");
}

let lastRunLogSignature = "";

function renderRunLog() {
    const el = document.getElementById("run-log-list");
    if (!el) {return;}

    const signature = runLog.length.toString() + (runLog[0] ? runLog[0].index : "0");
    if (signature === lastRunLogSignature) {return;}
    lastRunLogSignature = signature;

    if (runLog.length === 0) {
        el.innerHTML = "<div class=\"achievement\">No prestige runs yet.</div>";
        return;
    }

    el.innerHTML = runLog.map(e => {
        const mins = Math.floor(e.seconds / 60);
        const secs = e.seconds % 60;
        const time = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        return `<div class="achievement done">#${e.index} — ${e.shards} Shards — ${e.rows}x${e.cols} — ${time}</div>`;
    }).join("");
}

function setAutoStrategy(strategy) {
    autoStrategy = strategy;
    saveGame();
    updateUI();
}

function buySkin(id) {
    const theme = THEMES[id];
    if (!theme) {return;}

    if (skins[id]) {
        activeSkin = id; // already owned: just activate
    } else if (gameState.prestigeCurrency >= theme.cost) {
        gameState.prestigeCurrency -= theme.cost;
        skins[id] = true;
        activeSkin = id;
        recomputePayoutMultiplier();
    } else {
        return;
    }

    saveGame();
    updateUI();
}

let lastSkinsSignature = "";

function renderSkins() {
    const el = document.getElementById("skins-list");
    if (!el) {return;}

    // Only rebuild when something actually changed — rebuilding the
    // buttons mid-hover destroys the element under the cursor.
    const signature = Object.keys(THEMES).map(id => `${id}:${skins[id] ? 1 : 0}:${activeSkin === id ? 1 : 0}`).join("|");
    if (signature === lastSkinsSignature) {return;}
    lastSkinsSignature = signature;

    el.innerHTML = Object.entries(THEMES).map(([id, t]) => {
        const owned = skins[id];
        const active = activeSkin === id;
        const label = owned ? (active ? `${t.name} ✓` : t.name) : `${t.name} (${t.cost} Shards)`;
        return `<button class="skin-btn ${active ? "active" : ""}" onclick="buySkin('${id}')">${label}</button>`;
    }).join("");
}

function updateAutoStrategyButtons() {
    document.querySelectorAll("[data-strategy]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.strategy === autoStrategy);
    });
}
