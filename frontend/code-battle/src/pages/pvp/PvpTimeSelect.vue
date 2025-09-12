<!-- frontend\code-battle\src\pages\pvp\PvpTimeSelect.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const mode = route.query.mode as string
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <router-link :to="{ name: 'Matchmaking', query: { mode, timeLimit: 'true' } }" id="time-limit-button"
        class="menu-button">
        Time Limit Mode
      </router-link>

      <router-link :to="{ name: 'Matchmaking', query: { mode, timeLimit: 'false' } }" id="endurance-button"
        class="menu-button">
        Endurance Mode
      </router-link>
    </div>
  </div>
</template>


<style scoped src="@/styles/menuButtons.css"></style>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
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

.menu-button {
  width: 12rem;
  height: 2.5rem;
}
</style>
