<!-- frontend\code-battle\src\App.vue -->
<script setup lang="ts">
import Navbar from "@/components/etc/Navbar.vue";
import BackButton from "@/components/etc/BackButton.vue";
import NotificationPopup from "./components/popups/NotificationPopup.vue";
import { onMounted, onBeforeUnmount } from 'vue'
import { RouterView } from "vue-router";
import { socket } from '@/clients/socket.api'
import { showNotification, notificationMessage, triggerNotification } from '@/composables/notificationService'
import router from "@/router";
import { useTeamStore } from "@/stores/team";
import { getPlayerData } from "@/stores/auth";

onMounted(() => {
  const teamStore = useTeamStore()
  socket.on('connect', () => {
    triggerNotification("Connected to PVP server.", 2000)
    const playerData = getPlayerData();
    if (!playerData) {
      console.error("Player data not found, cannot send player info to server.");
      return;
    }
    socket.emit('sendsPlayerInfo', {
      player_id: playerData.player_id,
      name: playerData.name,
    })
  })

  socket.on('connect_error', () => {
    triggerNotification("Unable to connect to PVP server. Please try again later.")
    router.push('/')
  })

  socket.on('disconnect', () => {
    triggerNotification("Disconnected from PVP server.", 2000)
    // Reset team info on disconnect
    teamStore.team_id = null
    teamStore.members = []
    teamStore.invite_link = ''
  })

  // For team matchmaking
  socket.on("teamMembersJoinMatchmaking", (data) => {
    console.log("Team leader started matchmaking, joining with team members")
    router.push({ name: 'Matchmaking', query: { mode: '3v3', timeLimit: data.timeLimit } });
  });
})

onBeforeUnmount(() => {
  socket.off('connect')
  socket.off('connect_error')
  socket.off('disconnect')
})

window.addEventListener("offline", () => {
  console.log("Lost internet connection");
});

window.addEventListener("online", () => {
  console.log("Back online");
});
</script>

<template>
  <NotificationPopup :show="showNotification" :message="notificationMessage" @close="showNotification = false" />
  <Navbar @notify="triggerNotification" />
  <BackButton />
  <div class="router-container">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<style scoped>
/* Main style.css */
.router-container {
  background: #42b983;
}
#nprogress .bar {
  background: #42b983;
}

.router-container {
  display: flex;
  justify-content: center;
  /* horizontal center */
}
</style>
