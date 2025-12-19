// Lightweight floating auto-rickshaw icons across the page
(function(){
  const EMOJI = '🛺';
  const MAX_AUTOS_DESKTOP = 8;
  const MAX_AUTOS_MOBILE = 4;
  const INTERVAL = 1800; // ms between spawns

  function createContainer(){
    const existing = document.querySelector('.floating-autos');
    if (existing) return existing;
    const c = document.createElement('div');
    c.className = 'floating-autos';
    document.body.appendChild(c);
    return c;
  }

  function spawn(container){
    const span = document.createElement('span');
    span.className = 'auto-icon';
    span.textContent = EMOJI;
    const h = window.innerHeight;
    const y = Math.random() * (h * 0.75) + h * 0.1; // avoid very top/bottom
    const dir = Math.random() < 0.65 ? 'lr' : 'rl';
    const dur = 14 + Math.random() * 10; // 14s - 24s
    const scale = 0.8 + Math.random() * 0.7; // 0.8 - 1.5
    span.style.setProperty('--y', `${y - h/2}px`);
    span.style.setProperty('--dur', `${dur}s`);
    span.style.setProperty('--s', scale.toFixed(2));
    span.classList.add(dir);
    container.appendChild(span);
    // cleanup after animation
    setTimeout(() => span.remove(), dur * 1000);
  }

  function start(){
    const container = createContainer();
    const max = Math.min((/Mobi|Android/i.test(navigator.userAgent) ? MAX_AUTOS_MOBILE : MAX_AUTOS_DESKTOP), 20);
    // Pre-warm a few
    for (let i = 0; i < Math.min(3, max); i++) setTimeout(()=>spawn(container), i * 600);
    let active = 0;
    setInterval(() => {
      // keep approx count proportional to area
      const current = container.childElementCount;
      if (current < max) spawn(container);
    }, INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

