<!-- frontend\code-battle\src\components\popups\ConfirmationPopup.vue -->
<template>
    <div class="popup-backdrop">
        <div class="popup-content">
            <h2>{{ title }}</h2>
            <p>{{ message }}</p>
            <button v-on:click="buttonOnYes">{{ yesText }}</button>
            <button v-on:click="buttonOnNo">{{ noText }}</button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string
    message: string
    yesText: string
    noText: string
    buttonOnYes: () => void
    buttonOnNo: () => void
}>()
</script>

<!-- Import shared popup CSS -->
<style src="@/styles/messagePopup.css"></style>