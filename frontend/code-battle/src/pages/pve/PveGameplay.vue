<template>
    <div class="container">
        <!-- Top bar -->
        <div class="top-bar">
            <!-- Toggle Button when hidden -->
            <div v-if="!showDescriptionPopup" class="popup-toggle fixed">
                <button @click="showDescriptionPopup = true">▼</button>
            </div>
            <div class="timer">
                Time Left:
                <span>{{ formattedTime }}</span>
            </div>
        </div>

        <!-- Code editor and run/submit buttons -->
        <CodeEditor v-model="code" />

        <div class="buttons">
            <button @click="runCode" :disabled="isLoading">Run code</button>
            <button @click="submitCode" :disabled="isLoading">
                Submit
            </button>
        </div>
        <div class="buttons">
            <span v-if="isLoading" class="loading-spinner">Loading...</span>
        </div>

        <!-- Slide Panel Toggle -->
        <transition name="slide-down">
            <div v-if="showDescriptionPopup" class="description-popup-panel">
                <div class="description-popup-content" v-if="questionData">
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
                <div class="description-popup-toggle">
                    <button @click="showDescriptionPopup = false">▲</button>
                </div>
            </div>
        </transition>

        <!-- Submission result -->
        <transition name="fade">
            <div v-if="showResultPopup" class="overlay" @click.self="showResultPopup = false">
                <div class="popup">
                    <h2>Test Results</h2>
                    <p><strong>Final Score:</strong> {{ finalScore }} / {{
                        questionData?.testCases?.reduce((acc, test) => acc + (test.score ?? 0), 0) ?? 0
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

    <!-- Game ends -->
    <!-- By timer -->
    <template v-if="showTimeoutPopup">
        <div class="popup-backdrop">
            <div class="popup-content">
                <h2>Time's up!</h2>
                <p>Your time limit has expired.</p>
                <button @click="restartPage">Restart</button>
                <router-link :to="{ name: 'PveLevelSelect' }">
                    <button>Select New Level</button>
                </router-link>
            </div>
        </div>
    </template>

    <!-- By clear -->
    <template v-if="showClearedPopup">
        <div class="popup-backdrop">
            <div class="popup-content">
                <h2>Level Cleared!</h2>
                <p>Your final score: {{ finalScore }}</p>
                <button @click="restartPage">Restart</button>
                <router-link :to="{ name: 'PveLevelSelect' }">
                    <button>Select New Level</button>
                </router-link>
            </div>
        </div>
    </template>

    <!-- By confident lost -->
    <template v-if="showConfidentLostPopup">
        <div class="popup-backdrop">
            <div class="popup-content">
                <h2>Your submission failed</h2>
                <h2 :style="{ color: 'red' }">Confident Modifer on</h2>
                <p>Your final score: {{ finalScore }}</p>
                <router-link :to="{ name: 'PveLevelSelect' }">
                    <button>Select New Level</button>
                </router-link>
            </div>
        </div>
    </template>

    <!-- Notifications -->
    <transition name="notif-slide">
        <div v-if="showNotification" class="notification">
            ℹ️ {{ notificationMessage }}
        </div>
    </transition>

</template>

<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
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
// Base
const code = ref('// Write code here')
const showDescriptionPopup = ref(false)
const questionData = ref<Question | null>(null)
const isLoading = ref(false)
const MODIFIER_BONUS = 1.25

// Timer
const timeLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// Time out
const showTimeoutPopup = ref(false)

// Result
const showResultPopup = ref(false)
const testResults = ref<{
    passed: boolean
    results: { passed: boolean; output: string; expectedOutput: string; input: string }[]
    totalScore: number
} | null>(null)
const finalScore = ref(0);

// Clear
const showClearedPopup = ref(false)

// Sabotage
let sabotageTimer: ReturnType<typeof setInterval> | null = null

// Confident
const showConfidentLostPopup = ref(false)

// Notifications
const showNotification = ref(false)
const notificationMessage = ref('')

function triggerNotification(message: string, duration = 3000) {
    notificationMessage.value = message
    showNotification.value = true
    setTimeout(() => (showNotification.value = false), duration)
}


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
    if (!questionData.value) return
    isLoading.value = true
    try {
        console.log('Submitting code:', code.value)
        const baseLimit = questionData.value.timeLimit || 1 // fallback to 1 to avoid division by 0
        let scorePct = 1

        if (timeLimitEnabled) {
            scorePct = timeLeft.value / baseLimit
        } else {
            const timeUsed = baseLimit - timeLeft.value
            scorePct = timeUsed / baseLimit
        }
        console.log('Timer pct:', scorePct)
        const res = await codeRunnerApi.post('/run', {
            code: code.value,
            testCases: questionData.value.testCases,
            // Score percentage based on timer, if its enabled check from time left, if disabled find time taken which would've left from based timer limit.
            scorePct: scorePct,
        })
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
        console.log(testResults.value)
        if (selectedModifier === 'Sabotage' || selectedModifier === 'Confident'){
            finalScore.value = +(testResults.value.totalScore * MODIFIER_BONUS).toFixed(3);
        } else {
            finalScore.value = testResults.value.totalScore;
        }

        if (data.passed) {
            showClearedPopup.value = true
        } else {
            if (selectedModifier === 'Confident') {
                showConfidentLostPopup.value = true;
            } else {
                showResultPopup.value = true
            }
        }
    } catch (error) {
        console.error('Code run failed:', (error as any).customMessage || error)
    } finally {
        isLoading.value = false
    }
}

const restartPage = () => {
    window.location.reload()
}


// =============================
// 🚀 Lifecycle Hooks
// =============================
onMounted(async () => {
    // Fetch question
    const response = await api.get(`/questions?level=${level}`)
    questionData.value = response.data as Question

    // Modifiers on notifications
    if (selectedModifier === 'Confident') {
        triggerNotification('Confident mode you can only submit once, use it wisely.')
    }

    // Sabotage modifer handling
    if (selectedModifier === 'Sabotage') {
        triggerNotification('Sabotage modifier is active, your code will get one of its character removed every 2 minutes.')
        sabotageTimer = setInterval(() => {
            if (code.value.length > 0) {
                // Notify the sabotage
                triggerNotification('Your code have been sabotage, find it and fix it!')

                // Remove a random character
                const index = Math.floor(Math.random() * code.value.length)
                code.value = code.value.slice(0, index) + code.value.slice(index + 1)
            }
        }, 2 * 60 * 1000) // every 2 minutes
    }
})

watch(questionData, (newVal) => {
    if (!newVal) return

    if (timeLimitEnabled) {
        timeLeft.value = newVal.timeLimit || 0
    } else {
        timeLeft.value = 0
    }

    if (timer) clearInterval(timer)
    timer = setInterval(() => {
        if (timeLimitEnabled) {
            if (timeLeft.value > 0) {
                timeLeft.value--
            } else {
                clearInterval(timer!)
                showTimeoutPopup.value = true // ⏱️ trigger popup
            }
        } else {
            timeLeft.value++
        }
    }, 1000)
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
    if (sabotageTimer) clearInterval(sabotageTimer)
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
.description-popup-panel {
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

.description-popup-content {
    max-width: 1000px;
    margin: 0 auto;
}

/* Button inside the panel */
.description-popup-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
}

.description-popup-toggle button {
    background-color: #9ca3af;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 20px;
}

/* Button when panel is hidden */
.description-popup-toggle.fixed {
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

/* Loading submit */
.loading-spinner {
    justify-self: flex-end;
    margin-left: 8px;
    font-size: 12px;
    font-style: italic;
    color: #555;
}

/* Time out */
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
    text-align: center;
}

.popup-content button {
    margin: 0.5rem;
}

/* Notifications */
.notification {
    position: fixed;
    top: 1rem;
    left: 1rem;
    background-color: #1f2937;
    color: #f9fafb;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 1100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Slide in from top-left */
.notif-slide-enter-active {
    animation: notifIn 0.3s ease-out forwards;
}

.notif-slide-leave-active {
    animation: notifOut 0.2s ease-in forwards;
}

@keyframes notifIn {
    from {
        transform: translate(-100%, 0);
        opacity: 0;
    }

    to {
        transform: translate(0, 0);
        opacity: 1;
    }
}

@keyframes notifOut {
    from {
        transform: translate(0, 0);
        opacity: 1;
    }

    to {
        transform: translate(-100%, 0);
        opacity: 0;
    }
}
</style>