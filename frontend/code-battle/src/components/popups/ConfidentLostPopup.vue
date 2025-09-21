<!-- frontend\code-battle\src\components\popups\ConfidentLostPopup.vue -->
<template>
    <div class="popup-backdrop">
        <div class="popup-content">
            <h2>Your submission failed</h2>
            <h2 :style="{ color: 'red' }">Confident Modifier On</h2>
            <hr>
            <p>Your final score: {{ finalScore }}</p>
            <router-link :to="{ name: 'PveLevelSelect' }">
                <button>Select New Level</button>
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    finalScore: number
}>()
</script>

<!-- Import external CSS -->
<style src="@/styles/messagePopup.css"></style>
