<template>
    <div class="team-list">
        <h3 class="team-title">{{ title }}</h3>
        <div class="players">
            <div v-for="(player, i) in players" :key="player.id ?? i" class="player-slot">
                <PlayerAvatar :player="player" />
                <div class="avatar-name">{{ player.name }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import PlayerAvatar from '@/components/pvp/PlayerAvatar.vue'

defineProps<{
    title: string
    players: { id: string; name: string; avatar_url?: string }[]
}>()
</script>

<style scoped>
.team-list {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.players {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.5rem;
}

.player-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.avatar-name {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
}
</style>
