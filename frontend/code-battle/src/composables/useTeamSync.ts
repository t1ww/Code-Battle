// frontend\code-battle\src\composables\useTeamSync.ts
import { watch, nextTick, ref, type Ref } from 'vue'
import { socket } from '@/clients/socket.api'
import { usePvpGameStore } from '@/stores/game'
import debounce from 'lodash/debounce'
import { getPlayerData } from '@/stores/auth'

interface UseTeamSyncOptions {
    playerId: string | null | undefined
    codes: Ref<{ value: string }[]> // reactive array of codes for each question
    currentQuestionIndex: Ref<number>
}

export function useTeamSync({ playerId, codes, currentQuestionIndex }: UseTeamSyncOptions) {
    const gameStore = usePvpGameStore()
    const player = getPlayerData();

    // ===================================================
    // 🧠 STATE: teammate cursors
    // ===================================================
    // teammateCursors: playerName → { questionIndex, cursorIndex }
    const teammateCursors = ref<Record<string, { questionIndex: number; cursorIndex: number }>>({})
    // self cursor
    const localCursorIndex = ref(0)

    // ===================================================
    // 📨 RECEIVE teammate code updates
    // ===================================================
    let isApplyingExternal = false;
    const handleTeamCodeUpdate = (payload: { questionIndex: number, code: string, playerId: string }) => {
        if (payload.playerId === playerId) return;
        const { questionIndex, code } = payload;
        if (!codes.value[questionIndex]) return;

        isApplyingExternal = true;
        codes.value[questionIndex].value = code;
        nextTick(() => { isApplyingExternal = false });
    }

    socket.on('teamCodeUpdate', handleTeamCodeUpdate)

    // ===================================================
    // 📤 EMIT code updates (debounced)
    // ===================================================
    const pendingUpdates: Record<number, string> = {};
    const flushUpdates = debounce(() => {
        if (!gameStore.gameId || !playerId) return;
        for (const [questionIndex, code] of Object.entries(pendingUpdates)) {
            socket.emit('updateTeamCode', {
                gameId: gameStore.gameId,
                playerId,
                questionIndex: Number(questionIndex),
                code,
            });
        }
        Object.keys(pendingUpdates).forEach(k => delete pendingUpdates[+k]);
    }, 100);

    codes.value.forEach((c, idx) => {
        watch(() => c.value, (newCode) => {
            if (isApplyingExternal) return;
            pendingUpdates[idx] = newCode;
            flushUpdates();
        });
    });

    // ===================================================
    // 🖱️ CURSOR SYNC
    // ===================================================

    // Emit local cursor change (debounced to reduce spam)
    const emitCursorUpdate = debounce((index: number, questionIndex: number) => {
        if (!gameStore.gameId || !playerId || !player) return;
        socket.emit('updateCursor', {
            gameId: gameStore.gameId,
            playerId,
            playerName: player.name || 'Unknown',
            questionIndex,
            cursorIndex: index
        });
    }, 50);

    watch(localCursorIndex, (newIndex) => {
        emitCursorUpdate(newIndex, currentQuestionIndex.value); // <- use reactive ref
    });

    // Receive teammate cursor updates
    const handleCursorUpdate = (payload: {
        playerId: string
        playerName: string
        cursorIndex: number
        questionIndex: number
    }) => {
        if (payload.playerId === playerId) return
        teammateCursors.value[payload.playerName] = {
            questionIndex: payload.questionIndex,
            cursorIndex: payload.cursorIndex
        }
    }

    socket.on('teamCursorUpdate', handleCursorUpdate);

    // ===================================================
    // 🧹 Cleanup
    // ===================================================
    const destroy = () => {
        socket.off('teamCodeUpdate', handleTeamCodeUpdate)
        socket.off('teamCursorUpdate', handleCursorUpdate)
    }

    return { destroy, localCursorIndex, teammateCursors }
}
