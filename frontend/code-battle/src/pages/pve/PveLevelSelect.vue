<!-- frontend\code-battle\src\pages\PveLevelSelect.vue -->
<script setup lang="ts">
const levelDescriptions = {
  Easy: "Simple algorithmic problems focused on basic programming concepts like arithmetic, conditionals, and loops. Time limit: 30 seconds.",
  Medium: "Moderate complexity challenges involving strings, arrays, and simple recursion or iteration. Time limit: 60 seconds.",
  Hard: "Advanced problems requiring efficient algorithms and data structures like interval merging, sliding windows, or graph traversal. Time limit: 120 seconds.",
};
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <router-link :to="{ name: 'PveLevelView', query: { mode: 'Easy' } }" id="easy-button" class="mode-button">
        Easy
      </router-link>
      <router-link :to="{ name: 'PveLevelView', query: { mode: 'Medium' } }" id="medium-button" class="mode-button">
        Medium
      </router-link>
      <router-link :to="{ name: 'PveLevelView', query: { mode: 'Hard' } }" id="hard-button" class="mode-button">
        Hard
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
  background-color: #bbb; /* matching the screenshot background */
}

h1 {
  margin-bottom: 40px;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

#easy-button {
  margin-right: 6rem;
}

#medium-button {
  margin-left: 6rem;
}

#hard-button {
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
  width: 150px;
  height: 40px;
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
.mode-button:active{
  background-color: #bbb;
}
</style>
