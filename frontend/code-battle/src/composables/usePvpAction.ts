// frontend/code-battle/src/composables/usePvpAction.ts
import { ref, onMounted, onUnmounted } from 'vue'
import { socket } from '@/clients/socket.api'
import { usePvpGameStore } from '@/stores/game'
import { triggerNotification } from '@/composables/notificationService'
import { getPlayerData } from '@/stores/auth'

export function usePvpAction(initialSabotage = 3) {
  const gameStore = usePvpGameStore()
  const player = getPlayerData()

  // For 1v1: personal sabotage count
  const sabotagePoint = ref<number>(initialSabotage)
  // For 3v3: team-shared sabotage pool
  const teamSabotagePoints = ref<number>(0)

  const lockDrawVoteButton = ref<boolean>(false)
  const forfeitEnabled = ref<boolean>(false)

  // === Emit sabotage ===
  async function sendSabotage() {
    const is1v1 = gameStore?.is1v1;
    const is3v3 = gameStore?.is3v3;

    // For both: ensure game exists
    if (!gameStore.gameId) {
      triggerNotification('Game not ready yet!', 1200)
      return
    }

    // For 1v1 → local check
    if (is1v1 && sabotagePoint.value <= 0) {
      triggerNotification('No sabotage points left!', 1200)
      return
    }

    // For 3v3 → shared pool check
    if (is3v3 && teamSabotagePoints.value <= 0) {
      triggerNotification('No team sabotage points left!', 1200)
      return
    }

    try {
      socket.emit('sabotage', {
        gameId: gameStore.gameId,
        targetTeam: gameStore.opponentTeam,
      })

      if (is3v3) {
        teamSabotagePoints.value--
        triggerNotification(`Team sabotage sent! (${teamSabotagePoints.value} left)`, 1200)
      } else {
        sabotagePoint.value--
        triggerNotification(`Sabotage sent! (${sabotagePoint.value} left)`, 1200)
      }
    } catch (e) {
      console.error('sendSabotage failed', e)
      triggerNotification('Failed to send sabotage', 1200)
    }
  }

  async function voteDraw() {
    if (!gameStore.gameId || !player?.player_id) {
      triggerNotification('Unable to vote — game or player missing', 1200)
      return
    }
    try {
      socket.emit('voteDraw', { gameId: gameStore.gameId, player_id: player.player_id })
      lockDrawVoteButton.value = true
      triggerNotification('Voted for a draw', 1200)
    } catch (e) {
      console.error('voteDraw failed', e)
      triggerNotification('Failed to vote draw', 1200)
    }
  }

  async function forfeit() {
    if (!gameStore.gameId || !player?.player_id) {
      triggerNotification('Unable to forfeit — game or player missing', 1200)
      return
    }
    try {
      socket.emit('forfeit', { gameId: gameStore.gameId, player_id: player.player_id })
      triggerNotification('You forfeited.', 1200)
    } catch (e) {
      console.error('forfeit failed', e)
      triggerNotification('Failed to forfeit', 1200)
    }
  }

  function enableForfeit() {
    lockDrawVoteButton.value = false
    forfeitEnabled.value = true
  }

  function leaveGame() {
    if (!gameStore.gameId || !player?.player_id) return
    socket.emit('leaveGame', { gameId: gameStore.gameId, player_id: player.player_id })
  }

  // === Listen for sabotage updates ===
  onMounted(() => {
    // Old 1v1 event
    socket.on('awardSabotage', ({ amount }) => {
      sabotagePoint.value += amount
      triggerNotification(`You earned ${amount} sabotage!`, 1200)
    })

    // New 3v3 team event
    socket.on('teamSabotageUpdate', ({ useby, points }) => {
      teamSabotagePoints.value = points
      triggerNotification(`Team sabotage updated: ${points} total, Used by ${useby}`, 1000)
    })
  })

  onUnmounted(() => {
    socket.off('awardSabotage')
    socket.off('teamSabotageUpdate')
  })

  return {
    sabotagePoint,
    teamSabotagePoints,
    lockDrawVoteButton,
    forfeitEnabled,
    sendSabotage,
    voteDraw,
    forfeit,
    enableForfeit,
    leaveGame,
  }
}
