<!-- frontend\code-battle\src\components\popups\PvpResultPopup.vue -->
<template>
    <div v-if="show" class="popup-overlay">
        <div class="popup-container">
            <h2 v-if="winner">
                <span v-if="isWinner">🎉 You Win! 🎉</span>
                <span v-else-if="isLoser">💀 You Lose 💀</span>
                <span v-else>🤝 Draw 🤝</span>
            </h2>
            <h2 v-else>Test Results</h2>

            <ul class="test-results">
                <li v-for="(test, index) in testResults" :key="index"
                    :class="{ passed: test.passed, failed: !test.passed }">
                    <strong>Test {{ index + 1 }}:</strong>
                    <span>{{ test.passed ? '✅ Passed' : '❌ Failed' }}</span>
                    <div class="details" v-if="!test.passed">
                        <p><strong>Input:</strong> {{ test.input }}</p>
                        <p><strong>Expected:</strong> {{ test.expected_output }}</p>
                        <p><strong>Output:</strong> {{ test.output }}</p>
                    </div>
                </li>
            </ul>
            <button @click="$emit('close')">Close</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { usePvpGameStore } from '@/stores/usePvpGameStore'
import { computed, defineProps } from 'vue'
const gameStore = usePvpGameStore()

interface TestResult {
    passed: boolean
    input: string
    output: string
    expected_output: string
}

const props = defineProps<{
    show: boolean
    testResults: TestResult[]
    winner?: string | null
}>()

const isWinner = computed(() => props.winner === gameStore.playerTeam)
const isLoser = computed(() => props.winner === gameStore.opponentTeam)
const isDraw = computed(() => props.winner === 'draw')
</script>

<style scoped>
.popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.popup-container {
    background: #111;
    color: #fff;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
}

.test-results li.passed {
    color: #0f0;
}

.test-results li.failed {
    color: #f00;
}

.details {
    font-size: 0.85rem;
    margin-left: 12px;
}

.score {
    margin-top: 12px;
    font-weight: bold;
}

button {
    margin-top: 16px;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    background: #444;
    color: #fff;
    cursor: pointer;
}
</style>
