// Economy and progression math.

function getUpgradeCost(currentValue) {
    // Exponential curve, tuned so the early game stays cheap and paced:
    // 2 -> 3 costs 2, 3 -> 4 costs 3, then 4, 6, 10, ... growing fast.
    const base = Math.floor(2 * Math.pow(1.5, Math.max(0, currentValue - 2)));
    const discount = Math.max(0, 1 - 0.10 * prestigeLevel("discount"));
    return Math.max(1, Math.floor(base * discount));
}

function getCompletionReward(rows, cols) {
    // Roughly half the piece count: a 2x2 pays 2, a 3x3 pays 4, etc.
    // One completion should comfortably afford roughly one dimension upgrade.
    const totalPieces = rows * cols;
    const baseReward = Math.floor(totalPieces / 2);
    return Math.floor(baseReward * gameState.payoutMultiplier * (1 + 0.10 * (buffs.reward || 0)));
}

function calculatePrestigeGain() {
    // Based on the maximum board size owned, not the currently selected one.
    const totalCurrentCells = gameState.maxRows * gameState.maxCols;
    if (totalCurrentCells <= 100) {return 0;}

    // Flat rate up to a 15x15 board, then +5% per extra cell.
    const FLAT_CAP = 225; // 15x15
    const flatGain = Math.max(0, (totalCurrentCells - 100) / 5);

    let gain;
    if (totalCurrentCells <= FLAT_CAP) {
        gain = flatGain;
    } else {
        gain = ((FLAT_CAP - 100) / 5) * Math.pow(1.001, totalCurrentCells - FLAT_CAP);
    }

    return Math.floor(gain * (1 + 0.10 * prestigeLevel("tokens")) * (1 + 0.10 * (buffs.shards || 0)));
}

function getAutoPlacerCost(count = gameState.autoPlacers) {
    return Math.floor(15 * Math.pow(1.5, count));
}

function getAutoSpeedCost(level = gameState.autoSpeedLevel) {
    return Math.floor(20 * Math.pow(1.6, level - 1));
}

function getLaunchCooldownTrack() {
    const base = 2.0 * Math.pow(0.9, gameState.autoSpeedLevel - 1);
    const swiftBonus = Math.pow(0.9, prestigeLevel("swift")) * Math.pow(0.9, buffs.speed || 0);
    return Math.max(0.1, base * swiftBonus);
}

// --- Prestige upgrades ---

function prestigeLevel(key) {
    return gameState.prestigeUpgrades[key] || 0;
}

function getPrestigeUpgradeCost(key, level = prestigeLevel(key)) {
    const base = { snap: 15, headStart: 15, swift: 20, tokens: 25, mastery: 25, discount: 25, guide: 10 }[key] || 15;
    if (key === "guide") {
        return level >= 1 ? Infinity : base;
    }
    // Flat per-level cost: upgrades stay meaningful across many prestiges
    // instead of doubling away from the prestige rewards.
    return base * (level + 1);
}

function getSnapRadius() {
    return 20 + 4 * prestigeLevel("snap") + 5 * (buffs.snap || 0);
}

function getHeadStartBonus() {
    return 25 * prestigeLevel("headStart") + 25 * (buffs.headstart || 0);
}

function recomputePayoutMultiplier() {
    // Spending Shards on upgrades is a trade: fewer banked Shards,
    // so the payout multiplier drops, but the upgrade perks remain.
    gameState.payoutMultiplier = 1.0 + gameState.prestigeCurrency * (0.01 + 0.01 * prestigeLevel("mastery"));
}
