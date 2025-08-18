<!-- frontend\code-battle\src\components\pvp\private\PrivateRoomTeamList.vue -->
<script setup lang="ts">
defineProps<{ team: { id: string, members: any[] }, title: string }>()
</script>

<template>
  <div class="team-list">
    <div class="team-title">Team {{ team.id }}</div>
    <div v-for="member in team.members" :key="member.player_id" class="team-slot">
      <span class="avatar-placeholder"></span>
      <span>{{ member.name }}</span>
    </div>
    <!-- Empty slots for consistent height -->
    <div v-for="n in (3 - team.members.length)" :key="'empty-' + n" class="team-slot"></div>
  </div>
</template>

<style scoped>
.team-list {
  display: flex;
  flex-direction: column;
  width: 20rem;
  border-left: 1px solid limegreen;
  border-right: 1px solid limegreen;
  background: #35353546;
}

.team-title {
  text-align: center;
  font-weight: bold;
  padding: 0.75rem;
  border-bottom: 1px solid limegreen;
}

.team-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid limegreen;
  height: 60px;
  /* consistent row height */
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  background: gray;
  border-radius: 50%;
  margin-right: 0.5rem;
}
</style>
