const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");

// Elemento de nivel en HUD
let nivelEl = document.createElement("p");
nivelEl.id = "nivel";
nivelEl.textContent = "Nivel: 1";
nivelEl.style.margin = "5px 0 0 0";
nivelEl.style.color = "#ddd";
document.getElementById("hud").appendChild(nivelEl);

const bgm = document.getElementById("bgm");
const sfx = document.getElementById("sfx");

let score = 0;
let nivel = 1;
let atrapadosEnNivel = 0;
let metaNivel = 10;
let audioIniciado = false;
let velocidadExtra = 0;
let opacidadExtra = 1;
let tiempoDesaparicion = 0;

let juegoTerminado = false; // ✅ Nuevo: control final del juego

// Ajustar tamaño del canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// --- imágenes de los personajes ---
const personajesSrc = [
  "assets/leo.png",
  "assets/nando.png",
  "assets/moribunda.png",
  "assets/finado.png",
  "assets/teodora.png",
  "assets/xochitl.png"
];
const imgs = personajesSrc.map(src => {
  const i = new Image();
  i.src = src;
  return i;
});

// --- clase Niño ---
class Niño {
  constructor(img) {
    this.img = img;
    this.size = 80;
    this.x = Math.random() * (canvas.width - this.size);
    this.y = Math.random() * (canvas.height - this.size);
    const speed = 1 + Math.random() * (3 + velocidadExtra);
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = opacidadExtra;
    this.life = tiempoDesaparicion > 0 ? Date.now() + tiempoDesaparicion : null;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x <= 0 || this.x + this.size >= canvas.width) this.vx *= -1;
    if (this.y <= 0 || this.y + this.size >= canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }

  isClicked(mx, my) {
    return mx >= this.x && mx <= this.x + this.size && my >= this.y && my <= this.y + this.size;
  }

  expired() {
    return this.life && Date.now() > this.life;
  }
}

const personajes = [];
const maxPersonajes = 25;

// --- generar niños ---
function spawn() {
  if (juegoTerminado) return; // ✅ Ya no generar si el juego terminó
  if (personajes.length < maxPersonajes) {
    const img = imgs[Math.floor(Math.random() * imgs.length)];
    personajes.push(new Niño(img));
  }
}
setInterval(spawn, 700);

// --- evento clic: atrapar ---
canvas.addEventListener("click", (e) => {
  if (!audioIniciado) {
    bgm.volume = 0.4;
    bgm.play().catch(() => {});
    audioIniciado = true;
  }

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (let i = personajes.length - 1; i >= 0; i--) {
    if (personajes[i].isClicked(mx, my)) {
      sfx.currentTime = 0;
      sfx.play().catch(() => {});
      personajes.splice(i, 1);
      score++;
      atrapadosEnNivel++;
      scoreEl.textContent = score;

      if (atrapadosEnNivel >= metaNivel) subirNivel();
      break;
    }
  }
});

// --- función para subir de nivel ---
function subirNivel() {
  nivel++;
  atrapadosEnNivel = 0;
  metaNivel += 5;
  velocidadExtra += 1;
  nivelEl.textContent = `Nivel: ${nivel}`;

  if (nivel === 2) {
    mostrarMensaje("Nivel 2: ¡Los niños corren más rápido!");
  } else if (nivel === 3) {
    opacidadExtra = 0.5;
    mostrarMensaje("Nivel 3: ¡Algunos se vuelven fantasmas!");
  } else if (nivel === 4) {
    opacidadExtra = 0.8;
    tiempoDesaparicion = 1500;
    mostrarMensaje("Nivel 4: ¡Desaparecen rápido!");
  } else if (nivel >= 5) {
    terminarJuego();
    return;
  } else {
    mostrarMensaje(`¡Nivel ${nivel}!`);
  }

  document.body.style.background = `rgba(0, 0, 0, ${0.8 + (nivel * 0.02)})`;
}

// --- mostrar mensaje temporal ---
function mostrarMensaje(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  div.style.position = "absolute";
  div.style.top = "50%";
  div.style.left = "50%";
  div.style.transform = "translate(-50%, -50%)";
  div.style.fontSize = "2rem";
  div.style.color = "white";
  div.style.background = "rgba(0,0,0,0.6)";
  div.style.padding = "20px";
  div.style.borderRadius = "10px";
  div.style.textAlign = "center";
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1500);
}

// --- terminar juego ---
function terminarJuego() {
  juegoTerminado = true; // ✅ ya no se generarán más niños
  personajes.length = 0; // eliminar los que están en pantalla

  const fin = document.createElement("div");
  fin.innerHTML = `
    <h1>¡Has atrapado a todos los niños!</h1>
    <p>Puntuación final: ${score}</p>
    <button id="reiniciar">Jugar de nuevo</button>
  `;
  Object.assign(fin.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#fff",
    background: "rgba(0,0,0,0.8)",
    padding: "20px 30px",
    textAlign: "center",
    borderRadius: "10px"
  });
  document.body.appendChild(fin);
  document.getElementById("reiniciar").onclick = () => location.reload();
}

// --- bucle del juego ---
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = personajes.length - 1; i >= 0; i--) {
    personajes[i].update();
    personajes[i].draw();
    if (personajes[i].expired()) personajes.splice(i, 1);
  }
  requestAnimationFrame(loop);
}
loop();
