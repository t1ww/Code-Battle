<script setup lang="ts">
import Navbar from "@/components/etc/Navbar.vue";
import NotificationPopup from "@/components/popups/NotificationPopup.vue";
import BackgroundWrapper from "@/components/layouts/BackgroundWrapper.vue";
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { socket } from "@/clients/socket.api";
import { showNotification, notificationMessage, triggerNotification } from "@/composables/notificationService";
import router from "@/router";
import { useTeamStore } from "@/stores/team";
import { getPlayerData } from "@/stores/auth";
import MusicPlayer from "./components/controller/MusicPlayer.vue";
import { useRoute } from "vue-router";

const music = ref<any>(null) // get access to MusicPlayer methods
const route = useRoute();

onMounted(() => {
  const teamStore = useTeamStore();

  socket.on("connect", () => {
    triggerNotification("Connected to online server.", 2000);
    const playerData = getPlayerData();
    if (!playerData) {
      console.error("Player data not found, cannot send player info to server.");
      return;
    }
    socket.emit("sendsPlayerInfo", {
      player_id: playerData.player_id,
      name: playerData.name,
    });
  });

  socket.on("connect_error", () => {
    triggerNotification("Unable to connect to online server. Please try again later.");
    router.push("/");
  });

  socket.on("disconnect", () => {
    triggerNotification("Disconnected from online server.", 2000);
    teamStore.team_id = null;
    teamStore.members = [];
    teamStore.invite_link = "";
  });

  socket.on("teamMembersJoinMatchmaking", (data) => {
    console.log("Team leader started matchmaking, joining with team members");
    router.push({ name: "Matchmaking", query: { mode: "3v3", timeLimit: data.timeLimit } });
  });
});

onBeforeUnmount(() => {
  socket.off("connect");
  socket.off("connect_error");
  socket.off("disconnect");
});

window.addEventListener("offline", () => {
  console.log("Lost internet connection");
});

window.addEventListener("online", () => {
  console.log("Back online");
});

watch(
  () => route.fullPath,
  () => {
    // use route.meta.track if defined, otherwise default to 0
    const trackIndex = (route.meta.musicTrack as number | undefined) ?? 0;
    music.value?.playTrack(trackIndex);
  },
  { immediate: true }
);
</script>

<template>
  <NotificationPopup :show="showNotification" :message="notificationMessage" @close="showNotification = false" />
  <Navbar @notify="triggerNotification" />
  <BackgroundWrapper />
  <MusicPlayer ref="music" />
</template>

<style scoped>
#nprogress .bar {
  background: #42b983;
}
</style>
