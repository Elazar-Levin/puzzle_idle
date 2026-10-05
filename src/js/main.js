// Entry point: boot the game and run the main loop.

loadGame();
applyOfflineProgress();
resizeCanvas();
initNewPuzzle();
if (!tutorialSeen) {showTutorial();}
window.addEventListener("resize", resizeCanvas);

setInterval(saveGame, 5000);
window.addEventListener("beforeunload", saveGame);

let lastTime = 0;
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    // Cap the visual step; long hidden gaps are handled by simulateIdle().
    dt = Math.min(dt, 0.1);

    puzzle.update(Number.isNaN(dt) ? 0.016 : dt);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
