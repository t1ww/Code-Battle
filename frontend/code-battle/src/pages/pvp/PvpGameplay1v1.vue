<!-- frontend\code-battle\src\pages\pvp\PvpGameplay1v1.vue -->
<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import type { CodeRunResponse } from '@/types/types'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getPlayerData } from '@/stores/auth'
import codeRunnerApi from '@/clients/coderunner.api'
import CodeEditor from '@/components/gameplay/CodeEditor.vue'
import router from '@/router'
import { socket } from '@/clients/socket.api'

// Composables
import { triggerNotification } from '@/composables/notificationService'
import { useSabotage } from '@/composables/useSabotage'
import { useTimer } from '@/composables/useTimer'

// Popup components
import ResultPopup from '@/components/popups/ResultPopup.vue'
import DescriptionPopup from '@/components/popups/DescriptionPopup.vue'
import MessagePopup from '@/components/popups/MessagePopup.vue'
// pvp
import OpponentPanel from '@/components/gameplay/OpponentPanel.vue'
import VotePanel from '@/components/gameplay/VotePanel.vue'

// Stores
import { useQuestionStore } from '@/stores/questionStore'
const { question_data } = useQuestionStore()

// Constant
const PVP_TIME_LIMIT = 5400

// =============================
// 📍 Route & Query Params
// =============================
const route = useRoute()
const selectedModifier = route.query.modifier as string || 'None'
const timeLimitEnabled = route.query.timeLimitEnabled === 'true'

// =============================
// 🔁 Reactive State
// =============================
const code = ref('// Write code here')
const player = getPlayerData();
const isLoading = ref(false)
const showDescriptionPopup = ref(false)
const showOpponentPanel = ref(false)
const showVoteDrawPanel = ref(false)
const lockDrawVoteButton = ref(false)

// Toggle functions
function toggleOpponentPanel() {
    showOpponentPanel.value = !showOpponentPanel.value
}

function triggerDrawVote() {
    lockDrawVoteButton.value = true
}

// toggle
function toggleVoteDrawPanel() {
    showVoteDrawPanel.value = !showVoteDrawPanel.value
}

// update handleVoteDraw to close the vote panel after voting
function handleVoteDraw() {
    triggerDrawVote() // sets showDrawVoteButton true

    try {
        socket.emit('voteDraw', { player_id: player?.player_id })
    } catch (e) {
        console.warn('voteDraw socket emit failed', e)
    }

    triggerNotification('Voted for a draw', 1500)

    // close the small vote panel UI
    showVoteDrawPanel.value = false
}

// Composables setup
const { sabotageOnce } = useSabotage(code, triggerNotification)
const { timeLeft, formattedTime, startTimer, stopTimer } = useTimer(true, 5400, () => {
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
const finalScore = ref(0)

// Clear
const showClearedPopup = ref(false)

// Message Popup
const showMessagePopup = ref(false)
const messagePopupTitle = ref('')
const messagePopupMessage = ref('')

function openMessagePopup(title: string, message: string) {
    messagePopupTitle.value = title
    messagePopupMessage.value = message
    showMessagePopup.value = true
}

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
        const res = await codeRunnerApi.post('/run', {
            code: code.value,
            test_cases: question_data.value.test_cases,
            score_pct: 1, // PvP: ignore time bonus
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
            return
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

        finalScore.value = testResults.value.total_score

        if (data.passed) {
            showClearedPopup.value = true
        } else {
            showResultPopup.value = true
        }

    } catch (error) {
        console.error('Code run failed:', error)
        openMessagePopup('Server Error', String((error as any).message || error))
    } finally {
        isLoading.value = false
    }
}

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

// =============================
// 🚀 Lifecycle Hooks
// =============================
onMounted(async () => {
    if (!question_data.value) {
        // Inject dummy question for dev
        question_data.value = {
            id: 1,
            question_name: "Dummy Question",
            description: "Add two numbers together.",
            time_limit: 10,
            level: "Easy",
            test_cases: [
                { input: "1 2", expected_output: "3", score: 1 },
                { input: "5 7", expected_output: "12", score: 1 },
            ]
        }
    }
    if (!question_data.value) {
        setTimeout(() => {
            router.push({ name: 'PveLevelSelect' })
        }, 2000)
        return
    }

    // Listen for sabotage from opponent via socket
    socket.on("sabotageReceived", () => {
        sabotageOnce()
    })

    // Start fixed timer: 1h30m
    if (timeLimitEnabled) { timeLeft.value = PVP_TIME_LIMIT || 0 }
    startTimer()
})

onUnmounted(() => {
    stopTimer()
    socket.off("sabotageReceived")
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

        <!-- Opponent panel with sliding toggle -->
        <transition name="slide">
            <div class="opponent-panel-wrapper" v-if="showOpponentPanel">
                <OpponentPanel :onClose="toggleOpponentPanel" />
            </div>
        </transition>

        <!-- Vote panel component slides in/out; transition attaches classes to its root .vote-panel-wrapper -->
        <transition name="slide">
            <div class="vote-panel-wrapper" v-if="showVoteDrawPanel">
                <VotePanel :disabled="lockDrawVoteButton" @vote="handleVoteDraw" @close="toggleVoteDrawPanel" />
            </div>
        </transition>

        <!-- Open buttons (always rendered, just toggle visibility) -->
        <div class="side-buttons">
            <!-- open opponent panel -->
            <button class="side-button" @click="toggleOpponentPanel"
                :style="{ visibility: showOpponentPanel ? 'hidden' : 'visible' }">◀</button>

            <!-- toggle vote panel (small icon button) -->
            <button class="side-button" @click="toggleVoteDrawPanel"
                :style="{ visibility: showVoteDrawPanel || showOpponentPanel ? 'hidden' : 'visible' }">⚖</button>
        </div>
    </div>

    <!-- Game ends -->
    <MessagePopup v-if="showClearedPopup" title="Game ended" message="You win or lost"
        :buttonOnClick="() => { router.replace({ name: 'PveLevelSelect' }) }"></MessagePopup>
</template>

<style lang="css" src="@/styles/gameplay.css"></style>
<style scoped></style>