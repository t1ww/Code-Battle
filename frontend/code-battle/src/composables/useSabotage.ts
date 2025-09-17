// frontend/code-battle/src/composables/useSabotage.ts
import type { Ref } from "vue"

export function useSabotage(code: Ref<string>, triggerNotification: (msg: string) => void) {
    let sabotageTimer: ReturnType<typeof setInterval> | null = null

    function sabotageOnce() {
        if (code.value.length > 0) {
            triggerNotification('Your code has been sabotaged, find and fix it!')
            const index = Math.floor(Math.random() * code.value.length)
            code.value = code.value.slice(0, index) + code.value.slice(index + 1)
        }
    }

    function startSabotage() {
        triggerNotification('Sabotage modifier is active, your code will get one of its character removed every 2 minutes.')

        sabotageTimer = setInterval(() => {
            if (code.value.length > 0) {
                // Notify the sabotage
                triggerNotification('Your code has been sabotaged, find and fix it!')

                // Remove a character
                const index = Math.floor(Math.random() * code.value.length)
                code.value = code.value.slice(0, index) + code.value.slice(index + 1)
            }
        }, 2 * 60 * 1000) // every 2 mins
    }

    function stopSabotage() {
        if (sabotageTimer) clearInterval(sabotageTimer)
    }

    return {
        startSabotage,
        stopSabotage,
        sabotageOnce,
    }
}
