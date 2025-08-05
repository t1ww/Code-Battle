<script setup lang="ts">
import { useRouter } from "vue-router";
import { logoutPlayer } from "@/stores/auth"; // or wherever it's located
import { onMounted } from "vue";

const router = useRouter();

function handleLogout() {
  logoutPlayer();
  setTimeout(() => {
    router.replace({ name: "Login" });
  }, 300);
}

onMounted(() => {
  handleLogout()
})
</script>

<template>
  <h1>Logging out...</h1>
</template>

<style scoped>
  h1 {
    position: relative;
    top: 2rem;
    align-self: center;
  }
</style>