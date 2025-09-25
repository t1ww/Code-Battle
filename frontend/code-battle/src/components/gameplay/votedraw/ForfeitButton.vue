<!-- frontend\code-battle\src\components\ForfeitButton.vue -->
<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ (e: 'forfeit'): void }>()

function handleClick() {
    if (!props.disabled) {
        emit('forfeit')
    }
}
</script>

<template>
    <button class="forfeit-button" :disabled="props.disabled" @click="handleClick">
        Forfeit
    </button>
</template>

<style scoped>
.forfeit-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 0.75rem;
    width: 8rem;
    background: red;
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    transition: background 0.2s ease;
}

.forfeit-button:hover {
    background: darkred;
}

.forfeit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
