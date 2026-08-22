// Ambient backdrop: a slow radar sweep over range rings, with faint
// "contact" blips that ping and fade — reads as a surveillance console
// running quietly behind the app.
export function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let blips = [];
  let sweepAngle = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initBlips() {
    const count = Math.floor((window.innerWidth * window.innerHeight) / 32000);
    blips = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.6,
      phase: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.01,
      amber: Math.random() > 0.72,
    }));
  }

  function draw() {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.42;
    const maxR = Math.max(canvas.width, canvas.height) * 0.62;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = 'rgba(63, 198, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (maxR / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(63, 198, 255, 0.035)';
    ctx.beginPath();
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.stroke();
    ctx.restore();

    sweepAngle += 0.0032;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sweepAngle);
    const grad = ctx.createLinearGradient(0, 0, maxR, 0);
    grad.addColorStop(0, 'rgba(63, 198, 255, 0.16)');
    grad.addColorStop(1, 'rgba(63, 198, 255, 0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxR, -0.16, 0.16);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    for (const b of blips) {
      b.phase += b.speed;
      const pulse = (Math.sin(b.phase) + 1) / 2;
      const alpha = 0.15 + pulse * 0.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + pulse * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = b.amber
        ? `rgba(255, 178, 56, ${alpha})`
        : `rgba(63, 198, 255, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    initBlips();
  });

  resize();
  initBlips();
  draw();
}
