<script setup lang="ts">
import { usePrivateRoomStore } from '@/stores/privateRoom'
import PrivateRoomTeamList from '@/components/pvp/private/PrivateRoomTeamList.vue'
import SwapRequestPopup from '@/components/pvp/private/SwapRequestPopup.vue'

const privateRoom = usePrivateRoomStore()
</script>

<template>
  <div class="private-room">
    <div class="teams-grid">
      <PrivateRoomTeamList :team="privateRoom.state.teamA" />
      <PrivateRoomTeamList :team="privateRoom.state.teamB" />
    </div>

    <div class="room-footer">
      <div class="invite">Invite link: {{ privateRoom.state.inviteLink }}</div>
      <div class="time-limit">Time limit: <input type="checkbox" /></div>
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
  /* fill most of the screen */
  max-width: 1400px;
  /* allow much bigger max */
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
  width: 70%;
  max-width: 900px;
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
</style>
