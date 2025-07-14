<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
import { RouterView } from "vue-router";
</script>

<template>
  <Navbar />
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
  justify-content: center; /* horizontal center */
}
</style>
