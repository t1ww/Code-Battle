<script setup lang="ts">
// import Footer from "@/components/Footer.vue"
</script>

<template>
  <div class="container">
    <h1>Welcome to CODE BATTLE</h1>

    <div class="button-wrapper">
      <button id="pve-button" class="mode-button">PVE</button>
      <button id="pvp-button" class="mode-button">PVP</button>
    </div>

    <!-- <Footer/> -->
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

#pve-button {
  margin-right: 6rem;
}

#pvp-button {
  margin-left: 6rem;
}

.mode-button {
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
