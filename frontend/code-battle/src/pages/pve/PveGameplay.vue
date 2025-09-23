<!-- frontend\code-battle\src\pages\pve\PveGameplay.vue -->
<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import type { CodeRunResponse, ScoreSubmitRequest } from '@/types/types'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getPlayerData } from '@/stores/auth'
import codeRunnerApi from '@/clients/coderunner.api'
import CodeEditor from '@/components/gameplay/CodeEditor.vue'
import CodeTerminal from '@/components/gameplay/CodeTerminal.vue'
import router from '@/router'
import api from '@/clients/crud.api'

// Composables
import { triggerNotification } from '@/composables/notificationService'
import { useSabotage } from '@/composables/useSabotage'
import { useTimer } from '@/composables/useTimer'
import { useTerminal } from "@/composables/useTerminal";
const { codeTerminal, startSession, sendInput, stopSession } = useTerminal();

// Popup components
import ResultPopup from '@/components/popups/ResultPopup.vue'
import ConfidentLostPopup from '@/components/popups/ConfidentLostPopup.vue'
import TimeoutPopup from '@/components/popups/TimeoutPopup.vue'
import ClearedPopup from '@/components/popups/ClearedPopup.vue'
import MessagePopup from '@/components/popups/MessagePopup.vue'
import QuestionBrowser from '@/components/gameplay/questiondescription/QuestionBrowser.vue'

// Stores
import { useQuestionStore } from '@/stores/questionStore'
const { question_data } = useQuestionStore()

// =============================
// 📍 Route & Query Params
// =============================
const route = useRoute()
const selectedModifier = route.query.modifier as string || 'None'
const timeLimitEnabled = route.query.timeLimitEnabled === 'true'


// =============================
// 🔁 Reactive State
// =============================
// Base
const code = ref(`// Write code here`);

const showQuestionsPanel = ref(false)
const currentQuestionIndex = ref(0)
const isLoading = ref(false)
const MODIFIER_BONUS = 1.25
// get player ID from auth
const player = getPlayerData();

// Composables setup
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
    results: { passed: boolean; output: string; expected_output: string; input: string; score?: number }[]
    total_score: number
} | null>(null)
const finalScore = ref(0);

// Clear
const showClearedPopup = ref(false)

// Confident
const showConfidentLostPopup = ref(false)

// Message Popup
const showMessagePopup = ref(false)
const messagePopupTitle = ref('')
const messagePopupMessage = ref('')

function openMessagePopup(title: string, message: string) {
    messagePopupTitle.value = title
    messagePopupMessage.value = message
    showMessagePopup.value = true
}

// Terminal
const terminalOpen = ref(false) // default close
const selectedLanguage = ref('cpp')

// =============================
// 🧪 Code Actions
// =============================
// Replace Run Code button to just focus the terminal or echo input
const runCodeInteractive = () => {
    if (!code.value.trim()) return;

    // Stop previous session
    stopSession();

    // Log to console for debugging
    console.log("Running code:", code.value);

    // Open the terminal
    terminalOpen.value = true;
    codeTerminal.value?.pushOutput("> New session started");

    // Start a new session
    startSession(code.value)
};


// -----------------
// 🛠️ Helpers
// -----------------
/**
 * Map API results to our internal shape and compute a self-derived total_score.
 * - For each test case we will compute a per-test score using question.test_cases[i].score (fallback to 1)
 * - total_score is the sum of per-test scores for passed tests, multiplied by scorePct (0..1)
 * - returns numbers rounded to 3 decimals
 */
function mapTestResults(data: CodeRunResponse, question: any, scorePct = 1) {
    const perTest = data.results.map((r, i) => {
        const tc = question.test_cases?.[i] ?? {}
        const tcScore = Number(tc.score ?? 1) // fallback score per test
        const passed = !!r.passed
        const computedScore = +((passed ? tcScore : 0) * scorePct).toFixed(3)
        return {
            passed,
            output: r.output,
            expected_output: tc.expected_output,
            input: tc.input,
            score: computedScore
        }
    })
    const passedCount = perTest.filter(p => p.passed).length

    const total_score = +perTest.reduce((acc, t) => acc + (t.score ?? 0), 0).toFixed(3)

    return {
        passed: passedCount === (question.test_cases?.length ?? 0),
        results: perTest,
        total_score
    }
}

// =============================
// 🧪 Submission / run
// =============================
const submitCode = async () => {
    if (!question_data.value) return
    isLoading.value = true

    try {
        console.log('Submitting code:', code.value)
        const baseLimit = question_data.value.time_limit || 1
        let scorePct = 1

        if (timeLimitEnabled) {
            // fraction of time remaining
            scorePct = timeLeft.value / baseLimit
        } else {
            // if no time limit, approximate score by fraction of time used (keep existing behaviour)
            const timeUsed = baseLimit - timeLeft.value
            scorePct = timeUsed / baseLimit
        }

        // clamp
        scorePct = Math.max(0, Math.min(1, scorePct))

        console.log('Timer pct:', scorePct)

        const res = await codeRunnerApi.post('/run', {
            code: code.value,
            test_cases: question_data.value.test_cases,
            score_pct: scorePct,
        })

        const data = res.data as CodeRunResponse

        // Check for compile/runtime errors first
        const errorResult = data.results.find(r =>
            r.output.startsWith('[Compilation Error]') || r.output.startsWith('[Runtime Error]')
        )

        if (errorResult) {
            openMessagePopup(
                errorResult.output.startsWith('[Compilation Error]') ? 'Compilation Error' : 'Runtime Error',
                "---------- < Fix it before submitting! :D > ----------"
            )
            return // stop further processing
        }

        // Map results (we compute per-test scores here so the client owns the scoring logic)
        const mapped = mapTestResults(data, question_data.value, scorePct)
        testResults.value = mapped

        // Use mapped total_score (client-computed) and then apply modifier bonus if applicable
        finalScore.value = (selectedModifier === 'Sabotage' || selectedModifier === 'Confident')
            ? +(mapped.total_score * MODIFIER_BONUS).toFixed(3)
            : mapped.total_score

        // If all tests passed according to our mapping
        if (mapped.passed) {
            if (!player) {
                console.warn("Player is null; skipping score submission.")
                // still show cleared popup locally
                stopTimer()
                showClearedPopup.value = true
                return
            }

            stopTimer()
            showClearedPopup.value = true

            // Map your internal language keys to display/backend values
            const languageMap: Record<string, string> = {
                cpp: "C++",
                java: "Java",
                py: "Python",
            }

            // Get the mapped value
            const languageKey = selectedLanguage.value || 'cpp'
            const language = languageMap[languageKey] || "C++"

            const scorePayload: ScoreSubmitRequest = {
                player_id: player.player_id!,
                question_id: question_data.value.id.toString(),
                score: finalScore.value,
                language: language,
                modifier_state: selectedModifier as "None" | "Sabotage" | "Confident",
            }

            try {
                const response = await api.post("/scores/submit", scorePayload)
                console.log("Score submitted:", scorePayload)
                console.log("Res:", response)
            } catch (submitError) {
                console.error("Score submission failed:", submitError)
            }

        } else {
            // not all tests passed
            if (selectedModifier === 'Confident') {
                showConfidentLostPopup.value = true
            } else {
                showResultPopup.value = true
            }
        }

    } catch (error) {
        console.error('Code run failed:', error)
        openMessagePopup('Server Error', String((error as any).message || error))
    } finally {
        isLoading.value = false
    }
}

// =============================
// 🧪 Restart
// =============================
const restartGame = () => {
    code.value = '// Write code here';
    isLoading.value = false;
    showTimeoutPopup.value = false;
    showResultPopup.value = false;
    showClearedPopup.value = false;
    showConfidentLostPopup.value = false;
    testResults.value = null;
    finalScore.value = 0;
    timeLeft.value = question_data.value?.time_limit ?? 0;
    startTimer();
};

// =============================
// 🖥️ Computed
// =============================

const totalPossibleScore = computed(() =>
    question_data.value?.test_cases?.reduce((acc, t) => acc + (t.score ?? 0), 0) ?? 0
)
const clearedCount = computed(() => {
    if (!testResults.value) return 0
    return testResults.value.results.filter(r => r.passed).length
})
const modifierBonusApplied = computed(() => {
    return (selectedModifier === 'Sabotage' || selectedModifier === 'Confident') ? MODIFIER_BONUS : 1
})

// =============================
// 🚀 Lifecycle Hooks
// =============================
onMounted(async () => {
    // Don't need to Fetch question anymore
    if (!question_data.value) {
        setTimeout(() => {
            router.push({ name: 'PveLevelSelect' })
        }, 2000)
        return;
    }

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
    stopSession()
    codeTerminal.value?.pushOutput("> Session ended.");
})
</script>

<template>
    <MessagePopup v-if="showMessagePopup" :title="messagePopupTitle" :message="messagePopupMessage"
        :buttonOnClick="() => showMessagePopup = false" />

    <div class="container">
        <!-- In case question data is missing -->
        <template v-if="!question_data">
            <div class="error-message">
                <p>Error: Question data is missing.</p>
                <p>Redirecting to level selection...</p>
            </div>
        </template>

        <!-- Top bar -->
        <div class="top-bar">
            <!-- Toggle Button when hidden -->
            <div v-if="!showQuestionsPanel" class="popup-toggle fixed">
                <button @click="showQuestionsPanel = true">▼</button>
            </div>
            <div class="timer">
                Time Left:
                <span>{{ formattedTime }}</span>
            </div>
        </div>

        <!-- Code editor and run/submit buttons -->
        <div class="code-editor-wrapper">
            <CodeEditor v-model="code" v-model:modelLanguage="selectedLanguage" />
        </div>

        <div class="buttons">
            <button @click="runCodeInteractive" :disabled="isLoading">Run code</button>
            <button @click="submitCode" :disabled="isLoading">
                Submit
            </button>
        </div>

        <transition name="slide-down">
            <div class="terminal-wrapper" v-show="terminalOpen">
                <CodeTerminal ref="codeTerminal" @close="terminalOpen = false" :sendInput="sendInput" />
            </div>
        </transition>

        <div class="buttons">
            <span v-if="isLoading" class="loading-spinner">Loading...</span>
        </div>

        <!-- Slide Panel Toggle -->
        <QuestionBrowser :show="showQuestionsPanel" :questions="[question_data]" :timeLimitEnabled="timeLimitEnabled"
            :selectedModifier="selectedModifier" v-model:currentQuestionIndex="currentQuestionIndex"
            @close="showQuestionsPanel = false" />

        <!-- Submission result -->
        <ResultPopup :show="showResultPopup" :finalScore="finalScore"
            :totalPossibleScore="question_data?.test_cases?.reduce((acc, t) => acc + (t.score ?? 0), 0) ?? 0"
            :testResults="testResults?.results || []" @close="showResultPopup = false" />

    </div>

    <!-- Game ends -->
    <!-- By timer -->
    <TimeoutPopup v-if="showTimeoutPopup" @restart="restartGame" />

    <!-- By clear -->
    <ClearedPopup v-if="showClearedPopup" :timeLeft="formattedTime" :finalScore="finalScore"
        :totalPossibleScore="totalPossibleScore" :clearedCount="clearedCount" :modifierName="selectedModifier"
        :modifierBonus="modifierBonusApplied" @restart="restartGame" />


    <!-- By confident lost -->
    <ConfidentLostPopup v-if="showConfidentLostPopup" :finalScore="finalScore"
        @close="showConfidentLostPopup = false" />

</template>

<style lang="css" src="@/styles/gameplay.css"></style>
<style scoped></style>