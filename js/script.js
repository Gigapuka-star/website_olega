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
        this.speedY = 1.4 + Math.random() * 3.2;
        this.drift = -2 + Math.random() * 4;
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

  // Audio player setup: try core-undertale then fallback to undertale
  const player = document.getElementById('player');
  const audioToggle = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');

  async function chooseAudio() {
    const candidates = ['audio/core-undertale.mp3', 'audio/undertale.mp3'];
    for (const src of candidates) {
      try {
        const res = await fetch(src, { method: 'HEAD' });
        if (res.ok) return src;
      } catch (e) {
        // ignore fetch errors
      }
    }
    return null;
  }

  chooseAudio().then((src) => {
    if (!src) return; // no audio available
    player.src = src;
  });

  let playing = false;
  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      if (!player.src) return; // nothing loaded
      if (!playing) {
        player.play();
        playing = true;
        audioToggle.title = 'Pause';
        audioIcon.style.transform = 'scale(1.03)';
      } else {
        player.pause();
        playing = false;
        audioToggle.title = 'Play';
        audioIcon.style.transform = '';
      }
    });

    player.addEventListener('ended', () => {
      playing = false;
      audioIcon.style.transform = '';
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
});
