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

    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const snowParticles = [];
    const SNOW_COUNT = isMobile ? 120 : 240;
    const mouse = { x: -1000, y: -1000, radius: 60 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    window.addEventListener('touchend', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    // Pre-render a soft snowflake sprite to cache on the GPU
    const snowflakeSprite = document.createElement('canvas');
    snowflakeSprite.width = 16;
    snowflakeSprite.height = 16;
    const spriteCtx = snowflakeSprite.getContext('2d');
    const grad = spriteCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    spriteCtx.fillStyle = grad;
    spriteCtx.beginPath();
    spriteCtx.arc(8, 8, 8, 0, Math.PI * 2);
    spriteCtx.fill();

    class Snow {
      constructor(w, h) {
        this.reset(w, h, true);
      }

      reset(w, h, startAbove = false) {
        this.x = Math.random() * w;
        this.y = startAbove ? -(Math.random() * 60) : Math.random() * h;
        this.size = 2.5 + Math.random() * 6.5;
        this.speedY = (isMobile ? 0.8 : 1.2) + Math.random() * (isMobile ? 1.5 : 2.4);
        this.windStrength = 0.4 + Math.random() * 0.8;
        this.wave = Math.random() * Math.PI * 2;
        this.waveSpeed = 0.005 + Math.random() * 0.01;
        this.alpha = 0.35 + Math.random() * 0.55;
      }

      update(w, h) {
        this.wave += this.waveSpeed;
        this.x += Math.sin(this.wave) * this.windStrength;
        this.y += this.speedY;

        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        const radiusSq = mouse.radius * mouse.radius;

        if (distSq < radiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 18;
          this.y += (dy / dist) * force * 12;
        }

        if (this.y > h + 12) {
          this.reset(w, h, true);
          this.x = Math.random() * w;
          this.y = -20 - Math.random() * 40;
        }
        if (this.x < -20) this.x = w + 20;
        if (this.x > w + 20) this.x = -20;
      }

      draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(
          snowflakeSprite,
          this.x - this.size / 2,
          this.y - this.size / 2,
          this.size,
          this.size
        );
      }
    }

    function initSnow() {
      snowParticles.length = 0;
      for (let i = 0; i < SNOW_COUNT; i++) {
        snowParticles.push(new Snow(snowCanvas.width, snowCanvas.height));
      }
    }

    let snowAnimId = null;
    function snowLoop() {
      snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
      for (let particle of snowParticles) {
        particle.update(snowCanvas.width, snowCanvas.height);
        particle.draw(snowCtx);
      }
      snowCtx.globalAlpha = 1.0;
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

  // discord button opens my_discord.jpg in lightbox
  const dcBtn = document.getElementById('dc-btn');
  if (dcBtn) {
    dcBtn.addEventListener('click', () => openLightbox('photos/my_discord.jpg'));
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
    if (subtitle) subtitle.textContent = ready ? 'Готово до відтворення! :3' : 'Toby fox';
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

  // Save Point logic
  const savePoint = document.getElementById('save-point');
  const saveToast = document.getElementById('save-toast');
  if (savePoint && saveToast) {
    let hideTimeout = null;
    savePoint.addEventListener('click', () => {
      let saves = parseInt(localStorage.getItem('save_count') || '0', 10);
      saves += 1;
      localStorage.setItem('save_count', saves.toString());

      saveToast.innerHTML = `* Ви торкаєтеся теплого світла збереження. Прогрес вашої подорожі записано у файли браузера.<br><br>* Ви відчуваєте, як РІШУЧІСТЬ наповнює вашу душу.<br><br>* (Збереження #${saves} виконано!)`;
      saveToast.classList.remove('hidden');

      if (hideTimeout) clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        saveToast.classList.add('hidden');
      }, 4500);
    });
  }

  // Terminal commands handling
  const terminalInput = document.getElementById('terminal-input');
  const terminalBody = document.getElementById('terminal-body');

  let snakeActive = false;
  let snakeInterval = null;

  if (terminalInput && terminalBody) {
    function startSnakeGame() {
      if (snakeActive) return;
      snakeActive = true;

      // Clear terminal body
      terminalBody.innerHTML = '';

      // Create container
      const container = document.createElement('div');
      container.className = 'snake-game-container';
      container.innerHTML = `
        <div class="snake-stats">Рахунок: <span id="snake-score">0</span></div>
        <div class="snake-board" id="snake-board"></div>
        <div class="snake-controls">
          <button class="snake-btn" data-dir="up">▲</button>
          <div class="snake-row">
            <button class="snake-btn" data-dir="left">◀</button>
            <button class="snake-btn" data-dir="right">▶</button>
          </div>
          <button class="snake-btn" data-dir="down">▼</button>
        </div>
        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.4); margin-top: 0.4rem; text-align: center; font-family: monospace;">
          Керування: WASD / стрілочки.<br>Для виходу введіть будь-що в консоль.
        </div>
      `;
      terminalBody.appendChild(container);

      const boardEl = document.getElementById('snake-board');
      const scoreEl = document.getElementById('snake-score');

      const width = 10;
      const height = 8;
      let snake = [
        {x: 4, y: 4},
        {x: 3, y: 4},
        {x: 2, y: 4}
      ];
      let direction = 'right';
      let food = {x: 8, y: 4};
      let score = 0;

      function generateFood() {
        while (true) {
          const newFood = {
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height)
          };
          if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
            food = newFood;
            break;
          }
        }
      }

      function draw() {
        let boardStr = '';
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (snake[0].x === x && snake[0].y === y) {
              boardStr += '▣';
            } else if (snake.some((seg, idx) => idx > 0 && seg.x === x && seg.y === y)) {
              boardStr += '■';
            } else if (food.x === x && food.y === y) {
              boardStr += '❤';
            } else {
              boardStr += '·';
            }
          }
          if (y < height - 1) boardStr += '\n';
        }
        boardEl.textContent = boardStr;
      }

      function gameStep() {
        let nextX = snake[0].x;
        let nextY = snake[0].y;

        if (direction === 'up') nextY--;
        else if (direction === 'down') nextY++;
        else if (direction === 'left') nextX--;
        else if (direction === 'right') nextX++;

        if (
          nextX < 0 || nextX >= width ||
          nextY < 0 || nextY >= height ||
          snake.some(segment => segment.x === nextX && segment.y === nextY)
        ) {
          clearInterval(snakeInterval);
          snakeActive = false;
          window.removeEventListener('keydown', handleKeys);
          boardEl.textContent = 'ГРУ ЗАВЕРШЕНО!\nВведіть snake для\nнової гри.';
          boardEl.style.color = '#fca5a5';
          return;
        }

        snake.unshift({x: nextX, y: nextY});

        if (nextX === food.x && nextY === food.y) {
          score += 10;
          scoreEl.textContent = score;
          generateFood();
        } else {
          snake.pop();
        }

        draw();
      }

      const handleKeys = (e) => {
        if (!snakeActive) {
          window.removeEventListener('keydown', handleKeys);
          return;
        }

        const key = e.key.toLowerCase();
        if ((key === 'w' || e.key === 'ArrowUp') && direction !== 'down') direction = 'up';
        else if ((key === 's' || e.key === 'ArrowDown') && direction !== 'up') direction = 'down';
        else if ((key === 'a' || e.key === 'ArrowLeft') && direction !== 'right') direction = 'left';
        else if ((key === 'd' || e.key === 'ArrowRight') && direction !== 'left') direction = 'right';

        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      };

      window.addEventListener('keydown', handleKeys);

      const btns = container.querySelectorAll('.snake-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const newDir = btn.getAttribute('data-dir');
          if (newDir === 'up' && direction !== 'down') direction = 'up';
          if (newDir === 'down' && direction !== 'up') direction = 'down';
          if (newDir === 'left' && direction !== 'right') direction = 'left';
          if (newDir === 'right' && direction !== 'left') direction = 'right';
        });
      });

      draw();
      snakeInterval = setInterval(gameStep, 450);
    }

    function stopSnakeGame() {
      if (snakeInterval) {
        clearInterval(snakeInterval);
        snakeInterval = null;
      }
      window.removeEventListener('keydown', handleKeys);
      snakeActive = false;
    }

    const commands = {
      help: () => `Доступні команди:
  about    - про мене
  specs    - деталі ноутбука Toshiba
  friends  - інформація про друзів
  snow     - увімкнути/вимкнути сніг
  confetti - запустити конфеті
  theme    - змінити колір сайту (theme [green/pink/blue/orange/default])
  game     - гра камінь, ножиці, папір (game [rock/paper/scissors])
  snake    - гра змійка прямо в консолі 🐍
  ping     - перевірка зв'язку
  secret   - відкрити таємницю
  clear    - очистити екран`,
      about: () => `я — олег
Люблю прості речі, гарний дизайн і спокійний стиль.`,
      specs: () => `      /\\         oleg@oleg
     /  \\        ---------
    /\\   \\       OS: Arch Linux x86_64
   /      \\      Host: SATELLITE C855-2GC
  /   ,,   \\     Kernel: 7.1.3-arch1-2
 /   |  |   \\    DE: Xfce4 4.20
/_-''    ''-_\\   CPU: Intel i3-3120M (4) @ 2.50 GHz
                 GPU: AMD Radeon HD 6610M/7610M
                 Memory: 7.70 GiB`,
      friends: () => `Пошук друзів у базі даних...
Знайдено: 2.5 друга.
Деталі: 2 людини і 1 кіт (або 0.5 — це мій ноут, який завжди зі мною).`,
      clear: () => {
        terminalBody.innerHTML = '';
        return null;
      },
      snow: () => {
        const snowCanvas = document.getElementById('snow-canvas');
        if (snowCanvas) {
          const isHidden = window.getComputedStyle(snowCanvas).display === 'none';
          if (isHidden) {
            snowCanvas.style.display = 'block';
            return 'Снігопад увімкнено! ❄️';
          } else {
            snowCanvas.style.display = 'none';
            return 'Снігопад вимкнено! ☀️';
          }
        }
        return 'Помилка: сніговий екран не знайдено.';
      },
      confetti: () => {
        emit(120);
        startLoopIfNeeded();
        return 'Салют запущено! 🎉';
      },
      snake: () => {
        startSnakeGame();
        return null;
      },
      ping: () => `PING oleg (127.0.0.1) 56(84) bytes of data.
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.032 ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.045 ms
--- oleg ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms`,
      secret: () => {
        const thumb = document.getElementById('thumb');
        if (thumb) {
          thumb.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
          thumb.style.transform = 'rotate(360deg)';
          setTimeout(() => {
            thumb.style.transform = '';
          }, 1000);
        }
        return `Доступ дозволено! 🔓
Таємне повідомлення:
  .---.  .---.
 /     \\/     \\
 \\            /
  \\   ❤      /
   \\        /
    \\      /
     \\    /
      \\  /
       \\/
Рішучість! (А також картинка ноутбука щойно прокрутилася)`;
      }
    };

    const terminalForm = document.getElementById('terminal-form');
    if (terminalForm) {
      terminalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputVal = terminalInput.value.trim();
        terminalInput.value = '';

        if (!inputVal) return;

        if (snakeActive) {
          stopSnakeGame();
          terminalBody.innerHTML = '';
        }

        // Append entered command
        const cmdLine = document.createElement('div');
        cmdLine.className = 'terminal-line command-entered';
        cmdLine.textContent = `oleg@toshiba:~$ ${inputVal}`;
        terminalBody.appendChild(cmdLine);

        // Process command
        const lowerInput = inputVal.toLowerCase();
        const parts = lowerInput.split(/\s+/);
        const commandName = parts[0];

        let response = '';
        let isError = false;

        if (commandName === 'sudo') {
          response = 'oleg is not in the sudoers file. This incident will be reported.';
        } else if (commandName === 'theme' || commandName === 'color') {
          const arg = parts[1];
          const themes = {
            default: { accent: '#8b5cf6', accent2: '#22d3ee' },
            green: { accent: '#15803d', accent2: '#22c55e' },
            pink: { accent: '#db2777', accent2: '#f43f5e' },
            blue: { accent: '#1d4ed8', accent2: '#3b82f6' },
            orange: { accent: '#c2410c', accent2: '#f97316' }
          };
          if (!arg) {
            response = `Введіть колір теми: default, green, pink, blue, orange. (Наприклад: theme pink)`;
          } else if (themes[arg]) {
            const root = document.documentElement;
            root.style.setProperty('--accent', themes[arg].accent);
            root.style.setProperty('--accent-2', themes[arg].accent2);
            response = `Тему змінено на '${arg}'! ✨`;
          } else {
            response = `Невідома тема '${arg}'. Доступні: default, green, pink, blue, orange.`;
            isError = true;
          }
        } else if (commandName === 'game') {
          const choice = parts[1];
          const validChoices = ['rock', 'paper', 'scissors', 'камінь', 'папір', 'ножиці'];
          const choiceMap = {
            'камінь': 'rock',
            'папір': 'paper',
            'ножиці': 'scissors',
            'rock': 'rock',
            'paper': 'paper',
            'scissors': 'scissors'
          };
          if (!choice) {
            response = `Гра "Камінь, ножиці, папір". Введіть:
  game rock (або камінь)
  game paper (або папір)
  game scissors (або ножиці)`;
          } else if (validChoices.includes(choice)) {
            const playerMove = choiceMap[choice];
            const moves = ['rock', 'paper', 'scissors'];
            const botMove = moves[Math.floor(Math.random() * moves.length)];
            
            const moveNamesUk = {
              rock: 'камінь ✊',
              paper: 'папір ✋',
              scissors: 'ножиці ✌'
            };
            
            let result = '';
            if (playerMove === botMove) {
              result = 'Нічия! 🤝';
            } else if (
              (playerMove === 'rock' && botMove === 'scissors') ||
              (playerMove === 'scissors' && botMove === 'paper') ||
              (playerMove === 'paper' && botMove === 'rock')
            ) {
              result = 'Ви перемогли! 🎉';
            } else {
              result = 'Комп\'ютер переміг! 🤖';
            }
            response = `Ви обрали: ${moveNamesUk[playerMove]}
Комп'ютер обрав: ${moveNamesUk[botMove]}
Результат: ${result}`;
          } else {
            response = `Невідомий хід '${choice}'. Оберіть: rock, paper або scissors.`;
            isError = true;
          }
        } else if (commands[lowerInput]) {
          response = commands[lowerInput]();
        } else {
          response = `Команда '${inputVal}' не знайдена. Введіть 'help' для списку команд.`;
          isError = true;
        }

        if (response !== null) {
          const respLine = document.createElement('div');
          respLine.className = `terminal-line ${isError ? 'error-response' : 'system-response'}`;
          respLine.textContent = response;
          terminalBody.appendChild(respLine);
        }

        // Scroll to bottom
        terminalBody.scrollTop = terminalBody.scrollHeight;
      });
    }

    // Focus terminal input on clicking anywhere in the terminal card
    const terminalCard = document.querySelector('.terminal-card');
    if (terminalCard) {
      terminalCard.addEventListener('click', (e) => {
        if (e.target.closest('.snake-btn')) return;
        terminalInput.focus();
      });
    }
  }
});
