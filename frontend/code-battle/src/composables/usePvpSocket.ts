// frontend\code-battle\src\composables\usePvpSocket.ts
import { onMounted, onUnmounted } from 'vue'
import { socket } from '@/clients/socket.api'
import { usePvpGameStore } from '@/stores/usePvpGameStore'
import { triggerNotification } from '@/composables/notificationService'
import { getPlayerData } from '@/stores/auth'

export function usePvpSocket(options: {
    DEV?: boolean
    currentQuestionIndex: any
    sabotagePoint: any
    sabotageOnce: () => void
    showClearedPopup: any
    showMessagePopup: any
    showVoteDrawPanel: any
    showOpponentPanel: any
    showResultPopup: any
    showDrawFeedback: any
    drawRequestedByTeam: any
    updateGameState: (game: any) => void
    updateProgress: (team: 'team1' | 'team2', qIndex: number, progress: any, progressFullPass: any) => void
    handleEnableForfeit: () => void
    startTimer: () => void
    stopTimer: () => void
    timeLimitEnabled: boolean
    timeLeft: any
    PVP_TIME_LIMIT: number
    router: any
}) {
    const {
        DEV, currentQuestionIndex, sabotagePoint, sabotageOnce,
        showClearedPopup, showMessagePopup, showVoteDrawPanel, showOpponentPanel,
        showResultPopup, showDrawFeedback, drawRequestedByTeam,
        updateGameState, updateProgress, handleEnableForfeit,
        startTimer, stopTimer, timeLimitEnabled, timeLeft, PVP_TIME_LIMIT, router
    } = options

    const gameStore = usePvpGameStore()
    const player = getPlayerData()

    onMounted(() => {
        // === Game bootstrap ===
        if (!gameStore.gameId) {
            if (DEV) {
                console.log("DEV mode: Creating dummy game...")
                try {
                    socket.emit("createDevGame", { playerId: player?.player_id })
                } catch (err) {
                    console.error("Failed to create DEV game:", err)
                }
            } else {
                triggerNotification("No active game found. Redirecting to game selection.", 2000)
                router.replace({ name: 'PvpTypeSelect' })
                return
            }
        }

        socket.once("devGameCreated", (game) => {
            console.log("DEV game created:", game)
            updateGameState(game)
        })

        socket.emit("getGameState", { gameId: gameStore.gameId })
        socket.once("gameState", (game) => updateGameState(game))

        // === Question progress ===
        socket.on("questionProgress", (data) => {
            if (!data?.team) return
            const qIndex = data.questionIndex ?? currentQuestionIndex.value
            updateProgress(data.team as 'team1' | 'team2', qIndex, data.progress, data.progressFullPass)

            const progressArr = gameStore.progress[data.team as 'team1' | 'team2'][qIndex]
            const testCasesFinished = Array.isArray(progressArr) && progressArr.every(Boolean)
            const questionFinished = !!gameStore.progressFullPass[data.team as 'team1' | 'team2'][qIndex]

            if (testCasesFinished && !questionFinished) {
                setTimeout(() => triggerNotification(
                    "This question doesn't count yet — all test cases must pass in the same submission.",
                    1800
                ), 2000)
            }
        })

        // === Sabotage ===
        socket.on("awardSabotage", (payload: { amount: number }) => {
            if (typeof payload?.amount === "number") {
                sabotagePoint.value += payload.amount
                triggerNotification(`+${payload.amount} sabotage point(s)!`, 1200)
            }
        })

        socket.on("sabotageReceived", () => {
            sabotageOnce()
        })

        // === Draw flow ===
        socket.on("voteDrawResult", (data: { votes: number, totalPlayers: number }) => {
            triggerNotification(`Draw vote: ${data.votes}/${data.totalPlayers} voted`, 1200)
        })

        socket.on("drawRequested", ({ byTeam }) => {
            triggerNotification("Opposing team has requested a draw!", 2000)
            showDrawFeedback.value = true
            drawRequestedByTeam.value = byTeam
        })

        // === Forfeit enable ===
        socket.on("enableForfeitButton", () => {
            handleEnableForfeit()
        })

        // === Game end ===
        socket.on("gameEnd", (data: { winner: 'team1' | 'team2' | 'draw', progress: any }) => {
            showClearedPopup.value = false
            showMessagePopup.value = false
            showVoteDrawPanel.value = false
            showOpponentPanel.value = false

            showResultPopup.value = true
            gameStore.finished = true
            gameStore.winner = data.winner

            setTimeout(() => triggerNotification(`Game ended — winner: ${data.winner}`, 2500), 2000)
        })

        // === Timer ===
        if (timeLimitEnabled) timeLeft.value = PVP_TIME_LIMIT || 0
        startTimer()
    })

    onUnmounted(() => {
        stopTimer()
        socket.off("questionProgress")
        socket.off("awardSabotage")
        socket.off("sabotageReceived")
        socket.off("voteDrawResult")
        socket.off("drawRequested")
        socket.off("enableForfeitButton")
        socket.off("gameEnd")
    })
}
