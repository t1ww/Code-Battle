<!-- frontend\code-battle\src\pages\pvp\PvpTypeSelect.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useTeamStore } from '@/stores/team'

const team = useTeamStore()
const isMember = computed(() => team.size > 0 && !team.isLeader)

const is1v1Disabled = computed(() => isMember.value || team.size > 1)
const is3v3Disabled = computed(() => isMember.value || team.size !== 3)
const isPrivateDisabled = computed(() => isMember.value)

const get1v1Message = computed(() => {
  if (isMember.value) return 'Only team leader can select game mode.'
  if (team.size > 1) return 'You cannot play 1v1 with other people in the team'
  return ''
})

const get3v3Message = computed(() => {
  if (isMember.value) return 'Only team leader can select game mode.'
  if (team.size < 3) return 'Please form a team of 3 to play this mode'
  return ''
})

const getPrivateMessage = computed(() => {
  if (isMember.value) return 'Only team leader can select game mode.'
  return ''
})

</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <!-- 1v1 -->
      <div class="button-with-text">
        <router-link :to="is1v1Disabled ? {} : { name: 'PvpTimeSelect', query: { mode: '1v1' } }" id="pvp1v1-button"
          class="menu-button" :class="{ disabled: is1v1Disabled }">
          1v1
        </router-link>
        <span v-if="is1v1Disabled" id="1v1mode-text" class="mode-text">{{ get1v1Message }}</span>
      </div>

      <!-- 3v3 -->
      <div class="button-with-text">
        <router-link :to="is3v3Disabled ? {} : { name: 'PvpTimeSelect', query: { mode: '3v3' } }" id="pvp3v3-button"
          class="menu-button" :class="{ disabled: is3v3Disabled }">
          3v3
        </router-link>
        <span v-if="is3v3Disabled" class="mode-text">{{ get3v3Message }}</span>
      </div>

      <!-- Private -->
      <div class="button-with-text">
        <router-link :to="isPrivateDisabled ? {} : { name: 'PrivateRoom' }" id="pvp-private-button" class="menu-button"
          :class="{ disabled: isPrivateDisabled }">
          Private custom match
        </router-link>
        <span v-if="isPrivateDisabled" class="mode-text">{{ getPrivateMessage }}</span>
      </div>
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

.button-with-text {
  display: flex;
  align-items: center;
  margin-left: 6rem;
  gap: 1rem;
}

#pvp1v1-button,
#1v1mode-text {
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
  color: var(--theme-lighter-color);
  white-space: nowrap;
  text-overflow: ellipsis;

  /* glow effect */
  text-shadow:
    0 0 4px var(--text-glow-color),
    0 0 8px var(--text-glow-color),
    0 0 12px var(--text-glow-color);
}

.menu-button {
  width: 12rem;
  height: 2.5rem;
}

.menu-button.disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
