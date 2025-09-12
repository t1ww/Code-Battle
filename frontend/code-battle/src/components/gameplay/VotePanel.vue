<script setup lang="ts">
import VoteDrawButton from './VoteDrawButton.vue'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{
    (e: 'vote'): void
    (e: 'close'): void
}>()

function onVote() { emit('vote') }
function closePanel() { emit('close') }
</script>

<template>
    <div class="vote-panel">
        <button class="side-button close-btn" @click="closePanel">▶</button>
        <VoteDrawButton :disabled="props.disabled" @vote="onVote" />
    </div>
</template>

<style scoped>
.vote-panel {
  position: relative;
  display: flex;           /* flex layout */
  align-items: center;     /* vertical center of children */
  background: #5f5f5f;
  height: 4rem;
  padding-inline: 1rem;      /* leave space for side button */
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  color: #111;
}

/* Keep button absolute if you want it outside panel */
.vote-panel .close-btn {
  position: absolute;
  left: -35px;             /* outside the panel */
  top: 50%;                /* vertical center relative to panel */
  transform: translateY(-50%);
  border-radius: 6px 0 0 6px;
  z-index: 1200;
}
</style>