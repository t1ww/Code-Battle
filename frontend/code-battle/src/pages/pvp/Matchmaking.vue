<template>
    <div class="matchmaking-container">
        <div v-if="state === 'searching'">
            <SearchIcon />
            <p>Searching for a match…</p>
        </div>

        <div v-else-if="state === 'found'">
            <MatchFoundIcon />
            <p>Match found!</p>
        </div>

        <div v-else-if="state === 'showingTeams'" class="teams-view">
            <TeamList title="Team 1" :players="[match.you, ...match.friends]" />
            <span class="vs-label">VS</span>
            <TeamList title="Team 2" :players="match.opponents" />
        </div>

        <div v-else-if="state === 'countdown'" class="teams-view">
            <TeamList title="Team 1" :players="[match.you, ...match.friends]" />
            <span class="countdown">{{ countdown }}</span>
            <TeamList title="Team 2" :players="match.opponents" />
        </div>

        <div v-else>
            <h1>MATCH START!</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { findMatch } from '@/services/matchmaking'
import type { PlayerData } from '@/types/types'
import SearchIcon from '@/components/SearchIcon.vue'
import MatchFoundIcon from '@/components/MatchFoundIcon.vue'
import TeamList from '@/components/TeamList.vue'

const state = ref<'searching' | 'found' | 'showingTeams' | 'countdown' | 'started'>('searching')
type MatchMode = '1v1' | '3v3'

const match = ref<{
    mode: MatchMode
    you: PlayerData
    friends: PlayerData[]
    opponents: PlayerData[]
}>({
    mode: '1v1',
    you: { token: null, id: '0', name: '', email: null },
    friends: [],
    opponents: []
})
const countdown = ref(3)

onMounted(async () => {
    const data = await findMatch()
    match.value = {
        mode: data.friends.length + 1 === 3 ? '3v3' : '1v1', // crude check
        ...data
    }
    state.value = 'found'

    setTimeout(() => {
        state.value = 'showingTeams'
        setTimeout(() => {
            state.value = 'countdown'
            const timer = setInterval(() => {
                if (countdown.value === 1) {
                    clearInterval(timer)
                    state.value = 'started'
                } else {
                    countdown.value--
                }
            }, 1000)
        }, 1000)
    }, 1000)
})
</script>

<style scoped>
.matchmaking-container {
    display: grid;
    place-items: center;
    width: 100vw;
    height: 100vh;
    background: #ccc;
}

.teams-view {
    display: flex;
    align-items: center;
}

.vs-label {
    width: 8rem;
    font-weight: bold;
    font-size: 1.25rem;
}

.countdown {
    width: 8rem;
    font-size: 5rem;
}
</style>
