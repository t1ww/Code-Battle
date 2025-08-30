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

const dropSpeed = 16; // smaller = faster
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

    columns = Math.floor((c.width - 2 * sideMargin) / (cellSize + columnGap) );
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

    // clear whole canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.font = `${cellSize * fontScale}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = 0; i < columns; i++) {
        const drop = drops[i];
        const x = sideMargin + i * (cellSize + columnGap) + cellSize / 2;

        // draw column cells explicitly
        for (let row = 0; row < rows; row++) {
            const y = row * (cellSize + rowGap);

            // is this row inside the trail?
            let t = drop.pos - row;
            if (t < 0) t += rows;

            if (t >= 0 && t < drop.trail) {
                const char = drop.word[t % drop.word.length];
                if (t === 0) {
                    // leading char = bright
                    ctx.fillStyle = "#38F814";
                } else {
                    const alpha = 0.4 + 0.5 * (1 - t / drop.trail);
                    ctx.fillStyle = `rgba(0,255,0,${alpha})`;
                }
                ctx.fillText(char, x, y);
            } else {
                // force-clear inactive cell
                ctx.fillStyle = "black";
                ctx.fillRect(x - cellSize / 2, y, cellSize, cellSize);
            }
        }
    }

    // move drops only every dropSpeed frames
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
