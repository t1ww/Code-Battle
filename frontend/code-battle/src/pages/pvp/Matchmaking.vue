<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import type { PlayerData } from '@/types/types'

import SearchIcon from '@/components/pvp/SearchIcon.vue'
import MatchFoundIcon from '@/components/pvp/MatchFoundIcon.vue'
import TeamList from '@/components/pvp/TeamList.vue'

import { socket } from '@/clients/socket.api'

import { getPlayerData } from "@/stores/auth"
import { useTeamStore } from '@/stores/team'

const player = getPlayerData()
const teamStore = useTeamStore()

type MatchState = 'searching' | 'found' | 'showingTeams' | 'countdown' | 'started'

const route = useRoute()
const mode = computed(() => route.query.mode)
const timeLimit = computed(() => route.query.timeLimit === 'true')

const errorMessage = ref('')

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

const mapToMinimal = (players: PlayerData[]) => {
    return players
        .filter(p => p.id && p.name)
        .map(({ id, name, avatar_url }) => ({ id: id!, name: name!, avatar_url }))
}

const team1 = computed(() => {
    if (mode.value === '1v1') return mapToMinimal([match.value.you])
    return mapToMinimal([match.value.you, ...match.value.friends])
})

const team2 = computed(() => {
    if (mode.value === '1v1') return mapToMinimal(match.value.opponents.slice(0, 1))
    return mapToMinimal(match.value.opponents)
})


const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
    if (player?.id) {
        if (mode.value === '1v1') {
            socket.emit("queuePlayer", { player_id: player.id, name: player.name, email: player.email, mode: '1v1', timeLimit: timeLimit.value })
        } else if (mode.value === '3v3') {
            if (!teamStore.team_id || teamStore.members.length < 3) {
                errorMessage.value = 'You must be in a full team to queue for 3v3.'
                return
            }
            socket.emit('queueTeam', { team_id: teamStore.team_id, mode: '3v3' })
        } else {
            // Error
            errorMessage.value = 'Invalid match mode selected.'
        }
    }

    socket.on("matchInfo", (data: { you: PlayerData, friends: PlayerData[], opponents: PlayerData[] }) => {
        match.value = data
    })

    socket.on("queueResponse", (response: { error_message: any; message: any }) => {
        if (response.error_message) {
            console.error("Queue Error:", response.error_message)
            return
        }
        console.log("Queued successfully:", response.message)

        // Try to start match after player is queued
        socket.emit("startMatch", { mode: mode.value || '1v1' })
    })

    socket.on("matchResponse", (response: { error_message: any; message: any }) => {
        if (response.error_message) {
            console.error("Match Error:", response.error_message)
            return
        }
        console.log("Match started:", response.message)
    })

    socket.on("matchStarted", (data: { player_id: any }) => {
        console.log("Match started for player:", data.player_id)
        // Run the sequence here
        state.value = 'found'
        setTimeout(() => {
            setTimeout(() => {
                state.value = 'showingTeams'
                setTimeout(() => {
                    state.value = 'countdown'
                    countdown.value = 3;
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
        }, 2400);
    })
})

onBeforeUnmount(() => {
    if (timer) clearInterval(timer)

    socket.off("matchInfo")
    socket.off("queueResponse")
    socket.off("matchResponse")
    socket.off("matchStarted")
})

</script>

<template>
    <div class="matchmaking-container">
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

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

        <div v-else-if="state === 'started'">
            <h1>MATCH START!</h1>
        </div>
    </div>
</template>

<style scoped>
.error-message {
    color: red;
    margin: 0.5rem 0;
    font-weight: bold;
}

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
