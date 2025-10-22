// frontend\code-battle\src\composables\usePvpTeamChat.ts
import { ref, onUnmounted } from 'vue'
import { socket } from '@/clients/socket.api'
import { usePvpGameStore } from '@/stores/game'
import { getPlayerData } from '@/stores/auth'
import { triggerNotification } from '@/composables/notificationService'

export type ChatMessage = { from: string; text: string }
export function usePvpTeamChat() {
    const gameStore = usePvpGameStore()
    const player = getPlayerData()


    const chatMessages = ref<ChatMessage[]>([])

    function sendMessage(msg: string) {
        if (!msg.trim()) return
        if (!gameStore.gameId) {
            triggerNotification('Game not ready yet!')
            return
        }

        const fromName = player?.name || 'You'

        // Optimistic UI
        chatMessages.value.push({ from: fromName, text: msg })

        socket.emit('teamChatMessage', {
            gameId: gameStore.gameId,
            text: msg
        })
    }

    // Listen only for your team messages
    const handler = (data: { from: string; text: string; gameId: string }) => {
        if (data.gameId !== gameStore.gameId) return
        // Ignore messages from yourself (already optimistically added)
        if (data.from === player?.name) return

        chatMessages.value.push({ from: data.from, text: data.text })
    }

    socket.on('teamChatMessage', handler)

    onUnmounted(() => {
        socket.off('teamChatMessage', handler)
    })

    return { chatMessages, sendMessage }
}