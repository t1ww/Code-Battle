export interface SwapRequest {
  fromTeamId: string
  toTeamId: string
  requesterId: string
  targetId: string
  status: 'pending' | 'accepted' | 'declined'
}

export interface PrivateRoomState {
  teamA: { id: string, members: any[] }
  teamB: { id: string, members: any[] }
  swapRequests: SwapRequest[]
}