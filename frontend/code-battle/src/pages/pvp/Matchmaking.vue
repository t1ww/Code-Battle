<template>
    <div class="matchmaking-container">
        <div v-if="state === MatchState.Searching">
            <MagnifierIcon />
            <p>Searching for a match…</p>
        </div>

        <div v-else-if="state === MatchState.Found">
            <ThumbsUpIcon />
            <p>Match found!</p>
        </div>

        <div v-else-if="state === MatchState.ShowingTeams">
            <TeamList :title="'Team 1'" :players="[match.you, ...match.friends]" />
            <span>VS</span>
            <TeamList :title="'Team 2'" :players="match.opponents" />
        </div>

        <div v-else-if="state === MatchState.Countdown">
            <p class="countdown">{{ countdown }}</p>
        </div>

        <div v-else>
            <h1>MATCH START!</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MatchState } from '@/types/types'
import { findMatch } from '@/services/matchmaking'
import type { PlayerData } from '@/types/types'

const state = ref<MatchState>(MatchState.Searching)
const match = ref<{ you: PlayerData; friends: PlayerData[]; opponents: PlayerData[] }>({
    you: { token: '', id: '0', name: '', email: '' }, friends: [], opponents: []
})
const countdown = ref(3)

onMounted(async () => {
    // 1. Search
    await findMatch().then(data => {
        match.value = data
        state.value = MatchState.Found
    })

    // 2. Show “Match found!” for 1s
    setTimeout(() => state.value = MatchState.ShowingTeams, 1000)

    // 3. Then show teams for 1s
    setTimeout(() => {
        state.value = MatchState.Countdown
        const timer = setInterval(() => {
            if (countdown.value === 1) {
                clearInterval(timer)
                state.value = MatchState.Started
            } else {
                countdown.value--
            }
        }, 1000)
    }, 1000)
})
</script>

<style scoped>
.matchmaking-container {
    /* center everything */
    display: grid;
    place-items: center;
    width: 100vw;
    height: 100vh;
    background: #ccc;
}

.countdown {
    font-size: 5rem;
}
</style>
