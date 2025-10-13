// frontend\code-battle\src\composables\useTeamSync.ts
import { watch, type Ref } from 'vue'
import { socket } from '@/clients/socket.api'
import { usePvpGameStore } from '@/stores/game'
import debounce from 'lodash/debounce'

interface UseTeamSyncOptions {
    playerId: string | null | undefined
    teamKey: 'team1' | 'team2'
    codes: Ref<{ value: string }[]> // reactive array of codes for each question
}

export function useTeamSync({ playerId, teamKey, codes }: UseTeamSyncOptions) {
    const gameStore = usePvpGameStore()

    // -----------------------
    // Receive teammate updates
    // -----------------------
    const handleTeamCodeUpdate = (payload: { questionIndex: number, code: string }) => {
        const { questionIndex, code } = payload
        if (!codes.value[questionIndex]) return
        codes.value[questionIndex].value = code
    }

    socket.on('teamCodeUpdate', handleTeamCodeUpdate)

    // -----------------------
    // Emit own updates (debounced)
    // -----------------------
    const emitCodeUpdate = debounce((questionIndex: number, code: string) => {
        if (!gameStore.gameId || !playerId) return
        socket.emit('updateTeamCode', {
            gameId: gameStore.gameId,
            playerId,
            team: teamKey,
            questionIndex,
            code
        })
    }, 150) // 150ms debounce to reduce spam

    // -----------------------
    // Watch local code changes
    // -----------------------
    codes.value.forEach((c, idx) => {
        watch(() => c.value, (newCode) => {
            emitCodeUpdate(idx, newCode)
        })
    })

    // -----------------------
    // Cleanup
    // -----------------------
    const destroy = () => {
        socket.off('teamCodeUpdate', handleTeamCodeUpdate)
    }

    return { destroy }
}
