<!-- frontend\code-battle\src\components\popups\TimeoutPopup.vue -->
<template>
    <div class="popup-backdrop">
        <div class="popup-content">
            <h2>Time's up!</h2>
            <hr>
            <p>Your time limit has expired.</p>
            <button @click="onRestart">Restart</button>
            <router-link :to="{ name: 'PveLevelSelect' }">
                <button>Select New Level</button>
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ onRestart: () => void }>()
</script>

<!-- Use shared popup CSS -->
<style src="@/styles/messagePopup.css"></style>