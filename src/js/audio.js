// Tiny WebAudio bleeps — no audio assets needed.

let audioCtx = null;

// Any user interaction (canvas or UI buttons) unlocks the audio pipeline.
document.addEventListener("pointerdown", () => ensureAudio(), { capture: true });

function ensureAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            audioCtx = null;
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    // Start the background track on the first user interaction.
    const music = document.getElementById("bg-music");
    if (music && music.paused) {
        applyMusicSettings();
        music.play().catch(() => { /* autoplay blocked until interaction */ });
    }
}

function applyMusicSettings() {
    const music = document.getElementById("bg-music");
    if (music) {
        music.volume = musicVolume;
        music.muted = musicMuted;
    }
}

function setMusicVolume(v) {
    musicVolume = Math.max(0, Math.min(1, v));
    applyMusicSettings();
    saveGame();
}

function toggleMute() {
    musicMuted = !musicMuted;
    applyMusicSettings();
    saveGame();
    updateUI();
}

function toggleSfxMute() {
    sfxMuted = !sfxMuted;
    saveGame();
    updateUI();
}

function playTone(freq, duration, type = "sine", gain = 0.12) {
    if (sfxMuted) {return;}
    ensureAudio();
    if (!audioCtx) {return;}

    const osc = audioCtx.createOscillator();
    const vol = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.setValueAtTime(gain, audioCtx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(vol).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playComplete() {
    playTone(523, 0.15, "sine", 0.12);
    setTimeout(() => playTone(784, 0.22, "sine", 0.12), 120);
}
