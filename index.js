//Todo Configurations - creating variables

let step = "waiting"; // stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame
let spaceHeroX; // Changes when moving forward
let spaceHeroY; // Only changes when falling
let sceneOffset; // change the scene after moving
let platforms = [];
let sticks = [];
let score = 0;
let modal = document.getElementById("instructionsModal");
modal.style.display = "block";
let animId = null;

const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 130;

const spaceHeroDistanceFromEdge = 1; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectTargetSize = 8;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 2; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 3;

const spaceHeroWidth = 55;
const spaceHeroHeight = 60;

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

//TOdo creating hero image

const charImg = new Image();
charImg.src = "./images/spaceHero.png";

//TOdo Getting all Ids and classes from HTML

const modalInstructions = document.getElementById("instructionsModal");
const startButton = document.querySelector(".start-button");
const instructionElement = document.getElementById("instruction");
const perfectTargetElement = document.getElementById("perfectTarget");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const musicBackground = document.getElementById("bgm");
musicBackground.muted = false;
const winButton = document.getElementById("win");
const platformSound = document.getElementById("platformSound");
const fallingSound = document.getElementById("fallingSound");
const musicGameOver = document.getElementById("gameOver");
const muteButton = document.getElementById("muteBtn");

//TOdo Getting the canvas from HTML

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

//TOdo The game starts here
function startGame() {
  musicBackground.play();
  modalInstructions.style.display = "none";
  muteButton.style.display = "block";
  updateCanvas();
}

//TOdo Updating and reseting the game progress
function updateCanvas() {
  musicGameOver.pause();
  step = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;

  instructionElement.style.opacity = 1;
  perfectTargetElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;

  // Display the first platform which is always the same
  // x + w has to match paddingX
  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  // Reset sticks
  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  // Reset spaceHero
  spaceHeroX = platforms[0].x + platforms[0].w - spaceHeroDistanceFromEdge;
  spaceHeroY = 0;

  draw();
}

// Function to generate Platform randomly
function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 250;
  const minimumWidth = 30;
  const maximumWidth = 100;

  // X coordinate of the edge of the furthest platform
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

//TOdo The main game loop
function animate(timestamp) {
  if (animId === undefined) {
    return;
  }
  console.log(animId);
  musicBackground.play();
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  // Creating conditions for each step
  switch (step) {
    case "waiting":
      return; // Stop the loop
    case "stretching": {
      stretchingStep(timestamp);
      break;
    }
    case "turning": {
      const isGameWon = turningStep(timestamp);

      if (isGameWon) {
        cancelAnimationFrame(animId);
        return;
      }
      break;
    }
    case "walking": {
      walkingStep(timestamp);
      break;
    }
    case "transitioning": {
      transitioningStep(timestamp);
      break;
    }
    case "falling": {
      const isGameLost = fallingStep(timestamp);

      if (isGameLost) {
        cancelAnimationFrame(animId);
        return;
      }
      break;
    }
    default:
      throw Error("Wrong step");
  }

  draw();
  animId = window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
}

//TOdo Creating conditions for each steps

function stretchingStep(timestamp) {
  sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
  console.log(timestamp);
}

function turningStep(timestamp) {
  platformSound.play();
  sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

  // stop the stick when 90°

  if (sticks.last().rotation > 90) {
    sticks.last().rotation = 90;

    // If perfectTargetSize increase score
    const [nextPlatform, perfectTargetSize] = theplatformHits();
    if (nextPlatform) {
      // Increase score
      score += perfectTargetSize ? 2 : 1;
      scoreElement.innerText = score;

      if (score >= 3) {
        winButton.style.display = "block";
        return true;
      }

      if (perfectTargetSize) {
        perfectTargetElement.style.opacity = 1;
        setTimeout(() => (perfectTargetElement.style.opacity = 0), 1000);
      }

      // generate new platforms
      generatePlatform();
    }
    // back to the startingPoint
    step = "walking";
  }
}

function walkingStep(timestamp) {
  spaceHeroX += (timestamp - lastTimestamp) / walkingSpeed;

  const [nextPlatform] = theplatformHits();

  // // If the player reachs another platform, so "transitioning", else "falling"
  if (nextPlatform) {
    const maxspaceHeroX =
      nextPlatform.x + nextPlatform.w - spaceHeroDistanceFromEdge;
    if (spaceHeroX > maxspaceHeroX) {
      spaceHeroX = maxspaceHeroX;
      step = "transitioning";
    }
  } else {
    const maxspaceHeroX =
      sticks.last().x + sticks.last().length + spaceHeroWidth;
    if (spaceHeroX > maxspaceHeroX) {
      spaceHeroX = maxspaceHeroX;
      step = "falling";
    }
  }
}

function transitioningStep(timestamp) {
  sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
  // the game changes the scene
  const [nextPlatform] = theplatformHits();
  if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
    // Add the next step
    sticks.push({
      x: nextPlatform.x + nextPlatform.w,
      length: 0,
      rotation: 0,
    });
    step = "waiting"; // back to the startingPoint
  }
}

function fallingStep(timestamp) {
  if (sticks.last().rotation < 180) fallingSound.play();
  sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

  spaceHeroY += (timestamp - lastTimestamp) / fallingSpeed;
  const maxspaceHeroY =
    platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
  if (spaceHeroY > maxspaceHeroY) {
    musicBackground.pause();
    musicGameOver.play();
    restartButton.style.display = "block";
    return true;
  }
}

//TOdo Returns the platform the stick hit (if it didn't hit any stick then return undefined)
function theplatformHits() {
  if (sticks.last().rotation != 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  // If the stick hits the perfect area
  if (
    platformHits &&
    platformHits.x + platformHits.w / 2 - perfectTargetSize / 2 < stickFarX &&
    stickFarX < platformHits.x + platformHits.w / 2 + perfectTargetSize / 2
  )
    return [platformHits, true];

  return [platformHits, false];
}

//TOdo Drawing platforms / Hero and Sticks

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // Center main canvas area to the middle of the screen
  ctx.translate(
    (window.innerWidth - canvasWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasHeight) / 2
  );

  // Draw scene
  drawPlatforms();
  drawHero();
  drawSticks();

  // Restore transformation
  ctx.restore();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform
    ctx.fillStyle = "#131312";
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Draw perfect area only if hero did not yet reach the platform
    if (sticks.last().x < x) {
      ctx.fillStyle = "white";
      ctx.fillRect(
        x + w / 2 - perfectTargetSize / 2,
        canvasHeight - platformHeight,
        perfectTargetSize,
        perfectTargetSize
      );
    }
  });
}

function drawHero() {
  // image{image, x, y, w, h}
  ctx.drawImage(
    charImg,
    spaceHeroX - spaceHeroWidth,
    spaceHeroY + canvasHeight - platformHeight - spaceHeroHeight,
    spaceHeroWidth,
    spaceHeroHeight
  );
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    // Draw stick
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    // Restore transformations
    ctx.restore();
  });
}

//TODo Creating eventListeners

// If space is pressed => restart the game
window.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    updateCanvas();
    return;
  }
});

// StartingPoint => stretching "MOUSE-DOWN"
window.addEventListener("mousedown", function (event) {
  if (event.target.classList.contains("mute")) {
    return;
  }
  if (step === "waiting") {
    lastTimestamp = undefined;
    instructionElement.style.opacity = 0;
    step = "stretching";
    window.requestAnimationFrame(animate);
  }
});

// stretching => rotate "MOUSE-UP"
window.addEventListener("mouseup", function () {
  if (step === "stretching") {
    step = "turning";
  }
});

// resizing
window.addEventListener("resize", function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

startButton.addEventListener("click", startGame);

muteButton.addEventListener("click", function () {
  musicBackground.muted = true;
  platformSound.muted = true;
  fallingSound.muted = true;
  musicGameOver.muted = true;
});

restartButton.addEventListener("click", function () {
  updateCanvas();
  restartButton.style.display = "none";
});

winButton.addEventListener("click", function () {
  updateCanvas();
  winButton.style.display = "none";
});
