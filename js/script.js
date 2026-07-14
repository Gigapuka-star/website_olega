document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // SNOW CANVAS (continuous)
  const snowCanvas = document.getElementById('snow-canvas');
  let snowCtx = null;
  if (snowCanvas) {
    snowCtx = snowCanvas.getContext('2d');
    function resizeSnow() {
      snowCanvas.width = window.innerWidth;
      snowCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeSnow);
    resizeSnow();

    const snowParticles = [];
    const SNOW_COUNT = 360;

    class Snow {
      constructor(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.radius = 3.5 + Math.random() * 6;
        this.speedY = 7.5 + Math.random() * 8.5;
        this.drift = -6 + Math.random() * 12;
        this.alpha = 0.6 + Math.random() * 0.35;
      }

      update(w, h) {
        this.x += this.drift;
        this.y += this.speedY;
        if (this.y > h + 10) {
          this.y = -10;
          this.x = Math.random() * w;
        }
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,' + this.alpha + ')';
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initSnow() {
      snowParticles.length = 0;
      for (let i = 0; i < SNOW_COUNT; i++) snowParticles.push(new Snow(snowCanvas.width, snowCanvas.height));
    }

    let snowAnimId = null;
    function snowLoop() {
      snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
      for (let p of snowParticles) {
        p.update(snowCanvas.width, snowCanvas.height);
        p.draw(snowCtx);
      }
      snowAnimId = requestAnimationFrame(snowLoop);
    }

    initSnow();
    snowLoop();
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  const colors = ['#ffcd3c', '#ff4d6d', '#7c93ff', '#44d5c2', '#ffffff'];

  class Confetti {
    constructor(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * -h;
      this.size = 6 + Math.random() * 10;
      this.gravity = 0.6 + Math.random() * 0.8;
      this.rotation = Math.random() * 360;
      this.speedX = -4 + Math.random() * 8;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = 0.95;
    }

    update() {
      this.x += this.speedX;
      this.y += this.gravity;
      this.rotation += this.speedX * 0.5;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
      ctx.restore();
    }
  }

  let pieces = [];
  let animationId = null;
  let emitting = false;

  function emit(count) {
    emitting = true;
    for (let i = 0; i < count; i++) pieces.push(new Confetti(canvas.width, canvas.height));
    // stop emitting flag after short time so loop can finish naturally
    setTimeout(() => {
      emitting = false;
    }, 3500);
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.update();
      p.draw(ctx);
      if (p.y > canvas.height + 60 || p.x < -60 || p.x > canvas.width + 60) {
        pieces.splice(i, 1);
      }
    }

    if (pieces.length === 0 && !emitting) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      return;
    }

    animationId = requestAnimationFrame(loop);
  }

  function startLoopIfNeeded() {
    if (!animationId) {
      animationId = requestAnimationFrame(loop);
    }
  }

  // run confetti only on 8 October, or when forced with ?confetti=1
  const params = new URLSearchParams(window.location.search);
  const force = params.get('confetti') === '1';
  const now = new Date();
  const isBirthday = (now.getDate() === 8 && now.getMonth() === 9);

  if (isBirthday || force) {
    emit(120);
    startLoopIfNeeded();
  }

  // Lightbox / thumbnail handling
  const thumb = document.getElementById('thumb');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  function openLightbox(src) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add('hidden');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  if (thumb) {
    // open the neofetch image in the lightbox (full-screen)
    thumb.addEventListener('click', () => openLightbox('photos/neofetch.jpg'));
  }

  // telegram button opens tg.jpg in lightbox
  const tgBtn = document.getElementById('tg-btn');
  if (tgBtn) {
    tgBtn.addEventListener('click', () => openLightbox('photos/tg.jpg'));
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  // Audio player setup: try photos track and play/pause controls
  const player = document.getElementById('player');
  const playButton = document.getElementById('play-btn');
  const pauseButton = document.getElementById('pause-btn');
  const progressFill = document.getElementById('progress-fill');
  const timeText = document.getElementById('time-text');
  const durationText = document.getElementById('duration-text');
  const subtitle = document.querySelector('.mini-player-subtitle');

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function chooseAudio() {
    const src = 'photos/northernlight.ogg';
    try {
      const res = await fetch(src, { method: 'HEAD' });
      if (res.ok) return src;
    } catch (e) {
      // ignore fetch errors
    }
    return null;
  }

  function updateTimeDisplay() {
    if (!player.duration || Number.isNaN(player.duration)) return;
    timeText.textContent = formatTime(player.currentTime);
    durationText.textContent = formatTime(player.duration);
    const percent = player.currentTime / player.duration;
    progressFill.style.width = `${Math.min(Math.max(percent, 0), 1) * 100}%`;
  }

  function setPlayerState(loaded) {
    const ready = loaded && player.readyState >= 2;
    if (playButton) playButton.disabled = !ready;
    if (pauseButton) pauseButton.disabled = !ready;
    if (subtitle) subtitle.textContent = ready ? 'готово до відтворення' : 'Toby fox';
  }

  if (player) {
    chooseAudio().then((src) => {
      if (!src) {
        if (subtitle) subtitle.textContent = 'аудіо не знайдено';
        setPlayerState(false);
        return;
      }
      player.src = src;
      player.load();
    });

    player.addEventListener('loadedmetadata', () => {
      setPlayerState(true);
      durationText.textContent = formatTime(player.duration);
      updateTimeDisplay();
    });

    player.addEventListener('timeupdate', updateTimeDisplay);
    player.addEventListener('ended', () => {
      progressFill.style.width = '100%';
      isPlaying = false;
      if (subtitle) subtitle.textContent = 'пісня завершена';
      updateButtons();
    });
  }

  let isPlaying = false;

  function updateButtons() {
    if (!playButton || !pauseButton) return;
    playButton.classList.toggle('active', isPlaying);
    pauseButton.classList.toggle('active', !isPlaying);
  }

  if (playButton) {
    playButton.addEventListener('click', () => {
      if (!player || !player.src) return;
      player.play();
      isPlaying = true;
      if (subtitle) subtitle.textContent = 'відтворюється';
      updateButtons();
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      if (!player || !player.src) return;
      player.pause();
      isPlaying = false;
      if (subtitle) subtitle.textContent = 'пауза';
      updateButtons();
    });
  }

  if (progressFill && player) {
    const progressContainer = progressFill.parentElement;
    if (progressContainer) {
      progressContainer.addEventListener('click', (event) => {
        if (!player.duration) return;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percent = clickX / rect.width;
        player.currentTime = percent * player.duration;
        updateTimeDisplay();
      });
    }
  }

  setPlayerState(false);

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
});
