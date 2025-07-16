<template>
    <div class="container">
        <!-- Top bar -->
        <div class="top-bar">
            <div class="center-div">
                <button @click="showPopup = true">⬇️</button>
            </div>
            <div class="timer">Time Left : {{ formattedTime }}</div>
        </div>

        <!-- Code editor and run/submit buttons -->
        <CodeEditor v-model="code" />
        <div class="buttons">
            <button @click="runCode">Run code</button>
            <button @click="submitCode">Submit</button>
        </div>

        <!-- Popup Modal (only when triggered) -->
        <div v-if="showPopup" class="overlay" @click.self="showPopup = false">
            <div class="popup" v-if="questionData">
                <h2>{{ questionData.questionName }}</h2>
                <hr>
                <p><strong>Description:</strong></p>
                <p>{{ questionData.description }}</p>
                <p><strong>Test Cases:</strong></p>
                <ul>
                    <li v-for="(test, i) in questionData.testCases" :key="i">
                        <p>Input: {{ test.input }}</p>
                        <p>Output: {{ test.expectedOutput }}</p>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import api from '@/clients/api'
import type { Question } from '@/types/types'

import CodeEditor from '@/components/pve/CodeEditor.vue'
import { ref, computed, onMounted } from 'vue'

const showPopup = ref(false)
const code = ref('// Write code here')

const runCode = () => {
    console.log('Running code:', code.value)
}

const submitCode = () => {
    console.log('Submitting code:', code.value)
}

const totalTime = 180
const timeLeft = ref(totalTime)

const formattedTime = computed(() => {
    const minutes = String(Math.floor(timeLeft.value / 60)).padStart(2, '0')
    const seconds = String(timeLeft.value % 60).padStart(2, '0')
    return `00:${minutes}:${seconds}`
})

// Description
const route = useRoute()
const level = route.query.mode as string || 'Easy'
const questionData = ref<Question | null>(null)

onMounted(async () => {
    const response = await api.get(`/questions?level=${level}`)
    questionData.value = response.data as Question
})


onMounted(() => {
    const timer = setInterval(() => {
        if (timeLeft.value > 0) timeLeft.value--
        else clearInterval(timer)
    }, 1000)
})
</script>

<style scoped>
.container {
    background-color: #d1d5db;
    /* gray-300 */
    padding: 2rem;
    padding-top: 6rem;
    min-height: 100vh;
    min-width: 100vw;
    box-sizing: border-box;
}

/* Top bar with button and timer */
.top-bar {
    position: relative;
    margin-bottom: 16px;
    height: 40px;
}

.center-div {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
}

.center-div button {
    background-color: #9ca3af;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 20px;
}

.timer {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-weight: 600;
    font-size: 14px;
    color: black;
}

.top-bar button {
    background-color: #9ca3af;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 20px;
}

/* Buttons */
.buttons {
    max-width: 800px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 32px;
}

.buttons button {
    background-color: #9ca3af;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
}

.buttons button:hover {
    background-color: #6b7280;
}

/* Overlay */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

/* Popup */
.popup {
    background-color: #e5e7eb;
    border-radius: 12px;
    width: 400px;
    max-width: 90vw;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    font-size: 20px;
    text-align: center;
}
</style>
