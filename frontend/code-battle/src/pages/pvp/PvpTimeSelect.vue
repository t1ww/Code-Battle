<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const mode = route.query.mode as string
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <router-link :to="{ name: 'Matchmaking', query: { mode, timeLimit: 'true' } }" id="time-limit-button"
        class="mode-button">
        Time Limit Mode
      </router-link>

      <router-link :to="{ name: 'Matchmaking', query: { mode, timeLimit: 'false' } }" id="endurance-button"
        class="mode-button">
        Endurance Mode
      </router-link>
    </div>
  </div>
</template>


<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-color: #bbb;
  /* matching the screenshot background */
}

h1 {
  margin-bottom: 40px;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

#time-limit-button {
  margin-right: 12rem;
}

#endurance-button {
  margin-left: 12rem;
}

.mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: inherit;
  border-radius: .5em;
  outline: none;
  width: 12rem;
  height: 2.5rem;
  background-color: #ddd;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.mode-button:hover {
  transform: scale(1.05) translateX(5px);
  background-color: #eee;
}

.mode-button:active {
  background-color: #bbb;
}
</style>
