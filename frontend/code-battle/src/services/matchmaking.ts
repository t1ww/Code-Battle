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
                avatarUrl: 'https://i.pravatar.cc/64?img=1'
            },
            friends: [
                { token: null, id: '2', name: 'friend 1', email: null, avatarUrl: 'https://i.pravatar.cc/64?img=2' },
                { token: null, id: '3', name: 'friend 2', email: null }
            ],
            opponents: [
                { token: null, id: '4', name: 'opponent 1', email: null, avatarUrl: 'https://i.pravatar.cc/64?img=4' },
                { token: null, id: '5', name: 'opponent 2', email: null, avatarUrl: 'https://i.pravatar.cc/64?img=5' },
                { token: null, id: '6', name: 'opponent 3', email: null }
            ]
        }), 2000)
    })
}
