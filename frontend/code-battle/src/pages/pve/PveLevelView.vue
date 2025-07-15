<script setup lang="ts">
import router from '@/router'
import { ref, onMounted } from 'vue'

interface TestCase {
  name: string
  input: string
  output: string
}

interface LevelData {
  levelTitle: string
  description: string
  testCases: TestCase[]
  difficultyOptions: string[]
}

const levelData = ref<LevelData | null>(null)
const selectedModifier = ref('None')
const timeLimitEnabled = ref(true)

// Mock API call
async function fetchLevelData(): Promise<LevelData> {
  // Replace with real API later
  return {
    levelTitle: 'Level 1: Hello world',
    description: `Write a C++ program that takes a name input and prints a greeting message in the format: hello <name>.
If no name is provided, print the default message: hello world.`,
    testCases: [
      { name: 'Test Case 1', input: '(no input)', output: 'hello world' },
      { name: 'Test Case 2', input: 'alice', output: 'hello alice' }
    ],
    difficultyOptions: ['None', 'Sabotage', 'Confident']
  }
}

function cylcleModifier(direction: 'left' | 'right') {
  if (!levelData.value) return
  const options = levelData.value.difficultyOptions
  const current = options.indexOf(selectedModifier.value)
  const next =
    direction === 'left'
      ? (current - 1 + options.length) % options.length
      : (current + 1) % options.length
  selectedModifier.value = options[next]
}

onMounted(async () => {
  levelData.value = await fetchLevelData()
})
</script>

<template>
  <div class="level-container" v-if="levelData">
    <div class="panel leaderboard">
      <h3>Leaderboard</h3>
      <div class="leaderboard-empty">
        <div class="face">:(</div>
        <p>No leaderboard data<br />available at the moment</p>
      </div>
    </div>

    <div class="panel description">
      <h3>Description</h3>
      <div class="desc-content">
        <h4>{{ levelData.levelTitle }}</h4>

        <p><strong>Description:</strong><br />{{ levelData.description }}</p>

        <p><strong>Test Cases:</strong></p>
        <div class="test-cases">
          <div v-for="(test, index) in levelData.testCases" :key="index">
            <strong>{{ test.name }}</strong><br />
            Input: {{ test.input }}<br />
            Output: {{ test.output }}<br /><br />
          </div>
        </div>

        <div class="options">
          <label>
            <input type="checkbox" v-model="timeLimitEnabled" />
            Time limit
          </label>

          <div class="modifier">
            Difficulty modifier:
            <button @click="cylcleModifier('left')">&lt;</button>
            <span>{{ selectedModifier }}</span>
            <button @click="cylcleModifier('right')">&gt;</button>
          </div>
        </div>
        <router-link :to="{ name: 'PveGameplay' }" class="start-button">
          Start
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.level-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #bbb;
  font-family: sans-serif;
  color: #000;
}

/* Panels */
.panel {
  border: 1px solid #444;
  background: #ddd;
  padding: 1rem;
  box-sizing: border-box;
  overflow-y: auto;
}

/* Left: Leaderboard */
.leaderboard {
  width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  text-align: center;
}

/* Empty Leaderboard Message */
.leaderboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.6;
}

.leaderboard-empty .face {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

/* Right: Description Panel */
.description {
  width: 65%;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding-right: 4vw;
}

.desc-content {
  margin-top: 0.5rem;
}

h4 {
  margin-bottom: 0.75rem;
}

p {
  line-height: 1.4;
  margin-bottom: 0.75rem;
}

/* Test case section */
.test-cases {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-family: monospace;
  margin-left: 1rem;
}

.test-cases > div {
  padding: 0.5rem;
  background: #eee;
  border: .2em solid #aaa;
  border-radius: .5em;
  min-width: 180px;
}

/* Options Section */
.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

/* Modifier Selector */
.modifier {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modifier button {
  width: 2rem;
  height: 2rem; /* was 1.5rem, too tight */
  font-size: 1rem; /* ensure arrow characters fit */
  line-height: 1; /* prevent vertical misalignment */
  background: #ccc;
  border: 1px solid #888;
  cursor: pointer;
  padding: 0;
}

.modifier span {
  width: 6rem;
  text-align: center;
  font-weight: bold;
}

/* Start Button */
.start-button {
  align-self: flex-end;
  margin-top: 1.5rem;
  padding: 0.5rem 1.25rem;
  background-color: #666;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 0.4rem;
  transition: background-color 0.2s ease, transform 0.1s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #444;
}

.start-button:hover {
  background-color: #555;
  transform: scale(1.02);
}

.start-button:active {
  transform: scale(0.98);
}

</style>
