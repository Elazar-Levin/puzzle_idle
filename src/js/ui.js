// DOM UI updates and shop/prestige actions.
function updateUI() {
    document.getElementById("matrix-display").innerText = `${gameState.rows} x ${gameState.cols}`;
    document.getElementById("row-cost").innerText = previewCost((i) => getUpgradeCost(gameState.maxRows + i)).total;
    document.getElementById("col-cost").innerText = previewCost((i) => getUpgradeCost(gameState.maxCols + i)).total;
    document.getElementById("auto-cost").innerText = previewCost((i) => getAutoPlacerCost(gameState.autoPlacers + i)).total;
    document.getElementById("speed-cost").innerText = previewCost((i) => getAutoSpeedCost(gameState.autoSpeedLevel + i)).total;
    
    // NEW: Sync premium prestige visual nodes
    document.getElementById("multiplier-display").innerText = `x${gameState.payoutMultiplier.toFixed(1)}`;
    document.getElementById("prestige-display").innerText = gameState.prestigeCurrency;
    document.getElementById("wallet-display").innerText = `${gameState.currency} Pieces`;

    document.getElementById("snap-level").innerText = prestigeLevel("snap");
    document.getElementById("headstart-level").innerText = prestigeLevel("headStart");
    document.getElementById("swift-level").innerText = prestigeLevel("swift");
    document.getElementById("snap-cost").innerText = previewCost((i) => getPrestigeUpgradeCost("snap", prestigeLevel("snap") + i), gameState.prestigeCurrency).total;
    document.getElementById("headstart-cost").innerText = previewCost((i) => getPrestigeUpgradeCost("headStart", prestigeLevel("headStart") + i), gameState.prestigeCurrency).total;
    document.getElementById("swift-cost").innerText = previewCost((i) => getPrestigeUpgradeCost("swift", prestigeLevel("swift") + i), gameState.prestigeCurrency).total;
    document.getElementById("tokens-level").innerText = prestigeLevel("tokens");
    document.getElementById("mastery-level").innerText = prestigeLevel("mastery");
    document.getElementById("tokens-cost").innerText = previewCost((i) => getPrestigeUpgradeCost("tokens", prestigeLevel("tokens") + i), gameState.prestigeCurrency).total;
    document.getElementById("mastery-cost").innerText = previewCost((i) => getPrestigeUpgradeCost("mastery", prestigeLevel("mastery") + i), gameState.prestigeCurrency).total;

    document.getElementById("discount-level").innerText = prestigeLevel("discount");
    document.getElementById("discount-cost").innerText = previewCost((i) => getPrestigeUpgradeCost("discount", prestigeLevel("discount") + i), gameState.prestigeCurrency).total;
    document.getElementById("discount-info").innerText =
        `-${prestigeLevel("discount") * 10}% → -${(prestigeLevel("discount") + 1) * 10}% upgrade prices`;

    document.getElementById("guide-level").innerText = prestigeLevel("guide") >= 1 ? "Owned" : "—";
    document.getElementById("guide-cost").innerText = prestigeLevel("guide") >= 1 ? "—" : getPrestigeUpgradeCost("guide");
    document.getElementById("guide-btn").disabled = prestigeLevel("guide") >= 1;

    document.getElementById("row-info").innerText = `${gameState.maxRows} → ${gameState.maxRows + 1} rows`;
    document.getElementById("col-info").innerText = `${gameState.maxCols} → ${gameState.maxCols + 1} cols`;

    document.getElementById("matrix-display").innerText = `${gameState.rows} x ${gameState.cols} (max ${gameState.maxRows} x ${gameState.maxCols})`;

    const rowsSelect = document.getElementById("rows-select");
    const colsSelect = document.getElementById("cols-select");
    if (rowsSelect.options.length !== gameState.maxRows - 1) {
        rowsSelect.innerHTML = "";
        for (let r = 2; r <= gameState.maxRows; r++) {
            rowsSelect.add(new Option(r, r));
        }
    }
    if (colsSelect.options.length !== gameState.maxCols - 1) {
        colsSelect.innerHTML = "";
        for (let c = 2; c <= gameState.maxCols; c++) {
            colsSelect.add(new Option(c, c));
        }
    }
    rowsSelect.value = gameState.rows;
    colsSelect.value = gameState.cols;
    document.getElementById("auto-info").innerText = `${gameState.autoPlacers} → ${gameState.autoPlacers + 1} slots`;
    const swiftFactor = Math.pow(0.9, prestigeLevel("swift"));
    document.getElementById("speed-info").innerText =
        `${(2.0 * Math.pow(0.9, gameState.autoSpeedLevel - 1) * swiftFactor).toFixed(2)}s → ` +
        `${(2.0 * Math.pow(0.9, gameState.autoSpeedLevel) * swiftFactor).toFixed(2)}s`;
    document.getElementById("snap-info").innerText = `${getSnapRadius()}px → ${getSnapRadius() + 4}px`;
    document.getElementById("headstart-info").innerText = `+${getHeadStartBonus()} → +${getHeadStartBonus() + 25} Pieces`;
    document.getElementById("swift-info").innerText =
        `×${Math.pow(0.9, prestigeLevel("swift")).toFixed(2)} → ×${Math.pow(0.9, prestigeLevel("swift") + 1).toFixed(2)} launch rate`;
    document.getElementById("tokens-info").innerText =
        `+${prestigeLevel("tokens") * 10}% → +${(prestigeLevel("tokens") + 1) * 10}% Shards`;
    document.getElementById("mastery-info").innerText =
        `${5 + prestigeLevel("mastery")}% → ${6 + prestigeLevel("mastery")}% boost per shard`;

    document.getElementById("daily-display").innerText = (lastDailyDate === todayStr()) ? "Claimed" : "Available";

    document.getElementById("volume-slider").value = Math.round(musicVolume * 100);
    document.getElementById("mute-btn").innerText = musicMuted ? "Unmute Music" : "Mute Music";
    document.getElementById("sfx-mute-btn").innerText = sfxMuted ? "Unmute SFX" : "Mute SFX";

    // Keep the buy-amount button anchored to the panel's right edge,
    // whatever width the panel currently has.
    const overlay = document.getElementById("ui-overlay");
    const buyBtn = document.getElementById("buy-amount-btn");
    if (overlay && buyBtn) {
        buyBtn.style.left = `${overlay.getBoundingClientRect().right + 12}px`;
    }

    document.getElementById("stat-pieces").innerText = stats.piecesPlaced;
    document.getElementById("stat-completed").innerText = stats.puzzlesCompleted;
    document.getElementById("stat-prestiges").innerText = stats.prestiges;
    document.getElementById("stat-lifetime").innerText = stats.lifetimePieces;
    document.getElementById("stat-fastest").innerText = stats.fastestMs > 0 ? `${(stats.fastestMs / 1000).toFixed(1)}s` : "—";

    document.body.style.background = THEMES[activeSkin].bg;

    const currentCells = gameState.rows * gameState.cols;
    if (currentCells > stats.maxCells) {stats.maxCells = currentCells;}

    renderChallenges();
    renderAchievements();
    renderSkins();
    updateAutoStrategyButtons();
    document.getElementById("buy-amount-btn").innerText = buyAmount === "max" ? "Buy: Max" : `Buy: x${buyAmount}`;
    renderRunLog();
    checkTutorialPopups();

    const potentialGain = calculatePrestigeGain();
    document.getElementById("prestige-gain").innerText = potentialGain;
    
    // Gray out button if the user is still on the baseline 2x2 grid and has nothing to claim
    const btn = document.getElementById("prestige-btn");
    if (btn) {
        btn.disabled = (potentialGain === 0);
        btn.style.opacity = (potentialGain === 0) ? "0.5" : "1.0";
        btn.style.cursor = (potentialGain === 0) ? "not-allowed" : "pointer";
    }
}


function initTooltips() {
    const tip = document.getElementById("tooltip");
    if (!tip) {return;}

    document.addEventListener("mouseover", (e) => {
        const target = e.target.closest("[data-tip]");
        if (!target) {return;}

        tip.textContent = target.dataset.tip;
        tip.style.display = "block";

        const rect = target.getBoundingClientRect();
        let x = rect.left;
        let y = rect.bottom + 6;

        // Keep the tooltip on screen.
        if (x + tip.offsetWidth > window.innerWidth - 8) {
            x = window.innerWidth - tip.offsetWidth - 8;
        }
        if (y + tip.offsetHeight > window.innerHeight - 8) {
            y = rect.top - tip.offsetHeight - 6;
        }

        tip.style.left = `${x}px`;
        tip.style.top = `${Math.max(8, y)}px`;
    });

    document.addEventListener("mouseout", (e) => {
        if (e.target.closest("[data-tip]")) {
            tip.style.display = "none";
        }
    });
}

initTooltips();

function toggleMenu(id) {
    const section = document.getElementById(id);
    if (!section) {return;}

    section.hidden = !section.hidden;

    const toggle = section.previousElementSibling;
    if (toggle && toggle.classList.contains("menu-toggle")) {
        toggle.textContent = toggle.textContent.replace(section.hidden ? "▼" : "▶", section.hidden ? "▶" : "▼");
    }

    // Panel width may have changed as sections open/close.
    updateUI();
}

// --- Buy-amount helpers (Buy x1 / x10 / Max) ---
let buyAmount = 1; // 1 | 10 | "max"

function cycleBuyAmount() {
    buyAmount = buyAmount === 1 ? 10 : (buyAmount === 10 ? "max" : 1);
    updateUI();
}

// Returns { total, n } for buying up to `buyAmount` levels (or as many as
// affordable for "max") from the current level, using costAt(i) for level i.
function previewCost(costAt, budget = gameState.currency) {
    const limit = buyAmount === "max" ? 100 : buyAmount;
    let total = 0;
    let n = 0;
    for (let i = 0; i < limit; i++) {
        const c = costAt(i);
        if (total + c > budget) {break;}
        total += c;
        n++;
    }
    // Always show the price of at least the next level, even if it's
    // unaffordable right now — displaying 0 would imply it's free.
    if (n === 0) {
        total = costAt(0);
        n = 1;
    }
    return { total, n };
}

// Loops a purchase up to the selected amount. costAt/apply must consume one
// level per call. Returns how many levels were bought.
function multiBuy(currencyGetter, costAt, apply, cap = 100) {
    const limit = buyAmount === "max" ? cap : buyAmount;
    let bought = 0;
    while (bought < limit) {
        // costAt reads current state (post-increment), so no index needed.
        const cost = costAt();
        if (currencyGetter() < cost) {break;}
        currencyGetter(-cost);
        apply();
        bought++;
    }
    return bought;
}

function buyAutoPlacer() {
    const bought = multiBuy(
        (delta) => {
            if (delta === undefined) {return gameState.currency;}
            gameState.currency += delta;
        },
        () => getAutoPlacerCost(),
        () => {gameState.autoPlacers++;},
    );
    if (bought > 0) {updateUI();}
}

function buyAutoSpeed() {
    const bought = multiBuy(
        (delta) => {
            if (delta === undefined) {return gameState.currency;}
            gameState.currency += delta;
        },
        () => getAutoSpeedCost(),
        () => {gameState.autoSpeedLevel++;},
    );
    if (bought > 0) {updateUI();}
}

function upgradeDimension(dimensionKey) {
    const maxKey = dimensionKey === "rows" ? "maxRows" : "maxCols";
    const bought = multiBuy(
        (delta) => {
            if (delta === undefined) {return gameState.currency;}
            gameState.currency += delta;
        },
        () => getUpgradeCost(gameState[maxKey]),
        () => {gameState[maxKey]++;},
    );
    if (bought > 0) {
        gameState[dimensionKey] = gameState[maxKey];
        initNewPuzzle();
        updateUI();
    }
}

function setCurrentSize(dimensionKey, value) {
    const maxKey = dimensionKey === "rows" ? "maxRows" : "maxCols";
    const v = Math.max(2, Math.min(gameState[maxKey], parseInt(value, 10) || 2));
    if (gameState[dimensionKey] !== v) {
        gameState[dimensionKey] = v;
        initNewPuzzle();
        updateUI();
    }
}

function buyPrestigeUpgrade(key) {
    const bought = multiBuy(
        (delta) => {
            if (delta === undefined) {return gameState.prestigeCurrency;}
            gameState.prestigeCurrency += delta;
        },
        () => getPrestigeUpgradeCost(key),
        () => {gameState.prestigeUpgrades[key]++;},
    );
    if (bought > 0) {
        recomputePayoutMultiplier();
        saveGame();
        updateUI();
    }
}

function executePrestigeReset() {
    const tokensGained = calculatePrestigeGain();
    if (tokensGained <= 0) {return;}

    showConfirm(`Prestige for ${tokensGained} Shards?\n\nYour currency, board size, and piece progress will be wiped. Automation levels are kept.`, () => {
        gameState.prestigeCurrency += tokensGained;
        stats.prestiges++;

        // Log the run before wiping state.
        const runSeconds = Math.floor((Date.now() - runStartedAt) / 1000);
        runLog.unshift({
            index: stats.prestiges,
            shards: tokensGained,
            rows: gameState.rows,
            cols: gameState.cols,
            seconds: runSeconds,
        });
        if (runLog.length > 20) {runLog.pop();}
        runStartedAt = Date.now();

        recomputePayoutMultiplier();

        // Wipe standard progress; keep automation so early tiers solve quickly.
        gameState.currency = 0;
        gameState.rows = 2;
        gameState.cols = 2;
        gameState.maxRows = 2;
        gameState.maxCols = 2;
        gameState.autoTimer = 0;

        initNewPuzzle();
        updateUI();
    });
}
