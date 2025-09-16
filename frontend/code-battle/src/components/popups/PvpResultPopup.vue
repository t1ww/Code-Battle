<!-- frontend\code-battle\src\components\popups\ResultPopup.vue -->
<template>
    <transition name="fade">
        <div v-if="show" class="popup-backdrop" @click.self="$emit('close')">
            <div class="popup-content">
                <h2>Test Cases</h2>
                <div v-for="(result, i) in testResults" :key="i" class="test-result"
                    :style="{ color: result.passed ? 'green' : 'red' }">
                    <p><strong>Test Case {{ i + 1 }}:</strong> {{ result.passed ? 'Passed' : 'Failed' }}</p>
                </div>
                <button @click="$emit('close')">Close</button>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
defineProps<{
    show: boolean
    testResults: {
        passed: boolean
        output: string
        expected_output: string
        input: string
    }[]
}>()
defineEmits(['close'])
</script>

<style scoped>
.popup-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.popup-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: left;
    max-height: 80vh;
    width: 20rem;
    overflow-y: auto;
}

.test-result {
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.popup-content button {
    display: block;
    margin: 1rem auto 0;
    padding: 0.5rem 1.5rem;
    font-weight: bold;
}
</style>
