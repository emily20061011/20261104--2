// ==========================================
// 全域變數設定
// ==========================================

// 題目資料 (包含圖片、提示、正確答案)
let questionsData = [
  { imgPath: 'assets/japan.png', prompt: '日本', correctAnswer: '富士山與櫻花之國：日本' },
  { imgPath: 'assets/france.png', prompt: '法國', correctAnswer: '浪漫巴黎鐵塔：法國' },
  { imgPath: 'assets/egypt.png', prompt: '埃及', correctAnswer: '神祕金字塔與木乃伊：埃及' },
  { imgPath: 'assets/australia.png', prompt: '澳洲', correctAnswer: '袋鼠與無尾熊之鄉：澳洲' },
  { imgPath: 'assets/brazil.png', prompt: '巴西', correctAnswer: '熱情森巴與足球王國：巴西' },
  { imgPath: 'assets/canada.png', prompt: '加拿大', correctAnswer: '楓葉與冰雪王國：加拿大' }
];

let targetBoxes = [];     // 上方目標放置區物件陣列
let dragOptions = [];     // 下方可拖曳選項物件陣列
let activeDrag = null;    // 當前正在被拖曳的選項

let gameState = 'QUIZ';   // 狀態管理：'QUIZ' (測驗中), 'RESULT' (顯示成績)
let submitButton;         // 交卷按鈕
let finalScore = 0;       // 最終分數
let confettiParticles = []; // 彩帶粒子陣列

// 載入圖片或 GIF 資源
function preload() {
  for (let i = 0; i < questionsData.length; i++) {
    // 如果你有準備圖檔/GIF，可以將下面這行解除註解：
    // questionsData[i].img = loadImage(questionsData[i].imgPath);
  }
}

function setup() {
  // 建立全螢幕響應式畫布
  createCanvas(windowWidth, windowHeight);
  
  // 初始化版面與卡片位置
  initGameLayout();

  // 建立「交卷看成績」按鈕
  submitButton = createButton('交卷看成績');
  styleSubmitButton();
  submitButton.mousePressed(calculateScore);
  submitButton.hide(); // 初始隱藏，直到所有格子都填滿
}

function draw() {
  // 背景顏色
  background(240, 244, 248);

  // 1. 繪製標題列
  drawHeader();

  // 2. 繪製上方目標放置區
  for (let box of targetBoxes) {
    box.display();
  }

  // 3. 繪製下方可拖曳選項
  for (let opt of dragOptions) {
    if (opt !== activeDrag) {
      opt.display();
    }
  }
  // 被拖曳中的選項最後繪製，確保在最上層
  if (activeDrag) {
    activeDrag.display();
  }

  // 4. 檢查是否全部放置完畢，決定是否顯示交卷按鈕
  if (gameState === 'QUIZ') {
    checkCompletion();
  }

  // 5. 結算畫面與彩帶特效
  if (gameState === 'RESULT') {
    drawResultOverlay();
    
    // 分數高於或等於 80 分時顯示彩帶特效
    if (finalScore >= 80) {
      updateAndDrawConfetti();
    }
  }
}

// ==========================================
// 初始化與響應式版面配置
// ==========================================
function initGameLayout() {
  targetBoxes = [];
  dragOptions = [];

  let cols = 6;
  let margin = 15;
  let totalWidth = width - margin * (cols + 1);
  let cardWidth = constrain(totalWidth / cols, 120, 180); // 限制卡片寬度範圍
  let cardHeight = cardWidth * 1.2;

  let startX = (width - (cardWidth * cols + margin * (cols - 1))) / 2;
  let topY = 90;                     // 上方目標區 Y 軸
  let bottomY = topY + cardHeight + 50; // 下方選項區 Y 軸

  // 建立 6 個上方目標框
  for (let i = 0; i < cols; i++) {
    let x = startX + i * (cardWidth + margin);
    targetBoxes.push(new TargetBox(i, x, topY, cardWidth, cardHeight, questionsData[i]));
  }

  // 隨機打亂下方選項的順序
  let shuffledAnswers = questionsData.map(q => q.correctAnswer);
  shuffleArray(shuffledAnswers);

  // 建立 6 個下方可拖曳選項
  for (let i = 0; i < cols; i++) {
    let x = startX + i * (cardWidth + margin);
    dragOptions.push(new DragOption(i, x, bottomY, cardWidth, cardHeight * 0.5, shuffledAnswers[i]));
  }
}

// 視窗大小改變時自動重新適應排版
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGameLayout();
  styleSubmitButton();
}

// ==========================================
// UI 介面與按鈕樣式
// ==========================================

function drawHeader() {
  push();
  fill(44, 62, 80);
  noStroke();
  textSize(min(width * 0.022, 24));
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("🌍 小學生趣味國家知識大比拼 — 拖曳下方文字到正確圖片下方！", width / 2, 40);
  pop();
}

function styleSubmitButton() {
  submitButton.position(width / 2 - 90, height - 70);
  submitButton.size(180, 45);
  submitButton.style('font-size', '18px');
  submitButton.style('font-weight', 'bold');
  submitButton.style('background-color', '#27ae60');
  submitButton.style('color', '#ffffff');
  submitButton.style('border', 'none');
  submitButton.style('border-radius', '22px');
  submitButton.style('cursor', 'pointer');
  submitButton.style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)');
}

function checkCompletion() {
  let allFilled = targetBoxes.every(box => box.attachedOption !== null);
  if (allFilled) {
    submitButton.show();
  } else {
    submitButton.hide();
  }
}

function calculateScore() {
  gameState = 'RESULT';
  submitButton.hide();

  let correctCount = 0;
  for (let box of targetBoxes) {
    if (box.attachedOption && box.attachedOption.text === box.data.correctAnswer) {
      correctCount++;
    }
  }

  finalScore = Math.round((correctCount / questionsData.length) * 100);

  if (finalScore >= 80) {
    createConfetti();
  }
}

function drawResultOverlay() {
  push();
  // 半透明背景遮罩
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  // 成績結算卡片背景
  fill(255);
  stroke(41, 128, 185);
  strokeWeight(4);
  rectMode(CENTER);
  rect(width / 2, height / 2, 340, 220, 15);

  // 成績標題
  noStroke();
  fill(44, 62, 80);
  textSize(26);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("測驗結果", width / 2, height / 2 - 65);

  // 分數顯示
  textSize(40);
  if (finalScore >= 80) {
    fill(39, 174, 96); // 綠色 (高分)
  } else {
    fill(231, 76, 60);  // 紅色 (需加油)
  }
  text(finalScore + " 分", width / 2, height / 2 - 10);

  // 鼓勵評語
  textSize(16);
  fill(127, 140, 141);
  if (finalScore === 100) {
    text("🎉 太神啦！完美答對，地理小達人！", width / 2, height / 2 + 45);
  } else if (finalScore >= 80) {
    text("👏 太棒了！表現非常優秀喔！", width / 2, height / 2 + 45);
  } else {
    text("💪 別氣餒，再試一次一定可以更好！", width / 2, height / 2 + 45);
  }
  pop();
}

// ==========================================
// 滑鼠拖曳互動邏輯
// ==========================================
function mousePressed() {
  if (gameState !== 'QUIZ') return;

  // 檢查是否點擊到任何一個可拖曳選項
  for (let i = dragOptions.length - 1; i >= 0; i--) {
    let opt = dragOptions[i];
    if (opt.isMouseOver()) {
      activeDrag = opt;
      opt.isDragging = true;
      
      // 如果該選項原本在某個目標框內，將其從目標框中卸載
      if (opt.targetBox) {
        opt.targetBox.attachedOption = null;
        opt.targetBox = null;
      }
      break;
    }
  }
}

function mouseDragged() {
  if (activeDrag) {
    activeDrag.x = mouseX - activeDrag.w / 2;
    activeDrag.y = mouseY - activeDrag.h / 2;
  }
}

function mouseReleased() {
  if (activeDrag) {
    let droppedInBox = false;

    // 檢查是否放開在某個目標框的範圍內
    for (let box of targetBoxes) {
      if (box.isMouseOver()) {
        // 如果該目標框已經有選項，把舊選項退回原位
        if (box.attachedOption) {
          box.attachedOption.resetPosition();
        }

        // 綁定新選項到目標框
        box.attachedOption = activeDrag;
        activeDrag.targetBox = box;
        activeDrag.x = box.x + 8;
        activeDrag.y = box.y + box.h - activeDrag.h - 10;
        droppedInBox = true;
        break;
      }
    }

    // 如果沒有放在任何目標框內，退回原位
    if (!droppedInBox) {
      activeDrag.resetPosition();
    }

    activeDrag.isDragging = false;
    activeDrag = null;
  }
}

// 陣列隨機洗牌工具函式
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==========================================
// 類別定義 (TargetBox & DragOption)
// ==========================================

// 上方目標放置區
class TargetBox {
  constructor(id, x, y, w, h, data) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.data = data;
    this.attachedOption = null;
  }

  display() {
    push();
    stroke(189, 195, 199);
    strokeWeight(2);
    fill(255);
    rect(this.x, this.y, this.w, this.h, 12);

    // 繪製圖片/GIF 區塊或預設提示
    if (this.data.img) {
      image(this.data.img, this.x + 10, this.y + 10, this.w - 20, this.h * 0.55);
    } else {
      fill(236, 240, 241);
      noStroke();
      rect(this.x + 8, this.y + 8, this.w - 16, this.h * 0.55, 8);
      
      fill(41, 128, 185);
      textSize(min(this.w * 0.12, 16));
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text(this.data.prompt, this.x + this.w / 2, this.y + 8 + (this.h * 0.55) / 2);
    }

    // 尚未放置選項時顯示虛線框提示
    if (!this.attachedOption) {
      drawingContext.setLineDash([5, 5]);
      stroke(149, 165, 166);
      fill(250, 252, 253);
      rect(this.x + 8, this.y + this.h * 0.62, this.w - 16, this.h * 0.32, 6);
      drawingContext.setLineDash([]); // 恢復實線
      
      noStroke();
      fill(127, 140, 141);
      textSize(13);
      textAlign(CENTER, CENTER);
      text("拖曳文字到這裡", this.x + this.w / 2, this.y + this.h * 0.78);
    }

    pop();
  }

  isMouseOver() {
    return mouseX > this.x && mouseX < this.x + this.w &&
           mouseY > this.y && mouseY < this.y + this.h;
  }
}

// 下方可拖曳選項
class DragOption {
  constructor(id, homeX, homeY, w, h, text) {
    this.id = id;
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX;
    this.y = homeY;
    this.w = w;
    this.h = h;
    this.text = text;
    this.isDragging = false;
    this.targetBox = null;
  }

  display() {
    push();
    if (this.isDragging) {
      stroke(41, 128, 185);
      strokeWeight(3);
      fill(235, 245, 251);
      // 拖曳陰影效果
      drawingContext.shadowBlur = 12;
      drawingContext.shadowColor = 'rgba(0,0,0,0.25)';
    } else {
      stroke(52, 152, 219);
      strokeWeight(2);
      fill(255);
    }

    rect(this.x, this.y, this.w, this.h, 8);

    // 文字內容繪製
    noStroke();
    fill(44, 62, 80);
    textSize(min(this.w * 0.09, 13));
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(this.text, this.x + this.w / 2, this.y + this.h / 2);
    pop();
  }

  isMouseOver() {
    return mouseX > this.x && mouseX < this.x + this.w &&
           mouseY > this.y && mouseY < this.y + this.h;
  }

  resetPosition() {
    this.x = this.homeX;
    this.y = this.homeY;
    if (this.targetBox) {
      this.targetBox.attachedOption = null;
      this.targetBox = null;
    }
  }
}

// ==========================================
// 彩帶特效系統 (80分以上觸發)
// ==========================================

function createConfetti() {
  confettiParticles = [];
  let colors = ['#f1c40f', '#e67e22', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71'];
  
  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: random(width),
      y: random(-height, 0),
      size: random(6, 14),
      color: random(colors),
      speedY: random(2, 6),
      speedX: random(-1.5, 1.5),
      rotation: random(TWO_PI),
      rotSpeed: random(-0.08, 0.08)
    });
  }
}

function updateAndDrawConfetti() {
  push();
  noStroke();
  for (let p of confettiParticles) {
    fill(p.color);
    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    rect(0, 0, p.size, p.size / 2);
    pop();

    // 移動與旋轉
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotSpeed;

    // 掉出畫面底部時循環回到上方
    if (p.y > height) {
      p.y = -20;
      p.x = random(width);
    }
  }
  pop();
}