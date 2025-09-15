// frontend\code-battle\src\stores\pvpGameStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePvpGameStore = defineStore('pvpGame', () => {
  const gameId = ref<string | null>(null)
  const questions = ref<any[]>([])
  const progress = ref<any>({})
  const team1 = ref<any>({})
  const team2 = ref<any>({})
  const drawVotes = ref<Set<string>>(new Set())
  const finished = ref(false)
  
  // Add playerTeam to track which team the current player is on
  const playerTeam = ref<'team1' | 'team2' | null>(null)

  // Computed helper to get opponent team key
  const opponentTeam = computed(() => {
    if (playerTeam.value === 'team1') return 'team2'
    if (playerTeam.value === 'team2') return 'team1'
    return null
  })

  function clearGame() {
    gameId.value = null
    questions.value = []
    progress.value = {}
    team1.value = {}
    team2.value = {}
    drawVotes.value.clear()
    finished.value = false
    playerTeam.value = null
  }

  return { gameId, questions, progress, team1, team2, drawVotes, finished, playerTeam, opponentTeam, clearGame }
})
