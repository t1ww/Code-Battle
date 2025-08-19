<!-- frontend\code-battle\src\components\pvp\private\PrivateRoomTeamList.vue -->
<script setup lang="ts">
import type { Team } from '@/types/privateRoom'
defineProps<{ team: Team, teamName: string, incomingSwapRequesterId: string }>()
</script>

<template>
  <div class="team-list">
    <div class="team-name">{{ teamName }}</div>
    <div v-for="member in team.players" :key="member.player_id" class="team-slot"
      :class="{ 'swap-requester': member.player_id === incomingSwapRequesterId }">
      <span class="avatar-placeholder"></span>
      <span>{{ member.name }}</span>
    </div>
    <!-- Empty slots for consistent height -->
    <div v-for="n in (3 - team.players.length)" :key="'empty-' + n" class="team-slot"></div>
  </div>
</template>

<style scoped>
.team-list {
  display: flex;
  flex-direction: column;
  width: 24rem;
}

.team-name {
  text-align: center;
  font-weight: bold;
  padding: 1rem;
  border-bottom: 1px solid limegreen;
}

.team-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid limegreen;
  height: 5rem;
}

.team-slot:last-child {
  border-bottom: none;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  background: gray;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.swap-requester {
  border-bottom: 2px solid yellow;
  background: rgba(255, 255, 0, 0.2);
}
</style>
