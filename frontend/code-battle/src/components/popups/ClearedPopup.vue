<!-- frontend\code-battle\src\components\popups\ClearedPopup.vue -->
<template>
    <div class="popup-backdrop">
        <div class="popup-content">
            <h2>Level Cleared!</h2>
            <hr>
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

<!-- Import external CSS -->
<style src="@/styles/messagePopup.css"></style>
