import type { PlayerData } from '@/types/types'

export function findMatch(): Promise<{
    you: PlayerData
    friends: PlayerData[]
    opponents: PlayerData[]
}> {
    return new Promise(resolve => {
        setTimeout(() => resolve({
            you: {
                token: null, id: '1', name: 'you', email: null,
                avatarUrl: 'https://i.pinimg.com/236x/68/31/12/68311248ba2f6e0ba94ff6da62eac9f6.jpg'
            },
            friends: [
                { token: null, id: '2', name: 'friend 1', email: null, avatarUrl: 'https://braverplayers.org/wp-content/uploads/2022/09/blank-pfp.png' },
                { token: null, id: '3', name: 'friend 2', email: null }
            ],
            opponents: [
                { token: null, id: '4', name: 'opponent 1', email: null, avatarUrl: 'https://braverplayers.org/wp-content/uploads/2022/09/blank-pfp.png' },
                { token: null, id: '5', name: 'opponent 2', email: null, avatarUrl: 'https://braverplayers.org/wp-content/uploads/2022/09/blank-pfp.png' },
                { token: null, id: '6', name: 'opponent 3', email: null }
            ]
        }), 2000)
    })
}
