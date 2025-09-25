// frontend\code-battle\src\composables\usePvpSocket.ts
import { onMounted, onUnmounted, type Ref } from 'vue'
import { socket } from '@/clients/socket.api'
import { usePvpGameStore } from '@/stores/game'
import { triggerNotification } from './notificationService'
import router from '@/router'

interface UsePvpSocketOptions {
    playerId: string | null | undefined
    DEV: boolean
    leaveGame: () => void
    sabotageOnce: () => void
    enableForfeit: () => void
    handleQuestionProgress: (data: any) => void
    handleGameEnd: (data: { winner: 'team1' | 'team2' | 'draw' }) => void
    sabotagePoint: Ref<number>
    timeLeft?: Ref<number>
    timeLimitEnabled?: boolean
    PVP_TIME_LIMIT?: number
    onDrawRequested?: (byTeam: string) => void
    onVoteDrawResult?: (votes: number, totalPlayers: number) => void
}

export function usePvpSocket(options: UsePvpSocketOptions) {
    const gameStore = usePvpGameStore()
    const {
        playerId,
        DEV,
        leaveGame,
        sabotageOnce,
        enableForfeit,
        handleQuestionProgress,
        handleGameEnd,
        sabotagePoint,
        timeLeft,
        timeLimitEnabled,
        PVP_TIME_LIMIT,
        onDrawRequested,
        onVoteDrawResult
    } = options

    const registerSocketEvents = () => {
        socket.on("questionProgress", handleQuestionProgress)

        socket.on("awardSabotage", (payload: { amount: number }) => {
            if (typeof payload?.amount === "number") {
                sabotagePoint.value += payload.amount
                triggerNotification(`+${payload.amount} sabotage point(s)!`, 1200)
            }
        })

        socket.on("sabotageReceived", () => sabotageOnce())

        socket.on("voteDrawResult", (data: { votes: number, totalPlayers: number }) => {
            triggerNotification(`Draw vote: ${data.votes}/${data.totalPlayers} voted`, 1200)
            onVoteDrawResult?.(data.votes, data.totalPlayers)
        })

        socket.on("drawRequested", ({ byTeam }) => {
            triggerNotification("Opposing team has requested a draw!", 2000)
            onDrawRequested?.(byTeam)
        })

        socket.on("enableForfeitButton", () => {
            enableForfeit()
            triggerNotification("Vote draw failed — you can now forfeit.", 2000)
        })

        socket.on("gameEnd", handleGameEnd)
    }

    const unregisterSocketEvents = () => {
        socket.off("questionProgress")
        socket.off("awardSabotage")
        socket.off("sabotageReceived")
        socket.off("voteDrawResult")
        socket.off("drawRequested")
        socket.off("enableForfeitButton")
        socket.off("gameEnd")
    }

    const initPvpSockets = () => {
        onMounted(() => {
            if (!gameStore.gameId) {
                if (DEV) {
                    socket.emit("createDevGame", { playerId })
                } else {
                    triggerNotification("No active game found. Redirecting to game selection.", 2000)
                    router.replace({ name: 'PvpTypeSelect' })
                    return
                }
            }

            socket.once("devGameCreated", (game) => updateGameState(game))
            socket.emit("getGameState", { gameId: gameStore.gameId })
            socket.once("gameState", (game) => updateGameState(game))

            registerSocketEvents()

            if (timeLimitEnabled && timeLeft && PVP_TIME_LIMIT) timeLeft.value = PVP_TIME_LIMIT
        })

        onUnmounted(() => {
            unregisterSocketEvents()
            if (!gameStore.finished) {
                leaveGame()
            }
        })
    }

    const updateGameState = (game: any) => {
        gameStore.gameId = game.gameId
        gameStore.questions = game.questions
        gameStore.progress = game.progress
        gameStore.progressFullPass = game.progressFullPass || { team1: [], team2: [] }
        gameStore.team1 = game.team1
        gameStore.team2 = game.team2
        gameStore.playerTeam = game.playerTeam
        gameStore.finished = game.finished
    }

    return { initPvpSockets }
}
