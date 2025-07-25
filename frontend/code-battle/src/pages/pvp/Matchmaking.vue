<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import { findMatch } from '@/services/matchmaking'
import type { PlayerData } from '@/types/types'

import SearchIcon from '@/components/pvp/SearchIcon.vue'
import MatchFoundIcon from '@/components/pvp/MatchFoundIcon.vue'
import TeamList from '@/components/pvp/TeamList.vue'

type MatchState = 'searching' | 'found' | 'showingTeams' | 'countdown' | 'started'

const route = useRoute()
const mode = computed(() => route.query.mode)

const state = ref<MatchState>('searching')

const match = ref<{
    you: PlayerData
    friends: PlayerData[]
    opponents: PlayerData[]
}>({
    you: { token: null, id: '0', name: '', email: null },
    friends: [],
    opponents: []
})

const team1 = computed(() => {
    if (mode.value === '1v1') return [match.value.you]
    return [match.value.you, ...match.value.friends]
})

const team2 = computed(() => {
    if (mode.value === '1v1') return match.value.opponents.slice(0, 1)
    return match.value.opponents
})

const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null

watch(
    () => route.query.mode,
    async (newModeRaw) => {
        const newMode = (newModeRaw === '1v1' || newModeRaw === '3v3') ? newModeRaw : '1v1'
        console.log('mode changed:', newMode)

        state.value = 'searching'
        countdown.value = 3

        if (timer) {
            clearInterval(timer)
            timer = null
        }

        const data = await findMatch()
        match.value = data
        state.value = 'found'

        setTimeout(() => {
            state.value = 'showingTeams'
            setTimeout(() => {
                state.value = 'countdown'
                timer = setInterval(() => {
                    if (countdown.value <= 1) {
                        clearInterval(timer!)
                        timer = null
                        state.value = 'started'
                    } else {
                        countdown.value--
                    }
                }, 1000)
            }, 1000)
        }, 1000)
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
})
</script>

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

        <div v-else-if="state === 'showingTeams' || state === 'countdown'" class="teams-view">
            <TeamList title="Team 1" :players="team1" />
            <span :class="state === 'countdown' ? 'countdown' : 'vs-label'">
                {{ state === 'countdown' ? countdown : 'VS' }}
            </span>
            <TeamList title="Team 2" :players="team2" />
        </div>

        <div v-else>
            <h1>MATCH START!</h1>
        </div>
    </div>
</template>

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
    text-align: center;
}

.countdown {
    width: 8rem;
    font-size: 5rem;
    text-align: center;
}
</style>
