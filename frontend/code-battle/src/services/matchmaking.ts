// services/matchmaking.ts
import type { PlayerData } from '@/types/types'

export function findMatch(): Promise<{
    you: PlayerData;
    friends: PlayerData[];
    opponents: PlayerData[];
}> {
    return new Promise(resolve => {
        setTimeout(() => resolve({
            you: { token: null, id: '1', name: 'you', email: null },
            friends: [
                { token: null, id: '2', name: 'friend_1', email: null },
                { token: null, id: '3', name: 'friend_2', email: null }
            ],
            opponents: [
                { token: null, id: '4', name: 'opponent_1', email: null },
                { token: null, id: '5', name: 'opponent_2', email: null },
                { token: null, id: '6', name: 'opponent_3', email: null }
            ]
        }), 2000)
    })
}
