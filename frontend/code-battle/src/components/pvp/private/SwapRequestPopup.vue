<script setup lang="ts">
defineProps<{ swap: any }>()
defineEmits(['accept', 'decline'])
</script>

<template>
    <div class="swap-popup">
        <p>Swap request from {{ swap.requesterId }} to {{ swap.targetId }}</p>
        <button @click="$emit('accept')">Accept</button>
        <button @click="$emit('decline')">Decline</button>
    </div>
</template>

<style scoped>
.swap-popup {
    background: #fff;
    border: 1px solid #aaa;
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 8px;
}
</style>