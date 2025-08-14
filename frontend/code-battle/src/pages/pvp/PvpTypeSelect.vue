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
.mode-button.disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
