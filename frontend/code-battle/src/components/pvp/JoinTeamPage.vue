<!-- frontend\code-battle\src\components\pvp\JoinTeamPage.vue -->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useTeamStore } from '@/stores/team'
import { getPlayerData } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const teamStore = useTeamStore()

const self = getPlayerData()
if (!self || !self.player_id || !self.name || !self.email) {
    throw new Error('Player not authenticated or missing data')
}

const selfInfo = {
    id: self.player_id,
    name: self.name,
    email: self.email,
}

onMounted(async () => {
    const inviteId = route.params.inviteId as string
    if (inviteId && !teamStore.team_id) {
        try {
            await teamStore.joinTeamWithInvite(inviteId, selfInfo)
            router.push({ name: 'PvpTypeSelect' })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : ''
            alert(`Failed to join team: ${errorMessage ? ': ' + errorMessage : ''}`)
            router.push({ name: 'Home' })
        }
    }
})

</script>

<template>
    <div>
        Joining team...
    </div>
</template>
