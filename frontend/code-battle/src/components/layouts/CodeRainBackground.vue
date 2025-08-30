<!-- frontend\code-battle\src\components\layouts\CodeRainBackground.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";

const delay = 300;   // ms per step
const words = [
    "function".split(""),
    "if (true) { } else { }".split(""),
];
const cellSize = 24; // px, roughly matches your `.cell` width/height

// dynamic grid and dimensions
const grid = ref<string[][]>([]);
const rows = ref(0);
const cols = ref(0);

function initGrid() {
    rows.value = Math.ceil((window.innerHeight / cellSize) * 1.5);
    cols.value = Math.ceil(window.innerWidth / cellSize);

    grid.value = Array.from({ length: rows.value }, () => Array(cols.value).fill(""));
}

function animateColumn(col: number) {
    let word = words[Math.floor(Math.random() * words.length)].slice(); // copy array
    word.reverse(); // reverse the word (to make it forward down)

    let i = Math.floor(Math.random() * rows.value);

    setInterval(() => {
        // clear column
        for (let r = 0; r < rows.value; r++) grid.value[r][col] = "";

        // display reversed word
        for (let k = 0; k < word.length; k++) {
            const row = (i - k + rows.value) % rows.value;
            grid.value[row][col] = word[k];
        }

        i = (i + 1) % rows.value;
    }, delay + (Math.random() * 100));
}

onMounted(() => {
    initGrid();
    window.addEventListener("resize", initGrid);

    for (let c = 0; c < cols.value; c++) {
        animateColumn(c);
    }
});

</script>

<template>
    <div class="code-rain">
        <div v-for="(row, rIndex) in grid" :key="rIndex" class="row">
            <span v-for="(cell, cIndex) in row" :key="cIndex" class="cell" :class="{ visible: cell !== '' }">
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
    /* so background is not interactive */
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
    opacity: 0;               /* start invisible */
    margin-right: 1em;
    transition: opacity 0.5s ease-in-out; /* smooth fade */
}

.cell.visible {
    opacity: 1;               /* fade in */
}
</style>
