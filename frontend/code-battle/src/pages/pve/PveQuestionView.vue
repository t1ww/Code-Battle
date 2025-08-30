<!-- frontend\code-battle\src\pages\PveQuestionView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/clients/crud.api'
import type { Question, LeaderboardEntry } from '@/types/types'
import { getPlayerData } from '@/stores/auth'
import { useQuestionStore } from '@/stores/questionStore'
import CheckboxToggle from '@/components/etc/CheckboxToggle.vue'

const route = useRoute()
const level = route.query.mode as string || 'Easy'

const { question_data } = useQuestionStore()
const leaderboard = ref<LeaderboardEntry[]>([])
const selectedModifier = ref('None')
const timeLimitEnabled = ref(true)

const loading = ref(true)
const error = ref<string | null>(null)

const difficultyOptions = ['None', 'Sabotage', 'Confident']

const player = getPlayerData()  // assuming this returns { id, name, ... }
const selfEntry = ref<LeaderboardEntry | null>(null)
const showSelfAtBottom = ref(false)
const topScoreEntry = ref<LeaderboardEntry | null>(null)

async function fetchLevelData(): Promise<Question> {
  try {
    const response = await api.get(`/questions?level=${level}`)
    console.log('[Level Fetch] Question data:', response.data)
    return response.data as Question
  } catch (err) {
    console.error('[Level Fetch Error]', err)
    throw err
  }
}

async function fetchTopScore() {
  try {
    const response = await api.get(`/scores/topscore?question_id=${question_data.value?.id}`)
    topScoreEntry.value = response.data as LeaderboardEntry
  } catch (err) {
    console.error('[Top Score Fetch Error]', err)
  }
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const questionId = question_data.value?.id
    const response = await api.get(`/scores/leaderboard?question_id=${questionId}`)
    console.log('[Leaderboard Fetch] Data:', response.data)
    return response.data as LeaderboardEntry[]
  } catch (err) {
    console.error('[Leaderboard Fetch Error]', err)
    throw err
  }
}

function cylcleModifier(direction: 'left' | 'right') {
  const options = difficultyOptions
  const current = options.indexOf(selectedModifier.value)
  const next =
    direction === 'left'
      ? (current - 1 + options.length) % options.length
      : (current + 1) % options.length
  selectedModifier.value = options[next]
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    question_data.value = await fetchLevelData()
    leaderboard.value = await fetchLeaderboard()

    if (player && leaderboard.value.length) {
      const found = leaderboard.value.find(
        (entry) => entry.player_name === player.name
      )
      if (found) {
        selfEntry.value = found
        showSelfAtBottom.value = false
      } else {
        selfEntry.value = null
        showSelfAtBottom.value = true
        await fetchTopScore()
      }
    }
  } catch (err) {
    error.value = 'Failed to load level data or leaderboard.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="level-container">
    <!-- Leaderboard -->
    <div class="panel leaderboard">
      <h3>Leaderboard</h3>

      <!-- Show error -->
      <div v-if="error">
        <div class="face">:(</div>
        <p>Failed to load leaderboard data.</p>
      </div>

      <!-- Show leaderboard -->
      <div v-else-if="leaderboard.length">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Lang</th>
              <th>Mod</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(entry, i) in leaderboard" :key="i">
              <tr v-if="entry.player_name === player?.name" class="self-row">
                <td>{{ i + 1 }}#</td>
                <td>{{ entry.player_name }}</td>
                <td>{{ entry.language }}</td>
                <td>{{ entry.modifier_state }}</td>
                <td>{{ entry.score }}</td>
              </tr>
              <tr v-else>
                <td>{{ i + 1 }}#</td>
                <td>{{ entry.player_name }}</td>
                <td>{{ entry.language }}</td>
                <td>{{ entry.modifier_state }}</td>
                <td>{{ entry.score }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- No data -->
      <div v-else class="leaderboard-empty">
        <div class="face">:(</div>
        <p>No leaderboard data<br />available at the moment</p>
      </div>
      <div v-if="showSelfAtBottom && topScoreEntry" class="fixed-self-entry">
        <strong>Your Best Score:</strong>
        <span>{{ topScoreEntry.player_name }}</span> -
        <span>{{ topScoreEntry.score }}</span>
      </div>
    </div>

    <!-- Description -->
    <div class="panel description">
      <h3>Description</h3>
      <div v-if="error">
        <div class="face">:(</div>
        <p>Failed to load level description.</p>
      </div>

      <div v-else-if="question_data" class="desc-content">
        <h4>Level {{ question_data.level }}: {{ question_data.question_name }}</h4>

        <p><strong>Description:</strong><br />{{ question_data.description }}</p>
        <hr />

        <p><strong>Test Cases:</strong></p>
        <div class="test-cases">
          <div v-for="(test, i) in question_data.test_cases" :key="i">
            <strong>Test Case {{ i + 1 }}</strong><br />
            Input: {{ test.input }}<br />
            Output: {{ test.expected_output }}
          </div>
        </div>
        <hr />

        <div class="options">
          <CheckboxToggle v-model="timeLimitEnabled" label="Time limit :" />
          <div class="modifier">
            <span>Difficulty modifier :</span>
            <div class="modifier-cycle modifier">
              <button @click="cylcleModifier('left')">&lt;</button>
              <span>{{ selectedModifier }}</span>
              <button @click="cylcleModifier('right')">&gt;</button>
            </div>
          </div>
        </div>
        <hr />

        <div class="start-button-container">
          <router-link :to="{
            name: 'PveGameplay',
            query: {
              modifier: selectedModifier,
              timeLimitEnabled: timeLimitEnabled.toString()
            }
          }" class="start-button">
            Start!
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
* {
  box-sizing: border-box;
}
/* Headings */
h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  border-bottom: 2px solid #2e7d32;
  padding-bottom: 0.3rem;
}

h4 {
  margin: 0;
  border-bottom: 1.5px solid #57a05a;
  padding-bottom: 0.3rem;
  font-weight: 700;
  color: #85eb8a;
}

hr {
  border: none;          /* remove default border */
  height: 2px;           /* thickness */
  background-color: #85eb8a; /* your desired color */
  margin: 1rem 0;        /* optional spacing */
}

.level-container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 5rem 2rem 2rem 2rem;
  width: 100vw;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #ffffff;
  gap: 2rem;
}

/* Panels */
.panel {
  background-color: #1b1f1be7;
  border: var(--theme-color) .2rem solid;
  border-radius: 0.7rem;
  padding: 1rem 1.5rem;
  height: 100%;
  overflow-y: auto;
  box-shadow: 0 0 .5rem var(--theme-color);
}

/* Leaderboard width */
.leaderboard {
  width: 30vw;
  min-width: 320px;
}

/* Description width */
.description {
  width: 55vw;
  min-width: 480px;
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 1rem;
}

/* Table styling */
.leaderboard-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.4rem;
  /* vertical spacing between rows */
  font-size: 0.85rem;
  margin-top: 0.3rem;
  table-layout: fixed;
  color: var(--theme-lighter-color);
}

.leaderboard-table th,
.leaderboard-table td {
  padding-top: .25rem;
  padding-bottom: .1rem;
  border-bottom: 1px solid #6b8e23;
  text-align: center;
}

.leaderboard-table td:last-child,
.leaderboard-table th:last-child {
  text-align: right;
  padding-right: 1.5rem;
}

.leaderboard-table th {
  font-weight: 600;
  background-color: #0e0e0e;
}

/* Highlight self row */
.self-row {
  background-color: #1f3b2e;
  font-weight: 700;
}

/* Rounded corners for left and right cells in self-row */
.self-row td:first-child {
  border-top-left-radius: 0.7rem;
  border-bottom-left-radius: 0.7rem;
  border-left-color: #4c8c29;
}

.self-row td:last-child {
  border-top-right-radius: 0.7rem;
  border-bottom-right-radius: 0.7rem;
  border-right-color: #4c8c29;
}

/* Test cases */
.test-cases {
  display: flex;
  gap: 1rem;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--theme-color);
}

.test-cases>div {
  background: #2d31290e;
  border: 1px solid var(--theme-color);
  border-radius: 0.4rem;
  padding: 0.5rem;
  flex: 1;
}

/* Options */
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

/* Modifier */
.modifier {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.modifier span {
  width: 8rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.modifier button {
  width: 1.6rem;
  height: 1.6rem;
  font-size: 1rem;
  background: #7fc97f;
  border: none;
  color: #1b5e20;
  cursor: pointer;
  font-weight: bold;
  user-select: none;
  transition: background-color 0.2s ease;
  outline: none;
  padding: 0;
}

.modifier button:hover {
  color: #569c4d;
  background: #83cc83;
}

.modifier button:active {
  background: #ffffff;
}

.modifier-cycle {
  border-radius: 0.4rem;
  background: #7fc97f;
}

/* Start button */
.start-button-container {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.start-button {
  padding: 0.4rem 1rem;
  width: 7rem;
  background-color: #2a2e2a62;
  color: var(--theme-lighter-color);
  font-weight: 700;
  text-align: center;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: 1px solid #3e783e;
}

.start-button:hover {
  background-color: #5ad15a7a;
}

.start-button:active {
  background-color: #3e783e;
}

/* Scrollbar styling for panels */
.panel::-webkit-scrollbar {
  width: 10px;
}

.panel::-webkit-scrollbar-track {
  background: #c1e6a3;
  border-radius: 10px;
}

.panel::-webkit-scrollbar-thumb {
  background-color: #6ca06c;
  border-radius: 10px;
  border: 2px solid #c1e6a3;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .level-container {
    flex-direction: column;
    height: auto;
    padding: 1rem;
  }

  .leaderboard,
  .description {
    width: 100%;
    min-width: unset;
    height: 50vh;
  }

  .test-cases {
    flex-direction: column;
  }
}

/* Self Leaderboard fixed entry */
.fixed-self-entry {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: #dff0d8;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  color: #2e7d32;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}
</style>
