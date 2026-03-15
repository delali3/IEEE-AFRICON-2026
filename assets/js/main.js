/* ===== IEEE AFRICON 2026 - Main JavaScript ===== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Hero Slider ---- */
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  let current = 0;
  let autoplay = true;
  let timer;

  function showSlide(n) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function startAutoplay() {
    timer = setInterval(() => {
      if (autoplay) showSlide(current + 1);
    }, 5000);
  }

  function stopAutoplay() {
    clearInterval(timer);
  }

  document.querySelector('.slider-arrow.prev')?.addEventListener('click', () => {
    stopAutoplay();
    showSlide(current - 1);
    startAutoplay();
  });

  document.querySelector('.slider-arrow.next')?.addEventListener('click', () => {
    stopAutoplay();
    showSlide(current + 1);
    startAutoplay();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      showSlide(i);
      startAutoplay();
    });
  });

  const playPauseBtn = document.querySelector('.slider-play-pause');
  playPauseBtn?.addEventListener('click', () => {
    autoplay = !autoplay;
    playPauseBtn.textContent = autoplay ? '❚❚' : '▶';
  });

  if (slides.length > 0) {
    showSlide(0);
    startAutoplay();
  }

  /* ---- Mini Venue Slider ---- */
  const miniSlides = document.querySelectorAll('.mini-slide');
  let miniCurrent = 0;
  let miniTimer;

  function showMiniSlide(n) {
    miniSlides.forEach(s => s.classList.remove('active'));
    miniCurrent = (n + miniSlides.length) % miniSlides.length;
    miniSlides[miniCurrent].classList.add('active');
  }

  if (miniSlides.length > 0) {
    showMiniSlide(0);
    miniTimer = setInterval(() => showMiniSlide(miniCurrent + 1), 4000);
  }

  document.querySelector('.mini-btn.mini-play')?.addEventListener('click', () => {
    clearInterval(miniTimer);
    miniTimer = setInterval(() => showMiniSlide(miniCurrent + 1), 4000);
  });

  document.querySelector('.mini-btn.mini-pause')?.addEventListener('click', () => {
    clearInterval(miniTimer);
  });

  /* ---- Search Toggle ---- */
  const searchIcon = document.querySelector('.search-icon');
  const searchBox = document.querySelector('.search-box');

  searchIcon?.addEventListener('click', () => {
    searchBox?.classList.toggle('active');
    if (searchBox?.classList.contains('active')) {
      searchBox.querySelector('input')?.focus();
    }
  });

  /* ---- Back to Top ---- */
  const backToTop = document.querySelector('.back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.style.opacity = '1';
    } else {
      backToTop.style.opacity = '0';
    }
  });

  backToTop?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---- Active nav link ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-list a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

});
