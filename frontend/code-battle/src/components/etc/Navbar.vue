<script setup lang="ts">
import { socket } from '@/clients/socket.api'
import { computed, onBeforeUnmount, onMounted } from 'vue'
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

  const link = teamStore.invite_link.startsWith('http')
    ? teamStore.invite_link
    : `${window.location.origin}${teamStore.invite_link}`

  await navigator.clipboard.writeText(link)
  alert('Invite link copied!')
}

const teammates = computed(() =>
  teamStore.members.filter(m => m.id !== self.id)
)

onMounted(() => {
  socket.on('teamJoined', (teamData) => {
    if (teamData?.team_id === teamStore.team_id) {
      teamStore.setMembers(teamData.players)
    }
  })
})

onBeforeUnmount(() => {
  socket.off('teamJoined')
})
</script>

<template>
  <nav class="navbar">
    <div class="team-wrapper">
      <!-- Self avatar with tooltip -->
      <div v-if="selfAvatar" :title="selfInfo.name">
        <PlayerAvatar :player="selfAvatar" />
      </div>

      <!-- Teammates avatars with tooltip -->
      <div v-for="(player, index) in teammates" :key="player.id || index" :title="player.name">
        <PlayerAvatar :player="player" />
      </div>

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
