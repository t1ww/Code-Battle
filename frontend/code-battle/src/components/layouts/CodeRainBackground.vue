<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D;
let animationId: number;
let frameCount = 0;

const cellSize = 24;
const dropSpeed = 12; // smaller = faster
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

    columns = Math.floor(c.width / cellSize);
    rows = Math.floor(c.height / cellSize);

    drops = Array.from({ length: columns }, () => {
        const word = words[Math.floor(Math.random() * words.length)].split("").reverse();
        return {
            word,
            pos: Math.floor(Math.random() * rows),
            trail: 3 + Math.floor(Math.random() * 3)
        };
    });
}

function draw() {
    if (!ctx || !canvas.value) return;
    const c = canvas.value;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.font = `${cellSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i < columns; i++) {
        const drop = drops[i];
        const x = i * cellSize + cellSize / 2;

        // leading character
        const char = drop.word[0];
        const y = drop.pos * cellSize;
        ctx.fillStyle = "#38F814";
        ctx.fillText(char, x, y);

        // trail
        for (let t = 1; t < drop.trail; t++) {
            const row = (drop.pos - t + rows) % rows;
            const charY = row * cellSize;
            const trailChar = drop.word[t % drop.word.length];
            const alpha = 0.2 + 0.6 * (1 - t / drop.trail);
            const green = t === drop.trail - 1 ? 1 : 0;
            ctx.fillStyle = `rgba(0,${Math.floor(255 * (1 - green)) + Math.floor(255 * green)},0,${alpha})`;
            ctx.fillText(trailChar, x, charY);
        }
    }

    // move drops only every dropSpeed frames
    if (frameCount % dropSpeed === 0) {
        drops.forEach(drop => {
            drop.pos = (drop.pos + 1) % rows;
        });
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
