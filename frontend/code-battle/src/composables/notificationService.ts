// frontend/code-battle/src/composables/useNotification.ts
import { ref } from 'vue'

export const showNotification = ref(false)
export const notificationMessage = ref('')

let hideTimeout: ReturnType<typeof setTimeout> | null = null

export function triggerNotification(message: string, duration = 3000) {
  // Clear previous timeout
  if (hideTimeout) clearTimeout(hideTimeout)

  notificationMessage.value = message
  showNotification.value = true

  hideTimeout = setTimeout(() => {
    showNotification.value = false
    hideTimeout = null
  }, duration)
}
