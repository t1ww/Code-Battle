<script setup lang="ts">
import { computed } from 'vue'
import { useTeamStore } from '@/stores/team'

const team = useTeamStore()

const is1v1Disabled = computed(() => {
  // Disabled when team size > 1
  return team.size > 1
})

const is3v3Disabled = computed(() => {
  // Disabled when team size !== 3
  return team.size !== 3
})

const get1v1Tooltip = computed(() => {
  if (team.size > 1) return 'You cannot play 1v1 with other people in the team'
  return ''
})

const get3v3Tooltip = computed(() => {
  if (team.size < 3) return 'Please form a team of 3 to play this mode'
  return ''
})
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <!-- 1v1 -->
      <router-link :to="is1v1Disabled ? {} : { name: 'PvpTimeSelect', query: { mode: '1v1' } }" id="pvp1v1-button"
        class="mode-button" :class="{ disabled: is1v1Disabled }" :title="get1v1Tooltip">
        1v1
      </router-link>

      <!-- 3v3 -->
      <router-link :to="is3v3Disabled ? {} : { name: 'PvpTimeSelect', query: { mode: '3v3' } }" id="pvp3v3-button"
        class="mode-button" :class="{ disabled: is3v3Disabled }" :title="get3v3Tooltip">
        3v3
      </router-link>

      <!-- Private -->
      <router-link :to="{ name: '' }" id="pvp-private-button" class="mode-button">
        Private custom match
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

#pvp1v1-button {
  margin-right: 6rem;
}

#pvp3v3-button {
  margin-left: 6rem;
}

#pvp-private-button {
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

.mode-button.disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>