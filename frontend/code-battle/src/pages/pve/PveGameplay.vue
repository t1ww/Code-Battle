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
        <DescriptionPopup :show="showDescriptionPopup" :question="question_data" :timeLimitEnabled="timeLimitEnabled"
            :selectedModifier="selectedModifier" @close="showDescriptionPopup = false" />

        <!-- Submission result -->
        <ResultPopup :show="showResultPopup" :finalScore="finalScore"
            :totalPossibleScore="question_data?.test_cases?.reduce((acc, t) => acc + (t.score ?? 0), 0) ?? 0"
            :testResults="testResults?.results || []" @close="showResultPopup = false" />

    </div>

    <!-- Game ends -->
    <!-- By timer -->
    <TimeoutPopup v-if="showTimeoutPopup" @restart="restartPage" />

    <!-- By clear -->
    <ClearedPopup v-if="showClearedPopup" :finalScore="finalScore" :fullScore="fullScore" @restart="restartPage" />

    <!-- By confident lost -->
    <ConfidentLostPopup v-if="showConfidentLostPopup" :finalScore="finalScore"
        @close="showConfidentLostPopup = false" />

    <!-- Notifications -->
    <NotificationPopup :show="showNotification" :message="notificationMessage" @close="showNotification = false" />
</template>

<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/clients/crud.api'
import codeRunnerApi from '@/clients/coderunner.api'
import type { CodeRunResponse, Question, ScoreSubmitRequest } from '@/types/types'
import CodeEditor from '@/components/pve/CodeEditor.vue'
import { getPlayerData } from '@/stores/auth'

// Composables
import { useNotification } from '@/composables/useNotification'
import { useSabotage } from '@/composables/useSabotage'
import { useTimer } from '@/composables/useTimer'

// Popup components
import ResultPopup from '@/components/popups/ResultPopup.vue'
import NotificationPopup from '@/components/popups/NotificationPopup.vue'
import ConfidentLostPopup from '@/components/popups/ConfidentLostPopup.vue'
import TimeoutPopup from '@/components/popups/TimeoutPopup.vue'
import ClearedPopup from '@/components/popups/ClearedPopup.vue'
import DescriptionPopup from '@/components/popups/DescriptionPopup.vue'



// =============================
// 📍 Route & Query Params
// =============================
const route = useRoute()
const level = route.query.mode as string || 'Easy'
const selectedModifier = route.query.modifier as string || 'None'
const timeLimitEnabled = route.query.timeLimitEnabled === 'true'


// =============================
// 🔁 Reactive State
// =============================
// Base
const code = ref('// Write code here')
const showDescriptionPopup = ref(false)
const question_data = ref<Question | null>(null)
const isLoading = ref(false)
const MODIFIER_BONUS = 1.25
// get player ID from auth
const player = getPlayerData();

// Composables setup
const { showNotification, notificationMessage, triggerNotification } = useNotification()
const { startSabotage, stopSabotage } = useSabotage(code, triggerNotification)
const { timeLeft, formattedTime, startTimer, stopTimer } = useTimer(timeLimitEnabled, question_data.value?.time_limit ?? 0, () => {
    showTimeoutPopup.value = true
})

// Time out
const showTimeoutPopup = ref(false)

// Result
const showResultPopup = ref(false)
const testResults = ref<{
    passed: boolean
    results: { passed: boolean; output: string; expected_output: string; input: string }[]
    total_score: number
} | null>(null)
const finalScore = ref(0);

// Clear
const showClearedPopup = ref(false)

// Confident
const showConfidentLostPopup = ref(false)


// =============================
// 🧪 Code Actions
// =============================
const runCode = async () => {
    console.log('Running code:', code.value)
}

const submitCode = async () => {
    if (!question_data.value) return
    isLoading.value = true
    try {
        console.log('Submitting code:', code.value)
        const baseLimit = question_data.value.time_limit || 1 // fallback to 1 to avoid division by 0
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
            test_cases: question_data.value.test_cases,
            // Score percentage based on timer, if its enabled check from time left, if disabled find time taken which would've left from based timer limit.
            scorePct: scorePct,
        })
        const data = res.data as CodeRunResponse

        testResults.value = {
            passed: data.total_score === question_data.value.test_cases.length,
            results: data.results.map((r, i) => ({
                passed: r.passed,
                output: r.output,
                expected_output: question_data.value!.test_cases[i].expected_output,
                input: question_data.value!.test_cases[i].input,
            })),
            total_score: data.total_score ?? 0,
        }
        console.log(testResults.value)
        if (selectedModifier === 'Sabotage' || selectedModifier === 'Confident') {
            finalScore.value = +(testResults.value.total_score * MODIFIER_BONUS).toFixed(3);
        } else {
            finalScore.value = testResults.value.total_score;
        }

        if (data.passed) {
            if (!player) {
                console.warn("Player is null; skipping score submission.");
                return;
            }
            console.log(player)

            showClearedPopup.value = true
            const scorePayload: ScoreSubmitRequest = {
                player_id: player.id!, // replace with actual player ID from state/store if dynamic
                question_id: question_data.value.id.toString(),
                score: finalScore.value,
                language: "c++", // optionally make this reactive if you're tracking language
                modifier_state: selectedModifier as "None" | "Sabotage" | "Confident",
            };

            try {
                const response = await api.post("/scores/submit", scorePayload);
                console.log("Score submitted:", scorePayload);
                console.log("Res:", response);
            } catch (submitError) {
                console.error("Score submission failed:", submitError);
            }
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
// 🖥️ Computed
// =============================

const fullScore = computed(() =>
    question_data.value?.test_cases?.reduce((acc, t) => acc + (t.score ?? 0), 0) ?? 0
)

// =============================
// 🚀 Lifecycle Hooks
// =============================
onMounted(async () => {
    // Fetch question
    const response = await api.get(`/questions?level=${level}`)
    question_data.value = response.data as Question

    // Modifiers on notifications
    if (selectedModifier === 'Confident') {
        triggerNotification('Confident mode you can only submit once, use it wisely.')
    }

    // Sabotage modifer handling
    if (selectedModifier === 'Sabotage') {
        startSabotage();
    }

    // Set timeLeft only after questionData is loaded
    if (timeLimitEnabled) {
        timeLeft.value = question_data.value.time_limit || 0
    }
    // Start the timer
    startTimer();
})

onUnmounted(() => {
    stopTimer()
    stopSabotage()
})
</script>

<style scoped>
.container {
    background-color: #d1d5db;
    padding: 5rem 6rem 3.6rem;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
    overflow-x: hidden;
}

.top-bar {
    position: relative;
    margin-bottom: 2rem;
    height: 40px;
}

.top-bar button {
    margin-top: 0;
    background-color: #9ca3af;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 20px;
}

.popup-toggle.fixed {
    display: flex;
    justify-content: center;
    padding: 0.5rem;
    z-index: 999;
}

.timer {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    font-weight: 600;
    font-size: 14px;
    color: black;
}

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

.loading-spinner {
    justify-self: flex-end;
    margin-left: 8px;
    font-size: 12px;
    font-style: italic;
    color: #555;
}
</style>