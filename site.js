(() => {
  'use strict';
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  let language = 'en';
  const dialog = $('#media-dialog');
  const title = $('#media-title');
  const stage = $('#media-stage');
  const source = $('.video-source', dialog);
  const controls = $('.gallery-controls', dialog);
  const count = $('.gallery-count', dialog);
  let activeGroup = [], activeIndex = 0, opener = null, video = null;
  const localized = (node, key) => node.dataset[key + (language === 'ru' ? 'Ru' : 'En')];
  function setLanguage(next, persist = true) {
    language = next === 'ru' ? 'ru' : 'en';
    document.documentElement.lang = language;
    $$('[data-en][data-ru]').forEach(node => { node.textContent = node.dataset[language]; });
    $$('[data-alt-en]').forEach(node => { node.alt = localized(node, 'alt'); });
    $$('[data-aria-en]').forEach(node => { node.setAttribute('aria-label', localized(node, 'aria')); });
    $$('[data-lang]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.lang === language)); });
    document.title = language === 'ru' ? 'OneginDev — Игры и цифровые проекты' : 'OneginDev — Games & Digital Experiences';
    const description = language === 'ru' ? 'OneginDev — независимый разработчик. Главный проект — кооперативная игра Load & Behold. В портфолио также OneginCase, SpaceHub, Bloomy и Routify.' : 'OneginDev — independent games and digital experiences. Discover Load & Behold, a cooperative cargo-flight adventure, and explore selected projects including Routify.';
    $('meta[name="description"]').content = description;
    $('meta[property="og:title"]').content = document.title;
    $('meta[property="og:description"]').content = description;
    if (persist) { try { localStorage.setItem('onegin-language', language); } catch {} }
    if (dialog.open) { if (video) title.textContent = localized(video, 'caption'); else showImage(activeIndex); }
  }
  let initial = 'en';
  try { initial = localStorage.getItem('onegin-language') || 'en'; } catch {}
  const requested = new URLSearchParams(window.location.search).get('lang');
  if (requested === 'ru' || requested === 'en') initial = requested;
  setLanguage(initial, false);
  $$('[data-lang]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  $('#year').textContent = new Date().getFullYear();

  function groupImages(name) {
    const seen = new Set();
    return $$('[data-gallery]').filter(node => {
      if (node.dataset.gallery !== name || seen.has(node.href)) return false;
      seen.add(node.href); return true;
    });
  }
  function showImage(index) {
    if (!activeGroup.length) return;
    activeIndex = (index + activeGroup.length) % activeGroup.length;
    const item = activeGroup[activeIndex];
    const image = new Image();
    image.src = item.href;
    image.alt = localized(item, 'caption');
    title.textContent = localized(item, 'caption');
    count.textContent = `${activeIndex + 1} / ${activeGroup.length}`;
    source.hidden = true; controls.hidden = false;
    stage.replaceChildren(image);
  }
  function showVideo(link) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${link.dataset.video}?autoplay=1&rel=0`;
    iframe.title = localized(link, 'caption');
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    title.textContent = localized(link, 'caption');
    controls.hidden = true; source.hidden = false; source.href = link.href;
    stage.replaceChildren(iframe);
  }
  $$('[data-gallery], [data-video], [data-open-gallery]').forEach(link => {
    link.addEventListener('click', event => {
      if (!dialog.showModal || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); opener = link; video = link.dataset.video ? link : null;
      if (video) showVideo(link);
      else {
        activeGroup = groupImages(link.dataset.gallery || link.dataset.openGallery);
        showImage(Math.max(0, activeGroup.findIndex(item => item.href === link.href)));
      }
      dialog.showModal();
    });
  });
  $('.close-media', dialog).addEventListener('click', () => dialog.close());
  $('.gallery-prev', dialog).addEventListener('click', () => showImage(activeIndex - 1));
  $('.gallery-next', dialog).addEventListener('click', () => showImage(activeIndex + 1));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (controls.hidden) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(activeIndex + 1); }
  });
  let touchStart = null;
  stage.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, {passive: true});
  stage.addEventListener('touchend', event => {
    if (controls.hidden || touchStart === null) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 55) showImage(activeIndex + (delta < 0 ? 1 : -1));
    touchStart = null;
  }, {passive: true});
  dialog.addEventListener('close', () => { stage.replaceChildren(); video = null; opener?.focus({preventScroll:true}); });
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } });
    }, {threshold: 0.08});
    $$('.reveal').forEach(node => observer.observe(node));
  }
  let ticking = false;
  function progress() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    $('.scroll-progress').style.width = `${total > 0 ? Math.min(100, Math.max(0, window.scrollY / total * 100)) : 0}%`;
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(progress); ticking = true; } }, {passive:true});
  window.addEventListener('resize', progress); progress();
})();
