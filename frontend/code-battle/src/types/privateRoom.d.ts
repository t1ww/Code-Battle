// frontend\code-battle\src\types\privateRoom.d.ts
export interface SwapRequest {
  fromTeamId: string
  toTeamId: string
  requesterId: string
  targetId: string
  status: 'pending' | 'accepted' | 'declined'
}

export interface Team {
  team_id: string
  players: {
    player_id: string
    name: string
    email: string
  }[]
}

export interface PrivateRoomState {
  roomId: string
  team1: Team | null
  team2: Team | null
  swapRequests: SwapRequest[]
  inviteLink: string
}