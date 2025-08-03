<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Define routes that shouldn't show the back button
const backTo = computed(() => route.meta.backTo as string | undefined)
// Navigate manually to a controlled path
function handleBack() {
    router.push(backTo.value || '/')
}
</script>

<template>
    <div v-if="backTo" class="back-button-wrapper">
        <button @click="handleBack" class="back-button">←</button>
    </div>
</template>

<style scoped>
.back-button-wrapper {
    padding: 1rem;
}

.back-button {
    position: fixed;
    top: 6rem;
    left: 0rem;
    outline: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: green;
}
</style>
