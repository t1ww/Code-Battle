<!-- frontend\code-battle\src\components\VotePanel.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import VoteDrawButton from './VoteDrawButton.vue'
import ForfeitButton from './ForfeitButton.vue'
import { socket } from '@/clients/socket.api'
import { usePvpAction } from '@/composables/usePvpAction'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{
    (e: 'vote'): void
    (e: 'close'): void
    (e: 'forfeit'): void
}>()

const { forfeitEnabled } = usePvpAction()

function onVote() {
    emit('vote')
}
function closePanel() {
    emit('close')
}
function onForfeit() {
    emit('forfeit')
    forfeitEnabled.value = false
}

// Listen for server event to enable forfeit button
onMounted(() => {
    socket.on('enableForfeitButton', () => {
        forfeitEnabled.value = true
    })
})

onUnmounted(() => {
    socket.off('enableForfeitButton')
})
</script>

<template>
    <div class="vote-panel">
        <button class="side-button close-btn" @click="closePanel">▶</button>

        <!-- Conditional button: vote draw OR forfeit -->
        <VoteDrawButton v-if="!forfeitEnabled" :disabled="props.disabled" @vote="onVote" />
        <ForfeitButton v-else :disabled="props.disabled" @forfeit="onForfeit" />
    </div>
</template>

<style scoped>
.vote-panel {
    position: relative;
    display: flex;
    align-items: center;
    background: #5f5f5f;
    height: 4rem;
    padding-inline: 1rem;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    color: #111;
}

.vote-panel .close-btn {
    position: absolute;
    left: -35px;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 6px 0 0 6px;
    z-index: 1200;
}
</style>
