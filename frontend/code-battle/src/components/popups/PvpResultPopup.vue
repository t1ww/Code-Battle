<!-- frontend\code-battle\src\components\popups\PvpResultPopup.vue -->
<template>
    <div v-if="show" class="popup-overlay">
        <div class="popup-container">
            <!-- Winner / Loser / Draw -->
            <h2 v-if="winner">
                <span v-if="isWinner">🎉 You Win! 🎉</span>
                <span v-else-if="isLoser">💀 You Lose 💀</span>
                <span v-else>🤝 Draw 🤝</span>
            </h2>
            <h2 v-else>Test Results</h2>

            <!-- Questions & Test Progress -->
            <div v-for="(question, qIndex) in questions" :key="question.id" class="question-block">
                <h3>Question {{ qIndex + 1 }} (ID: {{ question.id }})</h3>

                <!-- Progress bar for test cases -->
                <div class="progress-bar">
                    <div v-for="(passed, tIndex) in progress[qIndex]" :key="tIndex" class="progress-segment"
                        :class="{ passed, failed: !passed }"
                        :title="'Test ' + (tIndex + 1) + (passed ? ': ✅ Passed' : ': ❌ Failed')"></div>
                </div>

                <!-- Full pass indicator -->
                <div v-if="progressFullPass?.[qIndex]" class="test-case pass">
                    <span class="status-badge pass">✔ Cleared</span>
                </div>
            </div>

            <button @click="$emit('close')">Close</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue'
import { usePvpGameStore } from '@/stores/usePvpGameStore'

const gameStore = usePvpGameStore()

interface TestResult {
    passed: boolean
    input: string
    output: string
    expected_output: string
}

const props = defineProps<{
    show: boolean
    testResults: TestResult[][] // per question -> per test
    questions?: any[]
    progress: boolean[][]      // per question -> per test
    progressFullPass?: boolean[]
    winner?: 'team1' | 'team2' | 'draw' | null
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
    width: 500px;
    max-height: 80vh;
    overflow-y: auto;
}

.question-block {
    margin-bottom: 16px;
}

.progress-bar {
    display: flex;
    margin: 6px 0;
}

.progress-segment {
    flex: 1;
    height: 12px;
    margin-right: 2px;
    border-radius: 2px;
    background: #333;
}

.progress-segment.passed {
    background: #0f0;
}

.progress-segment.failed {
    background: #f00;
}

.test-results {
    margin-top: 6px;
    font-size: 0.85rem;
}

.test-case.pass {
    color: #101d10;
    font-weight: bold;
    margin-top: 4px;
}

.status-badge.pass {
    background-color: #2ecc71;
    padding: 0.2rem 0.5rem;
    border-radius: 0.3rem;
    font-size: 0.85rem;
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
