// ═══════════════════════════════════════════════════════════
// Jogo para minha chatinha ❤️ — script.js
// ═══════════════════════════════════════════════════════════

const finalMessages = [
  "Então, amor! Você chegou até aqui.",
  "Passou pelos corações, pelas estrelas, pelo quiz, segurou aquele botão irritante — e ainda ficou tentando uma senha que, sinceramente, nunca existiu.",
  "Eu fiz tudo isso porque queria ver você persistir por algo completamente sem sentido só porque era meu.",
  "E você foi.",
  "amor, você é a parte do meu dia que eu espero sem perceber. A pessoa que eu quero contar quando algo ruim acontece, e quando algo bom também.",
  "Não tem jeito mais bonito de dizer isso. Eu só te amo muito. ❤️",
  "em geografia, você é meu mundo.",
  "em biologia, você é meu coração.",
  "em química, você é meu oxigênio.",
  "em artes, você é a obra que eu passaria horas admirando.",
  "em música, você é a canção que eu nunca enjoo de ouvir.",
  "e na vida, você é uma das poucas pessoas que me fazem acreditar que algumas coincidências acontecem por algum motivo.",
  "e por fim, eu gostaria de dizer que eu te amo muito!! ❤️‍🔥"
];

let score = 0, timeLeft = 30, phase = 1;
let timerInterval = null, bgHeartInterval = null, holdInterval = null;
let phaseEnded = false, passwordAttempts = 0;
let holdProgress = 0, patienceTrolled = false, finalIndex = 0;

let canvas, ctx, canvasItems = [], animFrame = null;
let headerHeight = 0;
let bgImage = null;

(function preloadBg() {
  bgImage = new Image();
  bgImage.src = "foto.jpg";
})();

(function drawStars() {
  const sc = document.getElementById("starsCanvas");
  const sctx = sc.getContext("2d");
  sc.width = window.innerWidth;
  sc.height = window.innerHeight;

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * sc.width;
    const y = Math.random() * sc.height;
    const r = Math.random() * 1.2 + 0.3;
    const op = Math.random() * 0.55 + 0.15;

    sctx.beginPath();
    sctx.arc(x, y, r, 0, Math.PI * 2);
    sctx.fillStyle = `rgba(255,255,255,${op})`;
    sctx.fill();
  }
})();

function startBgHearts() {
  if (bgHeartInterval) return;
  bgHeartInterval = setInterval(() => spawnFloatHeart("floating-heart"), 1800);
}

function spawnFloatHeart(cls, size) {
  const h = document.createElement("div");
  h.className = cls;
  h.textContent = "❤️";
  h.style.left = Math.random() * 95 + "vw";
  h.style.fontSize = (size || Math.random() * 14 + 12) + "px";
  h.style.animationDuration = (Math.random() * 4 + 6) + "s";
  document.body.appendChild(h);
  h.addEventListener("animationend", () => h.remove());
}

startBgHearts();

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function startGame() {
  clearEverything();
  score = 0;
  timeLeft = 30;
  phase = 1;
  phaseEnded = false;
  passwordAttempts = 0;
  holdProgress = 0;
  patienceTrolled = false;
  finalIndex = 0;
  startPhase();
}

const PHASES = {
  1: {
    label: "Fase 1 de 2",
    title: "Pega os corações",
    tip: "Toque nos corações. Bomba tira pontos. Parece simples.",
    duration: 25,
    goal: 180,
    items: [
      { emoji: "❤️", pts: 16, size: 44, speed: () => rand(320, 500) },
      { emoji: "💖", pts: 22, size: 48, speed: () => rand(360, 540) },
      { emoji: "💘", pts: 28, size: 40, speed: () => rand(400, 580) },
      { emoji: "💣", pts: -40, size: 46, speed: () => rand(420, 620) }
    ],
    weights: [30, 22, 16, 32],
    spawnMs: 320
  },

  2: {
    label: "Fase 2 de 2",
    title: "Agora são estrelas",
    tip: "Estrelas valem mais. Mas cuidado: uma delas é armadilha.",
    duration: 25,
    goal: 150,
    items: [
      { emoji: "⭐", pts: 15, size: 44, speed: () => rand(400, 600) },
      { emoji: "✨", pts: 20, size: 40, speed: () => rand(440, 660) },
      { emoji: "🌟", pts: 25, size: 48, speed: () => rand(380, 560) },
      { emoji: "🌑", pts: -30, size: 44, speed: () => rand(400, 600), trap: true },
      { emoji: "💣", pts: -45, size: 46, speed: () => rand(500, 720) }
    ],
    weights: [24, 19, 14, 18, 25],
    spawnMs: 240
  }
};

function rand(a, b) {
  return Math.random() * (b - a) + a;
}

function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;

  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }

  return items[items.length - 1];
}

function startPhase() {
  const cfg = PHASES[phase];

  score = 0;
  timeLeft = cfg.duration;
  phaseEnded = false;
  canvasItems = [];

  document.getElementById("phaseLabel").textContent = cfg.label;
  document.getElementById("phaseTitle").textContent = cfg.title;
  document.getElementById("tipText").textContent = cfg.tip;
  document.getElementById("score").textContent = 0;
  document.getElementById("goalDisplay").textContent = cfg.goal;
  document.getElementById("timer").textContent = timeLeft;
  document.getElementById("progress").style.width = "0%";
  document.getElementById("progress").classList.remove("near-goal");
  document.getElementById("progressPct").textContent = "0%";

  showScreen("game");

  requestAnimationFrame(() => {
    setupCanvas();
    timerInterval = setInterval(tick, 1000);
    spawnInterval = setInterval(spawnItem, cfg.spawnMs);
    lastTs = null;
    animFrame = requestAnimationFrame(gameLoop);
  });
}

let spawnInterval = null;

function setupCanvas() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  const header = document.querySelector(".game-header");
  headerHeight = header ? header.offsetHeight : 120;

  const playH = window.innerHeight - headerHeight;

  canvas.width = window.innerWidth;
  canvas.height = playH;
  canvas.style.top = headerHeight + "px";
  canvas.style.height = playH + "px";

  canvas.removeEventListener("pointerdown", onCanvasTap);
  canvas.addEventListener("pointerdown", onCanvasTap, { passive: false });
}

function spawnItem() {
  if (phaseEnded || !canvas) return;

  const cfg = PHASES[phase];
  const item = weightedPick(cfg.items, getCurrentWeights(cfg));
  const size = item.size;
  const margin = size;

  canvasItems.push({
    emoji: item.emoji,
    pts: item.pts,
    size: size,
    x: margin + Math.random() * (canvas.width - margin * 2),
    y: -size,
    vy: item.speed(),
    alive: true,
    hit: false,
    scale: 1,
    alpha: 1
  });
}

// Conforme o tempo da fase passa, itens ruins (bomba/armadilha) ficam mais frequentes.
// Aumenta o peso deles em até +60% perto do fim da fase, tirando proporcionalmente dos bons.
function getCurrentWeights(cfg) {
  const elapsed = 1 - Math.max(0, timeLeft) / cfg.duration;
  const boost = 1 + elapsed * 0.6;

  const adjusted = cfg.items.map((item, i) => {
    const isBad = item.pts < 0;
    return isBad ? cfg.weights[i] * boost : cfg.weights[i];
  });

  return adjusted;
}

let lastTs = null;

function gameLoop(ts) {
  if (!canvas || !ctx) return;

  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;

  const h = canvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Foto de fundo com overlay escuro
  if (bgImage && bgImage.complete) {
    const iw = bgImage.naturalWidth, ih = bgImage.naturalHeight;
    const scale = Math.max(canvas.width / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = (canvas.width - dw) / 2, dy = (h - dh) / 2;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(bgImage, dx, dy, dw, dh);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#07000f";
    ctx.fillRect(0, 0, canvas.width, h);
    ctx.restore();
  }

  for (let i = canvasItems.length - 1; i >= 0; i--) {
    const it = canvasItems[i];

    if (it.hit) {
      it.scale += dt * 6;
      it.alpha -= dt * 5;

      if (it.alpha <= 0) {
        canvasItems.splice(i, 1);
        continue;
      }
    } else {
      it.y += it.vy * dt;

      if (it.y > h + it.size + 20) {
        canvasItems.splice(i, 1);
        continue;
      }
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, it.alpha);
    ctx.font = `${it.size * it.scale}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(it.emoji, it.x, it.y);
    ctx.restore();
  }

  if (!phaseEnded) {
    animFrame = requestAnimationFrame(gameLoop);
  }
}

function onCanvasTap(e) {
  e.preventDefault();

  if (phaseEnded) return;

  const rect = canvas.getBoundingClientRect();
  const rawTouches = e.changedTouches ? Array.from(e.changedTouches) : [e];

  for (let t = 0; t < rawTouches.length; t++) {
    const touch = rawTouches[t];
    const tx = (touch.clientX !== undefined ? touch.clientX : touch.x) - rect.left;
    const ty = (touch.clientY !== undefined ? touch.clientY : touch.y) - rect.top;

    for (let i = canvasItems.length - 1; i >= 0; i--) {
      const it = canvasItems[i];

      if (it.hit) continue;

      const dx = tx - it.x;
      const dy = ty - it.y;
      const hitR = it.size * 0.75;

      if (dx * dx + dy * dy < hitR * hitR) {
        it.hit = true;
        score = Math.max(0, score + it.pts);

        document.getElementById("score").textContent = score;

        if (navigator.vibrate) {
          navigator.vibrate(it.pts > 0 ? 18 : [40, 30, 40]);
        }

        const cfg = PHASES[phase];
        const pct = Math.min((score / cfg.goal) * 100, 100);

        const progressEl = document.getElementById("progress");
        progressEl.style.width = pct + "%";
        progressEl.classList.toggle("near-goal", pct >= 80 && pct < 100);
        document.getElementById("progressPct").textContent = Math.floor(pct) + "%";

        if (it.pts > 0) spawnFloatHeart("floating-heart", 22);
        if (score >= cfg.goal) endPhase();

        break;
      }
    }
  }
}

function tick() {
  timeLeft--;
  document.getElementById("timer").textContent = timeLeft;

  if (timeLeft <= 0) endPhase();
}

const retryMessages = [
  "Quase, mas não foi não kkk. Vamos de novo.",
  "Eitaa, faltou pouquinho. De novo!",
  "Não foi dessa vez amor, tenta mais uma.",
  "Quase quase. Bora de novo, eu creio em você.",
  "Hmm, não rolou. Mas você consegue, tenta outra vez."
];

function endPhase() {
  if (phaseEnded) return;

  phaseEnded = true;

  clearInterval(timerInterval);
  timerInterval = null;

  clearInterval(spawnInterval);
  spawnInterval = null;

  cancelAnimationFrame(animFrame);
  animFrame = null;
  lastTs = null;

  canvas && canvas.removeEventListener("pointerdown", onCanvasTap);
  canvasItems = [];

  const cfg = PHASES[phase];
  const metaAtingida = score >= cfg.goal;

  const fade = document.getElementById("phaseFade");
  if (fade) fade.classList.add("show");

  setTimeout(() => {
    if (fade) fade.classList.remove("show");

    if (!metaAtingida) {
      // Tempo acabou sem bater a meta: zoeira + repete a MESMA fase do início.
      const msg = retryMessages[Math.floor(Math.random() * retryMessages.length)];

      showMessage(
        "Tempo esgotado ⏳",
        msg,
        "Tentar de novo",
        () => startPhase()
      );
      return;
    }

    if (phase === 1) {
      showMessage(
        "Ok, passou.",
        "Confesso que esperava menos habilidade. Vou ter que dificultar.",
        "Continuar para fase 2",
        () => {
          phase = 2;
          startPhase();
        }
      );
    } else {
      showMessage(
        "Impressionante.",
        "Tá bom amor, nao vou subestimar voce mais. Agora vamos ver se você sabe sobre mim.",
        "Começar quiz",
        startQuiz
      );
    }
  }, 550);
}

function showMessage(title, text, btnText, action) {
  showScreen("message");

  const oldQuiz = document.getElementById("quizOptions");
  if (oldQuiz) oldQuiz.remove();

  document.getElementById("messageTitle").textContent = title;
  document.getElementById("messageText").textContent = text;

  const tag = document.getElementById("messageTag");
  if (tag) tag.textContent = "mensagem";

  const btn = document.getElementById("messageBtn");
  btn.style.display = "block";
  btn.textContent = btnText;
  btn.onclick = action;
}

// ── QUIZ SOBRE MIM ────────────────────────────────────────

// Banco de perguntas. As marcadas como required sempre aparecem.
// As demais completam até QUIZ_MAX perguntas no total.
const quizBank = [
  {
    question: "Qual é a data do meu aniversário?",
    options: ["04/07", "04/05", "25/07", "25/08"],
    answer: 0,
    correctMsg: "aí sim, essa você não podia esquecer mesmo",
    wrongMsg: "meu deus amor... justo meu aniversário?",
    required: true
  },
  {
    question: "Qual parte do seu corpo que eu gosto mais?",
    options: ["Bunda", "PPK", "Peito kkk", "Seu cabelo"],
    answer: 1,
    correctMsg: "muita saudade dela amor",
    wrongMsg: "poxa amor :(",
    required: true
  },
  {
    question: "O que eu gosto mais de fazer?",
    options: ["Jogar no celular", "Jogar bola", "Estudar", "Assistir jogo"],
    answer: 1,
    correctMsg: "boa amor, eu sabia que tu lembrava",
    wrongMsg: "meu deus amor… decepcionado de verdade",
    required: true
  },
  {
    question: "Qual joguinho eu mais gosto de ganhar em cima de você?",
    options: ["Dominó", "Dama", "Stop", "Joguinho das palavras"],
    answer: 0,
    correctMsg: "boa amor, eu sabia que tu lembrava",
    wrongMsg: "poxa amor… vou fingir que não vi essa resposta",
    required: true
  },
  {
    question: "Meu time favorito?",
    options: ["Flamengo", "Corinthians", "Palmeiras", "São Paulo"],
    answer: 0,
    correctMsg: "isso aí, Mengão até debaixo d'água",
    wrongMsg: "para tudo. Como assim você não sabe meu time?"
  },
  {
    question: "Minha comida favorita?",
    options: ["Feijoada", "Estrogonofe", "Churrasco", "Macarrão"],
    answer: 1,
    correctMsg: "issoo, estrogonofe nunca falha comigo",
    wrongMsg: "poxa amor, era estrogonofe :("
  },
  {
    question: "Minha série favorita?",
    options: ["Breaking Bad", "Stranger Things", "La Casa de Papel", "Friends"],
    answer: 1,
    correctMsg: "Stranger Things mesmo, você sabe",
    wrongMsg: "errou a série amor, era Stranger Things"
  }
];

const QUIZ_MAX = 7;

// Garante que todas as perguntas marcadas como required sempre entrem,
// completa o restante até QUIZ_MAX, e embaralha a ordem final.
function pickRandomQuiz(bank, max) {
  const required = bank.filter(q => q.required);
  const optional = bank.filter(q => !q.required);

  const shuffledOptional = [...optional];
  for (let i = shuffledOptional.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptional[i], shuffledOptional[j]] = [shuffledOptional[j], shuffledOptional[i]];
  }

  const remainingSlots = Math.max(0, max - required.length);
  const selected = [...required, ...shuffledOptional.slice(0, remainingSlots)];

  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

function startQuiz() {
  quizQuestions = pickRandomQuiz(quizBank, QUIZ_MAX);
  quizIndex = 0;
  quizScore = 0;
  showQuizQuestion();
}

function showQuizQuestion() {
  const q = quizQuestions[quizIndex];

  showScreen("message");

  const tag = document.getElementById("messageTag");
  if (tag) tag.textContent = `quiz ${quizIndex + 1}/${quizQuestions.length}`;

  document.getElementById("messageTitle").textContent = q.question;
  document.getElementById("messageText").textContent = "Escolhe com cuidado, amor.";

  const btn = document.getElementById("messageBtn");
  btn.style.display = "none";

  const oldBox = document.getElementById("quizOptions");
  if (oldBox) oldBox.remove();

  const box = document.createElement("div");
  box.id = "quizOptions";

  q.options.forEach((option, i) => {
    const optionBtn = document.createElement("button");
    optionBtn.className = "btn-primary";
    optionBtn.textContent = option;
    optionBtn.style.marginTop = "12px";
    optionBtn.onclick = () => answerQuiz(i);
    box.appendChild(optionBtn);
  });

  document.querySelector("#message .card").appendChild(box);
}

function answerQuiz(choice) {
  const q = quizQuestions[quizIndex];
  const acertou = choice === q.answer;

  if (acertou) {
    quizScore++;
    document.getElementById("messageText").textContent = q.correctMsg;
  } else {
    document.getElementById("messageText").textContent = q.wrongMsg;
  }

  const box = document.getElementById("quizOptions");
  if (box) box.remove();

  const btn = document.getElementById("messageBtn");
  btn.style.display = "block";
  btn.textContent = quizIndex + 1 < quizQuestions.length ? "Próxima" : "Continuar";
  btn.onclick = nextQuizQuestion;
}

function nextQuizQuestion() {
  quizIndex++;

  if (quizIndex < quizQuestions.length) {
    showQuizQuestion();
  } else {
    showMessage(
      "chega de coisas sobre mim.",
      `Você acertou ${quizScore} de ${quizQuestions.length}. Vou guardar esse resultado, viu. Agora uma pergunta importante... 👀`,
      "Continuar",
      showChoiceScreen
    );
  }
}

// ── FASE DE ESCOLHA ──────────────────────────────────────

let playerChoiceAttempts = 0;

function showChoiceScreen() {
  playerChoiceAttempts = 0;
  showScreen("choice");
  document.getElementById("choiceSubtitle").textContent = "pensa bem antes de responder 😏";

  const martiPhoto = document.querySelector("#choiceMarti .choice-photo");
  const martiOption = document.getElementById("choiceMarti");
  const ruanName = document.querySelector("#choiceRuan .choice-name");

  martiPhoto.style.opacity = "1";
  martiPhoto.style.transform = "scale(1)";
  martiPhoto.classList.remove("shake", "vanish");
  martiOption.style.pointerEvents = "auto";
  martiOption.style.opacity = "1";

  ruanName.classList.remove("glow1", "glow2", "glow3");
}

function choosePlayer() {
  playerChoiceAttempts++;
  const martiPhoto = document.querySelector("#choiceMarti .choice-photo");
  const subtitle   = document.getElementById("choiceSubtitle");
  const martiOption = document.getElementById("choiceMarti");
  const ruanName   = document.querySelector("#choiceRuan .choice-name");

  // vibrar no celular
  if (navigator.vibrate) navigator.vibrate(120);

  // Nome do Ruan brilha mais a cada tentativa
  ruanName.classList.remove("glow1","glow2","glow3");
  void ruanName.offsetWidth;
  if (playerChoiceAttempts === 1) ruanName.classList.add("glow1");
  else if (playerChoiceAttempts === 2) ruanName.classList.add("glow2");
  else ruanName.classList.add("glow3");

  if (playerChoiceAttempts === 1) {
    martiPhoto.classList.remove("shake");
    void martiPhoto.offsetWidth;
    martiPhoto.classList.add("shake");
    subtitle.textContent = "ei ei ei... tem certeza? 😒";
  } else if (playerChoiceAttempts === 2) {
    martiPhoto.classList.remove("shake");
    void martiPhoto.offsetWidth;
    martiPhoto.classList.add("shake");
    subtitle.textContent = "KKKK tá insistindo nessa? 😂";
  } else {
    // Traição detectada!
    martiPhoto.classList.remove("shake");
    void martiPhoto.offsetWidth;
    martiPhoto.classList.add("vanish");
    martiOption.style.pointerEvents = "none";
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
    setTimeout(() => {
      showTraicao();
    }, 400);
  }
}

function showTraicao() {
  showScreen("traicao");
  document.getElementById("traicaoSub").textContent = "tentou o Martinelli 3 vezes... sério mesmo? 😂🚨";
  setTimeout(() => {
    showScreen("choice");
    const martiOption = document.getElementById("choiceMarti");
    const martiPhoto  = document.querySelector("#choiceMarti .choice-photo");
    martiPhoto.classList.remove("shake","vanish");
    martiOption.style.opacity = "0.3";
    martiOption.style.pointerEvents = "none";
    document.getElementById("choiceSubtitle").textContent = "só resta uma opção disponível agora 😂";
  }, 2800);
}

function chooseMe() {
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  showMessage(
    "sabia que ia escolher certo 😎❤️",
    "Eu sabia que no final era eu. Sempre fui eu. Agora próxima fase!",
    "Continuar",
    startMemory
  );
}

// ── FASE MEMORY ──────────────────────────────────────────

const MEMORY_EMOJIS = ["❤️","💣","⭐","💀","🔥","😈"];
let memoryTimer = null;
let memoryTimeLeft = 45;
let memoryErrors = 0;
let memFlipped = [];
let memMatched = 0;
let memLocked = false;

function startMemory() {
  showScreen("memory");
  memoryErrors = 0;
  memMatched = 0;
  memFlipped = [];
  memLocked = false;
  memoryTimeLeft = 45;

  document.getElementById("memoryTimer").textContent = memoryTimeLeft;
  document.getElementById("memoryErrors").textContent = 0;

  // Montar baralho com pares embaralhados
  const deck = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
    .sort(() => Math.random() - 0.5);

  const grid = document.getElementById("memoryGrid");
  grid.innerHTML = "";

  deck.forEach((emoji, idx) => {
    const card = document.createElement("div");
    card.className = "mem-card";
    card.dataset.emoji = emoji;
    card.dataset.idx = idx;
    card.innerHTML = `<span class="mem-front">${emoji}</span><span class="mem-back">?</span>`;
    card.addEventListener("click", () => onMemCard(card));
    grid.appendChild(card);
  });

  clearInterval(memoryTimer);
  memoryTimer = setInterval(() => {
    memoryTimeLeft--;
    document.getElementById("memoryTimer").textContent = memoryTimeLeft;
    if (memoryTimeLeft <= 10) {
      document.getElementById("memoryTimer").style.color = "#ff5ca0";
      if (navigator.vibrate) navigator.vibrate(60);
    }
    if (memoryTimeLeft <= 0) {
      clearInterval(memoryTimer);
      // Tempo esgotado: trollar e reiniciar
      if (navigator.vibrate) navigator.vibrate([300,100,300]);
      showMessage(
        "kkkkkk tempo esgotou 💀",
        "foi mal amor, o tempo acabou. de novo!",
        "Tentar de novo",
        startMemory
      );
    }
  }, 1000);
}

function onMemCard(card) {
  if (memLocked) return;
  if (card.classList.contains("flipped")) return;
  if (card.classList.contains("matched")) return;

  card.classList.add("flipped");
  if (navigator.vibrate) navigator.vibrate(30);
  memFlipped.push(card);

  if (memFlipped.length === 2) {
    memLocked = true;
    const [a, b] = memFlipped;

    if (a.dataset.emoji === b.dataset.emoji) {
      // Par certo
      setTimeout(() => {
        a.classList.add("matched");
        b.classList.add("matched");
        if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
        memFlipped = [];
        memLocked = false;
        memMatched++;
        if (memMatched === MEMORY_EMOJIS.length) {
          clearInterval(memoryTimer);
          setTimeout(() => {
            showMessage(
              "ok, achei que ia demorar mais 😒",
              `terminou com ${memoryErrors} erro(s). podia ter errado mais kkk`,
              "Continuar",
              startPatienceTest
            );
          }, 600);
        }
      }, 400);
    } else {
      // Par errado
      memoryErrors++;
      document.getElementById("memoryErrors").textContent = memoryErrors;
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => {
        a.classList.add("wrong");
        b.classList.add("wrong");
        setTimeout(() => {
          a.classList.remove("flipped", "wrong");
          b.classList.remove("flipped", "wrong");
          memFlipped = [];
          memLocked = false;
          // A cada 3 erros embaralha as cartas não encontradas
          if (memoryErrors % 3 === 0) {
            shuffleUnmatched();
          }
        }, 700);
      }, 300);
    }
  }
}

function shuffleUnmatched() {
  const grid = document.getElementById("memoryGrid");
  const cards = Array.from(grid.querySelectorAll(".mem-card:not(.matched)"));
  const emojis = cards.map(c => c.dataset.emoji).sort(() => Math.random() - 0.5);
  cards.forEach((card, i) => {
    card.dataset.emoji = emojis[i];
    card.querySelector(".mem-front").textContent = emojis[i];
  });
}

// ── PERGUNTA DO ANEL (botão "Não" fugindo até clicar em "Sim") ──

const ringTrollMessages = [
  "Ih, fugiu? Vai ter que clicar em mim mesmo 😏",
  "Kkkkk não tem como escapar dessa não, amor",
  "Só clicando no Sim que isso aqui acaba 😈"
];

function startPatienceTest() {
  showScreen("ringQuestion");

  const txt = document.getElementById("ringQuestionText");
  txt.textContent = "Pensa bem antes de responder, hein.";

  setupDodgingButton({
    btnId: "btnRingNao",
    onDodge: (count) => {
      if (count > 0 && count % 2 === 0 && navigator.vibrate) {
        navigator.vibrate(25);
      }
      const idx = Math.min(count, ringTrollMessages.length) - 1;
      if (idx >= 0) txt.textContent = ringTrollMessages[idx];
    }
  });

  const simBtn = document.getElementById("btnRingSim");
  simBtn.onclick = () => {
    const naoBtn = document.getElementById("btnRingNao");
    if (naoBtn) naoBtn.style.display = "none";
    setTimeout(startFakeLoading, 300);
  };
}

// Reaproveitável: o botão começa estático (lado a lado com o Sim) e só passa
// a "fugir" do toque/clique/hover a partir da primeira tentativa de clique.
// Avisa um callback opcional a cada fuga (usado pra mensagens de trollagem).
function setupDodgingButton({ btnId, onDodge }) {
  const oldBtn = document.getElementById(btnId);
  const btn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(btn, oldBtn);
  btn.classList.remove("dodging");

  let dodgeCount = 0;
  let dodgingActive = false;

  function randomPos() {
    const bw = 130, bh = 50, margin = 16;
    return {
      x: margin + Math.random() * (window.innerWidth - bw - margin * 2),
      y: margin + Math.random() * (window.innerHeight - bh - margin * 2)
    };
  }

  function activateDodging() {
    if (dodgingActive) return;
    dodgingActive = true;
    btn.classList.add("dodging");
    // Primeira posição: onde o botão já estava na tela, pra não "teleportar" sem motivo.
    const rect = btn.getBoundingClientRect();
    btn.style.left = rect.left + "px";
    btn.style.top = rect.top + "px";
  }

  function dodge() {
    activateDodging();
    const p = randomPos();
    btn.style.left = p.x + "px";
    btn.style.top = p.y + "px";
    dodgeCount++;
    if (onDodge) onDodge(dodgeCount);
  }

  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dodge();
  }, { passive: false });

  btn.addEventListener("mouseenter", dodge);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dodge();
  });

  return btn;
}

function startFakeLoading() {
  showScreen("loading");

  const ring = document.getElementById("loadingRing");
  const pct = document.getElementById("loadingPercent");
  const txt = document.getElementById("loadingText");
  const CIRCUM = 201;

  // Alterar título do loading
  document.querySelector("#loading h2").textContent = "Preparando seu prêmio...";

  const steps = [
    { v: 0, msg: "Iniciando...", delay: 800 },
    { v: 7, msg: "Separando o suspense...", delay: 1300 },
    { v: 16, msg: "Organizando uma dose de caos...", delay: 1300 },
    { v: 27, msg: "Misturando provocação com carinho...", delay: 1300 },
    { v: 38, msg: "Verificando se você ainda não fechou...", delay: 1300 },
    { v: 51, msg: "Ajustando o nível de drama...", delay: 1300 },
    { v: 63, msg: "Quase chegando numa parte importante...", delay: 1300 },
    { v: 75, msg: "Agora parece que vai acabar, né?", delay: 1300 },
    { v: 87, msg: "Quase lá. Mas quase mesmo.", delay: 1300 },
    { v: 94, msg: "Preparando o prêmio...", delay: 1300 },
    { v: 99, msg: "99%. Clássico.", delay: 2400 },
    { v: 99, msg: "Ainda 99%. Não foi erro.", delay: 2400 },
    { v: 99, msg: "Eu sei.", delay: 2000 },
    { v: 99, msg: "Respira. Falta pouco de verdade.", delay: 2000 },
    { v: 100, msg: "Pronto.", delay: 1400 }
  ];

  ring.style.strokeDashoffset = CIRCUM;
  pct.textContent = "0%";
  txt.textContent = steps[0].msg;

  let i = 0;

  function next() {
    const s = steps[i];

    ring.style.strokeDashoffset = CIRCUM * (1 - s.v / 100);
    pct.textContent = s.v + "%";
    txt.textContent = s.msg;

    i++;

    if (i < steps.length) setTimeout(next, s.delay);
    else setTimeout(showPrizeScreen, 1200);
  }

  next();
}

function showPrizeScreen() {
  showMessage(
    "🎁 Seu prêmio chegou!!",
    "muitos beijinhos e carinhos e mt pau kkkk 🤣❤️",
    "Continuar",
    showPasswordScreen
  );
}

function showPasswordScreen() {
  passwordAttempts = 0;

  document.getElementById("passwordInput").value = "";
  document.getElementById("passwordText").textContent = "Talvez nem exista. Quem sabe.";

  showScreen("password");

  setTimeout(() => document.getElementById("passwordInput").focus(), 300);
}

function checkPassword() {
  const txt = document.getElementById("passwordText");
  const input = document.getElementById("passwordInput");

  if (!input.value.trim()) {
    txt.textContent = "Digita alguma coisa primeiro, amor. 🙄";
    return;
  }

  passwordAttempts++;

  if (passwordAttempts === 1) {
    txt.textContent = "Errada. Mas gostei da confiança.";
  } else if (passwordAttempts === 2) {
    txt.textContent = "Ainda não.";
  } else if (passwordAttempts === 3) {
    txt.textContent = "Última tentativa. Faz algum sentido agora?";
  } else {
    txt.textContent = "Tá bom, confesso: não existia senha. Foram " + passwordAttempts + " tentativas.";
    setTimeout(showFinal, 2200);
  }

  input.value = "";
}

document.getElementById("passwordInput").addEventListener("keydown", e => {
  if (e.key === "Enter") checkPassword();
});

function showFinal() {
  showScreen("final");

  finalIndex = 0;

  document.getElementById("storyText").textContent = "";
  document.getElementById("nextFinalBtn").classList.remove("hidden");
  document.getElementById("restartBtn").classList.add("hidden");

  nextFinalMessage();
}

function nextFinalMessage() {
  const el = document.getElementById("storyText");
  const nextBtn = document.getElementById("nextFinalBtn");

  if (finalIndex < finalMessages.length) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "fadeUp 0.5s ease both";
    el.textContent = finalMessages[finalIndex++];
  } else {
    nextBtn.classList.add("hidden");
    showQuestionScreen();
  }
}

function startFinalHearts() {
  let n = 0;

  const iv = setInterval(() => {
    spawnFloatHeart("final-heart", Math.random() * 16 + 20);
    spawnFloatHeart("final-heart", Math.random() * 10 + 14);

    if (++n > 40) clearInterval(iv);
  }, 260);
}

// ── TELA DA PERGUNTA ─────────────────────────────────────

function showQuestionScreen() {
  showScreen("question");
  setupDodgingButton({ btnId: "btnNao" });
}

function answerSim() {
  const naoBtn = document.getElementById("btnNao");
  if (naoBtn) naoBtn.style.display = "none";

  showScreen("finalAnswer");
  startFinalHearts();
}

function restartGame() {
  clearEverything();

  score = 0;
  timeLeft = 30;
  phase = 1;
  phaseEnded = false;
  passwordAttempts = 0;
  holdProgress = 0;
  patienceTrolled = false;
  finalIndex = 0;

  document.getElementById("progress").style.width = "0%";

  showScreen("home");
}

function clearEverything() {
  clearInterval(timerInterval);
  timerInterval = null;

  clearInterval(spawnInterval);
  spawnInterval = null;

  clearInterval(holdInterval);
  holdInterval = null;

  cancelAnimationFrame(animFrame);
  animFrame = null;
  lastTs = null;

  phaseEnded = true;
  canvasItems = [];

  if (canvas) canvas.removeEventListener("pointerdown", onCanvasTap);

  document.querySelectorAll(".final-heart").forEach(el => el.remove());

  const naoBtn = document.getElementById("btnNao");
  if (naoBtn) naoBtn.style.display = "none";

  const oldQuiz = document.getElementById("quizOptions");
  if (oldQuiz) oldQuiz.remove();
}
