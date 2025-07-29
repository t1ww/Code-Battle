// composables/useSabotage.ts
import { Ref } from 'vue'

export function useSabotage(code: Ref<string>, triggerNotification: (msg: string) => void) {
    let sabotageTimer: ReturnType<typeof setInterval> | null = null

    function startSabotage() {
        triggerNotification('Sabotage modifier is active, your code will get one of its character removed every 2 minutes.')

        sabotageTimer = setInterval(() => {
            if (code.value.length > 0) {
                const index = Math.floor(Math.random() * code.value.length)
                code.value = code.value.slice(0, index) + code.value.slice(index + 1)
                triggerNotification('Your code has been sabotaged, find and fix it!')
            }
        }, 2 * 60 * 1000) // every 2 mins
    }

    function stopSabotage() {
        if (sabotageTimer) clearInterval(sabotageTimer)
    }

    return {
        startSabotage,
        stopSabotage,
    }
}
