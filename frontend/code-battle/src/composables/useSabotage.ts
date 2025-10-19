// frontend/code-battle/src/composables/useSabotage.ts
import type { Ref } from "vue"

export function useSabotage(code: Ref<string>, triggerNotification: (msg: string) => void) {
    let sabotageTimer: ReturnType<typeof setInterval> | null = null
    let time = 2;
    let unitMinute = 60;
    let unitMillisecond = 1000;

    // helper: find an index of a meaningful character
    function getMeaningfulIndex(src: string): number | null {
        // Remove all line & block comments
        const noComments = src
            .replace(/\/\/.*$/gm, '')       // remove line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments

        // Collect indices of meaningful characters (non-whitespace)
        const indices: number[] = []
        for (let i = 0; i < src.length; i++) {
            const ch = src[i]
            if (!/\s/.test(ch) && noComments.includes(ch)) {
                indices.push(i)
            }
        }

        if (indices.length === 0) return null
        return indices[Math.floor(Math.random() * indices.length)]
    }

    function sabotageOnce() {
        if (!code.value.trim()) return

        const index = getMeaningfulIndex(code.value)
        if (index == null) {
            // No meaningful character to remove — sabotage missed
            triggerNotification("Your code has been sabotaged... Luckily they missed!")
            return
        }

        triggerNotification('Your code has been sabotaged, find and fix it!')
        console.log("[Sabotage] Deleting char:", code.value[index], "at", index)
        code.value = code.value.slice(0, index) + code.value.slice(index + 1)
    }

    function startSabotage() {
        triggerNotification('Sabotage modifier is active, your code will get one of its character removed every 2 minutes.')

        sabotageTimer = setInterval(() => {
            if (!code.value.trim()) return
            sabotageOnce()
        }, time * unitMinute * unitMillisecond) // time * min * ms 
    }

    function stopSabotage() {
        if (sabotageTimer) clearInterval(sabotageTimer)
    }

    return { startSabotage, stopSabotage, sabotageOnce }
}
