<!-- frontend\code-battle\src\components\popups\MessagePopup.vue -->
<template>
    <div class="popup-backdrop">
        <div class="popup-content">
            <h2>{{ title }}</h2>
            <p>{{ message }}</p>
            <button v-on:click="buttonOnClick">Ok</button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string
    message: string
    buttonOnClick: () => void
}>()
</script>

<!-- Import shared popup CSS -->
<style src="@/styles/messagePopup.css"></style>

<!-- Override colors locally to keep white popup -->
<style scoped>
.popup-content {
    background: white;
    color: black;
    min-width: 20rem;
}

.popup-content h2,
.popup-content p {
    color: black;
}
</style>
