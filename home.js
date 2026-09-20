'use strict';
(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = document.querySelector('.motion-toggle');
  let manualPause = false;
  const applyMotion = () => {
    const paused = manualPause || preference.matches;
    motion.hidden = preference.matches;
    root.classList.toggle('motion-off', paused);
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? motion.dataset.resume : motion.dataset.pause);
    motion.querySelector('span').textContent = paused ? '▷' : 'Ⅱ';
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
  const cast = document.querySelector('.hero-cast');
  let frame = 0;
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || preference.matches || manualPause || innerWidth < 900 || frame) return;
    frame = requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      cast.style.setProperty('--px', `${(event.clientX / r.width - .5) * 12}px`);
      cast.style.setProperty('--py', `${((event.clientY-r.top) / r.height - .5) * 9}px`);frame = 0;
    });
  });
  hero.addEventListener('pointerleave', () => {cast.style.setProperty('--px','0px');cast.style.setProperty('--py','0px');});
})();
