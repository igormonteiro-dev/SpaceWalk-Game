// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that acceps degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Todo To fix - instruction message after reset

//todo create a pop-up as starting page

// Todo Define rules of the game

let step = "waiting"; // stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame
let spaceHeroX; // Changes when moving forward
let spaceHeroY; // Only changes when falling
let sceneOffset; // change the scene after moving
let platforms = [];
let sticks = [];
let musicMuted = false;

//Todo Add background music, sound effects to "platform", "perfectTargetSize" and "falling"

let score = 0;

const charImg = new Image();
charImg.src = "./images/spaceHero.png";

// Configurations - Set size, distance and time
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 130;

const spaceHeroDistanceFromEdge = 1; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectTargetSize = 8;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 3;

const spaceHeroWidth = 55;
const spaceHeroHeight = 60;

// Extend the base functionality of JavaScript
Array.prototype.findLast = function () {
  return this[this.length - 1];
};

// Getting the canvas from HTML
const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// Getting all Ids from HTML
const instructionElement = document.getElementById("instruction");
const perfectTargetElement = document.getElementById("perfectTarget");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const musicBackground = document.getElementById("bgm").play();
const platformSound = document.getElementById("platformSound");

// Initialize layout
resetGame();

// Reset game progress
function resetGame() {
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
  heroX = platforms[0].x + platforms[0].w - spaceHeroDistanceFromEdge;
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

resetGame();

// Creating eventListener of the whole steps of the game

// If space is pressed => restart the game
window.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    event.preventDefault();
    resetGame();
    return;
  }
});

// StartingPoint => stretching "MOUSE-DOWN"
window.addEventListener("mousedown", function (event) {
  if (step === "waiting") {
    lastTimestamp = undefined;
    instructionElement.style.opacity = 0;
    step = "stretching";
    window.requestAnimationFrame(animate);
  }
});

// stretching => rotate "MOUSE-UP"
window.addEventListener("mouseup", function (event) {
  if (step === "stretching") {
    step = "turning";
  }
});

// resizing
window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

window.requestAnimationFrame(animate);

// The main game loop
function animate(timestamp) {
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
      sticks.findLast().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;
    }

    case "turning": {
      sticks.findLast().rotation += (timestamp - lastTimestamp) / turningSpeed;

      // stop the stick when 90°

      if (sticks.findLast().rotation > 90) {
        sticks.findLast().rotation = 90;

        // If perfectTargetSize increase score
        const [nextPlatform, perfectTargetSize] = thePlatformTheStickHits();
        if (nextPlatform) {
          // Increase score
          score += perfectTargetSize ? 2 : 1;
          scoreElement.innerText = score;

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
      break;
    }

    // // If the player reachs another platform, so "transitioning", else "falling"
    case "walking": {
      heroX += (timestamp - lastTimestamp) / walkingSpeed; //todo better understanding this

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        const maxHeroX =
          nextPlatform.x + nextPlatform.w - spaceHeroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          step = "transitioning";
        }
      } else {
        const maxHeroX =
          sticks.findLast().x + sticks.findLast().length + spaceHeroWidth; //todo better understanding this
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          step = "falling";
        }
      }
      break;
    }

    // the game changes the scene
    case "transitioning": {
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        // Add the next step
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0,
        });
        step = "waiting"; // back to the startingPoint
      }
      break;
    }
    case "falling": {
      if (sticks.findLast().rotation < 180)
        sticks.findLast().rotation +=
          (timestamp - lastTimestamp) / turningSpeed;

      spaceHeroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxspaceHeroY =
        platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (spaceHeroY > maxspaceHeroY) {
        restartButton.style.display = "block";
        return;
      }
      break;
    }
    default:
      throw Error("Wrong step");
  }

  draw();
  window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
}

//todo continue here
// Returns the platform the stick hit (if it didn't hit any stick then return undefined)
function thePlatformTheStickHits() {
  if (sticks.findLast().rotation != 90)
    throw Error(`Stick is ${sticks.findLast().rotation}°`);
  const stickFarX = sticks.findLast().x + sticks.findLast().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  // If the stick hits the perfect area
  if (
    platformTheStickHits &&
    platformTheStickHits.x +
      platformTheStickHits.w / 2 -
      perfectTargetSize / 2 <
      stickFarX &&
    stickFarX <
      platformTheStickHits.x +
        platformTheStickHits.w / 2 +
        perfectTargetSize / 2
  )
    return [platformTheStickHits, true];

  return [platformTheStickHits, false];
}

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

restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform
    ctx.fillStyle = "#121311";
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Draw perfect area only if hero did not yet reach the platform
    if (sticks.findLast().x < x) {
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
    heroX - spaceHeroWidth,
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
