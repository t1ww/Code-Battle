// frontend\code-battle\src\stores\privateRoom.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PrivateRoomState, SwapRequest } from '@/types/privateRoom.d.ts'
import { socket } from '@/clients/socket.api'

export const usePrivateRoomStore = defineStore('privateRoom', () => {
  const state = ref<PrivateRoomState>({
    roomId: '',
    team1: { team_id: '', players: [] },
    team2: { team_id: '', players: [] },
    swapRequests: [],
    inviteLink: ''
  })

  // --- socket listeners ---
  socket.on('privateRoomCreated', (data: { room_id: string, link: string }) => {
    state.value.inviteLink = `${window.location.origin}${data.link}`
  })

  socket.on('swapRequest', (swap: SwapRequest) => {
    state.value.swapRequests.push(swap)
  })
  socket.on('swapAccepted', (swap: SwapRequest) => {
    state.value.swapRequests = state.value.swapRequests.filter(s => s !== swap)
  })
  socket.on('swapDeclined', (swap: SwapRequest) => {
    state.value.swapRequests = state.value.swapRequests.filter(s => s !== swap)
  })

  // --- actions ---
  function createRoom(players: any[]) {
    socket.emit('createPrivateRoom', players)
  }

  function sendSwapRequest(fromTeamId: string, toTeamId: string, requesterId: string, targetId: string) {
    socket.emit('swapRequest', { fromTeamId, toTeamId, requesterId, targetId })
  }
  function acceptSwap(swap: SwapRequest) {
    socket.emit('swapAccept', swap)
  }
  function declineSwap(swap: SwapRequest) {
    socket.emit('swapDecline', swap)
  }

  return {
    state,
    createRoom,
    sendSwapRequest,
    acceptSwap,
    declineSwap
  }
})