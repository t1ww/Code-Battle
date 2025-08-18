<script setup lang="ts">
import Navbar from "@/components/etc/Navbar.vue";
import BackButton from "@/components/etc/BackButton.vue";
import NotificationPopup from "./components/popups/NotificationPopup.vue";
import { onMounted, onBeforeUnmount } from 'vue'
import { RouterView } from "vue-router";
import { socket } from '@/clients/socket.api'
import { useNotification } from '@/composables/useNotification'
import router from "@/router";
import { useTeamStore } from "@/stores/team";

const { showNotification, notificationMessage, triggerNotification } = useNotification()

onMounted(() => {
  const teamStore = useTeamStore()
  socket.on('connect', () => {
    triggerNotification("Connected to PVP server.", 2000)
  })

  socket.on('connect_error', () => {
    triggerNotification("Unable to connect to PVP server. Please try again later.")
    router.push('/')
  })

  socket.on('disconnect', (reason) => {
    triggerNotification("Disconnected from PVP server.", 2000)
    // Reset team info on disconnect
    teamStore.team_id = null
    teamStore.members = []
    teamStore.invite_link = ''
  })
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
  <Navbar />
  <BackButton />
  <div class="router-container">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<style scoped>
/* Main style.css */
#nprogress .bar {
  background: #42b983;
}

.router-container {
  display: flex;
  justify-content: center;
  /* horizontal center */
}
</style>
