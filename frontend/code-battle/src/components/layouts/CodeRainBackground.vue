<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const cellSize = 24; // px
const delay = 200;   // base step delay

const words = [
    "function".split(""),
    "if (true) { } else { }".split(""),
];

const grid = ref<string[][]>([]);
const blinkGrid = ref<number[][]>([]);
const rows = ref(0);
const cols = ref(0);
let columnIntervals: number[] = [];

function initGrid() {
    rows.value = Math.ceil((window.innerHeight / cellSize) * 1.5);
    cols.value = Math.ceil(window.innerWidth / cellSize);

    grid.value = Array.from({ length: rows.value }, () => Array(cols.value).fill(""));
    blinkGrid.value = Array.from({ length: rows.value }, () =>
        Array.from({ length: cols.value }, () => Math.random() * 0.6 + 0.4)
    );
}

function animateColumn(col: number) {
    let word = words[Math.floor(Math.random() * words.length)].slice().reverse();
    let i = Math.floor(Math.random() * rows.value);

    const interval = setInterval(() => {
        // clear column
        for (let r = 0; r < rows.value; r++) grid.value[r][col] = "";

        // display word downwards
        for (let k = 0; k < word.length; k++) {
            const row = (i - k + rows.value) % rows.value;
            grid.value[row][col] = word[k];
        }

        i = (i + 1) % rows.value;
    }, delay + Math.random() * 200);

    columnIntervals.push(interval);
}

// random blinking
function updateBlink() {
    for (let r = 0; r < rows.value; r++) {
        for (let c = 0; c < cols.value; c++) {
            if (grid.value[r][c]) {
                blinkGrid.value[r][c] = Math.random() * 0.6 + 0.4;
            }
        }
    }
}

let blinkInterval: number;

onMounted(() => {
    initGrid();
    window.addEventListener("resize", initGrid);

    for (let c = 0; c < cols.value; c++) {
        animateColumn(c);
    }

    blinkInterval = window.setInterval(updateBlink, 800 + Math.random() * 700);
});

onBeforeUnmount(() => {
    columnIntervals.forEach(clearInterval);
    clearInterval(blinkInterval);
});
</script>

<template>
    <div class="code-rain">
        <div v-for="(row, rIndex) in grid" :key="rIndex" class="row">
            <span v-for="(cell, cIndex) in row" :key="cIndex" class="cell"
                :style="{ opacity: cell ? blinkGrid[rIndex][cIndex] : 0 }">
                {{ cell }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.code-rain {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: monospace;
    color: #0f0;
    pointer-events: none;
    overflow: hidden;
}

.row {
    display: flex;
    justify-content: center;
}

.cell {
    width: 1em;
    height: 1.2em;
    text-align: center;
    margin-right: .5rem;
    transition: opacity 0.2s linear;
}
</style>
