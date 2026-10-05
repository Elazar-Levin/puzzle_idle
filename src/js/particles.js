const PARTICLE_LIFE = 1.2;
const PARTICLE_RISE_SPEED = 45; // pixels per second

function spawnTextParticle(x, y, text) {
    particles.push({
        x,
        y,
        text,
        alpha: 1.0,
        velocityUp: PARTICLE_RISE_SPEED,
        lifeSpan: PARTICLE_LIFE,
    });
}

function updateAndDrawParticles(ctx, dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.y -= p.velocityUp * dt;
        p.lifeSpan -= dt;
        p.alpha = Math.max(0, p.lifeSpan / PARTICLE_LIFE);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 20px 'Segoe UI', sans-serif";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();

        if (p.lifeSpan <= 0) {
            particles.splice(i, 1);
        }
    }
}
