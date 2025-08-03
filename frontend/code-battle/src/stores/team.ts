// stores/team.ts
import { defineStore } from 'pinia'
import { socket } from '@/clients/socket.api'

export const useTeamStore = defineStore('team', {
    state: () => ({
        team_id: null as string | null,
        members: [] as { player_id: string; name: string; avatar_url?: string }[],
        invite_link: '' as string,
    }),

    getters: {
        size: (state) => state.members.length,
        isLeader: (state) => state.members[0]?.player_id === localStorage.getItem('player_id'),
    },

    actions: {
        connectSocket() {
            if (!socket.connected) socket.connect()
        },

        async createTeam(self: { player_id: string; name: string; avatar_url?: string }) {
            this.connectSocket()
            return new Promise<void>((resolve, reject) => {
                socket.emit('createTeam', [self])

                socket.once('teamCreated', ({ team_id, link }) => {
                    this.team_id = team_id
                    this.members = [self]
                    this.invite_link = link // store backend link here
                    resolve()
                })

                socket.once('error', ({ error_message }) => {
                    reject(error_message)
                })
            })
        },

        async joinTeamWithInvite(invite_id: string, self: { id: string; name: string, email: string }) {
            this.connectSocket()
            return new Promise<void>((resolve, reject) => {
                socket.emit('joinTeamWithInvite', {
                    invite_id,
                    player: {
                        player_id: self.id,  // rename here
                        name: self.name,
                        email: self.email // add if available or empty string
                    }
                });


                socket.once('teamJoined', (team) => {
                    this.team_id = team.team_id
                    this.members = team.players
                    resolve()
                })

                socket.once('error', ({ error_message }) => {
                    reject(error_message)
                })
            })
        },

        setMembers(members: { player_id: string; name: string; avatar_url?: string }[]) {
            this.members = members
        }
    },
})
