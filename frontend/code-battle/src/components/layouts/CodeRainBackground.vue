<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D;
let animationId: number;
let frameCount = 0;

const cellSize = 10; // scale cell size
const fontScale = 1; // scale text size
const rowGap = 1; // px extra gap between rows
const columnGap = 10; // px extra gap between columns

const sideMargin = 80; // px empty space on both sides

const dropSpeed = 14; // smaller = faster
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
}

function draw() {
    if (!ctx || !canvas.value) return;
    const c = canvas.value;

    // fade previous frame instead of clearing
    ctx.fillStyle = "rgba(0,0,0,1)"; // hard alpha 1 for so no burns
    ctx.fillRect(0, 0, c.width, c.height);

    // green bottom glow (bottom 15% of screen)
    const glowHeight = c.height * 0.15; // 15% of screen
    const gradient = ctx.createLinearGradient(0, c.height - glowHeight, 0, c.height);
    gradient.addColorStop(0, "rgba(0,50,0,0)");
    gradient.addColorStop(1, "rgba(0,255,0,0.15)"); // subtle glow
    ctx.fillStyle = gradient;
    ctx.fillRect(0, c.height - glowHeight, c.width, glowHeight);

    ctx.font = `${cellSize * fontScale}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i < columns; i++) {
        const drop = drops[i];
        const x = sideMargin + i * (cellSize + columnGap) + cellSize / 2;

        for (let row = 0; row < rows; row++) {
            const y = row * (cellSize + rowGap);

            let t = drop.pos - row;
            if (t < 0) t += rows;

            if (t >= 0 && t < drop.trail) {
                const char = drop.word[t % drop.word.length];

                // glow
                ctx.shadowBlur = t === 0 ? 10 : 5;
                ctx.shadowColor = "#38F814";

                ctx.fillStyle =
                    t === 0
                        ? "#38F814"
                        : `rgba(0,255,0,${0.4 + 0.5 * (1 - t / drop.trail)})`;

                ctx.fillText(char, x, y);
            }
        }
    }

    // move drops
    if (frameCount % dropSpeed === 0) {
        drops.forEach((drop) => {
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
