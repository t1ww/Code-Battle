// frontend\code-battle\src\composables\useTeamSync.ts
import { watch, nextTick, type Ref } from 'vue'
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
    let isApplyingExternal = false;
    const handleTeamCodeUpdate = (payload: { questionIndex: number, code: string, playerId: string }) => {
        if (payload.playerId === playerId) return;
        const { questionIndex, code } = payload;
        if (!codes.value[questionIndex]) return;

        isApplyingExternal = true;
        codes.value[questionIndex].value = code;
        nextTick(() => {
            isApplyingExternal = false;
        });
        
        console.log("Received team code update.")
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
            // Skip emitting if it's from a teammate update
            if (isApplyingExternal) return;
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
