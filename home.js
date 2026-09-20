'use strict';
(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = document.querySelector('.motion-toggle');
  let manualPause = false;
  let resetHeroMotion = () => {};
  const applyMotion = () => {
    const paused = manualPause || preference.matches;
    motion.hidden = preference.matches;
    root.classList.toggle('motion-off', paused);
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? motion.dataset.resume : motion.dataset.pause);
    motion.querySelector('span').textContent = paused ? '▷' : 'Ⅱ';
    if (paused) resetHeroMotion(true);
  };
  motion.addEventListener('click', () => { manualPause = !manualPause; applyMotion(); });
  preference.addEventListener('change', applyMotion);
  applyMotion();
  if ('IntersectionObserver' in window) {
    root.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.remove('pending');observer.unobserve(entry.target);}
    }), {threshold: .08});
    document.querySelectorAll('.reveal').forEach(el => {el.classList.add('pending');observer.observe(el);});
  }
  document.querySelectorAll('[data-world]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-world]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    document.querySelectorAll('[data-scene]').forEach(scene => {scene.hidden = scene.dataset.scene !== button.dataset.world;});
    document.querySelector('[data-world-title]').textContent = button.dataset.title;
    document.querySelector('[data-world-body]').textContent = button.dataset.description;
    document.querySelector('[data-world-creature]').src = `assets/${button.dataset.creature}.webp`;
  }));
  document.querySelectorAll('[data-skin]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-skin]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const selected = document.getElementById('selected-echo');
    selected.src = button.querySelector('img').src;
    selected.alt = button.dataset.name;
    document.getElementById('echo-name').textContent = button.dataset.name;
    document.getElementById('echo-count').textContent = button.dataset.number;
    document.querySelector('.echo-aura').style.background = `radial-gradient(ellipse, ${button.dataset.color}35, transparent 67%)`;
  }));
  const dialog = document.querySelector('.trailer-dialog');
  const container = dialog.querySelector('.video-container');
  const consent = container.firstElementChild;
  let opener;
  document.querySelectorAll('[data-trailer]').forEach(link => link.addEventListener('click', event => {
    if (!dialog.showModal) return;
    event.preventDefault();opener = link;dialog.showModal();
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {if (e.target === dialog) {const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close', () => {container.replaceChildren(consent);if(opener)opener.focus();});
  dialog.querySelector('[data-load-video]').addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.title = document.getElementById('video-heading').textContent;
    frame.src = `https://www.youtube-nocookie.com/embed/${dialog.dataset.video}?autoplay=1&rel=0`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;container.replaceChildren(frame);
  });
  const hero = document.querySelector('.hero');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  const actors = [...hero.querySelectorAll('.cast')].map(el => ({
    el, x: 0, y: 0, targetX: 0, targetY: 0,
    reach: el.classList.contains('cast-main') ? 6 : el.classList.contains('cast-pet') ? 4 : 3
  }));
  let frame = 0;
  let previousTime = 0;
  const paint = actor => {
    actor.el.style.setProperty('--mx', `${actor.x.toFixed(3)}px`);
    actor.el.style.setProperty('--my', `${actor.y.toFixed(3)}px`);
  };
  const animate = time => {
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
    previousTime = time;
    const easing = 1 - Math.exp(-elapsed / 160);
    let moving = false;
    actors.forEach(actor => {
      actor.x += (actor.targetX - actor.x) * easing;
      actor.y += (actor.targetY - actor.y) * easing;
      const unsettled = Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > .015;
      if (!unsettled) { actor.x = actor.targetX; actor.y = actor.targetY; }
      actor.el.classList.toggle('is-reacting', unsettled);
      paint(actor);
      moving ||= unsettled;
    });
    frame = moving ? requestAnimationFrame(animate) : 0;
    if (!moving) previousTime = 0;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(animate); };
  resetHeroMotion = (immediate = false) => {
    actors.forEach(actor => {
      actor.targetX = actor.targetY = 0;
      if (immediate) {
        actor.x = actor.y = 0;
        actor.el.classList.remove('is-reacting');
        paint(actor);
      }
    });
    if (immediate) { cancelAnimationFrame(frame); frame = previousTime = 0; }
    else if (actors.some(actor => actor.x || actor.y)) schedule();
  };
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches || preference.matches || manualPause) return;
    let nearest = null;
    let distance = .85;
    actors.forEach(actor => {
      const rect = actor.el.getBoundingClientRect();
      const x = (event.clientX - (rect.left - actor.x + rect.width / 2)) / (rect.width / 2);
      const y = (event.clientY - (rect.top - actor.y + rect.height / 2)) / (rect.height / 2);
      const score = Math.hypot(x, y);
      actor.targetX = actor.targetY = 0;
      if (score < distance) { distance = score; nearest = { actor, x, y }; }
    });
    // Only the nearby character responds; the composition stays anchored.
    if (nearest) {
      nearest.actor.targetX = nearest.x * nearest.actor.reach;
      nearest.actor.targetY = nearest.y * nearest.actor.reach * .65;
    }
    schedule();
  });
  hero.addEventListener('pointerleave', () => resetHeroMotion());
  hero.addEventListener('pointercancel', () => resetHeroMotion(true));
  window.addEventListener('scroll', () => resetHeroMotion(), { passive: true });
  window.addEventListener('resize', () => resetHeroMotion(true), { passive: true });
  window.addEventListener('blur', () => resetHeroMotion(true));
  finePointer.addEventListener('change', () => resetHeroMotion(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetHeroMotion(true); });
})();
