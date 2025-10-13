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
    const handleTeamCodeUpdate = (payload: { questionIndex: number, code: string, playerId: string }) => {
        if (payload.playerId === playerId) return // ignore updates from self
        const { questionIndex, code } = payload
        if (!codes.value[questionIndex]) return
        codes.value[questionIndex].value = code
        console.log("Recieved team code update.")
    }

    socket.on('teamCodeUpdate', handleTeamCodeUpdate)

    // -----------------------
    // Emit own updates (debounced)
    // -----------------------
    const pendingUpdates: Record<number, string> = {};
    const flushUpdates = debounce(() => {
        if (!gameStore.gameId || !playerId) return;
        for (const [questionIndex, code] of Object.entries(pendingUpdates)) {
            socket.emit('updateTeamCode', {
                gameId: gameStore.gameId,
                playerId,
                team: teamKey,
                questionIndex: Number(questionIndex),
                code,
            });
        }
        // clear buffer
        Object.keys(pendingUpdates).forEach(k => delete pendingUpdates[+k]);
    }, 100); // batch every 100ms

    // -----------------------
    // Watch local code changes
    // -----------------------
    codes.value.forEach((c, idx) => {
        watch(() => c.value, (newCode) => {
            pendingUpdates[idx] = newCode;
            flushUpdates();
        });
    });

    // -----------------------
    // Cleanup
    // -----------------------
    const destroy = () => {
        socket.off('teamCodeUpdate', handleTeamCodeUpdate)
    }

    return { destroy }
}
