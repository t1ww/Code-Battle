<!-- frontend\code-battle\src\pages\Home.vue -->
<script setup lang="ts">
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <router-link :to="{ name: 'PveLevelSelect' }" id="pve-button" class="mode-button">
        PVE
      </router-link>
      <router-link :to="{ name: 'PvpTypeSelect' }" id="pvp-button" class="mode-button">
        PVP
      </router-link>
    </div>
  </div>
</template>


<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

#pve-button {
  margin-right: 6rem;
}

#pvp-button {
  margin-left: 6rem;
}

.mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: inherit;
  border-radius: .5em;
  outline: none;
  width: 150px;
  height: 40px;
  background-color: #ddd;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.mode-button:hover {
  transform: scale(1.05) translateX(5px);
  background-color: #eee;
}
.mode-button:active{
  background-color: #bbb;
}
</style>
