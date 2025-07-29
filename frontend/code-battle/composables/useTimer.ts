// composables/useTimer.ts
import { computed, ref } from 'vue'

export function useTimer(timeLimitEnabled: boolean, baseTime: number, onTimeout: () => void) {
    const timeLeft = ref(timeLimitEnabled ? baseTime : 0)
    let timer: ReturnType<typeof setInterval> | null = null

    function startTimer() {
        if (timer) clearInterval(timer)
        timer = setInterval(() => {
            if (timeLimitEnabled) {
                if (timeLeft.value > 0) {
                    timeLeft.value--
                } else {
                    stopTimer()
                    onTimeout()
                }
            } else {
                timeLeft.value++
            }
        }, 1000)
    }

    function stopTimer() {
        if (timer) clearInterval(timer)
    }

    const formattedTime = computed(() => {
        const total = timeLeft.value
        const h = String(Math.floor(total / 3600)).padStart(2, '0')
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
        const s = String(total % 60).padStart(2, '0')
        return `${h}:${m}:${s}`
    })

    return {
        timeLeft,
        formattedTime,
        startTimer,
        stopTimer,
    }
}
