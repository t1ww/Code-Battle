// stores/team.ts
import { defineStore } from 'pinia'

export const useTeamStore = defineStore('team', {
    state: () => ({
        members: [] as { id: string, name: string, avatar_url?: string }[],
    }),
    getters: {
        size: (state) => state.members.length,
        isLeader: (state) => state.members[0]?.id === localStorage.getItem('player_id'),
    },
    actions: {
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
