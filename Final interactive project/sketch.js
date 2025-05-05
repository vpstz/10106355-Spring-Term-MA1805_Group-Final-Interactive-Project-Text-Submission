let playerX;
let playerY;
let playerWidth;
let playerHeight;
let playerSpeed;
let balls = [];
let ballSpeed = 3;
let bonusItems = [];
let bonusOn = false;
let bonusStartTime = 0;
let score = 0;
let lives = 3; 
let gameOver = false;

function setup() {
  createCanvas(400, 600); 
  playerX = width / 2; 
  playerY = height - 50;
  playerWidth = 50;
  playerHeight = 20;
  playerSpeed = 7;

  console.log("This is the ball collecting game");
  console.log("Use left and right arrow keys to move.");
  console.log("Catch the ball and you earn a point.");
  console.log("When the ball touch the ground you lose a life, 0 life = gg");
  console.log("There are bonuses that will increase your speed ")
  console.log (" the level get harder per 10 balls")
  console.log("Lastly, good luck.")
}

function drawPlayer() {
  fill(0, 200, 100);
  rect(playerX, playerY, playerWidth, playerHeight);
}

function constrainPlayerPosition() {
  if (playerX < 0) {
    playerX = 0;
  } else if (playerX + playerWidth > width) {
    playerX = width - playerWidth;
  }
}


function spawnBall() {
  let ball = {
    x: random(width),
    y: 0,
    size: 20,
  };
  
  balls.push(ball);
}

function spawnBonusItem() {
  let bonus = {
    x: random(width),
    y: 0,
    size: 15,
  };
  bonusItems.push(bonus);
}

function checkBallCollision(ball) {
  let ballCenterX = ball.x;
  let ballCenterY = ball.y;
  let playerCenterX = playerX + playerWidth / 2;
  let playerCenterY = playerY + playerHeight / 2;

  let distance = dist(ballCenterX, ballCenterY, playerCenterX, playerCenterY);
  if (distance < ball.size / 2 + playerWidth / 2) {
    score = score + 1;

    if (score % 10 === 0) {
      ballSpeed = ballSpeed + 0.2;
    }

    return true;
  } else {
    return false;
  }
}

function drawBall(ball) {
  fill(255, 50, 50);
  ellipse(ball.x, ball.y, ball.size);
}

function updateBalls() {
  for (let i = balls.length - 1; i >= 0; i--) {
    let ball = balls[i];
    ball.y = ball.y + ballSpeed;

    if (checkBallCollision(ball)) {
      balls.splice(i, 1);
    } else if (ball.y > height) {
      loseLife();
      balls.splice(i, 1);
    } else {
      drawBall(ball);
    }
  }
}




function loseLife() {
  lives = lives - 1;

  if (lives <= 0) {
    gameOver = true;
  }
}



function drawBonus(bonus) {
  fill(50, 200, 255);
  ellipse(bonus.x, bonus.y, bonus.size);
}

function BonusCollected(bonus) {
  let bonusCenterX = bonus.x;
  let bonusCenterY = bonus.y;
  let playerCenterX = playerX + playerWidth / 2;
  let playerCenterY = playerY + playerHeight / 2;

  let distance = dist(bonusCenterX, bonusCenterY, playerCenterX, playerCenterY);
  if (distance < bonus.size / 2 + playerWidth / 2) {
    bonusOn = true;
    bonusStartTime = frameCount;
    return true;
  } else {
    return false;
  }
}

function updateBonusEffect() {
  if (bonusOn) {
    if (frameCount - bonusStartTime > 600) {
      bonusOn = false;
    }
  }

  if (bonusOn) {
    playerSpeed = 12;
  } else {
    playerSpeed = 7;
  }
}

function updateBonusItems() {
  for (let i = bonusItems.length - 1; i >= 0; i--) {
    let bonus = bonusItems[i];

    
    bonus.y = bonus.y + (ballSpeed - 1);

    if (BonusCollected(bonus)) {
      bonusItems.splice(i, 1);
    } else if (bonus.y > height) {
      bonusItems.splice(i, 1);
    } else {
      drawBonus(bonus);
    }
  }
}


function keyPressed() {
  if (key === "R" || key === "r") {
    restartGame();
  }
}

function restartGame() {
  balls = [];
  bonusItems = [];
  score = 0;
  lives = 3;
  ballSpeed = 3;
  bonusOn = false;
  gameOver = false;
}


function showGameOverScreen() {
  background(200, 50, 50);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("Game Over", width / 2, height / 2 - 20);
  textSize(24);
  text("Final Score: " + score, width / 2, height / 2 + 20);
  text("Press 'R' to Restart", width / 2, height / 2 + 60);
}


function draw() {
  if (gameOver) {
    showGameOverScreen();
  } else {
    background(100, 100, 250);
    fill(255);
    textSize(20);
    text("Score: " + score, 10, 25);
    text("Lives: " + lives, 10, 50);
  
    
    if (keyIsDown(LEFT_ARROW)) {
      playerX = playerX - playerSpeed;
    } else if (keyIsDown(RIGHT_ARROW)) {
      playerX = playerX + playerSpeed;
    }

    
    constrainPlayerPosition();
    drawPlayer();

    
    if (frameCount % 30 === 0) {
      spawnBall();
    }

    if (frameCount % 300 === 0) {
      spawnBonusItem();
    }

    updateBalls();
    
    updateBonusItems();
    
    updateBonusEffect();
  }
}