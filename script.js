const runner = document.getElementById('runner');
const jumpAudio = document.getElementById('jump-audio');
const bgMusic = document.getElementById('bg-music');
const coin = document.getElementById('coin');
const bomb = document.getElementById('bomb');
const fly = document.getElementById('fly');
const tornado = document.getElementById('tornado');
const scoreDisplay = document.getElementById('score');
const popup = document.getElementById('popup-message');
const background = document.getElementById('background');
const gameOverOverlay = document.getElementById('game-over-overlay');
const restartBtn = document.getElementById('restart-btn');
const nameDisplay = document.getElementById('name-display');

// Main menu and start button
const mainMenu = document.getElementById('main-menu');
const startBtn = document.getElementById('start-btn');

const languages = [
  "Coding Language: Python Gained!",
  "Coding Language: JavaScript Gained!",
  "Coding Language: Java Gained!",
  "Coding Language: HTML Gained!",
  "Coding Language: CSS Gained!",
  "Coding Language: C++ Gained!"
];

const portfolioInfo = [
  "Name: Meera Alzaabi",
  "Age: 19",
  "Major: Computer Science",
  "Minor: Mathematics",
  "Rising Junior",
  "Located in Abu Dhabi"
];
let infoIndex = 0;

let score = 0;
let objectX = window.innerWidth;
const baseObjectSpeed = 5;
let objectSpeed = baseObjectSpeed;
const positions = [];
// Generate positions from 180px (above runner) to near top of screen (500px)
for (let i = 180; i <= 500; i += 30) {
  positions.push(i);
}

// Game progression variables
let speedMultiplier = 1;
let gameTime = 0;
const speedIncreaseInterval = 10000; // Increase speed every 10 seconds
let lastSpeedIncreaseTime = 0;

// Pattern generation variables
let lastPositionIndex = 0;
let patternDirection = 1;
let waveCounter = 0;

// Fly object control
let flyX = window.innerWidth + 1000;
const baseFlySpeed = 4;
let flySpeed = baseFlySpeed;
let flyY = 300;

// Tornado object control
let tornadoX = window.innerWidth;
let tornadoActive = false;
const baseTornadoSpeed = 3;
let tornadoSpeed = baseTornadoSpeed;
const tornadoFrequency = 5000; // Appears every 5 seconds
let lastTornadoTime = 0;

let velocity = 0;
let gravity = -1.2;
let jumpForce = 18;
let posY = 0;
let onGround = true;
let jumps = 0;

let gameRunning = false;
let animationId;

let lastJumpTime = 0;
const jumpDebounceMs = 150;

function playMusic() {
  bgMusic.volume = 0.1;
  bgMusic.playbackRate = 0.75;
  bgMusic.play().catch(() => {
    window.addEventListener('keydown', () => bgMusic.play(), { once: true });
    window.addEventListener('click', () => bgMusic.play(), { once: true });
  });
}

function tryJump() {
  const now = Date.now();
  if (!gameRunning) return;
  if (jumps < 5 && now - lastJumpTime > jumpDebounceMs) {
    velocity = jumpForce;
    jumpAudio.currentTime = 0;
    jumpAudio.play();
    jumps++;
    onGround = false;
    lastJumpTime = now;
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    tryJump();
  }
});

background.addEventListener('touchstart', (e) => {
  e.preventDefault();
  tryJump();
}, { passive: false });

background.addEventListener('click', (e) => {
  if (gameRunning) tryJump();
});

function getRandomPosition() {
  return positions[Math.floor(Math.random() * positions.length)];
}

function getPatternPosition() {
  // 30% chance for random position
  if (Math.random() < 0.3) {
    lastPositionIndex = Math.floor(Math.random() * positions.length);
    return positions[lastPositionIndex];
  }
  
  // 20% chance for wave pattern
  if (Math.random() < 0.2) {
    waveCounter += 0.2;
    const waveIndex = Math.floor(positions.length/2 + Math.sin(waveCounter) * positions.length/2);
    return positions[Math.max(0, Math.min(positions.length-1, waveIndex))];
  }
  
  // 50% chance for sequential pattern (up or down)
  patternDirection = Math.random() < 0.5 ? 1 : -1;
  lastPositionIndex = (lastPositionIndex + patternDirection + positions.length) % positions.length;
  return positions[lastPositionIndex];
}

function resetObject() {
  objectX = window.innerWidth + Math.random() * 100;
  
  // 75% chance to spawn coins (up from 50%)
  if (Math.random() < 0.75) {
    currentObject = 'coin';
    coin.style.display = 'block';
    bomb.style.display = 'none';
    coin.style.bottom = getPatternPosition() + 'px';
    
    // 40% chance to spawn additional coins (1-2 more)
    if (Math.random() < 0.4) {
      const numExtraCoins = Math.random() < 0.5 ? 1 : 2;
      
      for (let i = 0; i < numExtraCoins; i++) {
        setTimeout(() => {
          if (gameRunning) {
            const extraCoin = document.createElement('div');
            extraCoin.className = 'extra-coin';
            extraCoin.style.position = 'absolute';
            extraCoin.style.width = '60px';
            extraCoin.style.height = '60px';
            extraCoin.style.backgroundImage = "url('media/coin.gif')";
            extraCoin.style.backgroundSize = 'contain';
            extraCoin.style.backgroundRepeat = 'no-repeat';
            extraCoin.style.backgroundPosition = 'center';
            extraCoin.style.zIndex = '15';
            extraCoin.style.bottom = getPatternPosition() + 'px';
            extraCoin.style.left = (window.innerWidth + 100 + (i * 150)) + 'px';
            background.appendChild(extraCoin);
            
            // Animate the extra coin
            let extraCoinX = window.innerWidth + 100 + (i * 150);
            function moveExtraCoin() {
              if (!gameRunning) {
                extraCoin.remove();
                return;
              }
              
              extraCoinX -= objectSpeed * speedMultiplier;
              extraCoin.style.left = extraCoinX + 'px';
              
              if (extraCoinX < -100) {
                extraCoin.remove();
                return;
              }
              
              // Check collision
              if (isTouchingDirectly(runner, extraCoin)) {
                score++;
                showPopupMessage(true);
                scoreDisplay.textContent = `Score: ${score}`;
                extraCoin.remove();
                return;
              }
              
              requestAnimationFrame(moveExtraCoin);
            }
            moveExtraCoin();
          }
        }, Math.random() * 300); // Stagger the appearance
      }
    }
  } else {
    currentObject = 'bomb';
    bomb.style.display = 'block';
    coin.style.display = 'none';
    bomb.style.bottom = getPatternPosition() + 'px';
  }
}

function spawnTornado() {
  const now = Date.now();
  if (!tornadoActive && now - lastTornadoTime > tornadoFrequency) {
    tornadoX = window.innerWidth;
    tornado.style.left = tornadoX + 'px';
    tornado.style.display = 'block';
    tornadoActive = true;
    lastTornadoTime = now;
  }
}

function resetTornado() {
  tornadoActive = false;
  tornado.style.display = 'none';
  tornadoX = window.innerWidth;
}

function showPopupMessage(isGain, message = "") {
  let displayMsg = "";
  if (message) {
    displayMsg = message;
  } else if (isGain) {
    const lang = languages[Math.floor(Math.random() * languages.length)];
    displayMsg = `<span class="plus">+1</span> ${lang}`;
  } else {
    displayMsg = `<span class="minus">-1</span> Bomb Hit!`;
  }
  popup.innerHTML = displayMsg;
  popup.style.opacity = '1';
  popup.style.animation = 'none';
  void popup.offsetWidth;
  popup.style.animation = 'floatUpFade 2.5s forwards';
}

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  background.classList.add('blur');
  gameOverOverlay.classList.add('visible');
  bgMusic.pause();
}

function restartGame() {
  // Clear any extra coins
  document.querySelectorAll('.extra-coin').forEach(coin => coin.remove());
  
  score = 0;
  scoreDisplay.textContent = `Score: ${score}`;
  posY = 0;
  velocity = 0;
  jumps = 0;
  onGround = true;
  gameRunning = true;
  
  // Reset speed variables
  speedMultiplier = 1;
  gameTime = 0;
  lastSpeedIncreaseTime = 0;
  objectSpeed = baseObjectSpeed;
  flySpeed = baseFlySpeed;
  tornadoSpeed = baseTornadoSpeed;
  
  // Reset background speed
  document.getElementById('foreground').style.animationDuration = '10s';
  
  background.classList.remove('blur');
  gameOverOverlay.classList.remove('visible');
  resetObject();
  resetFly();
  resetTornado();
  lastTornadoTime = 0;
  playMusic();
  gameLoop();
}

function resetFly() {
  flyX = window.innerWidth + Math.random() * 1500;
  flyY = 250 + Math.random() * 500;
  fly.style.left = flyX + 'px';
  fly.style.bottom = flyY + 'px';
  fly.style.display = 'block';
}

function isTouchingDirectly(obj1, obj2) {
  const rect1 = obj1.getBoundingClientRect();
  const rect2 = obj2.getBoundingClientRect();
  
  const obj1Visible = {
    left: rect1.left + rect1.width * 0.3,
    right: rect1.right - rect1.width * 0.3,
    top: rect1.top + rect1.height * 0.3,
    bottom: rect1.bottom - rect1.height * 0.3
  };
  
  const obj2Visible = {
    left: rect2.left + rect2.width * 0.3,
    right: rect2.right - rect2.width * 0.3,
    top: rect2.top + rect2.height * 0.3,
    bottom: rect2.bottom - rect2.height * 0.3
  };
  
  return !(
    obj1Visible.right < obj2Visible.left || 
    obj1Visible.left > obj2Visible.right || 
    obj1Visible.bottom < obj2Visible.top || 
    obj1Visible.top > obj2Visible.bottom
  );
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  // Update game time and speed
  gameTime += 16; // Assuming 60fps, each frame is ~16ms
  if (gameTime - lastSpeedIncreaseTime > speedIncreaseInterval) {
    speedMultiplier += 0.2; // Increase speed by 20% each interval
    lastSpeedIncreaseTime = gameTime;
    objectSpeed = baseObjectSpeed * speedMultiplier;
    flySpeed = baseFlySpeed * speedMultiplier;
    tornadoSpeed = baseTornadoSpeed * speedMultiplier;
    
    // Speed up background
    document.getElementById('foreground').style.animationDuration = `${10 / speedMultiplier}s`;
  }

  // Runner jump physics
  if (!onGround || velocity > 0) {
    posY += velocity;
    velocity += gravity;

    if (posY <= 0) {
      posY = 0;
      velocity = 0;
      onGround = true;
      jumps = 0;
    }
    runner.style.transform = `translateY(-${posY}px)`;
  }

  // Move objects
  objectX -= objectSpeed * speedMultiplier;
  if (objectX < -50) resetObject();
  const object = currentObject === 'coin' ? coin : bomb;
  object.style.left = objectX + 'px';

  // Move fly
  flyX -= flySpeed * speedMultiplier;
  if (flyX < -100) resetFly();
  fly.style.left = flyX + 'px';

  // Spawn and move tornado
  spawnTornado();
  if (tornadoActive) {
    tornadoX -= tornadoSpeed * speedMultiplier;
    tornado.style.left = tornadoX + 'px';
    if (tornadoX < -100) resetTornado();
  }

  // Bomb collision
  if (currentObject === 'bomb' && bomb.style.display === 'block' && isTouchingDirectly(runner, bomb)) {
    if (score === 0) {
      showPopupMessage(false);
      gameOver();
      return;
    } else {
      score = Math.max(0, score - 1);
      showPopupMessage(false);
    }
    scoreDisplay.textContent = `Score: ${score}`;
    bomb.style.display = 'none';
    resetObject();
  }

  // Coin collision
  if (currentObject === 'coin' && coin.style.display === 'block' && isTouchingDirectly(runner, coin)) {
    score++;
    showPopupMessage(true);
    scoreDisplay.textContent = `Score: ${score}`;
    coin.style.display = 'none';
    resetObject();
  }

  // Fly collision
  if (fly.style.display === 'block' && isTouchingDirectly(runner, fly)) {
    showPopupMessage(false, portfolioInfo[infoIndex]);
    infoIndex = (infoIndex + 1) % portfolioInfo.length;
    fly.style.display = 'none';
    flyX = window.innerWidth + Math.random() * 1500;
  }

  // Tornado collision
  if (tornadoActive && isTouchingDirectly(runner, tornado)) {
    showPopupMessage(false, "Tornado Hit!");
    gameOver();
    return;
  }

  animationId = requestAnimationFrame(gameLoop);
}












document.addEventListener('DOMContentLoaded', function() {
  const forms = ['media/run2.gif', 'media/coin.gif', 'media/fly.gif', 'media/bomb.gif', 'media/tornado.gif'];
  let currentForm = 0;
  let isHovering = false;

  // Get both runner elements
  const runners = [document.getElementById('about-me-runner'), document.getElementById('about-me-runner-mobile')];
  const prompts = [document.getElementById('monster-prompt'), document.getElementById('monster-prompt-mobile')];


  // Add this to your existing DOMContentLoaded event listener
  document.getElementById('about-me-runner-mobile')?.addEventListener('click', function() {
    this.classList.add('clicked');
  });
  // Initially hide both elements
  runners.forEach(runner => {
    if (runner) {
      runner.style.opacity = '0';
      runner.style.transition = 'opacity 0.5s ease';
    }
  });

  prompts.forEach(prompt => {
    if (prompt) {
      prompt.style.opacity = '0';
      prompt.style.display = 'block';
    }
  });

  // Show both elements after 1.5 seconds with fade-in effect
  setTimeout(() => {
    runners.forEach(runner => {
      if (runner) runner.style.opacity = '1';
    });
    prompts.forEach(prompt => {
      if (prompt) prompt.style.opacity = '1';
    });
    
    // Hide prompts after 5 seconds
    setTimeout(() => {
      prompts.forEach(prompt => {
        if (prompt) {
          prompt.style.opacity = '0';
          setTimeout(() => {
            prompt.style.display = 'none';
          }, 500);
        }
      });
    }, 5000);
  }, 2800);

  // Set up click handlers for both runners
  runners.forEach(runner => {
    if (runner) {
      // Set consistent size for all forms
      runner.style.width = runner.id === 'about-me-runner-mobile' ? '120px' : '350px';
      runner.style.height = 'auto';

      // Animation control
      setInterval(() => {
        if (runner.src.includes('media/run2.gif')) {
          runner.src = runner.src;
        }
      }, 1000);

      // Hover effects (desktop only)
      if (runner.id === 'about-me-runner') {
        runner.addEventListener('mouseenter', () => {
          isHovering = true;
          runner.style.filter = 'drop-shadow(0 0 10px gold)';
        });

        runner.addEventListener('mouseleave', () => {
          isHovering = false;
          updateAppearance(runner);
        });
      }

      // Click handler
      runner.addEventListener('click', () => {
        const prompt = runner.id === 'about-me-runner' 
          ? document.getElementById('monster-prompt') 
          : document.getElementById('monster-prompt-mobile');
        
        if (prompt) {
          prompt.style.opacity = '0';
          setTimeout(() => {
            prompt.style.display = 'none';
          }, 500);
        }
        
        currentForm = (currentForm + 1) % forms.length;
        triggerTransformation(runner);
        
        if (window.innerWidth <= 480) {
          const messages = [
            "Now I'm a coin!",
            "Now I'm a fly!",
            "Now I'm a bomb!",
            "Now I'm a tornado!",
            "Back to running!"
          ];
          showPopupMessage(true, messages[currentForm]);
        }
      });
    }
  });

  // Helper Functions
  function triggerTransformation(runnerElement) {
    runnerElement.style.transform = 'scale(0.8)';
    setTimeout(() => {
      runnerElement.src = forms[currentForm];
      runnerElement.style.width = runnerElement.id === 'about-me-runner-mobile' ? '120px' : '350px';
      runnerElement.style.height = 'auto';
      updateAppearance(runnerElement);
      runnerElement.style.transform = 'scale(1)';
    }, 200);
  }

  function updateAppearance(runnerElement) {
    if (isHovering) {
      runnerElement.style.filter = 'drop-shadow(0 0 10px gold)';
    } else {
      runnerElement.style.filter = forms[currentForm].includes('coin') 
        ? 'brightness(1.3)' 
        : 'none';
    }
    
    runnerElement.style.transform = forms[currentForm].includes('bomb') 
      ? 'rotate(45deg)' 
      : 'none';
  }














  
  // Typing animation effect
  const typewriterElements = document.querySelectorAll('.typewriter, .typewriter-multiline');
  typewriterElements.forEach(el => {
    // Reset to prepare for animation
    if (el.classList.contains('typewriter')) {
      el.style.width = '0';
    } else if (el.classList.contains('typewriter-multiline')) {
      el.style.height = '0';
      el.style.opacity = '0';
    }
    
    // Trigger animation after delay
    const delay = el.style.animationDelay || '0s';
    setTimeout(() => {
      if (el.classList.contains('typewriter')) {
        el.style.width = 'auto';
        el.style.borderRight = 'none';
      } else if (el.classList.contains('typewriter-multiline')) {
        el.style.height = 'auto';
        el.style.opacity = '1';
      }
    }, parseFloat(delay) * 1000 + 3500);
  });
});











// Initialize game
let currentObject = 'coin';
resetObject();
resetFly();
resetTornado();

startBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  background.classList.remove('blur');
  scoreDisplay.style.display = 'block';
  nameDisplay.style.display = 'block'; // Show name display
  gameRunning = true;
  playMusic();
  gameLoop();
});

restartBtn.addEventListener('click', () => {
  gameOverOverlay.classList.remove('visible');
  background.classList.remove('blur');
  scoreDisplay.style.display = 'block';
  nameDisplay.style.display = 'block'; // Show name display on restart
  restartGame();
});






document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector('button[type="submit"]');
  const alertBox = form.querySelector('.form-alert');
  
  // Show loading state
  button.innerHTML = 'SENDING... <i class="fas fa-spinner fa-spin"></i>';
  
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      alertBox.style.display = 'block';
      alertBox.style.backgroundColor = '#d4edda';
      alertBox.style.color = '#155724';
      alertBox.textContent = 'Message sent successfully!';
      form.reset();
    } else {
      throw new Error('Form submission failed');
    }
  } catch (error) {
    alertBox.style.display = 'block';
    alertBox.style.backgroundColor = '#f8d7da';
    alertBox.style.color = '#721c24';
    alertBox.textContent = 'Oops! Something went wrong. Please try again.';
  } finally {
    button.innerHTML = 'SEND <i class="fas fa-paper-plane"></i>';
    setTimeout(() => alertBox.style.display = 'none', 5000);
  }
});