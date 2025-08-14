<script setup lang="ts">
import { computed } from 'vue'
import { useTeamStore } from '@/stores/team'

const team = useTeamStore()

const is1v1Disabled = computed(() => team.size > 1)
const is3v3Disabled = computed(() => team.size !== 3)

const get1v1Message = computed(() => {
  if (team.size > 1) return 'You cannot play 1v1 with other people in the team'
  return ''
})

const get3v3Message = computed(() => {
  if (team.size < 3) return 'Please form a team of 3 to play this mode'
  return ''
})
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <!-- 1v1 -->
      <div class="button-with-text">
        <router-link
          :to="is1v1Disabled ? {} : { name: 'PvpTimeSelect', query: { mode: '1v1' } }"
          id="pvp1v1-button"
          class="mode-button"
          :class="{ disabled: is1v1Disabled }"
        >
          1v1
        </router-link>
        <span v-if="is1v1Disabled" id="1v1mode-text" class="mode-text">{{ get1v1Message }}</span>
      </div>

      <!-- 3v3 -->
      <div class="button-with-text">
        <router-link
          :to="is3v3Disabled ? {} : { name: 'PvpTimeSelect', query: { mode: '3v3' } }"
          id="pvp3v3-button"
          class="mode-button"
          :class="{ disabled: is3v3Disabled }"
        >
          3v3
        </router-link>
        <span v-if="is3v3Disabled" class="mode-text">{{ get3v3Message }}</span>
      </div>

      <!-- Private -->
      <div class="button-with-text">
        <router-link :to="{ name: '' }" id="pvp-private-button" class="mode-button">
          Private custom match
        </router-link>
      </div>
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
}

h1 {
  margin-bottom: 40px;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.button-with-text {
  display: flex;
  align-items: center;
  margin-left: 6rem;
  gap: 1rem;
}

#pvp1v1-button, #1v1mode-text {
  margin-right: 6rem;
}

#pvp3v3-button {
  margin-left: 6rem;
}

#pvp-private-button {
  margin-left: 12rem;
}

.mode-text {
  font-size: 14px;
  color: #222;
  white-space: nowrap; /* force single line */
  overflow: hidden;    /* optional: hides overflow if too long */
  text-overflow: ellipsis; /* optional: adds "..." if too long */
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
