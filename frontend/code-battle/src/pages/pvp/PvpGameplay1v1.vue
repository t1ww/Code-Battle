<!-- frontend\code-battle\src\pages\pvp\PvpGameplay1v1.vue -->
<script setup lang="ts">
// =============================
// 📦 Imports
// =============================
import type { CodeRunResponse } from '@/types/types'
import { ref, onMounted, onUnmounted, inject } from 'vue'
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
import MessagePopup from '@/components/popups/MessagePopup.vue'
import PvpResultPopup from '@/components/popups/PvpResultPopup.vue'

// pvp
import OpponentPanel from '@/components/gameplay/OpponentPanel.vue'
import VotePanel from '@/components/gameplay/VotePanel.vue'

// Stores
import QuestionBrowser from '@/components/gameplay/QuestionBrowser.vue'

// Terminal
import { useTerminal } from "@/composables/useTerminal";
import CodeTerminal from '@/components/gameplay/CodeTerminal.vue'

const { codeTerminal, startSession, sendInput, stopSession } = useTerminal();

const terminalOpen = ref(false); // default closed
const runCodeInteractive = () => {
  if (!code.value.trim()) return;

  // Stop any previous session
  stopSession();

  console.log("Running code:", code.value);

  // Open terminal
  terminalOpen.value = true;
  codeTerminal.value?.pushOutput("> New session started");

  // Start a new session with the current code
  startSession(code.value);
};

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
const showQuestionsPanel = ref(false)
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
const currentQuestionIndex = ref(0)
const selectedLanguage = ref('cpp')
const forfeitEnabled = ref(false);

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

function openErrorMessagePopup(title: string, message: string) {
  messagePopupTitle.value = title
  messagePopupMessage.value = message
  showMessagePopup.value = true
}

// =============================
// 🧪 Code Actions
// =============================
const submitCode = async () => {
  isLoading.value = true;
  try {
    const currentQuestion = gameStore.questions[currentQuestionIndex.value];
    if (!currentQuestion) return;

    // Prevent full-pass questions from being submitted again
    const teamKey = gameStore.playerTeam
    if (teamKey != null && gameStore.progressFullPass?.[teamKey]?.[currentQuestionIndex.value]) {
      triggerNotification("Question already completed (full pass).", 1200);
      return;
    }

    const data = await runCodeOnApi(code.value, currentQuestion.test_cases);

    const resultsForCurrent = mapTestResults(data, currentQuestion);

    testResults.value = resultsForCurrent;
    // Determine passed test indices for this submission
    const passedIndices = resultsForCurrent.results
      .map((r, i) => (r.passed ? i : -1))
      .filter(i => i >= 0);

    // Save local progress view (optional)
    saveProgress(currentQuestionIndex.value, resultsForCurrent);

    // If any test cases were passed, inform server with the indices
    if (passedIndices.length > 0 && gameStore.gameId && gameStore.playerTeam) {
      socket.emit('questionFinished', {
        gameId: gameStore.gameId,
        team: gameStore.playerTeam,
        questionIndex: currentQuestionIndex.value,
        passedIndices
      });
    }

    // If entire question passed (all tests), show question cleared popup
    const allPassedForQuestion = resultsForCurrent.results.every(r => r.passed);
    if (allPassedForQuestion) {
      showClearedPopup.value = true;
    } else {
      showResultPopup.value = true;
    }

  } catch (error) {
    console.error('Code run failed:', error)
    openErrorMessagePopup('Server Error', String((error as any).message || error))
  } finally {
    isLoading.value = false
  }
}

// -----------------
// 🛠️ Helpers
// -----------------
async function runCodeOnApi(code: string, test_cases: any[]) {
  const res = await codeRunnerApi.post('/run', { code, test_cases, score_pct: 1 })
  const data = res.data as CodeRunResponse

  const errorResult = data.results.find(r =>
    r.output.startsWith('[Compilation Error]') || r.output.startsWith('[Runtime Error]')
  )

  if (errorResult) {
    openErrorMessagePopup(
      errorResult.output.startsWith('[Compilation Error]') ? 'Compilation Error' : 'Runtime Error',
      "---------- < Fix it before submitting! :D > ----------"
    )
    throw new Error('Code execution failed')
  }

  return data
}

function mapTestResults(data: CodeRunResponse, question: any) {
  const perTest = data.results.map((r, i) => ({
    passed: !!r.passed,
    output: r.output,
    expected_output: question.test_cases[i].expected_output,
    input: question.test_cases[i].input,
  }));
  const passedCount = perTest.filter(p => p.passed).length;

  return {
    passed: passedCount === (question.test_cases?.length ?? 0),
    results: perTest,
    total_score: Number(data.total_score) || passedCount
  };
}

function saveProgress(questionIndex: number, results: any) {
  const teamKey = gameStore.playerTeam || 'team1';
  if (!gameStore.progress[teamKey]) gameStore.progress[teamKey] = [];

  // store a boolean[] per-test so progress shape matches server (boolean[][])
  const perTestBooleans = (results?.results ?? []).map((r: any) => !!r.passed);

  gameStore.progress[teamKey][questionIndex] = perTestBooleans;

  console.log('questions ids:', gameStore.questions.map((q, i) => ({ i, id: q.id, level: q.level })));
  console.log('progress lengths:', {
    team1: (gameStore.progress.team1 || []).length,
    team2: (gameStore.progress.team2 || []).length
  });
}

function updateGameState(game: any) {
  gameStore.gameId = game.gameId
  gameStore.questions = game.questions
  gameStore.progress = game.progress
  gameStore.progressFullPass = game.progressFullPass || { team1: [], team2: [] }
  gameStore.team1 = game.team1
  gameStore.team2 = game.team2
  gameStore.playerTeam = game.playerTeam
  gameStore.finished = game.finished
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
}

function updateProgress(team: 'team1' | 'team2', questionIndex: number, progress: any, fullPass?: any) {
  if (!gameStore.progress[team]) gameStore.progress[team] = [];
  if (!gameStore.progressFullPass) gameStore.progressFullPass = { team1: [], team2: [] };
  if (!gameStore.progressFullPass[team]) gameStore.progressFullPass[team] = [];

  if (progress?.[questionIndex]) gameStore.progress[team][questionIndex] = progress[questionIndex];
  if (fullPass?.[questionIndex] !== undefined) gameStore.progressFullPass[team][questionIndex] = fullPass[questionIndex];
}

function endGame() {
  showResultPopup.value = false;
  router.replace({ name: 'PvpTypeSelect' });
}
// =============================
// 🖥️ Computed
// =============================

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

function handleForfeit() {
  if (!gameStore.gameId || !player?.player_id) return;
  socket.emit('forfeit', { gameId: gameStore.gameId, player_id: player.player_id });
  triggerNotification("You forfeited the game.", 1200);
}


// -----------------
// 🛠️ DEV Helpers
// -----------------
function forceClearQuestion() {
  if (!DEV) return; // only in DEV
  const teamKey = gameStore.playerTeam || 'team1';
  const qIndex = currentQuestionIndex.value;

  // mark all tests as passed locally
  const question = gameStore.questions[qIndex];
  if (!question) return;

  const allPassed = question.test_cases.map(() => true);
  if (!gameStore.progress[teamKey]) gameStore.progress[teamKey] = [];
  if (!gameStore.progressFullPass[teamKey]) gameStore.progressFullPass[teamKey] = [];

  gameStore.progress[teamKey][qIndex] = allPassed;
  gameStore.progressFullPass[teamKey][qIndex] = true;

  showClearedPopup.value = true;

  console.log(`DEV: Force cleared question ${qIndex} for ${teamKey}`);

  // Emit to backend like a normal full pass
  if (gameStore.gameId && gameStore.playerTeam) {
    socket.emit('questionFinished', {
      gameId: gameStore.gameId,
      team: teamKey,
      questionIndex: qIndex,
      passedIndices: allPassed.map((_: any, i: any) => i) // mark all test cases as passed
    });
    triggerNotification(`DEV: Question ${qIndex} force-cleared and emitted to backend!`, 1200);
  }
}

// =============================
// 🚀 Lifecycle Hooks
// =============================
const DEV = inject('DEV') as boolean

onMounted(async () => {
  // Ensure we have a game ID
  if (!gameStore.gameId) {
    if (DEV) {
      console.log("DEV mode: Creating dummy game...");
      try {
        socket.emit("createDevGame", { playerId: player?.player_id });
      } catch (err) {
        console.error("Failed to create DEV game:", err);
      }
    } else {
      triggerNotification("No active game found. Redirecting to game selection.", 2000);
      router.replace({ name: 'PvpTypeSelect' });
      return;
    }
  }

  // Listen for DEV game response
  socket.once("devGameCreated", (game) => {
    console.log("DEV game created:", game);
    updateGameState(game)
  });

  // Fetch game state from server
  socket.emit("getGameState", { gameId: gameStore.gameId })

  // Listen for game state response
  socket.once("gameState", (game) => {
    updateGameState(game)
  })

  // Listen for question progress updates from server (per-team per-question per-test)
  socket.on("questionProgress", (data) => {
    if (!data?.team) return;
    const qIndex = data.questionIndex ?? currentQuestionIndex.value;
    updateProgress(data.team as 'team1' | 'team2', qIndex, data.progress, data.progressFullPass);

    const progressArr = gameStore.progress[data.team as 'team1' | 'team2'][qIndex];
    const testCasesFinished = Array.isArray(progressArr) && progressArr.every(Boolean);
    const questionFinished = !!gameStore.progressFullPass[data.team as 'team1' | 'team2'][qIndex];

    if (testCasesFinished && !questionFinished) {
      setTimeout(() => triggerNotification(
        "This question doesn't count yet — all test cases must pass in the same submission.",
        1800
      ), 2000);
    }
  });

  // Listen for awardSabotage events (server tells us how many points to add)
  socket.on("awardSabotage", (payload: { amount: number }) => {
    if (typeof payload?.amount === "number") {
      sabotagePoint.value += payload.amount;
      triggerNotification(`+${payload.amount} sabotage point(s)!`, 1200);
    }
  });

  // Listen for sabotage
  socket.on("sabotageReceived", () => { sabotageOnce() })

  // Listen for draw vote results
  socket.on("voteDrawResult", (data: { votes: number, totalPlayers: number }) => {
    triggerNotification(`Draw vote: ${data.votes}/${data.totalPlayers} voted`, 1200);
  });

  socket.on("enableForfeitButton", () => {
    forfeitEnabled.value = true;
    triggerNotification("Vote draw failed — you can now forfeit.", 2000);
  });

  // Listen for game end
  socket.on("gameEnd", (data: { winner: 'team1' | 'team2' | 'draw', progress: any }) => {
    // show proper result popup (you may already have a PvpResultPopup for this)
    // Hide other popups
    showClearedPopup.value = false;
    showMessagePopup.value = false;
    showVoteDrawPanel.value = false;
    showOpponentPanel.value = false;

    // Show a dedicated end popup:
    showResultPopup.value = true;

    // Optionally set some store fields so popup can display winner
    gameStore.finished = true;
    gameStore.winner = data.winner;

    // you can also store winner somewhere (gameStore.winner = data.winner)
    setTimeout(() => triggerNotification(`Game ended — winner: ${data.winner}`, 2500), 2000);
  });

  // Start timer if enabled
  if (timeLimitEnabled) { timeLeft.value = PVP_TIME_LIMIT || 0 }
  startTimer()
})

onUnmounted(() => {
  stopTimer();
  socket.off("sabotageReceived");
  socket.off("questionProgress");
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

    <!-- Opponent panel with sliding toggle -->
    <transition name="slide-right">
      <div class="opponent-panel-wrapper" v-if="showOpponentPanel">
        <OpponentPanel :onClose="toggleOpponentPanel" :sendSabotage="sendSabotage"
          :opponent="gameStore.opponentTeamObj?.players[0]" :questions="gameStore.questions"
          :progress="gameStore.progress[gameStore.opponentTeam || 'team1'] || []"
          :progressFullPass="gameStore.progressFullPass?.[gameStore.opponentTeam || 'team1'] || []"
          :sabotagePoints="sabotagePoint" />
      </div>
    </transition>

    <!-- Vote panel component slides in/out -->
    <transition name="slide-right">
      <div class="vote-panel-wrapper" v-if="showVoteDrawPanel">
        <VotePanel :disabled="lockDrawVoteButton" @vote="voteDraw" @close="toggleVoteDrawPanel"
          @forfeit="handleForfeit" />
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

  <!-- Question cleared popup (not game end) -->
  <MessagePopup v-if="showClearedPopup" title="Question cleared!" message="Nice job — question cleared. Keep going!"
    :buttonOnClick="() => { showClearedPopup = false }" />

  <!-- Game End result -->
  <PvpResultPopup :show="showResultPopup" :testResults="[testResults?.results || []]" :questions="gameStore.questions"
    :progress="gameStore.progress[gameStore.playerTeam || 'team1'] || []"
    :progressFullPass="gameStore.progressFullPass?.[gameStore.playerTeam || 'team1'] || []"
    :winner="gameStore.finished ? gameStore.winner : null" @close="showResultPopup = false" @endGame="endGame" />

  <div v-if="DEV" class="dev-buttons" style="position: fixed; bottom: 10px; right: 10px;">
    <button @click="forceClearQuestion"
      style="background: orange; color: white; padding: 6px 12px; border-radius: 4px;">
      Force Clear Question
    </button>
  </div>
</template>

<style lang="css" src="@/styles/gameplay.css"></style>
<style scoped></style>