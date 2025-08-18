<!-- frontend\code-battle\src\components\popups\ConfidentLostPopup.vue -->
<template>
    <div class="popup-backdrop">
        <div class="popup-content">
            <h2>Your submission failed</h2>
            <h2 :style="{ color: 'red' }">Confident Modifier On</h2>
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

<style scoped>
.popup-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.popup-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
}

.popup-content button {
    margin: 0.5rem;
}
</style>
