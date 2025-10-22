<!-- frontend\code-battle\src\pages\pvp\PrivateStartGame.vue -->
<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { PlayerData } from '@/types/types'
import TeamList from '@/components/pvp/TeamList.vue'
import MatchFoundIcon from '@/assets/icons.svg/MatchFoundIcon.vue'

const router = useRouter()
const route = useRoute()

type MinimalPlayer = {
    player_id: string
    name: string
    avatar_url?: string
}
// --- Reactive state ---
const team1 = ref<MinimalPlayer[]>([])
const team2 = ref<MinimalPlayer[]>([])
const mode = ref('1v1')
const timeLimit = ref(false)

type MatchState = 'found' | 'showingTeams' | 'countdown' | 'started'
const state = ref<MatchState>('found')
const countdown = ref(3)

let timer: ReturnType<typeof setInterval> | null = null
let showTeamsTimeout: ReturnType<typeof setTimeout> | null = null
let showCountdownTimeout: ReturnType<typeof setTimeout> | null = null
let startMatchTimeout: ReturnType<typeof setTimeout> | null = null

// --- Utility ---
function mapToMinimal(players: PlayerData[]): MinimalPlayer[] {
    return players
        .filter(p => p.player_id !== null && p.name)
        .map(p => ({
            player_id: p.player_id as string,
            name: p.name as string,
            avatar_url: p.avatar_url
        }))
}

// --- Lifecycle ---
onMounted(() => {
    const routeState = window.history.state

    if (!routeState?.team1 || !routeState?.team2) {
        console.error('Team data missing in route state', routeState)
        router.replace({ name: 'PvpTypeSelect' })
        return
    }

    team1.value = mapToMinimal(routeState.team1)
    team2.value = mapToMinimal(routeState.team2)
    mode.value = (route.query.mode as string) || '1v1'
    timeLimit.value = route.query.timeLimit === 'true'

    // Show teams, countdown, then start match
    showTeamsTimeout = setTimeout(() => {
        state.value = 'showingTeams'

        showCountdownTimeout = setTimeout(() => {
            state.value = 'countdown'
            countdown.value = 3

            timer = setInterval(() => {
                if (countdown.value <= 1) {
                    clearInterval(timer!)
                    timer = null
                    startMatch()
                } else {
                    countdown.value--
                }
            }, 1000)
        }, 1000)
    }, 1800)
})

function startMatch() {
    console.log('Starting match...')
    state.value = 'started'
    startMatchTimeout = setTimeout(() => {
        console.log(`Redirecting to gameplay mode ${mode.value} with time limit: ${timeLimit.value}`)
        if (mode.value === '3v3') {
            router.replace({
                name: 'PvpGameplay3v3',
                query: { timeLimitEnabled: String(timeLimit.value) }
            });
        } else {
            router.replace({
                name: 'PvpGameplay1v1',
                query: { timeLimitEnabled: String(timeLimit.value) }
            });
        }
    }, 1500)
}

onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    if (showTeamsTimeout) clearTimeout(showTeamsTimeout)
    if (showCountdownTimeout) clearTimeout(showCountdownTimeout)
    if (startMatchTimeout) clearTimeout(startMatchTimeout)
})
</script>

<template>
    <div class="private-start-container">
        <div v-if="state === 'found'" class="stage-found">
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

        <div v-else-if="state === 'started'">
            <h1>MATCH START!</h1>
        </div>
    </div>
</template>

<style scoped>
.private-start-container {
    display: grid;
    place-items: center;
    width: 100vw;
    height: 100vh;
    color: var(--theme-color);
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
