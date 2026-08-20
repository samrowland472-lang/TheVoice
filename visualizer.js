const BAR_COUNT = 48;

export function initVisualizer() {
  const canvas = document.getElementById('viz-canvas');
  const ctx = canvas.getContext('2d');
  let mode = 'face';
  let amplitude = 0;
  let targetAmplitude = 0;
  let barHeights = Array.from({ length: BAR_COUNT }, () => 0.05);
  let particles = [];
  let facePoints = null;
  let waveOffset = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
    facePoints = null; // rebuilt lazily at the new size on next draw
  }

  function initParticles() {
    const rect = canvas.getBoundingClientRect();
    particles = Array.from({ length: 90 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * Math.min(rect.width, rect.height) * 0.4,
      speed: (Math.random() - 0.5) * 0.02,
      size: Math.random() * 3 + 1,
      hueShift: Math.random(),
    }));
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Colors follow VU-meter convention: green under load, amber approaching
  // peak, red at peak — so the palette carries real signal-level meaning
  // instead of being decorative.
  // A particle-rendered bust silhouette with a live waveform slicing through
  // it — a biometric/voiceprint read, distinct from the abstract modes below.
  function initFacePoints(rect) {
    const cx = rect.width / 2;
    const cy = rect.height * 0.46;
    const scale = Math.min(rect.width, rect.height * 1.1) * 0.4;
    const pts = [];

    const OUTLINE_N = 130;
    for (let i = 0; i < OUTLINE_N; i++) {
      const t = (i / OUTLINE_N) * Math.PI * 2;
      const rx = 0.66 + 0.05 * Math.cos(t * 2.1);
      const ry = t > Math.PI ? 0.72 : 0.92; // narrower toward the chin
      const x = cx + Math.cos(t) * scale * rx;
      const y = cy + Math.sin(t) * scale * ry - scale * 0.06;
      pts.push({ ox: x, oy: y, jitter: 1.2, fill: false });
    }

    const SHOULDER_N = 50;
    for (let i = 0; i <= SHOULDER_N; i++) {
      const t = i / SHOULDER_N;
      const x = cx + (t - 0.5) * scale * 2.3;
      const y = cy + scale * 0.86 + Math.pow(Math.abs(t - 0.5) * 2, 1.7) * scale * 0.55;
      if (y < rect.height + 20) pts.push({ ox: x, oy: y, jitter: 1.2, fill: false });
    }

    const FILL_N = 260;
    for (let i = 0; i < FILL_N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * scale * 0.6;
      const x = cx + Math.cos(a) * r * 0.72;
      const y = cy + Math.sin(a) * r * 0.88 - scale * 0.06;
      pts.push({ ox: x, oy: y, jitter: 0.8, fill: true });
    }

    return pts;
  }

  function drawFace(rect) {
    const cx = rect.width / 2;
    const cy = rect.height * 0.46;
    if (!facePoints) facePoints = initFacePoints(rect);

    const glowR = Math.min(rect.width, rect.height) * 0.55;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    glow.addColorStop(0, `rgba(63, 198, 255, ${0.06 + amplitude * 0.14})`);
    glow.addColorStop(1, 'rgba(63, 198, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (const p of facePoints) {
      const jig = (Math.random() - 0.5) * p.jitter * (0.5 + amplitude * 2.2);
      const x = p.ox + jig;
      const y = p.oy + jig;
      const size = p.fill ? 0.9 + amplitude * 1.1 : 1.5 + amplitude * 1.6;
      const alpha = p.fill ? 0.14 + amplitude * 0.28 : 0.55 + amplitude * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(151, 224, 255, ${alpha})`;
      ctx.fill();
    }

    waveOffset += 0.05 + amplitude * 0.06;
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= rect.width; x += 3) {
      const n = Math.sin(x * 0.045 + waveOffset * 1.4) * Math.sin(x * 0.011 + waveOffset * 0.4);
      const y = cy + n * (7 + amplitude * rect.height * 0.3);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(63, 198, 255, ${0.45 + amplitude * 0.5})`;
    ctx.stroke();
  }

  function drawBars(rect) {
    const w = rect.width;
    const h = rect.height;
    const gap = 4;
    const barWidth = (w - gap * (BAR_COUNT - 1)) / BAR_COUNT;

    for (let i = 0; i < BAR_COUNT; i++) {
      const decay = 0.92;
      const noise = amplitude * (0.3 + Math.random() * 0.7) * Math.sin(i * 0.4 + Date.now() * 0.003) * 0.5 + amplitude * Math.random();
      const target = Math.max(0.04, Math.min(1, Math.abs(noise)));
      barHeights[i] = barHeights[i] * decay + target * (1 - decay);

      const barH = barHeights[i] * h * 0.85;
      const x = i * (barWidth + gap);
      const y = (h - barH) / 2;

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, '#ff4d4d');
      grad.addColorStop(0.55, '#ffb238');
      grad.addColorStop(1, '#3fc6ff');
      ctx.fillStyle = grad;

      roundRect(x, y, barWidth, barH, 2);
      ctx.fill();
    }
  }

  function drawOrb(rect) {
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const baseR = Math.min(rect.width, rect.height) * 0.18;
    const pulse = baseR + amplitude * baseR * 1.4 + Math.sin(Date.now() * 0.004) * 6;

    for (let ring = 3; ring >= 0; ring--) {
      const r = pulse + ring * 18 + amplitude * ring * 10;
      const alpha = 0.12 - ring * 0.025 + amplitude * 0.05;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(63, 198, 255, ${Math.max(alpha, 0)})`;
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse);
    grad.addColorStop(0, '#eafff2');
    grad.addColorStop(0.35, '#3fc6ff');
    grad.addColorStop(1, '#ffb238');
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(pulse, 1), 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(63,198,255,0.8)';
    ctx.shadowBlur = 30 + amplitude * 40;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawParticles(rect) {
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    for (const p of particles) {
      p.angle += p.speed + amplitude * 0.02;
      const r = p.radius + amplitude * 60 * Math.sin(p.hueShift * 10 + Date.now() * 0.002);
      const x = cx + Math.cos(p.angle) * r;
      const y = cy + Math.sin(p.angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, p.size + amplitude * 3, 0, Math.PI * 2);
      const hue = 200 - p.hueShift * 162;
      ctx.fillStyle = `hsla(${hue}, 85%, ${60 + amplitude * 15}%, ${0.5 + amplitude * 0.5})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 4 + amplitude * 10, 0, Math.PI * 2);
    ctx.fillStyle = '#eafff2';
    ctx.shadowColor = '#3fc6ff';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawWave(rect) {
    const w = rect.width;
    const h = rect.height;
    const cy = h / 2;
    waveOffset += 0.06 + amplitude * 0.08;

    ctx.lineWidth = 2;
    const layers = [
      { color: 'rgba(63,198,255,0.9)', amp: 0.6, freq: 0.02, offset: 0 },
      { color: 'rgba(255,178,56,0.65)', amp: 0.4, freq: 0.025, offset: 1.5 },
      { color: 'rgba(255,77,77,0.45)', amp: 0.3, freq: 0.03, offset: 3 },
    ];

    for (const layer of layers) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y =
          cy +
          Math.sin(x * layer.freq + waveOffset + layer.offset) *
            (h * layer.amp * 0.25) *
            (0.3 + amplitude);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = layer.color;
      ctx.stroke();
    }
  }

  function loop() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    amplitude += (targetAmplitude - amplitude) * 0.15;
    targetAmplitude *= 0.9;

    if (mode === 'face') drawFace(rect);
    else if (mode === 'bars') drawBars(rect);
    else if (mode === 'orb') drawOrb(rect);
    else if (mode === 'particles') drawParticles(rect);
    else if (mode === 'wave') drawWave(rect);

    requestAnimationFrame(loop);
  }

  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
    });
  });

  window.addEventListener('resize', resize);
  resize();
  loop();

  return {
    pushAmplitude(v) {
      targetAmplitude = Math.max(targetAmplitude, Math.max(0, Math.min(1, v)));
    },
    setAmplitude(v) {
      targetAmplitude = Math.max(0, Math.min(1, v));
    },
  };
}
