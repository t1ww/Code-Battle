<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/clients/crud.api'
import type { Question, LeaderboardEntry } from '@/types/types'

const route = useRoute()
const level = route.query.mode as string || 'Easy'

const questionData = ref<Question | null>(null)
const leaderboard = ref<LeaderboardEntry[]>([])
const selectedModifier = ref('None')
const timeLimitEnabled = ref(true)

const difficultyOptions = ['None', 'Sabotage', 'Confident']

async function fetchLevelData(): Promise<Question> {
  const response = await api.get(`/questions?level=${level}`)
  console.log(response.data);
  return response.data as Question
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // mock data for now
  return [
    { name: 'Name 1', language: 'java', modifier: 'Confident', score: 1000 },
    { name: 'Name 2', language: 'java', modifier: 'Confident', score: 999 },
    { name: 'Name 3', language: 'java', modifier: 'Confident', score: 980 },
    { name: 'Name 4', language: 'java', modifier: 'Confident', score: 978 },
    { name: 'Name 5', language: 'java', modifier: 'Confident', score: 969 },
    { name: 'Name 6', language: 'java', modifier: 'Confident', score: 965 },
    { name: 'Name 7', language: 'java', modifier: 'Confident', score: 960 },
    { name: 'Name 8', language: 'java', modifier: 'Confident', score: 959 },
    { name: 'Name 9', language: 'java', modifier: 'Confident', score: 958 },
    { name: 'Name 10', language: 'java', modifier: 'Confident', score: 940 },
    { name: 'Name 11', language: 'java', modifier: 'Confident', score: 938 },
    { name: 'Name 12', language: 'java', modifier: 'Confident', score: 727 },
  ]
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
  questionData.value = await fetchLevelData()
  leaderboard.value = await fetchLeaderboard()
})
</script>

<template>
  <div class="level-container" v-if="questionData">
    <!-- Leaderboard -->
    <div class="panel leaderboard">
      <h3>Leaderboard</h3>
      <hr>
      <div v-if="leaderboard.length">
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
              <td>{{ entry.name }}</td>
              <td>{{ entry.language }}</td>
              <td>{{ entry.modifier }}</td>
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
      <div class="desc-content">
        <h4>Level {{ questionData.level }}: {{ questionData.questionName }}</h4>
        <hr />

        <p><strong>Description:</strong><br />{{ questionData.description }}</p>
        <hr />

        <p><strong>Test Cases:</strong></p>
        <div class="test-cases">
          <div v-for="(test, i) in questionData.testCases" :key="i">
            <strong>Test Case {{ i + 1 }}</strong><br />
            Input: {{ test.input }}<br />
            Output: {{ test.expectedOutput }}
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
              timeLimit: timeLimitEnabled.toString() // ✅ convert to string
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
  padding-top: 5rem;
  width: 100vw;
  background-color: #bbb;
  font-family: sans-serif;
  color: #000;
}

/* Panels */
.panel {
  border: none;
  border-radius: 1rem;
  margin: .5rem;
  margin-top: 1rem;
  background: #ddd;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: none;
  height: 85vh;
}


/* Left: Leaderboard */
.leaderboard {
  width: 36vw;
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
  font-size: clamp(.8rem, 1.1vw, 1.2vw);
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

/* ✅ Hover fix */
.leaderboard-table tbody tr:hover {
  background-color: #bbb;
  font-weight: bold;
}


/* Right: Description Panel */
.description {
  margin-left: 0;
  width: 70vw;
  padding: 1rem;
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
  justify-content: space-between;
  font-family: monospace;
}

.test-cases>div {
  background: #eee;
  border: 1px solid #aaa;
  border-radius: 0.4rem;
  padding: 0.5rem;
  width: 15vw;
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
  width: 2rem;
  height: 2rem;
  font-size: 1rem;
  background: #ccc;
  border: 1px solid #888;
  cursor: pointer;
  padding: 0;
}

.modifier span {
  width: 10rem;
  text-align: center;
  font-weight: bold;
}


/* Start Button */
.start-button-container {
  margin-right: 4rem;
  display: flex;
  justify-content: flex-end;
  /* ✅ Add this */
}


.start-button {
  align-self: flex-end;
  margin-top: 1.5rem;
  padding: 0.4rem 1rem;
  width: 8rem;
  background-color: #666;
  color: #fff;
  text-align: center;
  text-decoration: none;
  font-weight: bold;
  font-size: 1rem;
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

/* Reactive */
@media (max-width: 900px) {
  .level-container {
    flex-direction: column;
    align-items: center;
    padding-bottom: 1rem;
  }

  .leaderboard,
  .description {
    margin: 0rem;
    margin-top: 2rem;
    width: 90vw;
    height: auto;
  }

  .test-cases {
    flex-direction: column;
    align-items: flex-start;
  }

  .test-cases>div {
    width: 40%;
  }

  .start-button-container {
    justify-content: center;
    margin-right: 0;
  }
}
</style>
