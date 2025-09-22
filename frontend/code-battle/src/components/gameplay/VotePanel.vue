<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import VoteDrawButton from './VoteDrawButton.vue'
import { socket } from '@/clients/socket.api';

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{
    (e: 'vote'): void
    (e: 'close'): void
    (e: 'forfeit'): void
}>()

const forfeitEnabled = ref(false)

function onVote() { emit('vote') }
function closePanel() { emit('close') }
function onForfeit() { 
    emit('forfeit'); 
    forfeitEnabled.value = false; 
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
        <button v-else class="forfeit-button" @click="onForfeit" type="button">
            Forfeit
        </button>
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

/* Forfeit button styling */
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
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  transition: background 0.2s ease;
}
.forfeit-button:hover { background: darkred; }
.forfeit-button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
