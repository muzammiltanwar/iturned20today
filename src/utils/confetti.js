// confetti.js
// Custom lightweight canvas confetti effect

export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#00f2fe', '#4facfe', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const particleCount = 100;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width / 2,
      y: height + 20,
      radius: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 15 - 10,
      gravity: 0.3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  function update() {
    ctx.clearRect(0, 0, width, height);

    let active = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.012;

      if (p.opacity > 0) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        // Draw small rectangles or circles
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 1.2);
        ctx.restore();
      }
    });

    if (active) {
      requestAnimationFrame(update);
    } else {
      canvas.remove();
    }
  }

  update();
}
