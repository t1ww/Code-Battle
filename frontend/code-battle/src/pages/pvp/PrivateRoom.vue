<!-- frontend\code-battle\src\pages\pvp\PrivateRoom.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePrivateRoomStore } from '@/stores/privateRoom'
import { getPlayerData } from '@/stores/auth'
import PrivateRoomTeamList from '@/components/pvp/private/PrivateRoomTeamList.vue'
import SwapRequestPopup from '@/components/pvp/private/SwapRequestPopup.vue'
import { socket } from '@/clients/socket.api'

// Initialize necessary constants
const privateRoom = usePrivateRoomStore()
const route = useRoute()
const inviteId = route.params.inviteId as string | undefined

// Function to copy invite link to clipboard
const copyInviteLink = async () => {
  if (!privateRoom.state.inviteLink) return
  try {
    await navigator.clipboard.writeText(privateRoom.state.inviteLink)
    alert("Invite link copied!")
  } catch (err) {
    console.error("Failed to copy invite link", err)
  }
}

// Computed properties
const inviteLinkLabel = computed(() => {
  return privateRoom.state.inviteLink.replace(window.location.origin + '/privateroom', '. . . ');
})

// OnMounted lifecycle hook to handle joining or creating a private room
onMounted(() => {
  const player = getPlayerData()
  // Ensure player data is available
  if (!player) return

  if (inviteId) {
    // Join an existing private room
    socket.emit('joinPrivateRoom', { inviteId, players: [player] })
  } else {
    // Create a new private room if no inviteId
    socket.emit('createPrivateRoom', [player])
  }

  // Listen for room updates
  socket.on('privateRoomJoined', (roomData) => {
    privateRoom.state.teamA = roomData.team1 || { id: '', members: [] }
    privateRoom.state.teamB = roomData.team2 || { id: '', members: [] }
    privateRoom.state.inviteLink = `${window.location.origin}/private-room/${roomData.room_id}`
  })
})
</script>

<template>
  <div class="private-room">
    <div class="teams-grid">
      <PrivateRoomTeamList :team="privateRoom.state.teamA" :title="'Team A'" />
      <PrivateRoomTeamList :team="privateRoom.state.teamB" :title="'Team B'" />
    </div>

    <div class="room-footer">
      <div class="invite">
        <span class="label">Invite link:</span>
        <button class="invite-btn" @click="copyInviteLink">
          {{ inviteLinkLabel }}
          <span class="copy-icon">📋</span>
        </button>
      </div>

      <div class="time-limit">
        Time limit: <input type="checkbox" />
      </div>

      <button class="start-btn">Start!</button>
    </div>


    <SwapRequestPopup v-for="swap in privateRoom.state.swapRequests" :key="swap.requesterId + swap.targetId"
      :swap="swap" @accept="privateRoom.acceptSwap(swap)" @decline="privateRoom.declineSwap(swap)" />
  </div>
</template>

<style scoped>
.private-room {
  margin-top: 10vh;
  /* navbar buffer */
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

.teams-grid,
.room-footer {
  width: 100%;
}


.teams-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 2px solid limegreen;
  background: black;
}

.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  color: white;
}

.start-btn {
  background: gray;
  border: none;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  font-weight: bold;
  border-radius: 5px;
}

/* Invite link */
.invite {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.label {
  white-space: nowrap;
  font-weight: bold;
}

.invite-btn {
  display: flex;
  white-space: nowrap;
  align-items: center;
  gap: 0.25rem;
  background: #333;
  border: 1px solid #4caf50;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: monospace;
  /* makes the link easier to read */
}

.invite-btn:hover {
  background: #4caf50;
  color: black;
}

.copy-icon {
  font-size: 0.85rem;
}
</style>
