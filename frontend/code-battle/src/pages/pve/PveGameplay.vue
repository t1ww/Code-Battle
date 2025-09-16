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

import QuestionDescriptionPanel from '@/components/gameplay/QuestionDescriptionPanel.vue'

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
const code = ref(`// Write code here
int main() {
    return 0;
}`);

const showDescriptionPopup = ref(false)
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
    results: { passed: boolean; output: string; expected_output: string; input: string }[]
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


// =============================
// 🧪 Code Actions
// =============================
// Replace Run Code button to just focus the terminal or echo input
const runCodeInteractive = () => {
    if (!code.value.trim()) return;

    // Stop previous session
    stopSession();

    // Open the terminal
    terminalOpen.value = true;
    codeTerminal.value?.pushOutput("> New session started");

    // Start a new session
    startSession(code.value)
};


const submitCode = async () => {
    if (!question_data.value) return
    isLoading.value = true

    try {
        console.log('Submitting code:', code.value)
        const baseLimit = question_data.value.time_limit || 1
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

        // Normal test results
        testResults.value = {
            passed: data.total_score === question_data.value.test_cases.length,
            results: data.results.map((r, i) => ({
                passed: r.passed,
                output: r.output,
                expected_output: question_data.value!.test_cases[i].expected_output,
                input: question_data.value!.test_cases[i].input,
            })),
            total_score: parseFloat(data.total_score as unknown as string) || 0,
        }

        finalScore.value = (selectedModifier === 'Sabotage' || selectedModifier === 'Confident')
            ? +(testResults.value.total_score * MODIFIER_BONUS).toFixed(3)
            : testResults.value.total_score

        if (data.passed) {
            if (!player) {
                console.warn("Player is null; skipping score submission.")
                return
            }

            stopTimer()
            showClearedPopup.value = true

            const scorePayload: ScoreSubmitRequest = {
                player_id: player.player_id!,
                question_id: question_data.value.id.toString(),
                score: finalScore.value,
                language: "c++",
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
            <button @click="runCodeInteractive" :disabled="isLoading">Run code</button>
            <button @click="submitCode" :disabled="isLoading">
                Submit
            </button>
        </div>

        <!-- Terminal under the editor -->
        <button class="terminal-toggle" @click="terminalOpen = true"
            :style="{ visibility: terminalOpen ? 'hidden' : 'visible' }">
            Show Terminal ▲
        </button>

        <transition name="slide-down">
            <div class="terminal-wrapper" v-show="terminalOpen">
                <CodeTerminal ref="codeTerminal" @close="terminalOpen = false" :sendInput="sendInput" />
            </div>
        </transition>

        <div class="buttons">
            <span v-if="isLoading" class="loading-spinner">Loading...</span>
        </div>

        <!-- Slide Panel Toggle -->
        <QuestionDescriptionPanel :show="showDescriptionPopup" :question="question_data" :timeLimitEnabled="timeLimitEnabled"
            :selectedModifier="selectedModifier" @close="showDescriptionPopup = false" />

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