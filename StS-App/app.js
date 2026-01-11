let hpMax = 0;
let hpNow = 0;

let blockNow = 0;
let history = []; // Undo: speichert alte Zustände

const bossSelect = document.getElementById("bossSelect");
const bossImg = document.getElementById("bossImg");

// Screens
const screenStart = document.getElementById("screenStart");
const screenFight = document.getElementById("screenFight");
const screenWin = document.getElementById("screenWin");

// UI Elemente Fight
const elHpNow = document.getElementById("hpNow");
const elHpMax = document.getElementById("hpMax");
const elFill = document.getElementById("hpFill");
const elBlockNow = document.getElementById("blockNow");

// Start UI
const hpInput = document.getElementById("hpInput");

// Flash overlay
const hitFlash = document.getElementById("hitFlash");

// Damit wir beim Tod nicht mehrfach “vibrieren”
let winEffectDone = false;

function showScreen(name) {
  screenStart.classList.add("hidden");
  screenFight.classList.add("hidden");
  screenWin.classList.add("hidden");

  if (name === "start") screenStart.classList.remove("hidden");
  if (name === "fight") screenFight.classList.remove("hidden");
  if (name === "win") screenWin.classList.remove("hidden");
}

function render() {
  elHpNow.textContent = hpNow;
  elHpMax.textContent = hpMax;
  elBlockNow.textContent = blockNow;

  const pct = hpMax > 0 ? (hpNow / hpMax) * 100 : 0;
  elFill.style.width = Math.max(0, Math.min(100, pct)) + "%";
}

function saveState() {
  history.push({ hpNow, blockNow });
}

/* --------- Effekte --------- */

function shakeHpBar() {
  // Wackeln: class kurz hinzufügen, dann wieder entfernen
  elFill.classList.remove("shake");
  // Trick: Reflow, damit Animation erneut startet
  void elFill.offsetWidth;
  elFill.classList.add("shake");
}

function flashRed() {
  hitFlash.classList.add("on");
  setTimeout(() => hitFlash.classList.remove("on"), 120);
}

function flashHpGreen() {
  // kurz grün, dann wieder rot
  const old = elFill.style.background;
  elFill.style.background = "#22c55e";
  setTimeout(() => {
    elFill.style.background = old || ""; // zurück zu CSS-Default (rot)
  }, 180);
}

function vibrate(pattern) {
  // iPhone/Safari: oft NICHT unterstützt -> dann passiert einfach nichts
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch (_) {}
}

function winVibrate() {
  // “länger” – Pattern (wenn unterstützt)
  vibrate([180, 80, 180, 80, 400]);
}

/* --------- Game Logic --------- */

function checkWin() {
  if (hpNow <= 0) {
    hpNow = 0;
    render();
    showScreen("win");

    if (!winEffectDone) {
      winEffectDone = true;
      winVibrate();
    }
  }
}

const BOSSES = {
  waechter:    { img: "images/Wächter.jpg" },
  hexageist:   { img: "images/Hexageist.jpg" },
  schleimboss: { img: "images/Schleimboss.jpg" },
  champ:       { img: "images/Champ.jpg" },
  sammler:     { img: "images/Sammler.jpg" },
  bronze:      { img: "images/Bronze-Automaton.jpg" },
  deka:        { img: "images/Deka&Dunu.jpg" },
  erweckter:   { img: "images/Erweckter.jpg" },
  zeitschnecke:{ img: "images/Zeitschnecke.jpg" },
};


function startFight() {
  const value = Number(hpInput.value);

  if (!Number.isFinite(value) || value <= 0) {
    alert("Bitte gib eine Zahl größer als 0 ein 🙂");
    return;
  }

  hpMax = Math.floor(value);
  hpNow = hpMax;
  blockNow = 0;
  history = [];
  winEffectDone = false;

  // 🔽 SCHRITT 5: Boss-Bild setzen
  const bossKey = bossSelect.value;
  const boss = BOSSES[bossKey];
  bossImg.src = boss ? boss.img : "";

  render();
  showScreen("fight");
}

function applyDamage(amount) {
  if (amount <= 0) return;
  saveState();

  // Schaden geht zuerst in den Block
  const blocked = Math.min(blockNow, amount);
  blockNow -= blocked;

  const remaining = amount - blocked;

  if (remaining > 0) {
    // NUR wenn HP Schaden bekommt → Effekte
    shakeHpBar();
    flashRed();
    hpNow = Math.max(0, hpNow - remaining);
  }

  render();
  checkWin();
}

function heal(amount) {
  if (amount <= 0) return;
  saveState();

  flashHpGreen();

  // Pulse-Animation neu starten
  elFill.classList.remove("healPulse");
  void elFill.offsetWidth; // Reflow
  elFill.classList.add("healPulse");

  hpNow = Math.min(hpMax, hpNow + amount);
  render();
}

function addBlock(amount) {
  if (amount <= 0) return;
  saveState();
  blockNow += amount;
  render();
}

function resetBlock() {
  saveState();
  blockNow = 0;
  render();
}

function undo() {
  if (history.length === 0) return;
  const prev = history.pop();
  hpNow = prev.hpNow;
  blockNow = prev.blockNow;

  // Wenn wir aus Versehen im Win-Screen sind, wieder zurück in Fight
  if (hpNow > 0) {
    showScreen("fight");
    winEffectDone = false; // falls man “falsch tot” war
  }

  render();
}

/* --------- Event Listeners --------- */

document.getElementById("startFight").addEventListener("click", startFight);

// Enter im Input startet auch
hpInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startFight();
});

// Damage Buttons
document.querySelectorAll("button[data-dmg]").forEach((btn) => {
  btn.addEventListener("click", () => applyDamage(Number(btn.dataset.dmg)));
});

// Heal Buttons
document.querySelectorAll("button[data-heal]").forEach((btn) => {
  btn.addEventListener("click", () => heal(Number(btn.dataset.heal)));
});

// Block Buttons
document.getElementById("blockPlus1").addEventListener("click", () => addBlock(1));
document.getElementById("blockReset").addEventListener("click", resetBlock);

// Win Screen Buttons
document.getElementById("winUndo").addEventListener("click", undo);
document.getElementById("nextBoss").addEventListener("click", () => {
  hpInput.value = "";
  showScreen("start");
  hpInput.focus();
});

// Startansicht am Anfang
showScreen("start");
