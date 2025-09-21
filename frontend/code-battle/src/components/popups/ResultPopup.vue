<!-- frontend\code-battle\src\components\popups\ResultPopup.vue -->
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface TestResult {
    passed: boolean
    input: string
    output: string
    expected_output: string
}

const props = defineProps<{
    show: boolean
    testResults: TestResult[] // flat array
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

function handleClose() {
    emit('close')
}
</script>

<template>
    <div v-if="show" class="popup-backdrop">
        <div class="popup-content">
            <h2>🧪 Test Results</h2>
            <hr>
            <div class="question-block">
                <div class="progress-bar">
                    <div v-for="(test, i) in testResults" :key="i"
                        class="progress-segment"
                        :class="{ passed: test.passed, failed: !test.passed }"
                        :title="'Test ' + (i + 1) + (test.passed ? ': ✅ Passed' : ': ❌ Failed')">
                        <span class="progress-label">Test {{ i + 1 }}</span>
                    </div>
                </div>

                <div v-if="testResults.every(t => t.passed)" class="test-case pass">
                    <span class="status-badge pass">✔ Cleared</span>
                </div>

                <hr>
            </div>

            <button @click="handleClose">Close</button>
        </div>
    </div>
</template>

<style scoped>
.progress-bar {
    display: flex;
    margin: 6px 0;
}

.progress-segment {
    flex: 1;
    height: 20px;
    margin-right: 2px;
    border-radius: 2px;
    background: #333;
    position: relative; /* for text overlay */
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-segment.passed {
    background: #0f0;
}

.progress-segment.failed {
    background: #f00;
}

/* faint text overlay */
.progress-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    pointer-events: none; /* so hover still triggers the segment tooltip */
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
</style>
