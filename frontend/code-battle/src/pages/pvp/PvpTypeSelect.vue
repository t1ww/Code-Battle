<script setup lang="ts">
</script>

<template>
  <div class="container">
    <div class="button-wrapper">
      <router-link :to="{ name: 'Matchmaking' }" id="pvp1v1-button" class="mode-button">
        1v1
      </router-link>
      <router-link :to="{ name: 'Matchmaking' }" id="pvp3v3-button" class="mode-button">
        3v3
      </router-link>
      <router-link :to="{ name: '' }" id="pvp-private-button" class="mode-button">
        Private custom match
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
  background-color: #bbb; /* matching the screenshot background */
}

h1 {
  margin-bottom: 40px;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

#pvp1v1-button {
  margin-right: 6rem;
}

#pvp3v3-button {
  margin-left: 6rem;
}

#pvp-private-button {
  margin-left: 12rem;
}

.mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: inherit;
  border-radius: .5em;
  outline: none;
  width: 12rem;
  height: 2.5rem;
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
