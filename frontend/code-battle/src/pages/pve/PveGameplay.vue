<template>
    <div class="container">
        <!-- Top bar -->
        <div class="top-bar">
            <!-- Toggle Button when hidden -->
            <div v-if="!showPopup" class="popup-toggle fixed">
                <button @click="showPopup = true">▼</button>
            </div>
            <div class="timer">
                Time Left:
                <span>{{ formattedTime }}</span>
            </div>
        </div>

        <!-- Code editor and run/submit buttons -->
        <CodeEditor v-model="code" />
        
        <div class="buttons">
            <button @click="runCode">Run code</button>
            <button @click="submitCode">Submit</button>
        </div>

        <!-- Popup Modal (only when triggered) -->

        <!-- Slide Panel Toggle -->
        <transition name="slide-down">
            <div v-if="showPopup" class="popup-panel">
                <div class="popup-content" v-if="questionData">
                    <h3>Description</h3>
                    <hr />
                    <h4>Level {{ questionData.level }}: {{ questionData.questionName }}</h4>
                    <div class="section">
                        <p><strong>Description:</strong></p>
                        <p>{{ questionData.description }}</p>
                    </div>
                    <div class="section">
                        <p><strong>Test Cases:</strong></p>
                        <div class="test-cases">
                            <div v-for="(test, i) in questionData.testCases" :key="i" class="test-case">
                                <strong>Test Case {{ i + 1 }}</strong><br />
                                Input: {{ test.input || '(no input)' }}<br />
                                Output: {{ test.expectedOutput }}
                            </div>
                        </div>
                    </div>
                    <div class="section">
                        <label>
                            Time limit:
                            <input type="checkbox" v-model="timeLimitEnabled" disabled />
                        </label>
                    </div>
                    <div class="section modifier">
                        <span>Modifier:</span>
                        <span class="modifier-value">{{ selectedModifier }}</span>
                    </div>
                </div>
                <!-- Button inside sliding panel -->
                <div class="popup-toggle">
                    <button @click="showPopup = false">▲</button>
                </div>
            </div>
        </transition>

        <!-- Submission result -->
        <transition name="fade">
            <div v-if="showResultPopup" class="overlay" @click.self="showResultPopup = false">
                <div class="popup">
                    <h2>Test Results</h2>
                    <p><strong>Final Score:</strong> {{ testResults?.totalScore }} / {{ questionData?.testCases.length
                        }}</p>
                    <div v-for="(result, i) in testResults?.results" :key="i" class="test-result"
                        :style="{ color: result.passed ? 'green' : 'red' }">
                        <p><strong>Test Case {{ i + 1 }}:</strong> {{ result.passed ? 'Passed' : 'Failed' }}</p>
                        <p>Input: {{ result.input || '(no input)' }}</p>
                        <p>Expected Output: {{ result.expectedOutput }}</p>
                        <p>Actual Output: {{ result.output }}</p>
                    </div>
                    <button @click="showResultPopup = false">Close</button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/clients/crud.api'
import codeRunnerApi from '@/clients/coderunner.api'
import type { CodeRunResponse, Question } from '@/types/types'
import CodeEditor from '@/components/pve/CodeEditor.vue'

// =============================
// 📍 Route & Query Params
// =============================
const route = useRoute()
const level = route.query.mode as string || 'Easy'
const selectedModifier = route.query.modifier as string || 'None'
const timeLimitEnabled = route.query.timeLimit === 'true'

// =============================
// 🔁 Reactive State
// =============================
const code = ref('// Write code here')
const showPopup = ref(false)
const questionData = ref<Question | null>(null)

const totalTime = 180
const timeLeft = ref(timeLimitEnabled ? totalTime : 0)

const showResultPopup = ref(false)
const testResults = ref<{
    passed: boolean
    results: { passed: boolean; output: string; expectedOutput: string; input: string }[]
    totalScore: number
} | null>(null)


// =============================
// ⏱️ Computed
// =============================
const formattedTime = computed(() => {
    const totalSeconds = timeLeft.value
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
})

// =============================
// 🧪 Code Actions
// =============================
const runCode = async () => {
    console.log('Running code:', code.value)
}

const submitCode = async () => {
    console.log('Submitting code:', code.value)
    console.log('Test cases:', questionData.value?.testCases)
    if (!questionData.value) return

    const payload = {
        code: code.value,
        testCases: questionData.value.testCases,
        scorePct: 1,
    }

    try {
        const res = await codeRunnerApi.post('/run', payload)
        const data = res.data as CodeRunResponse

        testResults.value = {
            passed: data.totalScore === questionData.value.testCases.length,
            results: data.results.map((r, i) => ({
                passed: r.passed,
                output: r.output,
                expectedOutput: questionData.value!.testCases[i].expectedOutput,
                input: questionData.value!.testCases[i].input,
            })),
            totalScore: data.totalScore ?? 0,
        }

        showResultPopup.value = true
    } catch (error) {
        console.error('Code run failed:', (error as any).customMessage || error)
    }
}


// =============================
// 🚀 Lifecycle Hooks
// =============================
onMounted(async () => {
    const response = await api.get(`/questions?level=${level}`)
    questionData.value = response.data as Question
})


onMounted(() => {
    const timer = setInterval(() => {
        if (timeLimitEnabled) {
            // Countdown
            if (timeLeft.value > 0) timeLeft.value--
            else clearInterval(timer)
        } else {
            // Count up indefinitely
            timeLeft.value++
        }
    }, 1000)
})

</script>


<style scoped>
/* Page's screen container */
.container {
    background-color: #d1d5db;
    padding: 6rem;
    padding-top: 6rem;
    padding-bottom: 2.6rem;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
    overflow-x: hidden;
}

/* Top bar with button and timer */
.top-bar {
    position: relative;
    margin-bottom: 2rem;
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
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.buttons button {
    background-color: #9ca3af;
    border: none;
    width: 6rem;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    outline: none;
}

.buttons button:hover {
    background-color: #6b7280;
}

.buttons button:active {
    background-color: #9fb2a4;
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

/* Slide down transition */
.slide-down-enter-active {
    animation: slideDown 0.3s ease-out forwards;
}

.slide-down-leave-active {
    animation: slideUp 0.2s ease-in forwards;
}

@keyframes slideDown {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(0);
        opacity: 1;
    }

    to {
        transform: translateY(-100%);
        opacity: 0;
    }
}

/* Popup panel styling */
/* Popup panel */
.popup-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    background-color: #4b5563;
    color: white;
    z-index: 1000;
    font-size: 14px;
    border-bottom: 2px solid #ccc;
    text-align: left;
}

.popup-content {
    max-width: 1000px;
    margin: 0 auto;
}

/* Button inside the panel */
.popup-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
}

.popup-toggle button {
    background-color: #9ca3af;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 20px;
}

/* Button when panel is hidden */
.popup-toggle.fixed {
    display: flex;
    justify-content: center;
    padding: 0.5rem;
    z-index: 999;
}

/* Section layout */
.section {
    margin-bottom: 1rem;
}

.test-cases {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.test-case {
    background-color: #6b7280;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    width: 15vw;
}

.modifier {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.modifier-value {
    background: white;
    color: black;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: bold;
}
</style>