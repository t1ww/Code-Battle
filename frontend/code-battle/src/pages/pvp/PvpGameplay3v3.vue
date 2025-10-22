<!-- frontend\code-battle\src\pages\pvp\PvpGameplay3v3.vue -->
<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import { ref, inject, onMounted, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePvpGameStore } from '@/stores/game'
import { getPlayerData } from '@/stores/auth'
import router from '@/router'

// Components
import CodeEditor from '@/components/gameplay/CodeEditor.vue'
import CodeTerminal from '@/components/gameplay/CodeTerminal.vue'
import MessagePopup from '@/components/popups/MessagePopup.vue'
import PvpResultPopup from '@/components/popups/PvpResultPopup.vue'
import OpponentPanel from '@/components/gameplay/OpponentPanel.vue'
import VotePanel from '@/components/gameplay/votedraw/VotePanel.vue'
import QuestionBrowser from '@/components/gameplay/questiondescription/QuestionBrowser.vue'

// Composables
import { triggerNotification } from '@/composables/notificationService'
import { useSabotage } from '@/composables/useSabotage'
import { useTimer } from '@/composables/useTimer'
import { usePvpAction } from '@/composables/usePvpAction'
import { useTerminal } from "@/composables/useTerminal";
import { usePvpCode } from '@/composables/usePvpCode'
import { usePvpTeamChat } from '@/composables/usePvpTeamChat'

// - This is for 3v3
import { useTeamSync } from '@/composables/useTeamSync'

// =============================
// 🔁 Reactive State & Composables
// =============================
const gameStore = usePvpGameStore()
const player = getPlayerData()
const route = useRoute()
const DEV = inject('DEV') as boolean

// UI state
const showQuestionsPanel = ref(false)
const showOpponentPanel = ref(false)
const showVoteDrawPanel = ref(false)
const showChatPanel = ref(false)
const showClearedPopup = ref(false)
const showMessagePopup = ref(false)
const showResultPopup = ref(false)
const messagePopupTitle = ref('')
const messagePopupMessage = ref('')
const currentQuestionIndex = ref(0)
const selectedLanguage = ref('cpp')
const showDrawFeedback = ref(false)
const drawRequestedByTeam = ref('')
// Reactive chat messages
const { chatMessages, sendMessage: sendChatMessage } = usePvpTeamChat()

// =============================
// 📍 Query Params
// =============================
const selectedModifier = route.query.modifier as string || 'None'
const timeLimitEnabled = route.query.timeLimitEnabled === 'true'

// PvP code composable
const { codes, testResults, isLoading, submitCode, forceClearQuestion } = usePvpCode({ singleBufferMode: false })
const code = computed({
  get: () => codes.value[currentQuestionIndex.value].value,
  set: (val: string) => { codes.value[currentQuestionIndex.value].value = val }
})
// Timer
const PVP_TIME_LIMIT = 5400
const { timeLeft, formattedTime, startTimer, stopTimer } = useTimer(timeLimitEnabled, timeLimitEnabled ? PVP_TIME_LIMIT : 0, () => {
  // Time's up callback
  triggerNotification("Time's up! We'll end in a draw.", 2500)
  // End game as draw
  voteDraw();
})

// Sabotage
const doSabotageAll = false;
const sabotageInstances = codes.value.map(c => useSabotage(c, triggerNotification))
// Random sabotage
function sabotageRandom() {
  const randomIndex = Math.floor(Math.random() * sabotageInstances.length)
  sabotageInstances[randomIndex].sabotageOnce()
}
// All sabotage
function sabotageAll() {
  sabotageInstances.forEach(s => s.sabotageOnce())
}

// Hooker
function sabotageOnce() {
  if (doSabotageAll) {
    sabotageAll();
  } else {
    sabotageRandom();
  }
}

const {
  teamSabotagePoints,
  enemySabotagePoints,
  lockDrawVoteButton,
  sendSabotage,
  voteDraw,
  forfeit,
  enableForfeit,
  leaveGame
} = usePvpAction()

// Terminal
const { codeTerminal, startSession, sendInput, stopSession } = useTerminal();
const terminalOpen = ref(false)

const runCodeInteractive = () => {
  if (!code.value.trim()) return;

  stopSession();
  terminalOpen.value = true;
  codeTerminal.value?.pushOutput(`> New ${selectedLanguage.value.toUpperCase()} session started`);

  // Pass selected language here
  startSession(code.value, selectedLanguage.value);
};

// Toggle helpers
const toggleOpponentPanel = () => { showOpponentPanel.value = !showOpponentPanel.value }
const toggleVoteDrawPanel = () => { showVoteDrawPanel.value = !showVoteDrawPanel.value }
const toggleChatPanel = () => { showChatPanel.value = !showChatPanel.value }

// Player forfeit wrapper
async function handleForfeit() {
  if (!gameStore.gameId || !player?.player_id) return
  await forfeit()
}

// Message popup helper
function openErrorMessagePopup(title: string, message: string) {
  messagePopupTitle.value = title
  messagePopupMessage.value = message
  showMessagePopup.value = true
}

// ----------------------
// 🛠️ Helper functions
// ----------------------
async function helperSubmitCode() {
  try {
    const response = await submitCode(currentQuestionIndex.value, selectedLanguage.value)
    if (!response) return

    const { resultsForCurrent, error, alreadyCompleted } = response

    if (alreadyCompleted) {
      openErrorMessagePopup("Question already completed", "This question has already been fully passed.")
      return
    }

    if (error) {
      const output = (error as { output?: string }).output
      if (output?.startsWith('[Compilation Error]')) {
        openErrorMessagePopup('Compilation Error', output)
      } else if (output?.startsWith('[Runtime Error]')) {
        openErrorMessagePopup('Runtime Error', output)
      } else {
        openErrorMessagePopup('Server Error', String((error as any).message || JSON.stringify(error)))
      }
      return
    }

    if (resultsForCurrent) {
      if (resultsForCurrent.passed) {
        showClearedPopup.value = true
      } else {
        showResultPopup.value = true
      }
    }
  } catch (e) {
    openErrorMessagePopup('Unexpected Error', String(e))
    console.error('helperSubmitCode failed', e)
  }
}

function helperForceClearQuestion() {
  if (!DEV) return
  forceClearQuestion(currentQuestionIndex.value)
}

function handleQuestionProgress(data: any) {
  if (!data?.team) return
  const qIndex = data.questionIndex ?? currentQuestionIndex.value
  updateProgress(data.team, qIndex, data.progress, data.progressFullPass)

  const progressArr = gameStore.progress[data.team][qIndex]
  const testCasesFinished = Array.isArray(progressArr) && progressArr.every(Boolean)
  const questionFinished = !!gameStore.progressFullPass[data.team][qIndex]

  if (testCasesFinished && !questionFinished) {
    if (data.team === gameStore.playerTeam) {
      setTimeout(() => triggerNotification(
        "This question doesn't count yet — all test cases must pass in the same submission.",
        1800
      ), 2000)
    }
  }
}

function updateProgress(team: 'team1' | 'team2', questionIndex: number, progress: any, fullPass?: any) {
  if (!gameStore.progress[team]) gameStore.progress[team] = []
  if (!gameStore.progressFullPass) gameStore.progressFullPass = { team1: [], team2: [] }
  if (!gameStore.progressFullPass[team]) gameStore.progressFullPass[team] = []

  if (progress?.[questionIndex]) gameStore.progress[team][questionIndex] = progress[questionIndex]
  if (fullPass?.[questionIndex] !== undefined) gameStore.progressFullPass[team][questionIndex] = fullPass[questionIndex]
}

function handleGameEnd(data: { winner: 'team1' | 'team2' | 'draw', forfeitBy?: string, leaveBy?: string }) {
  showClearedPopup.value = false
  showMessagePopup.value = false
  showVoteDrawPanel.value = false
  showOpponentPanel.value = false
  showResultPopup.value = true
  gameStore.finished = true
  gameStore.winner = data.winner

  // Determine reason
  let reason = ''
  if (data.forfeitBy === gameStore.playerTeam) reason = 'You forfeited'
  if (data.forfeitBy === gameStore.opponentTeam) reason = 'Opponent forfeited'
  else if (data.leaveBy) reason = 'Opponent disconnected'

  gameStore.endReason = reason

  stopTimer()
  triggerNotification(`Game ended — winner: ${data.winner}`, 2500)
}

function endGame() {
  showResultPopup.value = false;
  router.replace({ name: 'PvpTypeSelect' });
}

// For 3v3
const { destroy: destroyTeamSync, localCursorIndex, teammateCursors } = useTeamSync({
  playerId: player?.player_id,
  codes,
  currentQuestionIndex
})

// =============================
// 🚀 Lifecycle Hooks
// =============================
import { usePvpSocket } from '@/composables/usePvpSocket'
import ChatPanel from '@/components/gameplay/ChatPanel.vue'

const { initPvpSockets } = usePvpSocket({
  playerId: player?.player_id,
  DEV,
  leaveGame,
  sabotageOnce,
  enableForfeit,
  handleQuestionProgress,
  handleGameEnd,
  sabotagePoints: teamSabotagePoints,
  enemySabotagePoints: enemySabotagePoints,
  timeLeft,
  timeLimitEnabled,
  PVP_TIME_LIMIT,
  onDrawRequested: (team) => {
    showDrawFeedback.value = true
    drawRequestedByTeam.value = team
  },
  onVoteDrawResult: (_votes, _totalPlayers) => {
    // Currently not used
  }
})

initPvpSockets()
onMounted(() => {
  startTimer()
})
onUnmounted(() => {
  destroyTeamSync()
})

const opponentTeamData = computed(() => {
  const opponent = gameStore.opponentTeamObj
  return opponent
    ? {
      player_id: opponent.players[0]?.player_id || "0",
      avatar_url: opponent.players[0]?.avatar_url || "",
      name: "Opponent Team",
    }
    : {
      player_id: "0",
      avatar_url: "",
      name: "Opponent Team not found",
    }
});
</script>

<template>
  <!-- Error message -->
  <MessagePopup v-if="showMessagePopup" :title="messagePopupTitle" :message="messagePopupMessage"
    :buttonOnClick="() => showMessagePopup = false" />

  <div class="container">
    <!-- Slide Panel Toggle -->
    <QuestionBrowser :show="showQuestionsPanel" :questions="gameStore.questions" :timeLimitEnabled="timeLimitEnabled"
      :selectedModifier="selectedModifier" v-model:currentQuestionIndex="currentQuestionIndex"
      @close="showQuestionsPanel = false" />

    <!-- In case question data is missing -->
    <template v-if="!gameStore.questions || gameStore.questions.length === 0">
      <div class="error-message">
        <p>Error: Question data is missing.</p>
        <p>Redirecting to level selection...</p>
      </div>
    </template>

    <!-- Top bar -->
    <div class="top-bar">
      <div v-if="!showQuestionsPanel" class="popup-toggle fixed">
        <button @click="showQuestionsPanel = true">▼</button>
      </div>
    </div>

    <!-- Code editor and run/submit buttons -->
    <div class="code-editor-wrapper">
      <div class="timer">
        Time Left:
        <span>{{ formattedTime }}</span>
      </div>
      <CodeEditor v-model="code" v-model:modelLanguage="selectedLanguage" @cursorMove="localCursorIndex = $event"
        :teammateCursors="teammateCursors" :currentQuestionIndex="currentQuestionIndex" />
    </div>

    <div class="buttons">
      <button @click="runCodeInteractive" :disabled="isLoading">Run code</button>
      <button @click="helperSubmitCode" :disabled="isLoading">
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

    <!-- Opponent panel with sliding toggle -->
    <transition name="slide-right">
      <div class="opponent-panel-wrapper" v-if="showOpponentPanel">
        <OpponentPanel :onClose="toggleOpponentPanel" :sendSabotage="sendSabotage" :opponent="opponentTeamData"
          :questions="gameStore.questions" :progress="gameStore.progress[gameStore.opponentTeam || 'team1'] || []"
          :progressFullPass="gameStore.progressFullPass?.[gameStore.opponentTeam || 'team1'] || []"
          :sabotagePoints="teamSabotagePoints" :enemySabotagePoints="enemySabotagePoints" />
      </div>
    </transition>

    <!-- Vote panel component slides in/out -->
    <transition name="slide-right">
      <div class="vote-panel-wrapper" v-show="showVoteDrawPanel">
        <VotePanel :showDrawFeedback="showDrawFeedback" :disabled="lockDrawVoteButton" @vote="voteDraw"
          @close="toggleVoteDrawPanel" @forfeit="handleForfeit" />
      </div>
    </transition>

    <!-- Vote panel component slides in/out -->
    <transition name="slide-right">
      <div class="chat-panel-wrapper" v-show="showChatPanel">
        <ChatPanel :onClose="toggleChatPanel"
          :user="{ name: player?.name || 'Unknown' }"
          :messages="chatMessages" :onSendMessage="sendChatMessage" />
      </div>
    </transition>

    <!-- Open buttons -->
    <div class="side-buttons">
      <button class="side-button" @click="toggleOpponentPanel"
        :style="{ visibility: showOpponentPanel || showChatPanel ? 'hidden' : 'visible' }">◀</button>
      <button class="side-button" @click="toggleVoteDrawPanel"
        :style="{ visibility: showVoteDrawPanel || showOpponentPanel || showChatPanel ? 'hidden' : 'visible' }">⚖</button>
      <button class="side-button" @click="toggleChatPanel"
        :style="{ visibility: showChatPanel || showOpponentPanel ? 'hidden' : 'visible' }">✉️</button>
    </div>
  </div>

  <!-- Question cleared popup (not game end) -->
  <MessagePopup v-if="showClearedPopup" title="Question cleared!" message="Nice job — question cleared. Keep going!"
    :buttonOnClick="() => { showClearedPopup = false }" />

  <!-- Game End result -->
  <PvpResultPopup :show="showResultPopup" :testResults="[testResults?.results || []]" :questions="gameStore.questions"
    :progress="gameStore.progress[gameStore.playerTeam || 'team1'] || []"
    :progressFullPass="gameStore.progressFullPass?.[gameStore.playerTeam || 'team1'] || []"
    :winner="gameStore.finished ? gameStore.winner : null" :endReason="gameStore.endReason"
    @close="showResultPopup = false" @endGame="endGame" />

  <div v-if="DEV" class="dev-buttons" style="position: fixed; bottom: 10px; right: 10px;">
    <button @click="helperForceClearQuestion"
      style="background: orange; color: white; padding: 6px 12px; border-radius: 4px;">
      Force Clear Question
    </button>
    <button @click="handleForfeit" style="background: orange; color: white; padding: 6px 12px; border-radius: 4px;">
      Forfeit Game
    </button>
  </div>
</template>

<style lang="css" src="@/styles/gameplay.css"></style>
<style scoped></style>