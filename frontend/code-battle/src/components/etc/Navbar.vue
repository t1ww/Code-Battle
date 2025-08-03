<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamStore } from '@/stores/team'
import { getPlayerData } from '@/stores/auth'

import PlayerAvatar from '@/components/pvp/PlayerAvatar.vue'

const teamStore = useTeamStore()

// Get player data once and throw if unavailable
const self = getPlayerData()
if (!self || !self.id || !self.name) {
  throw new Error('Player not authenticated or missing id/name')
}

const selfInfo = {
  id: self.id,
  name: self.name,
  avatar_url: self.avatar_url
}

const selfAvatar = computed(() => {
  if (!self) return null

  return {
    id: self.id as string, // TS now sees it as non-null
    avatar_url: self.avatar_url,
  }
})

const createOrShareTeam = async () => {
  if (!teamStore.team_id) {
    await teamStore.createTeam({ id: selfInfo.id, name: selfInfo.name })
  }

  const link = `${window.location.origin}/play?team=${teamStore.team_id}`
  await navigator.clipboard.writeText(link)
  alert('Invite link copied!')
}

const teammates = computed(() =>
  teamStore.members.filter(m => m.id !== self.id)
)

onMounted(async () => {
  const teamId = useRoute().query.team as string | undefined
  if (teamId && !teamStore.team_id) {
    try {
      await teamStore.joinTeam(teamId, selfInfo)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join team')
    }
  }
})
</script>

<template>
  <nav class="navbar">
    <div class="team-wrapper">
      <PlayerAvatar v-if="selfAvatar" :player="selfAvatar" />
      <PlayerAvatar v-for="(player, index) in teammates" :key="player.id || index" :player="player" />

      <!-- Add Button -->
      <div class="add-button" @click="createOrShareTeam">
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
