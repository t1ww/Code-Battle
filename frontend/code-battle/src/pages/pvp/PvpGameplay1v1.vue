<!-- frontend\code-battle\src\pages\pvp\PvpGameplay1v1.vue -->
<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import type { CodeRunResponse } from '@/types/types'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePvpGameStore } from '@/stores/usePvpGameStore'
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
import MessagePopup from '@/components/popups/MessagePopup.vue'

import QuestionDescriptionPanel from '@/components/gameplay/QuestionDescriptionPanel.vue'

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
const gameStore = usePvpGameStore()
const code = ref('// Write code here')
const player = getPlayerData();
const isLoading = ref(false)
const showDescriptionPopup = ref(false)
const showOpponentPanel = ref(false)
const showVoteDrawPanel = ref(false)
const lockDrawVoteButton = ref(false)
const sabotagePoint = ref(3)
const showClearedPopup = ref(false)
const showMessagePopup = ref(false)
const messagePopupTitle = ref('')
const messagePopupMessage = ref('')
const showTimeoutPopup = ref(false)
const showResultPopup = ref(false)

// Toggle functions
function toggleOpponentPanel() { showOpponentPanel.value = !showOpponentPanel.value }
function triggerDrawVote() {
  lockDrawVoteButton.value = true;
  showVoteDrawPanel.value = false
}

// toggle
function toggleVoteDrawPanel() { showVoteDrawPanel.value = !showVoteDrawPanel.value }

// Composables setup
const { sabotageOnce } = useSabotage(code, triggerNotification)
const { timeLeft, formattedTime, startTimer, stopTimer } = useTimer(true, 5400, () => {
  showTimeoutPopup.value = true
})

const testResults = ref<{
  passed: boolean
  results: { passed: boolean; output: string; expected_output: string; input: string }[]
  total_score: number
} | null>(null)
const finalScore = ref(0)

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

// ----------------------
// 🖥️ Multiplayer Actions
// ----------------------
function sendSabotage() {
  if (sabotagePoint.value <= 0) {
    triggerNotification("No sabotage points left!", 1200);
    return;
  }
  if (!gameStore.playerTeam || !gameStore.gameId) {
    triggerNotification("Game not ready yet!", 1200); // <--- add this
    return;
  }

  socket.emit("sabotage", {
    gameId: gameStore.gameId,
    targetTeam: gameStore.opponentTeam,
  });

  sabotagePoint.value--;
  triggerNotification(`Sabotage sent! You have ${sabotagePoint.value} sabotages left.`, 1200);
}

function voteDraw() {
  try {
    socket.emit("voteDraw", {
      gameId: route.query.gameId,
      player_id: player?.player_id
    });
    triggerNotification("Voted for a draw", 1200);
    triggerDrawVote();
  } catch (e) {
    console.error("Failed to vote draw:", e);
    triggerNotification("Failed to vote draw", 1200);
  }
}

// =============================
// 🚀 Lifecycle Hooks
// =============================
onMounted(async () => {
  // Check if player has a valid game
  if (!gameStore.gameId) {
    triggerNotification("No active game found. Redirecting to game selection.", 2000);
    router.replace({ name: 'PvpTypeSelect' })
    return
  }

  // Fetch game state from server
  socket.emit("getGameState", { gameId: gameStore.gameId })

  // Listen for game state response
  socket.once("gameState", (game) => {
    gameStore.questions = game.questions
    gameStore.progress = game.progress
    gameStore.team1 = game.team1
    gameStore.team2 = game.team2
    gameStore.finished = game.finished
    gameStore.playerTeam = game.playerTeam

    question_data.value = gameStore.questions[0];
    // 🔹 Log the full game state
    console.log("Game state received:", {
      gameId: gameStore.gameId,
      playerTeam: gameStore.playerTeam,
      opponentTeam: gameStore.opponentTeam,
      team1: gameStore.team1,
      team2: gameStore.team2,
      questions: gameStore.questions,
      progress: gameStore.progress,
      finished: gameStore.finished
    })
  })

  // Handle error messages from server
  socket.once("errorMessage", () => {
    router.replace({ name: 'PvpTypeSelect' })
  })

  // Listen for sabotage
  socket.on("sabotageReceived", () => { sabotageOnce() })

  // Listen for draw vote results
  socket.on("voteDrawResult", (data: { votes: number, totalPlayers: number }) => {
    triggerNotification(`Draw vote: ${data.votes}/${data.totalPlayers} voted`, 1200);
  });

  // Start timer if enabled
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
      <button @click="submitCode" :disabled="isLoading">Submit</button>
    </div>
    <div class="buttons">
      <span v-if="isLoading" class="loading-spinner">Loading...</span>
    </div>

    <!-- Slide Panel Toggle -->
    <QuestionDescriptionPanel :show="showDescriptionPopup" :question="question_data"
      :timeLimitEnabled="timeLimitEnabled" :selectedModifier="selectedModifier" @close="showDescriptionPopup = false" />

    <!-- Submission result -->
    <ResultPopup :show="showResultPopup" :finalScore="finalScore"
      :totalPossibleScore="question_data?.test_cases?.reduce((acc, t) => acc + (t.score ?? 0), 0) ?? 0"
      :testResults="testResults?.results || []" @close="showResultPopup = false" />

    <!-- Opponent panel with sliding toggle -->
    <transition name="slide-right">
      <div class="opponent-panel-wrapper" v-if="showOpponentPanel">
        <OpponentPanel :onClose="toggleOpponentPanel" :sendSabotage="sendSabotage"
          :opponent="gameStore.opponentTeamObj?.players[0]" :questions="gameStore.questions"
          :progress="gameStore.progress[gameStore.opponentTeam || 'team1'] || {}" :sabotagePoints="sabotagePoint" />
      </div>
    </transition>

    <!-- Vote panel component slides in/out -->
    <transition name="slide-right">
      <div class="vote-panel-wrapper" v-if="showVoteDrawPanel">
        <VotePanel :disabled="lockDrawVoteButton" @vote="voteDraw" @close="toggleVoteDrawPanel" />
      </div>
    </transition>

    <!-- Open buttons -->
    <div class="side-buttons">
      <button class="side-button" @click="toggleOpponentPanel"
        :style="{ visibility: showOpponentPanel ? 'hidden' : 'visible' }">◀</button>
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
