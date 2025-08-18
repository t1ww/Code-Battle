import { socket } from '@/clients/socket.api'

export function requestSwap(fromTeamId: string, toTeamId: string, requesterId: string, targetId: string) {
  socket.emit('swapRequest', { fromTeamId, toTeamId, requesterId, targetId })
}

export function onSwapRequest(callback: (data: any) => void) {
  socket.on('swapRequest', callback)
}

export function acceptSwap(swapId: string) {
  socket.emit('swapAccept', { swapId })
}

export function declineSwap(swapId: string) {
  socket.emit('swapDecline', { swapId })
}