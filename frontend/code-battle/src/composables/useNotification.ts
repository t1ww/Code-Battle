// composables/useNotification.ts
import { ref } from 'vue'

export function useNotification(duration = 3000) {
    const showNotification = ref(false)
    const notificationMessage = ref('')

    function triggerNotification(message: string, customDuration?: number) {
        notificationMessage.value = message
        showNotification.value = true
        setTimeout(() => (showNotification.value = false), customDuration ?? duration)
    }

    return {
        showNotification,
        notificationMessage,
        triggerNotification,
    }
}
