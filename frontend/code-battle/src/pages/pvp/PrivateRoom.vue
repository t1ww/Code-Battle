<!-- frontend\code-battle\src\pages\pvp\PrivateRoom.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePrivateRoomStore } from '@/stores/privateRoom'
import { getPlayerData } from '@/stores/auth'
import PrivateRoomTeamList from '@/components/pvp/private/PrivateRoomTeamList.vue'
import MessagePopup from '@/components/popups/MessagePopup.vue'
import { socket } from '@/clients/socket.api'
import ChainCopyIcon from '@/components/pvp/private/ChainCopyIcon.vue'
import CheckboxToggle from '@/components/etc/CheckboxToggle.vue'
import { triggerNotification } from '@/composables/notificationService'

// Initialize necessary constants
const privateRoom = usePrivateRoomStore()
const route = useRoute()
const router = useRouter()
const inviteId = route.params.inviteId as string | undefined
const roomDeleted = ref(false);
// State to track pending and incoming swap requests
const pendingSwapByMe = ref(false)
const pendingSwapByTeammate = ref(false)
const pendingSwapByOpponent = ref(false)
const incomingSwapRequester = ref<string | null>(null) // requesterId
const swapLocked = ref(false) // To prevent multiple swap requests
const swapDeclined = ref(false) // To prevent multiple swap requests

// Function to copy invite link to clipboard
const copyInviteLink = async () => {
  if (!privateRoom.state.inviteLink) return
  try {
    await navigator.clipboard.writeText(privateRoom.state.inviteLink)
    console.log("Invite link copied:", privateRoom.state.inviteLink)
    triggerNotification('Invite link copied!', 1500)
  } catch (err) {
    console.error("Failed to copy invite link", err)
  }
}
// Function to handle swap requests
const handleSwapClick = () => {
  const player = getPlayerData()
  const roomId = privateRoom.state.roomId
  if (!player || !roomId) return

  if (pendingSwapByMe.value) {
    // Cancel your own pending request
    socket.emit('cancelPendingSwap', { room_id: roomId, player_id: player.player_id })
  } else if (incomingSwapRequester.value) {
    // Accept the incoming swap
    socket.emit('confirmSwap', { room_id: roomId, player_id: player.player_id, requesterId: incomingSwapRequester.value })
    incomingSwapRequester.value = null
  } else {
    // Make a swap request
    socket.emit('swapTeam', { room_id: roomId, player_id: player.player_id })
  }
}
const declineSwap = () => {
  swapDeclined.value = true;
}
const swapClear = () => {
  pendingSwapByMe.value = false
  pendingSwapByOpponent.value = false
  pendingSwapByTeammate.value = false
  incomingSwapRequester.value = null
  swapLocked.value = false
  swapDeclined.value = false
}

// Computed properties
const inviteLinkLabel = computed(() => {
  return privateRoom.state.inviteLink.replace(`${window.location.origin}/privateRoom`, '... ');
})
const incomingSwapRequesterId = computed(() => {
  return incomingSwapRequester.value || ''
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
    console.log('Private room updated:', roomData)
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

  // Listen for room deletion
  socket.on('privateRoomDeleted', () => {
    console.log('Private room deleted by host.')
    roomDeleted.value = true;
  })

  // Listen for swap requests
  socket.on('swapRequestByme', () => {
    pendingSwapByMe.value = true
    swapLocked.value = true
  })

  socket.on('swapRequestByOpponent', ({ requesterId }) => {
    pendingSwapByOpponent.value = true
    incomingSwapRequester.value = requesterId
    swapLocked.value = true
  })

  socket.on('swapRequestByTeammate', ({ requesterId }) => {
    pendingSwapByTeammate.value = true
    incomingSwapRequester.value = requesterId
    swapLocked.value = true
  })

  // Listen for swap cancelled events
  socket.on('swapCancelled', ({ cancelledBy }) => {
    swapClear()
    if (cancelledBy === 'me') {
      // Do something specific if the swap was cancelled by the user who initiated it here.
      triggerNotification('Swap request cancelled', 1500)
    }
  })

  // Listen for swap confirmation
  socket.on('swapClear', () => {
    swapClear()
  })

  // Delete room on page refresh
  const handleUnload = () => {
    const player = getPlayerData()
    const roomId = privateRoom.state.roomId
    if (player && roomId) {
      socket.emit('leavePrivateRoom', { room_id: roomId })
    }
  }
  // Add event listener for beforeunload to handle room deletion
  window.addEventListener('beforeunload', handleUnload)
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleUnload)
    // Clean up socket listeners
    const player = getPlayerData()
    if (!player) return
    const roomId = privateRoom.state.roomId
    if (!roomId) return
    // Emit leave event
    socket.emit('leavePrivateRoom', { room_id: roomId })
  })
})
defineProps<{ inviteId?: string }>()
</script>

<template>
  <div class="private-room">
    <div class="teams-grid">
      <PrivateRoomTeamList :team="privateRoom.state.team1 ?? { team_id: '', players: [] }" :teamName="'Team A'"
        :incomingSwapRequesterId="incomingSwapRequesterId" />
      <div class="divider"><!-- Vertical divider --></div>
      <PrivateRoomTeamList :team="privateRoom.state.team2 ?? { team_id: '', players: [] }" :teamName="'Team B'"
        :incomingSwapRequesterId="incomingSwapRequesterId" />
    </div>

    <div class="room-footer">
      <div class="invite">
        <span class="label">Invite link:</span>
        <button class="invite-btn" @click="copyInviteLink">
          {{ inviteLinkLabel }}
          <ChainCopyIcon />
        </button>
      </div>

      <CheckboxToggle v-model="privateRoom.state.timeLimit" label="Time Limit" />

      <button v-if="!pendingSwapByTeammate && !swapDeclined" class="swap-btn" @click="handleSwapClick">
        <template v-if="pendingSwapByMe">Cancel</template>
        <template v-else-if="pendingSwapByOpponent">Accept</template>
        <template v-else>Swap</template>
      </button>

      <!-- Decline button for incoming swaps -->
      <button v-if="pendingSwapByOpponent && !pendingSwapByTeammate && !swapDeclined" class="swap-btn decline"
        @click="declineSwap">
        Decline
      </button>

      <!-- Show start button when there's no pending swap -->
      <button v-if="!pendingSwapByOpponent && !pendingSwapByTeammate && !pendingSwapByMe" class="start-btn">
        Start!
      </button>
    </div>

    <div v-if="roomDeleted" class="room-deleted">
      <MessagePopup title="Room Deleted" message="The room has been deleted by the creator." :buttonOnClick="() => {
        router.push({ name: 'PvpTypeSelect' })
      }" />
    </div>
  </div>
</template>

<style scoped>
button {
  outline: none;
}

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
  grid-template-columns: 1fr auto 1fr;
  /* middle column for divider */
  background: #35353546;
  border: 1px solid limegreen;
  border-radius: .5rem;
}

.divider {
  width: 1px;
  background-color: limegreen;
  align-self: center;
  height: 95%;
}

.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  color: white;
}

.start-btn {
  background: rgb(0, 0, 0);
  border: none;
  padding: 0.5rem 1rem;
  color: white;
  border: solid 1px;
  border-color: var(--theme-color);
  cursor: pointer;
  font-weight: bold;
  border-radius: 5px;
}

.start-btn:hover {
  background: #141414;
  color: white;
}

.start-btn:active {
  background: var(--theme-darker-color);
  color: white;
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
  background: #000000;
  border: 1px solid var(--theme-lighter-color);
  color: var(--theme-color);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: monospace;
  /* makes the link easier to read */
}

.invite-btn:hover {
  background: var(--theme-lighter-color);
  color: black;
}

.invite-btn:active {
  background: #000000;
  color: var(--theme-darker-color);
}

.copy-icon {
  font-size: 0.85rem;
}

/* Swap */
.swap-btn.accept {
  background: rgb(0, 0, 0);
  border: solid 1px limegreen;
  color: white;
  margin-left: 0.5rem;
}

.swap-btn.decline {
  background: rgb(0, 0, 0);
  border: solid 1px red;
  color: white;
  margin-left: 0.5rem;
}
</style>
