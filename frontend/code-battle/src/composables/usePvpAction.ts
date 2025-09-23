// frontend\code-battle\src\composables\usePvpActions.ts
import { ref } from 'vue'
import { socket } from '@/clients/socket.api'
import { usePvpGameStore } from '@/stores/usePvpGameStore'
import { triggerNotification } from '@/composables/notificationService'
import { getPlayerData } from '@/stores/auth'

/**
 * Composable exposing PvP actions (sabotage, vote draw, forfeit, etc).
 * - Guard emits if gameId or player missing.
 * - Exposes enableForfeit() so caller can flip the UI-enabled state when server requests it.
 */
export function usePvpAction(initialSabotage = 3) {
  const gameStore = usePvpGameStore()
  const player = getPlayerData()
  const sabotagePoint = ref<number>(initialSabotage)
  const lockDrawVoteButton = ref<boolean>(false)
  const forfeitEnabled = ref<boolean>(false)

  async function sendSabotage() {
    if (sabotagePoint.value <= 0) {
      triggerNotification('No sabotage points left!', 1200)
      return
    }
    if (!gameStore.gameId) {
      triggerNotification('Game not ready yet!', 1200)
      return
    }

    try {
      socket.emit('sabotage', { gameId: gameStore.gameId, targetTeam: gameStore.opponentTeam })
      sabotagePoint.value--
      triggerNotification(`Sabotage sent! (${sabotagePoint.value} left)`, 1200)
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

  async function acceptDraw() {
    // alias to voteDraw but kept separate for clarity
    await voteDraw()
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
    lockDrawVoteButton.value = true
    forfeitEnabled.value = true
  }

  return {
    sabotagePoint,
    lockDrawVoteButton,
    forfeitEnabled,
    sendSabotage,
    voteDraw,
    acceptDraw,
    forfeit,
    enableForfeit,
  }
}
