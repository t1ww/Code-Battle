// stores/team.ts
import { defineStore } from 'pinia'
import { socket } from '@/clients/socket.api'

export const useTeamStore = defineStore('team', {
    state: () => ({
        team_id: null as string | null,
        members: [] as { id: string, name: string, avatar_url?: string }[],
    }),

    getters: {
        size: (state) => state.members.length,
        isLeader: (state) => state.members[0]?.id === localStorage.getItem('player_id'),
    },

    actions: {
        connectSocket() {
            if (!socket.connected) socket.connect()
        },

        async createTeam(self: { id: string, name: string }) {
            this.connectSocket()
            return new Promise<void>((resolve, reject) => {
                socket.emit("createTeam", [self])

                socket.once("teamCreated", ({ team_id, link }) => {
                    this.team_id = team_id
                    this.members = [self]
                    resolve()
                })

                socket.once("error", ({ error_message }) => {
                    reject(error_message)
                })
            })
        },

        async joinTeam(team_id: string, self: { id: string, name: string }) {
            this.connectSocket()
            return new Promise<void>((resolve, reject) => {
                socket.emit("joinTeam", { team_id, player: self })

                socket.once("teamJoined", (team) => {
                    this.team_id = team.team_id
                    this.members = team.players
                    resolve()
                })

                socket.once("error", ({ error_message }) => {
                    reject(error_message)
                })
            })
        },

        addMember(member: { id: string, name: string, avatar_url?: string }) {
            if (!this.members.some(m => m.id === member.id)) {
                this.members.push(member)
            }
        },

        removeMember(id: string) {
            this.members = this.members.filter(m => m.id !== id)
        }
    }
})
