<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/clients/crud.api'
import type { Question, LeaderboardEntry } from '@/types/types'

const route = useRoute()
const level = route.query.mode as string || 'Easy'

const question_data = ref<Question | null>(null)
const leaderboard = ref<LeaderboardEntry[]>([])
const selectedModifier = ref('None')
const timeLimitEnabled = ref(true)

const loading = ref(true)
const error = ref<string | null>(null)

const difficultyOptions = ['None', 'Sabotage', 'Confident']

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
            <tr v-for="(entry, i) in leaderboard" :key="i">
              <td>{{ i + 1 }}#</td>
              <td>{{ entry.player_name }}</td>
              <td>{{ entry.language }}</td>
              <td>{{ entry.modifier_state }}</td>
              <td>{{ entry.score }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- No data -->
      <div v-else class="leaderboard-empty">
        <div class="face">:(</div>
        <p>No leaderboard data<br />available at the moment</p>
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
        <hr />

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
            <span>Time limit :</span>
            <input type="checkbox" v-model="timeLimitEnabled" />
          </label>

          <div class="modifier">
            <span>Difficulty modifier :</span>
            <button @click="cylcleModifier('left')">&lt;</button>
            <span>{{ selectedModifier }}</span>
            <button @click="cylcleModifier('right')">&gt;</button>
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
.level-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 5rem;
  width: 100vw;
  height: calc(100vh - 2rem); /* subtract padding-top */
  background-color: #bbb;
  font-family: sans-serif;
  color: #000;
  overflow: hidden; /* prevent scrollbars */
  box-sizing: border-box; /* include padding in height */
}

/* Panels */
.panel {
  height: 100%;
  min-height: 0;
  /* allows flex child to shrink properly */
  margin-inline: 2rem;
  margin-bottom: 2rem;
  border-radius: .5rem;
  background: #ddd;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 1rem;
} 

/* Left: Leaderboard */
.leaderboard {
  width: 30vw;
  /* smaller width */
  padding: 1rem;
}

.leaderboard h3 {
  text-align: left;
}

.leaderboard hr {
  color: black;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  /* smaller font */
  table-layout: fixed;
}

.leaderboard-table th {
  background-color: #ddd;
  border-bottom: 2px solid #666;
  font-weight: bold;
  padding: 0.5rem;
}

.leaderboard-table td {
  text-align: center;
  padding: 0.5rem;
  border-bottom: 1px solid #999;
  font-weight: 500;
}

/* Hover fix */
.leaderboard-table tbody tr:hover {
  background-color: #bbb;
  font-weight: bold;
}

/* Right: Description Panel */
.description {
  margin-left: 0;
  width: 55vw;
  /* smaller width */
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.desc-content hr {
  border: none;
  border-bottom: 2px solid #aaa;
  margin: 0.8rem 0;
}

.test-cases {
  display: flex;
  justify-content: left;
  font-family: monospace;
  gap: 0.5rem;
}

.test-cases>div {
  background: #eee;
  border: 1px solid #aaa;
  border-radius: 0.4rem;
  padding: 0.4rem;
  width: 10vw;
  font-size: 0.85rem;
}

/* Options Section */
.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkbox-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modifier {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modifier button {
  width: 1.6rem;
  height: 1.6rem;
  font-size: 0.85rem;
  background: #ccc;
  border: 1px solid #888;
  cursor: pointer;
  padding: 0;
}

.modifier span {
  width: 8rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Start Button */
.start-button-container {
  margin-right: 4rem;
  display: flex;
  justify-content: flex-end;
}

.start-button {
  align-self: flex-end;
  margin-top: 1.2rem;
  padding: 0.3rem 0.8rem;
  width: 7rem;
  background-color: #666;
  color: #fff;
  text-align: center;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.9rem;
  border-radius: 0.4rem;
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: 1px solid #444;
}

.start-button:hover {
  background-color: #555;
  transform: scale(1.02);
}

.start-button:active {
  transform: scale(0.98);
}

/* Responsive */
@media (max-width: 900px) {
  .level-container {
    flex-direction: column;
    align-items: center;
    padding-bottom: 1rem;
  }

  .leaderboard,
  .description {
    margin: 0;
    margin-top: 2rem;
    width: 90vw;
    height: auto;
    transform: scale(1);
    padding: 1rem;
  }

  .test-cases {
    flex-direction: column;
    align-items: flex-start;
  }

  .test-cases>div {
    width: 40%;
    font-size: 1rem;
  }

  .modifier button {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }

  .modifier span {
    width: 10rem;
    font-size: 1rem;
  }

  .start-button {
    width: 8rem;
    font-size: 1rem;
    padding: 0.4rem 1rem;
  }

  .start-button-container {
    justify-content: center;
    margin-right: 0;
  }
}
</style>