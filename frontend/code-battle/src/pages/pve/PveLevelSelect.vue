<!-- frontend\code-battle\src\pages\PveLevelSelect.vue -->
<script setup lang="ts">
import { ref } from "vue";

const levelDescriptions = {
  Easy: `Simple algorithmic problems focusing on basic programming concepts.
\nTime limit: 5 minutes per problem.`,

  Medium: `Moderate complexity challenges involving.
\nTime limit: 15 minutes per problem.`,

  Hard: `Advanced problems requiring efficient algorithms and data structures.
\nTime limit: 30 minutes per problem.`,
};

const hoveredLevel = ref<keyof typeof levelDescriptions | null>(null);

const showDescription = (level: keyof typeof levelDescriptions) => {
  hoveredLevel.value = level;
};

const hideDescription = () => {
  hoveredLevel.value = null;
};
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <router-link :to="{ name: 'PveLevelView', query: { mode: 'Easy' } }" id="easy-button" class="mode-button"
        @mouseenter="showDescription('Easy')" @mouseleave="hideDescription">
        Easy
      </router-link>
      <router-link :to="{ name: 'PveLevelView', query: { mode: 'Medium' } }" id="medium-button" class="mode-button"
        @mouseenter="showDescription('Medium')" @mouseleave="hideDescription">
        Medium
      </router-link>
      <router-link :to="{ name: 'PveLevelView', query: { mode: 'Hard' } }" id="hard-button" class="mode-button"
        @mouseenter="showDescription('Hard')" @mouseleave="hideDescription">
        Hard
      </router-link>
    </div>

    <transition name="slide-fade">
      <div v-if="hoveredLevel" class="description-box">
        {{ levelDescriptions[hoveredLevel] }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
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

.mode-button:active {
  background-color: #bbb;
}

/* Description box */
.description-box {
  position: absolute;
  top: 50%;
  right: 10%;
  transform: translateY(-50%);
  /* keep Y fixed */
  background-color: #fff;
  padding: 1rem;
  width: 24rem;
  border-radius: 0.5em;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

/* Slide animation */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(50px) translateY(-50%);
}

.slide-fade-enter-to {
  opacity: 1;
  transform: translateX(0) translateY(-50%);
}

.slide-fade-leave-from {
  opacity: 1;
  transform: translateX(0) translateY(-50%);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(50px) translateY(-50%);
}
</style>
