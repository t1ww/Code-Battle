<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useTeamStore } from '@/stores/team'
import { getPlayerData } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const teamStore = useTeamStore()

const self = getPlayerData()
if (!self || !self.id || !self.name) {
    throw new Error('Player not authenticated or missing id/name')
}

const selfInfo = {
    id: self.id,
    name: self.name,
    avatar_url: self.avatar_url,
}

onMounted(async () => {
    const inviteId = route.params.inviteId as string
    if (inviteId && !teamStore.team_id) {
        try {
            await teamStore.joinTeamWithInvite(inviteId, selfInfo)
            // Redirect to your team/play page or wherever after joining
            router.push({ path: '/pvpSelect' })
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to join team')
            // Optionally redirect to a safe page or home
            router.push({ path: '/' })
        }
    }
})
</script>

<template>
    <div>
        Joining team...
    </div>
</template>
