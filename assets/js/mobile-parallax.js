(() => {
  const stars = document.querySelector('.stars');
  if (!stars) return;
  let lx = 0, ly = 0;
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 8;
    const y = (e.clientY / window.innerHeight - 0.5) * 8;
    lx += (x - lx) * 0.08;
    ly += (y - ly) * 0.08;
    stars.style.transform = `translate(${lx}px, ${ly}px)`;
  }, { passive: true });
})();
