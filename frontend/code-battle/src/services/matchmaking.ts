// Deprecated, will keep for mock data template
import type { PlayerData } from '@/types/types'

export function findMatch(): Promise<{
    you: PlayerData
    friends: PlayerData[]
    opponents: PlayerData[]
}> {
    return new Promise(resolve => {
        setTimeout(() => resolve({
            you: {
                token: null, player_id: '1', name: 'you', email: null,
                avatar_url: 'https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg'
            },
            friends: [
                { token: null, player_id: '2', name: 'friend 1', email: null, avatar_url: 'https://braverplayers.org/wp-content/uploads/2022/09/blank-pfp.png' },
                { token: null, player_id: '3', name: 'friend 2', email: null }
            ],
            opponents: [
                { token: null, player_id: '4', name: 'opponent 1', email: null, avatar_url: 'https://braverplayers.org/wp-content/uploads/2022/09/blank-pfp.png' },
                { token: null, player_id: '5', name: 'opponent 2', email: null, avatar_url: 'https://braverplayers.org/wp-content/uploads/2022/09/blank-pfp.png' },
                { token: null, player_id: '6', name: 'opponent 3', email: null }
            ]
        }), 2000)
    })
}
