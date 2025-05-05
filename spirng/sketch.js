// constants
const GAME_STATES = {BETTING: 0, PLAYER_TURN: 1, DEALER_TURN: 2, GAME_OVER: 3};
const SCREENS = {MENU: 0, GAME: 1};
const CARD_SUITS = ["♥", "♦", "♣", "♠"];
const CARD_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
    this.width = 80;
    this.height = 120;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.moving = false;
    this.hidden = false;
  }

  draw() {
    if (this.hidden) {
      this.drawBack();
      return;
    }

    fill(255);
    rect(this.x, this.y, this.width, this.height, 5);
    
    // Checks if the value is a red suit or a black suit and sets the color accordingly
    if (this.suit === "♥" || this.suit === "♦") {
      fill(255, 0, 0);
    } else {
      fill(0, 0, 0);
    }
    
    // Draw the Suit and the Value
    textSize(20);
    text(this.value + this.suit, this.x + this.width/2, this.y + this.height/2);
    
    // Draw the Suit and the value in the corners
    textSize(14);
    text(this.value + this.suit, this.x + 15, this.y + 20);
    text(this.value + this.suit, this.x + this.width - 15, this.y + this.height - 20);
  }

  // Draws the back of the card for the dealear's hidden card
  drawBack() {
    fill(150, 0, 0);
    rect(this.x, this.y, this.width, this.height, 5);
  }
  
  // To move the card smoothly
  update() {
    if (this.moving) {
      this.x = lerp(this.x, this.targetX, 0.1);
      this.y = lerp(this.y, this.targetY, 0.1);
      
      if (dist(this.x, this.y, this.targetX, this.targetY) < 1) {
        this.moving = false;
        this.x = this.targetX;
        this.y = this.targetY;
      }
    }
  }
}

class Hand {
  constructor() {
    this.cards = [];
  }

  addCard(card) {
    this.cards.push(card);
  }

  calculateScore() {
    let score = 0;
    let aces = 0;
    
    for (let card of this.cards) {
      if (card.hidden) continue;
      
      if (card.value === "A") {
        score += 11;
        aces++;
      } else if (["K", "Q", "J"].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value);
      }
    }
    
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    
    return score;
  }

  // Draws each of the cards from the hand
  draw() {
    for (let card of this.cards) {
      card.draw();
    }
  }
  
  // Move each card to its target position
  update() {
    for (let card of this.cards) {
      card.update();
    }
  }
}

class Deck {
  constructor() {
    this.cards = [];
    this.count = 1;
    this.cutCardPosition = 0;
    this.initialize();
  }

  // Creates a deck of cards and shuffles it
  initialize() {
    this.cards = [];
    for (let suit of CARD_SUITS) {
      for (let value of CARD_VALUES) {
        this.cards.push(new Card(suit, value));
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }


  draw() {
    for (let i = 0; i < min(this.cards.length, 10); i++) {
      fill(150, 0, 0);
      rect(width - 150 + i * 0.5, height/2 - 60 + i * 0.5, 80, 120, 5);
    }
  }

 


  dealCard(hand, x, y, hidden = false) {
    if (this.cards.length === 0) {
      this.initialize();
      return null;
    }
    
    const card = this.cards.pop();
    card.hidden = hidden;
    card.x = width / 2;
    card.y = -card.height;
    card.targetX = x;
    card.targetY = y;
    card.moving = true;
    hand.addCard(card);
    return card;
  }
}

class BlackjackGame {
  constructor() {
    this.deck = new Deck();
    this.playerHands = [new Hand()];
    this.currentHandIndex = 0;
    this.dealerHand = new Hand();
    this.gameState = GAME_STATES.BETTING;
    this.chips = 1000;
    this.betAmount = 50;
    this.message = "";
    this.messageTimer = 0;
    this.animatedCards = [];
  }

  initialize() {
    this.deck.initialize();
    this.playerHands = [new Hand()];
    this.currentHandIndex = 0;
    this.dealerHand = new Hand();
    this.message = "";
  }

  dealInitialCards() {
    this.animatedCards = [];
    
    // Deal two cards to player and dealer (alternating)
    this.animatedCards.push(this.deck.dealCard(this.playerHands[0], 150, 450));
    this.animatedCards.push(this.deck.dealCard(this.dealerHand, 150, 150));
    this.animatedCards.push(this.deck.dealCard(this.playerHands[0], 180, 450));
    this.animatedCards.push(this.deck.dealCard(this.dealerHand, 180, 150, true));
    
    this.gameState = GAME_STATES.PLAYER_TURN;
  }

  update() {
    // Update animations
    this.animatedCards = this.animatedCards.filter(card => card.moving);
    for (let card of this.animatedCards) {
      card.update();
    }
    
    
    if (this.animatedCards.length === 0) {
      if (this.gameState === GAME_STATES.PLAYER_TURN) {
        this.updateScores();
        this.checkInitialPlayerBlackjack();
      }
      
      if (this.gameState === GAME_STATES.DEALER_TURN) {
        this.dealerPlay();
      }
    }
  }

  updateScores() {
    const dealerCards = this.gameState === GAME_STATES.PLAYER_TURN ? [this.dealerHand.cards[0]] : this.dealerHand.cards;
    const tempHand = new Hand();
    tempHand.cards = dealerCards;
    
    for (let hand of this.playerHands) {
      if (hand.calculateScore() > 21) {
        this.setMessage("Bust!", 60);
        this.nextHandOrEnd();
      }
    }
  }

  checkInitialPlayerBlackjack() {
    const firstHand = this.playerHands[0];
    if (firstHand.calculateScore() === 21 && firstHand.cards.length === 2) {
      if (this.dealerHand.cards[1]) this.dealerHand.cards[1].hidden = false;  
      
      const dealerScore = this.dealerHand.calculateScore();
      if (dealerScore === 21) {
        this.setMessage("Push! Both have Blackjack");
        this.chips += this.betAmount;
      } else {
        this.setMessage("Blackjack! You win 3:2");
        this.chips += this.betAmount * 2.5;
      }
      this.gameState = GAME_STATES.GAME_OVER;
    }
  }

  dealerPlay() {
  if (this.dealerHand.cards[1]) this.dealerHand.cards[1].hidden = false;
  const dealerScore = this.dealerHand.calculateScore();

  if (dealerScore < 17) {
    this.animatedCards.push(this.deck.dealCard(this.dealerHand, 
      150 + (this.dealerHand.cards.length * 30), 150));
    return;
  }
  
  this.resolveGame();
}

resolveGame() {
  let totalWin = 0;
  
  for (let i = 0; i < 1; i++) {
    const hand = this.playerHands[0];
    const score = hand.calculateScore();
    const handBet = this.betAmount;
    
    if (score > 21) {
      totalWin -= handBet;
    } else if (this.dealerHand.calculateScore() > 21) {
      totalWin += handBet;
      this.setMessage("Dealer busts! You win!");
    } else if (score > this.dealerHand.calculateScore()) {
      totalWin += handBet;
      this.setMessage("You win!");
    } else if (score === this.dealerHand.calculateScore()) {
      this.setMessage("Push!");
    } else {
      totalWin -= handBet;
      this.setMessage("You lose!");
    }
  }
  
  this.chips += totalWin;
  this.gameState = GAME_STATES.GAME_OVER;
}

  nextHandOrEnd() {
    this.gameState = GAME_STATES.DEALER_TURN;
  }

  setMessage(msg, duration = 120) {
    this.message = msg;
    this.messageTimer = duration;
  }

  draw() {
    // Draw table
    background(0, 100, 0);
    
    // Draw dealer area
    fill(0, 80, 0);
    rect(50, 80, 900, 180, 10);
    fill(255);
    text("Dealer", 100, 120);
    
    // Draw player area
    fill(0, 80, 0);
    rect(50, 320, 900, 300, 10);
    fill(255);
    text("Player", 100, 360);
    
    // Draw deck
    this.deck.draw();
    
    // Draw hands
    this.dealerHand.draw();
    for (let i = 0; i < this.playerHands.length; i++) {
      const yOffset = i * 50;
      for (let card of this.playerHands[i].cards) {
        card.y = card.targetY + yOffset;
        card.draw();
      }
    }
    
    // Draw game info
    this.drawGameInfo();
    this.drawChipPile();
    this.drawButtons();
    
    if (this.messageTimer > 0) {
      this.drawMessage();
      this.messageTimer--;
    }
  }

  drawChipPile() {
    let chipImage;
    if (this.chips < 500) {
      chipImage = SMALL_PILE;
    } else if (this.chips >= 500 && this.chips <= 1500) {
      chipImage = MEDIUM_PILE;
    } else {
      chipImage = BIG_PILE;
    }
    
    // Draw the chip pile in bottom right (adjust position/size as needed)
    if (chipImage) {
      const imgWidth = 200; // Adjust based on your image sizes
      const imgHeight = 120;
      image(chipImage, width - imgWidth - 20, height - imgHeight - 20, imgWidth, imgHeight);
    }
  }

  drawGameInfo() {
    fill(255);
    textSize(20);
    text(`Chips: $${this.chips}`, 150, 30);
    text(`Bet: $${this.betAmount}`, 300, 30);
    
    if (this.gameState !== GAME_STATES.BETTING) {
      const dealerScore = this.gameState === GAME_STATES.PLAYER_TURN && this.dealerHand.cards.length > 0 ? 
        new Hand([this.dealerHand.cards[0]]).calculateScore() : this.dealerHand.calculateScore();
      text(`Dealer: ${dealerScore}`, 850, 120);
      
      if (this.playerHands.length > 1) {
        textSize(16);
        text(`Playing hand ${this.currentHandIndex + 1} of ${this.playerHands.length}`, width/2, 300);
      }
      
      text(`Player: ${this.playerHands[this.currentHandIndex].calculateScore()}`, 850, 360);
    }
  }

  drawMessage() {
    fill(0, 0, 0, 200);
    rect(width/2 - 200, height/2 - 30, 400, 60, 10);
    fill(255);
    textSize(24);
    text(this.message, width/2, height/2);
  }

  drawButtons() {
    switch (this.gameState) {
      case GAME_STATES.BETTING:
        this.drawBettingButtons();
        break;
      case GAME_STATES.PLAYER_TURN:
        this.drawPlayerActionButtons();
        break;
      case GAME_STATES.GAME_OVER:
        this.drawGameOverButtons();
        break;
    }
  }

  drawBettingButtons() {
    const buttonWidths = [80, 40, 60, 60, 60, 60, 40];
    const buttonSpacing = 10;
    const totalWidth = buttonWidths.reduce((a, b) => a + b, 0) + (buttonSpacing * (buttonWidths.length - 1));
    let xPos = (width - totalWidth) / 2;
    
    // Deal button
    fill(200, 200, 0);
    rect(xPos, 650, buttonWidths[0], 40, 5);
    fill(0);
    text("Deal", xPos + buttonWidths[0]/2, 670);
    xPos += buttonWidths[0] + buttonSpacing;
  
    // - button
    fill(100);
    rect(xPos, 650, buttonWidths[1], 40, 5);
    fill(255);
    text("-", xPos + buttonWidths[1]/2, 670);
    xPos += buttonWidths[1] + buttonSpacing;
  
    // Fixed bet amounts
    const betOptions = [10, 25, 50, 100];
    for (let i = 0; i < betOptions.length; i++) {
      fill(this.betAmount === betOptions[i] ? 200 : 100);
      rect(xPos, 650, buttonWidths[2+i], 40, 5);
      fill(255);
      text(`$${betOptions[i]}`, xPos + buttonWidths[2+i]/2, 670);
      xPos += buttonWidths[2+i] + buttonSpacing;
    }
  
    // + button
    fill(100);
    rect(xPos, 650, buttonWidths[6], 40, 5);
    fill(255);
    text("+", xPos + buttonWidths[6]/2, 670);
  }

  drawPlayerActionButtons() {
    const startX = 380;
    
    // Hit button
    fill(0, 0, 200);
    rect(startX, 650, 80, 40, 5);
    
    // Stand button
    fill(200, 0, 0);
    rect(startX + 100, 650, 80, 40, 5);
    
    // Button labels
    fill(255);
    text("Hit", startX + 40, 670);
    text("Stand", startX + 140, 670);
}
  drawGameOverButtons() {
    fill(0, 200, 0);
    rect(450,   650, 100, 40, 5);
    fill(255);
    text("New Hand", 500, 670);
  }

  handleClick() {
    if (this.messageTimer > 0) return;
    
    switch (this.gameState) {
      case GAME_STATES.BETTING:
        this.handleBettingClick();
        break;
      case GAME_STATES.PLAYER_TURN:
        this.handlePlayerActionClick();
        break;
      case GAME_STATES.GAME_OVER:
        this.handleGameOverClick();
        break;
    }
  }

  handleBettingClick() {
    const buttonWidths = [80, 40, 60, 60, 60, 60, 40];
    const buttonSpacing = 10;
    const totalWidth = buttonWidths.reduce((a, b) => a + b, 0) + (buttonSpacing * (buttonWidths.length - 1));
    let xPos = (width - totalWidth) / 2;
    
    // Deal button 
    if (mouseX > xPos && mouseX < xPos + buttonWidths[0] && mouseY > 650 && mouseY < 690) {
      if (this.betAmount > this.chips) {
        this.setMessage("Not enough chips!");
        return;
      }
      this.dealInitialCards();
      return;
    }
    xPos += buttonWidths[0] + buttonSpacing;
  
    // - button subtracts 5 from the bet amount
    if (mouseX > xPos && mouseX < xPos + buttonWidths[1] && mouseY > 650 && mouseY < 690) {
      this.betAmount = max(10, this.betAmount - 5);
      return;
    }
    xPos += buttonWidths[1] + buttonSpacing;
  
    // Fixed bet amounts (10, 25, 50, 100)
    const betOptions = [10, 25, 50, 100];
    for (let i = 0; i < betOptions.length; i++) {
      if (mouseX > xPos && mouseX < xPos + buttonWidths[2+i] && mouseY > 650 && mouseY < 690) {
        this.betAmount = betOptions[i];
        return;
      }
      xPos += buttonWidths[2+i] + buttonSpacing;
    }
  
    // + button adds 5 to the bet amount
    if (mouseX > xPos && mouseX < xPos + buttonWidths[6] && mouseY > 650 && mouseY < 690) {
      this.betAmount = min(this.chips, this.betAmount + 5);
    }
  }

  handlePlayerActionClick() {
    const currentHand = this.playerHands[this.currentHandIndex];
    const startX = 380;
    
    // Hit button (matches the drawn button)
    if (mouseX > startX && mouseX < startX + 80 && mouseY > 650 && mouseY < 690) {
        const newCard = this.deck.dealCard(currentHand, 
            150 + (currentHand.cards.length * 30), 
            450 + this.currentHandIndex * 50);
        this.animatedCards.push(newCard);
    }
    
    // Stand button (matches the drawn button at 480,650 80x40)
    else if (mouseX > startX + 100 && mouseX < startX + 180 && mouseY > 650 && mouseY < 690) {
        this.nextHandOrEnd();
    }
}

  handleGameOverClick() {
    if (mouseX > 450 && mouseX < 550 && mouseY > 650 && mouseY < 690) {
      this.gameState = GAME_STATES.BETTING;
      this.initialize();
    }
  }
}

// Grid System
class GridSystem {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cellWidth = width / cols;
    this.cellHeight = height / rows;
  }

  position(col, row, spanX = 1, spanY = 1) {
    return {
      x: col * this.cellWidth,
      y: row * this.cellHeight,
      width: spanX * this.cellWidth,
      height: spanY * this.cellHeight
    };
  }
}

// Screen Manager
class ScreenManager {
  constructor() {
    this.currentScreen = SCREENS.MENU;
    this.grid = new GridSystem(12, 12);
    this.game = new BlackjackGame();
  }  
  draw() {
    switch (this.currentScreen) {
      case SCREENS.MENU:
        this.drawMenu();
        break;
      case SCREENS.GAME:
        this.game.draw();
        break;
    }
  }

  drawMenu() {
      // Draw your background image instead of black
      if (MENU_BACKGROUND) {
          image(MENU_BACKGROUND, 0, 0, width, height);
      } else {
          background(0); // Fallback if image not loaded
      }
      
      // Position Play button at bottom center
      const playPos = this.grid.position(5, 10, 2, 1);
      
      fill(0, 100, 0);
      rect(playPos.x, playPos.y, playPos.width, playPos.height, 10);
      fill(255);
      text("Play", playPos.x + playPos.width/2, playPos.y + playPos.height/2);
  }

  handleClick() {
    switch (this.currentScreen) {
      case SCREENS.MENU:
        this.handleMenuClick();
        break;
      case SCREENS.GAME:
        this.game.handleClick();
        break;
  }
}

 handleMenuClick() {
      // Only check for Play button now
      const playPos = this.grid.position(5, 10, 2, 1); // Changed row to match drawMenu()
      
      if (mouseX > playPos.x && mouseX < playPos.x + playPos.width &&
          mouseY > playPos.y && mouseY < playPos.y + playPos.height) {
          this.currentScreen = SCREENS.GAME;
      }
}

  update() {
    if (this.currentScreen === SCREENS.GAME) {
      this.game.update();
    }
  }
}

// Main sketch
let screenManager;
let MENU_BACKGROUND;
let SMALL_PILE;
let MEDIUM_PILE;
let BIG_PILE;

function setup() {
  createCanvas(1000, 700);
  textAlign(CENTER, CENTER);
  textSize(24);
  screenManager = new ScreenManager();
}

function draw() {
  screenManager.draw();
  screenManager.update();
}

function mousePressed() {
  screenManager.handleClick();
}

function preload() {
  MENU_BACKGROUND = loadImage("Menu_Screen.jpg");
  SMALL_PILE = loadImage("Small_Pile.png");
  MEDIUM_PILE = loadImage("Medium_Pile.png");
  BIG_PILE = loadImage("Big_Pile.png");
}