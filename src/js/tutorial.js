// One-time interactive tutorial for first-time players.

const TUTORIAL_STEPS = [
    "Welcome to Puzzle Idle! Drag the loose pieces into the board to complete the puzzle.",
    "Completing a puzzle earns Pieces. Spend them on rows, columns, and auto-placers from the Upgrades menu.",
    "Auto-placers place pieces for you automatically — faster with speed upgrades.",
    "Once your max board passes 100 cells, you can Prestige to trade progress for permanent Shard bonuses.",
    "Shards buy permanent upgrades and board skins. Good luck!",
];

let tutorialIndex = 0;
let tutorialSeen = false;
let prestigeTipSeen = false;
let challengeTipSeen = false;

function showTutorial() {
    tutorialIndex = 0;
    showModal(TUTORIAL_STEPS[tutorialIndex], [
        { label: "Next", onClick: advanceTutorial },
        { label: "Skip", onClick: finishTutorial },
    ]);
}

function advanceTutorial() {
    tutorialIndex++;
    if (tutorialIndex >= TUTORIAL_STEPS.length) {
        finishTutorial();
        return;
    }
    showTutorial_step();
}

function showTutorial_step() {
    showModal(TUTORIAL_STEPS[tutorialIndex], [
        { label: "Next", onClick: advanceTutorial },
        { label: "Skip", onClick: finishTutorial },
    ]);
}

function finishTutorial() {
    tutorialSeen = true;
    saveGame();
}

// Called from updateUI: one-time helper popups.
function checkTutorialPopups() {
    if (!prestigeTipSeen && calculatePrestigeGain() > 0) {
        prestigeTipSeen = true;
        saveGame();
        showAlert("Tip: Your max board is over 100 cells — you can Prestige for Shards now! Check the Prestige button.");
    }
    if (!challengeTipSeen && stats.maxCells >= CHALLENGE_UNLOCK_CELLS) {
        challengeTipSeen = true;
        saveGame();
        showAlert("Tip: Your board reached 500 cells — Challenges are now unlocked! Find them in the menu.");
    }
}
