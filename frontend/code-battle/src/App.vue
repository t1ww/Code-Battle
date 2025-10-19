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
import { usePvpGameStore } from "@/stores/game";

const music = ref<any>(null) // get access to MusicPlayer methods
const route = useRoute();
const gameStore = usePvpGameStore();

onMounted(() => {
  const teamStore = useTeamStore();

  socket.on("connect", () => {
    triggerNotification("Connected to online server.", 2000);
    const playerData = getPlayerData();
    if (!playerData) {
      console.error("Player data not found, cannot send player info to server.");
      return;
    }
    console.log("Sending player info to server:", playerData);
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
    console.log(`Time limit: ${data.timeLimit}`);
    router.push({ name: "Matchmaking", query: { mode: "3v3", timeLimit: data.timeLimit } });
  });

  socket.on("gameStart", (game) => {
    gameStore.gameId = game.gameId
    // populate teams, etc.
  })
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
    const trackIndex = (route.meta.musicTrack as number | undefined) ?? 0;
    // Only auto-play if the saved state isPlaying
    if (music.value?.isPlaying) {
      music.value.playTrack(trackIndex);
    }
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
