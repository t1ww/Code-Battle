import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PrivateRoomState, SwapRequest } from '@/types/privateRoom.d.ts'
import { socket } from '@/clients/socket.api'

export const usePrivateRoomStore = defineStore('privateRoom', () => {
  const state = ref<PrivateRoomState>({
    teamA: { id: '', members: [] },
    teamB: { id: '', members: [] },
    swapRequests: [],
    inviteLink: ''
  })

  function sendSwapRequest(fromTeamId: string, toTeamId: string, requesterId: string, targetId: string) {
    socket.emit('swapRequest', { fromTeamId, toTeamId, requesterId, targetId })
  }

  function acceptSwap(swap: SwapRequest) {
    socket.emit('swapAccept', swap)
  }

  function declineSwap(swap: SwapRequest) {
    socket.emit('swapDecline', swap)
  }

  // Listen for socket events
  socket.on('swapRequest', (swap: SwapRequest) => {
    state.value.swapRequests.push(swap)
  })
  socket.on('swapAccepted', (swap: SwapRequest) => {
    state.value.swapRequests = state.value.swapRequests.filter(s => s !== swap)
    // Optionally update teams here
  })
  socket.on('swapDeclined', (swap: SwapRequest) => {
    state.value.swapRequests = state.value.swapRequests.filter(s => s !== swap)
  })

  return {
    state,
    sendSwapRequest,
    acceptSwap,
    declineSwap
  }
})