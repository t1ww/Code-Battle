// frontend\code-battle\src\stores\usePvpGameStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePvpGameStore = defineStore('pvpGame', () => {
  const gameId = ref<string | null>(null)
  const questions = ref<any[]>([])
  const progress = ref<any>({})
  const progressFullPass = ref<any>({})
  const team1 = ref<any>({})
  const team2 = ref<any>({})
  const drawVotes = ref<Set<string>>(new Set())
  const finished = ref(false)
  const winner = ref<'team1' | 'team2' | 'draw' | null>(null)
  const endReason = ref<string | null>(null)

  const playerTeam = ref<'team1' | 'team2' | null>(null)

  // 🔹 String key of opponent team
  const opponentTeam = computed(() => {
    if (playerTeam.value === 'team1') return 'team2'
    if (playerTeam.value === 'team2') return 'team1'
    return null
  })

  // 🔹 Actual object of opponent team
  const opponentTeamObj = computed(() => {
    if (opponentTeam.value === 'team1') return team1.value
    if (opponentTeam.value === 'team2') return team2.value
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

  return { 
    gameId, 
    questions, 
    progress, 
    progressFullPass,
    team1, 
    team2, 
    drawVotes, 
    finished,
    winner,
    playerTeam, 
    opponentTeam, 
    opponentTeamObj,
    clearGame,
    endReason
  }
})