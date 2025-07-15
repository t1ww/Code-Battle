<template>
    <div class="team-list">
        <h3 class="team-title">{{ title }}</h3>
        <div class="players">
            <PlayerAvatar v-for="(p, i) in players" :key="p.id ?? i" :player="p" />
        </div>
    </div>
</template>

<script setup lang="ts">
import PlayerAvatar from './PlayerAvatar.vue'
import type { PlayerData } from '@/types/types'

defineProps<{
    title: string
    players: PlayerData[]
}>()
</script>
