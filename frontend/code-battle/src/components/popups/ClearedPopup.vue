<!-- frontend\code-battle\src\components\popups\ClearedPopup.vue -->
<template>
    <div class="popup-backdrop">
        <div class="popup-content">
            <h2>Level Cleared!</h2>
            <p>Time left: {{ timeLeft }}</p>
            <p>Your final score: {{ finalScore }} / {{ totalPossibleScore }}</p>
            <p>Test cases cleared: {{ clearedCount }}</p>
            <p>{{ modifierName }} Modifier Bonus Applied: ×{{ modifierBonus }}</p>
            <button @click="$emit('restart')">Restart</button>
            <router-link :to="{ name: 'PveLevelSelect' }">
                <button>Select New Level</button>
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    timeLeft: string
    finalScore: number
    totalPossibleScore: number
    clearedCount: number
    modifierName: string
    modifierBonus: number
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
