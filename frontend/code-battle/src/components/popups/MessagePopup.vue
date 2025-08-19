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

.popup-content h2,
.popup-content p {
    color: black;
}

.popup-content button {
    margin: 0.5rem;
}
</style>
