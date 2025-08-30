<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);
let glowCanvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D;
let animationId: number;
let frameCount = 0;

const cellSize = 10; // scale cell size
const fontScale = 1; // scale text size
const rowGap = 1; // px extra gap between rows
const columnGap = 10; // px extra gap between columns

const sideMargin = 80; // px empty space on both sides

const dropInterval = 8; // smaller = faster

let columns: number;
let rows: number;


interface Drop {
    word: string[];
    pos: number;
    trail: number;
}

let drops: Drop[] = [];
const words = ["function", "if (true) { } else { }"];

function initCanvas() {
    if (!canvas.value) return;
    const c = canvas.value;
    ctx = c.getContext("2d")!;
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    columns = Math.floor((c.width - 2 * sideMargin) / (cellSize + columnGap));
    rows = Math.floor(c.height / (cellSize + rowGap));

    drops = Array.from({ length: columns }, () => {
        const word = words[Math.floor(Math.random() * words.length)].split("").reverse();
        return {
            word,
            pos: Math.floor(Math.random() * rows),
            trail: word.length,   // show entire word
        };
    });

    // ✅ call createGlow here
    createGlow();
}

function createGlow() {
    if (!canvas.value) return;
    glowCanvas = document.createElement("canvas");
    glowCanvas.width = canvas.value.width;
    glowCanvas.height = canvas.value.height;
    const gCtx = glowCanvas.getContext("2d")!;

    const glowHeight = gCtx.canvas.height * 0.15;

    // linear gradient
    const linearGradient = gCtx.createLinearGradient(0, gCtx.canvas.height - glowHeight, 0, gCtx.canvas.height);
    linearGradient.addColorStop(0, "rgba(0,50,0,0)");
    linearGradient.addColorStop(1, "rgba(0,255,0,0.15)");
    gCtx.fillStyle = linearGradient;
    gCtx.fillRect(0, gCtx.canvas.height - glowHeight, gCtx.canvas.width, glowHeight);
}

function draw() {
    if (!ctx || !canvas.value) return;
    const c = canvas.value;

    // hard black background (so no lingering streaks)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);

    // draw pre-rendered glow
    if (glowCanvas) ctx.drawImage(glowCanvas, 0, 0);

    // texts
    ctx.font = `${cellSize * fontScale}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // draw drops and add to fadingChars
    for (let i = 0; i < columns; i++) {
        const drop = drops[i];
        const x = sideMargin + i * (cellSize + columnGap) + cellSize / 2;

        for (let t = 0; t < drop.trail; t++) {
            const row = (drop.pos - t + rows) % rows;
            const y = row * (cellSize + rowGap);
            const char = drop.word[t % drop.word.length];

            if (t === 0) {
                // leading char bright
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#38F814";
                ctx.fillStyle = "#38F814";
            } else {
                // trail fading
                const alpha = ((drop.trail - t) / drop.trail) * 0.7;
                ctx.shadowBlur = 0;
                ctx.fillStyle = `rgba(0,255,0,${alpha})`;
            }
            ctx.fillText(char, x, y);
        }
    }

    // move drops
    if (frameCount % dropInterval === 0) {
        drops.forEach(drop => drop.pos = (drop.pos + 1) % rows);
    }

    frameCount++;
    animationId = requestAnimationFrame(draw);
}

function resizeCanvas() {
    initCanvas();
}

onMounted(() => {
    initCanvas();
    window.addEventListener("resize", resizeCanvas);
    draw();
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", resizeCanvas);
    cancelAnimationFrame(animationId);
});
</script>

<template>
    <canvas ref="canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"></canvas>
</template>

<style scoped>
canvas {
    display: block;
}
</style>
