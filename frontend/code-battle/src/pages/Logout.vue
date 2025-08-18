<!-- frontend\code-battle\src\pages\Logout.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { logoutPlayer } from "@/stores/auth";

const router = useRouter();
const message = ref("Logging out...");

onMounted(() => {
  logoutPlayer();
  message.value = "You have been logged out successfully.";

  setTimeout(() => {
    router.push({ name: "Login" });
  }, 1000); // wait 1 second as required
});
</script>

<template>
  <h1>{{ message }}</h1>
</template>

<style scoped>
h1 {
  position: relative;
  top: 2rem;
  align-self: center;
}
</style>
