<!-- frontend\code-battle\src\pages\pvp\PrivateRoom.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
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
  return privateRoom.state.inviteLink.replace(window.location.origin + '/privateRoom', '. . . ');
})

// OnMounted lifecycle hook to handle joining or creating a private room
onMounted(() => {
  const player = getPlayerData()
  if (!player) return
  // Emit event to join or create a private room
  console.log('Joining or creating private room for player:', player)
  if (inviteId) {
    // Join an existing private room
    console.log('Joining private room with inviteId:', inviteId)
    socket.emit('joinPrivateRoom', { inviteId, player })
  } else {
    // Create a new private room if no inviteId
    console.log('Creating new private room for player:', player)
    socket.emit('createPrivateRoom', player)
  }
  
  // Listen for team updates
  socket.on('privateRoomUpdated', (roomData) => {
    privateRoom.state.team1 = roomData.team1
    privateRoom.state.team2 = roomData.team2
  })
  // Listen for updates when joining an existing room
  socket.on('privateRoomJoined', (roomData) => {
    console.log('Joined private room:', roomData)
    privateRoom.state.roomId = roomData.room_id
    privateRoom.state.team1 = roomData.team1
    privateRoom.state.team2 = roomData.team2
    privateRoom.state.inviteLink = `${window.location.origin}${roomData.inviteLink}`
  })

  // Listen specifically for creator event
  socket.on('privateRoomCreated', (roomData) => {
    console.log('Private room created:', roomData)
    privateRoom.state.roomId = roomData.room_id
    privateRoom.state.team1 = roomData.team1
    privateRoom.state.team2 = roomData.team2
    privateRoom.state.inviteLink = `${window.location.origin}${roomData.inviteLink}`
  })



  // Listen for swap requests
  socket.on('swapRequest', (swap) => {
    // show player swap request pointer
    // lets player click to accept or decline
    // socket.emit("confirmSwap"
  })
})

onBeforeUnmount(() => {
  const player = getPlayerData()
  if (!player) return
  const roomId = privateRoom.state.roomId
  if (!roomId) return
  socket.emit('leavePrivateRoom', { room_id: roomId })
})
</script>

<template>
  <div class="private-room">
    <div class="teams-grid">
      <PrivateRoomTeamList :team="privateRoom.state.team1 ?? { team_id: '', players: [] }" :title="'Team A'" />
      <PrivateRoomTeamList :team="privateRoom.state.team2 ?? { team_id: '', players: [] }" :title="'Team B'" />
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
