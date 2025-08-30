<!-- frontend\code-battle\src\pages\Home.vue -->
<script setup lang="ts">
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <router-link :to="{ name: 'PveLevelSelect' }" id="pve-button" class="menu-button">
        PVE
      </router-link>
      <router-link :to="{ name: 'PvpTypeSelect' }" id="pvp-button" class="menu-button">
        PVP
      </router-link>
    </div>
  </div>
</template>

<style scoped src="@/styles/menuButtons.css"></style>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
}

#pve-button {
  margin-right: 6rem;
}

#pvp-button {
  margin-left: 6rem;
}
</style>
