<script setup lang="ts">
import { computed } from 'vue'
import { useTeamStore } from '@/stores/team'
import { getPlayerData } from '@/stores/auth'

import PlayerAvatar from '@/components/pvp/PlayerAvatar.vue'

const teamStore = useTeamStore()
const self = getPlayerData()
const selfAvatar = computed(() => {
  if (!self?.id || !self.name) return null
  return {
    id: self.id,
    name: self.name,
    avatar_url: undefined
  }
})

const teammates = computed(() =>
  teamStore.members.filter(m => m.id !== self?.id)
)
</script>

<template>
  <nav class="navbar">
    <div class="team-wrapper">
      <PlayerAvatar v-if="selfAvatar" :player="selfAvatar" />
      <PlayerAvatar v-for="(player, index) in teammates" :key="player.id || index" :player="player" />

      <!-- Add Button -->
      <div class="add-button" @click="$emit('openInvitePopup')">
        <span>+</span>
      </div>
    </div>
  </nav>
</template>

<style scoped>
PlayerAvatar {
  margin: 0;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #dadada;
  padding: 0.75rem 1.5rem;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  /* push to right */
  align-items: center;
  box-sizing: border-box;
}

.team-wrapper {
  display: flex;
  flex-direction: row-reverse;
  gap: 0.rem;
  align-items: center;
}


.add-button {
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.add-button:hover {
  background: #e2e2e2;
}
</style>
