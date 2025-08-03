<script setup lang="ts">
import Navbar from "@/components/etc/Navbar.vue";
import { RouterView } from "vue-router";
import BackButton from "@/components/etc/BackButton.vue";
</script>

<template>
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
