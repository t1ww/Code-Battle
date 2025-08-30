<!-- frontend\code-battle\src\components\etc\BackButton.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Define routes that shouldn't show the back button
const backTo = computed(() => route.meta.backTo as string | undefined)
// Navigate manually to a controlled path
function handleBack() {
    router.replace(backTo.value || '/')
}
</script>

<template>
    <div v-if="backTo" class="back-button-wrapper">
        <button @click="handleBack" class="back-button">←</button>
    </div>
</template>

<style scoped>
.back-button {
    position: fixed;
    top: 6rem;
    left: 0rem;
    outline: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--theme-lighter-color);

    /* glow effect */
    text-shadow: 0 0 5px #42b983, 0 0 10px #42b983, 0 0 15px #42b983;
    transition: text-shadow 0.3s ease;
}

.back-button:hover {
    text-shadow: 0 0 10px #42b983, 0 0 20px #42b983, 0 0 30px #42b983;
}

.back-button:active {
    text-shadow: 0 0 10px #42b983, 0 0 20px #ffffff, 0 0 30px #42b983;
}
</style>
