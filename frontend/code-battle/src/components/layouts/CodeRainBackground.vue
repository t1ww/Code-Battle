<!-- frontend\code-battle\src\components\layouts\CodeRainBackground.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

/*
 Smooth interpolated Matrix-like background:
 - Pre-renders glyphs (normal + leading/glow).
 - Fixed timestep for logic; interpolation for smooth rendering.
 - Uses devicePixelRatio properly so canvas isn't blurry.
*/

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId = 0;

// sizing + layout
const cellSize = 12;
const fontScale = 1;
const rowGap = 1;
const columnGap = 10;
const sideMargin = 80;

// timing
let lastRenderTime = performance.now();
let lastUpdateTime = performance.now();
const updateIntervalMs = 90; // discrete step time
let accumulatedUpdate = 0;

// fps smoothing
let fpsSmoothed = 60;
const fpsAlpha = 0.08;

// canvas geometry
let columns = 0;
let rows = 0;

interface Drop {
  word: string[];
  pos: number;
  trail: number;
}
let drops: Drop[] = [];

const words = [
  "function",
  "if (true) { } else { }",
  "for (int i=0; i<n; i++) { }",
  "while(x < 10) { x++; }",
  "return 0;",
  "int a = 5;",
  "float b = 3.14;",
  "double c = 2.718;",
  "char ch = 'A';",
  "bool flag = true;",
  "System.out.println(x);",
  "std::cout << x << std::endl;",
  "try { } catch(...) { }",
  "new Object();",
  "delete ptr;",
  "a += 1;",
  "x == y ? a : b;",
  "switch(n) { case 1: break; default: break; }",
  "const int max = 100;",
  "virtual void foo() { }",
  "template<typename T> T add(T a, T b) { return a+b; }",
  "std::vector<int> v;",
  "this->value = 10;",
  "super();"
];

// Glyph caches
const glyphNormal = new Map<string, HTMLCanvasElement>();
const glyphLeading = new Map<string, HTMLCanvasElement>();
let glowCanvas: HTMLCanvasElement | null = null;

// bloom offscreen buffer (for additive blur pass)
let bloomCanvas: HTMLCanvasElement | null = null;
let bloomCtx: CanvasRenderingContext2D | null = null;

function buildCharSet(): Set<string> {
  const set = new Set<string>();
  for (const w of words) for (const ch of w) set.add(ch);
  return set;
}

function createGlyphCanvas(char: string, leading = false) {
  // slightly bigger padding for leading glyphs so glow doesn't get clipped
  const padding = leading ? 14 : 2;
  const glyphW = Math.ceil(cellSize * 1.3) + padding * 2;
  const glyphH = Math.ceil(cellSize * 1.4) + padding * 2;
  const g = document.createElement("canvas");
  g.width = glyphW;
  g.height = glyphH;
  const gctx = g.getContext("2d")!;
  const fontSize = Math.floor(cellSize * fontScale);
  gctx.font = `${fontSize}px monospace`;
  gctx.textAlign = "center";
  gctx.textBaseline = "middle";
  const cx = glyphW / 2;
  const cy = glyphH / 2;

  if (leading) {
    // stronger baked glow for leading glyphs
    // first draw a big soft glow (green)
    gctx.fillStyle = "#38F814";
    gctx.shadowColor = "rgba(56,248,20,0.95)";
    gctx.shadowBlur = 20; // stronger blur
    gctx.fillText(char, cx, cy);
    // then brighter core
    gctx.shadowBlur = 0;
    gctx.fillStyle = "#e7ffd7"; // brighter center
    gctx.fillText(char, cx, cy - 1);
  } else {
    // normal glyph
    gctx.fillStyle = "rgb(0,200,0)";
    gctx.fillText(char, cx, cy);
  }
  return g;
}

function buildGlyphCaches() {
  glyphNormal.clear();
  glyphLeading.clear();
  const chars = buildCharSet();
  for (const ch of chars) {
    glyphNormal.set(ch, createGlyphCanvas(ch, false));
    glyphLeading.set(ch, createGlyphCanvas(ch, true));
  }
  // ensure space exists
  if (!glyphNormal.has(" ")) glyphNormal.set(" ", createGlyphCanvas(" ", false));
  if (!glyphLeading.has(" ")) glyphLeading.set(" ", createGlyphCanvas(" ", true));
}

function createGlowOverlay(width: number, height: number) {
  glowCanvas = document.createElement("canvas");
  glowCanvas.width = width;
  glowCanvas.height = height;
  const gCtx = glowCanvas.getContext("2d")!;
  const glowHeight = gCtx.canvas.height * 0.12;
  const linearGradient = gCtx.createLinearGradient(0, gCtx.canvas.height - glowHeight, 0, gCtx.canvas.height);
  linearGradient.addColorStop(0, "rgba(0,50,0,0)");
  linearGradient.addColorStop(1, "rgba(0,255,0,0.14)");
  gCtx.fillStyle = linearGradient;
  gCtx.fillRect(0, gCtx.canvas.height - glowHeight, gCtx.canvas.width, glowHeight);
}

function createBloomBuffer(width: number, height: number, dpr: number) {
  bloomCanvas = document.createElement("canvas");
  // keep same backing resolution as main canvas
  bloomCanvas.width = width;
  bloomCanvas.height = height;
  bloomCanvas.style.width = `${Math.floor(width / dpr)}px`;
  bloomCanvas.style.height = `${Math.floor(height / dpr)}px`;
  bloomCtx = bloomCanvas.getContext("2d")!;
  // set transform so we can draw in CSS pixels
  bloomCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initCanvas() {
  if (!canvas.value) return;
  const c = canvas.value;
  // exact DPR for crispness
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.floor(window.innerWidth * dpr);
  c.height = Math.floor(window.innerHeight * dpr);
  c.style.width = `${window.innerWidth}px`;
  c.style.height = `${window.innerHeight}px`;
  ctx = c.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // prepare aux canvases
  createGlowOverlay(c.width, c.height);
  createBloomBuffer(c.width, c.height, dpr);

  columns = Math.max(1, Math.floor((window.innerWidth - 2 * sideMargin) / (cellSize + columnGap)));
  rows = Math.max(2, Math.floor(window.innerHeight / (cellSize + rowGap)));

  drops = Array.from({ length: columns }, () => {
    const word = words[Math.floor(Math.random() * words.length)].split("").reverse();
    return {
      word,
      pos: Math.floor(Math.random() * rows),
      trail: Math.max(3, Math.min(word.length, Math.floor(2 + Math.random() * (word.length - 1))))
    };
  });

  buildGlyphCaches();
}

function advanceDrops(steps = 1) {
  for (let s = 0; s < steps; s++) {
    for (const drop of drops) {
      drop.pos = (drop.pos + 1) % rows;
      if (Math.random() < 0.005) {
        const newWord = words[Math.floor(Math.random() * words.length)].split("").reverse();
        drop.word = newWord;
        drop.trail = Math.max(3, Math.min(newWord.length, Math.floor(2 + Math.random() * (newWord.length - 1))));
      }
    }
  }
}

function draw() {
  if (!ctx || !canvas.value || !bloomCtx) return;
  const now = performance.now();
  const dt = now - lastRenderTime;
  lastRenderTime = now;

  // fps smoothing
  const instantFps = dt > 0 ? 1000 / dt : 60;
  fpsSmoothed = fpsSmoothed * (1 - fpsAlpha) + instantFps * fpsAlpha;

  // fixed-timestep update handling
  accumulatedUpdate += now - lastUpdateTime;
  lastUpdateTime = now;
  if (accumulatedUpdate >= updateIntervalMs) {
    const steps = Math.floor(accumulatedUpdate / updateIntervalMs);
    advanceDrops(steps);
    accumulatedUpdate -= steps * updateIntervalMs;
  }
  const progress = Math.min(1, accumulatedUpdate / updateIntervalMs);

  const c = canvas.value;

  // clear main
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, c.width, c.height);

  // clear bloom buffer
  bloomCtx.clearRect(0, 0, bloomCanvas!.width, bloomCanvas!.height);

  // draw glow overlay (static)
  if (glowCanvas) ctx.drawImage(glowCanvas, 0, 0, c.width, c.height);

  // render columns with interpolation and paint leading glyphs also into bloom buffer
  ctx.imageSmoothingEnabled = true;
  const spacing = (cellSize + rowGap);
  for (let i = 0; i < columns; i++) {
    const drop = drops[i];
    const x = sideMargin + i * (cellSize + columnGap) + (cellSize / 2);

    for (let t = 0; t < drop.trail; t++) {
      const baseRow = (drop.pos - t + rows) % rows;
      const y = baseRow * spacing + progress * spacing;

      if (y < -cellSize || y > window.innerHeight + cellSize) continue;

      const ch = drop.word[t % drop.word.length] ?? " ";
      if (t === 0) {
        const img = glyphLeading.get(ch) ?? glyphLeading.get(" ")!;
        const gx = x - img.width / 2;
        const gy = y - img.height * 0.15;
        // main draw (sharp)
        ctx.drawImage(img, gx, gy);
        // also draw into bloom buffer (we'll blur & additively composite it)
        bloomCtx.globalAlpha = 1;
        bloomCtx.drawImage(img, gx, gy);
      } else {
        const img = glyphNormal.get(ch) ?? glyphNormal.get(" ")!;
        const alpha = ((drop.trail - t) / drop.trail) * 0.75;
        ctx.globalAlpha = Math.max(0.05, alpha);
        const gx = x - img.width / 2;
        const gy = y - img.height * 0.15;
        ctx.drawImage(img, gx, gy);
        ctx.globalAlpha = 1;
      }
    }
  }

  // additive blurred bloom pass: draw bloom buffer blurred and in 'lighter' mode
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // apply blur on the main context while drawing bloom buffer (keeps bloom buffer unchanged)
  ctx.filter = "blur(8px)"; // adjust for stronger/softer glow
  ctx.globalAlpha = 0.6;    // bloom intensity
  // draw whole bloom buffer (it is same backing resolution as main canvas)
  ctx.drawImage(bloomCanvas!, 0, 0, c.width, c.height);
  // optional second smaller blur pass to deepen glow (cheap: lower alpha)
  ctx.filter = "blur(16px)";
  ctx.globalAlpha = 0.15;
  ctx.drawImage(bloomCanvas!, 0, 0, c.width, c.height);
  // restore
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  // FPS counter
  const fpsText = `FPS: ${fpsSmoothed.toFixed(1)}`;
  const fontPx = 14;
  ctx.font = `${fontPx}px monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(fpsText, window.innerWidth - 12 + 1, window.innerHeight - 10 + 1);
  ctx.fillStyle = "#38F814";
  ctx.fillText(fpsText, window.innerWidth - 12, window.innerHeight - 10);

  animationId = requestAnimationFrame(draw);
}

function resizeHandler() {
  initCanvas();
}

onMounted(() => {
  initCanvas();
  window.addEventListener("resize", resizeHandler);
  lastRenderTime = performance.now();
  lastUpdateTime = performance.now();
  animationId = requestAnimationFrame(draw);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeHandler);
  cancelAnimationFrame(animationId);
});
</script>

<template>
  <canvas
    ref="canvas"
    style="position:absolute;bottom:0;right:0;top:0;left:0;width:100%;height:100%;pointer-events:none;display:block"
  ></canvas>
</template>

<style scoped>
canvas {
  display: block;
}
</style>
