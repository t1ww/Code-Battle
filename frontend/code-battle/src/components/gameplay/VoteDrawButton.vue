<!-- frontend\code-battle\src\components\gameplay\VoteDrawButton.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ (e: 'vote'): void }>()

const isLoading = ref(false)

function onClick() {
  if (props.disabled || isLoading.value) return
  isLoading.value = true
  emit('vote')
  setTimeout(() => {
    isLoading.value = false
  }, 600)
}

watch(() => props.disabled, val => {
  if (val) isLoading.value = false
})
</script>

<template>
  <button class="draw-button" :disabled="props.disabled || isLoading" @click="onClick" type="button"
          aria-pressed="false" aria-label="Vote for a draw" title="Vote for a draw">
    <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
    <span v-else>Vote Draw</span>
  </button>
</template>

<style scoped>
.draw-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #000000;
  color: rgb(57, 255, 39);
  border: none;
  padding: 0.65rem 0.75rem;
  width: 8rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  min-width: 3.5rem;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform .06s ease, background .12s ease;
}
.draw-button:hover:not(:disabled) { background: #5eff00; color:#000000; }
.draw-button:active:not(:disabled) { transform: translateY(0); }
.draw-button:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-sizing: border-box;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
