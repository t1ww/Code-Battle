<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/clients/crud.api'
import type { Question, LeaderboardEntry } from '@/types/types'
import { getPlayerData } from '@/stores/auth'
import { useQuestionStore } from '@/stores/questionStore'

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
      <hr />

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
          <label class="checkbox-line">
            <input type="checkbox" v-model="timeLimitEnabled" />
            <span>Time limit :</span>
          </label>

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

.level-container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  /* full height */
  padding: 5rem 2rem 2rem 2rem;
  /* leave room for navbar/back button */
  width: 100vw;
  height: calc(100vh - 2rem);
  background-color: #9bd67a;
  /* main green */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #000;
  overflow: hidden;
  gap: 2rem;
}

/* Panels */
.panel {
  background-color: #b0f08e;
  /* lighter green */
  border-radius: 0.7rem;
  padding: 1rem 1.5rem;
  height: 100%;
  overflow-y: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
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

/* Headings */
h3 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  border-bottom: 2px solid #2e7d32;
  /* dark green line */
  padding-bottom: 0.3rem;
}

h4 {
  margin: 0;
  border-bottom: 1.5px solid #57a05a;
  padding-bottom: 0.3rem;
  font-weight: 700;
  color: #2e7d32;
}

/* Table styling */
.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 0.3rem;
  table-layout: fixed;
  color: #000000;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #6b8e23;
  text-align: center;
}

.leaderboard-table th {
  font-weight: 600;
  background-color: #a7d08c;
}

/* Highlight self row */
.self-row {
  font-weight: 700;
  background-color: #72c653;
  color: #000;
}

.self-row td {
  padding: 0.5rem 1rem;
}

/* Test cases */
.test-cases {
  display: flex;
  gap: 1rem;
  font-family: monospace;
  font-size: 0.85rem;
  color: #2a5d1e;
}

.test-cases>div {
  background: #daf1be;
  border: 1px solid #6eaa4f;
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

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.checkbox-line input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.checkbox-line span {
  flex-shrink: 0;
  position: relative;
  padding-left: 28px;
  line-height: 1.2;
}

.checkbox-line span::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid #559f55;
  border-radius: 4px;
  background: white;
  box-sizing: border-box;
  transition: background-color 0.3s, border-color 0.3s;
}

.checkbox-line input[type="checkbox"]:checked + span::before {
  background-color: #559f55;
  border-color: #3e783e;
}

.checkbox-line input[type="checkbox"]:checked + span::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 3px 3px 0;
  pointer-events: none;
}

/* Hover effect */
.checkbox-line:hover span::before {
  border-color: #3e783e;
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
  background: #7fc97f;
  color: #1b5e20;
  cursor: pointer;
  font-weight: bold;
  border: none;
  outline: none;
  user-select: none;
  transition: background-color 0.2s ease;
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
  background-color: #559f55;
  color: white;
  font-weight: 700;
  text-align: center;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: 1px solid #3e783e;
}

.start-button:hover {
  background-color: #3e783e;
  transform: scale(1.05);
}

.start-button:active {
  transform: scale(0.95);
}

/* Fixed self entry */
.fixed-self-entry {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: #dff0d8;
  border: 1px solid #3e783e;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  color: #2e7d32;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

.leaderboard-table {
  border-collapse: separate; 
  border-spacing: 0 0.2rem; /* smaller vertical spacing */
}

/* Highlighted row */
.self-row td {
  background-color: #72c653;
  font-weight: 700;
  padding: 0.5rem 1rem;
}

/* Rounded corners for left and right cells */
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

/* Prevent double borders between cells */
.self-row td + td {
  border-left: none;
}

</style>
