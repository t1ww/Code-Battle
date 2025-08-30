<!-- frontend\code-battle\src\pages\pvp\Matchmaking.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { PlayerData } from '@/types/types'

import SearchIcon from '@/components/pvp/SearchIcon.vue'
import MatchFoundIcon from '@/assets/icons.svg/MatchFoundIcon.vue'
import TeamList from '@/components/pvp/TeamList.vue'
import MessagePopup from '@/components/popups/MessagePopup.vue'

import { socket } from '@/clients/socket.api'

import { getPlayerData } from "@/stores/auth"
import { useTeamStore } from '@/stores/team'
import { triggerNotification } from '@/composables/notificationService'

const router = useRouter()

const player = getPlayerData()
const team = useTeamStore()

type MatchState = 'searching' | 'found' | 'showingTeams' | 'countdown' | 'started'

const route = useRoute()
const mode = computed(() => route.query.mode)
const timeLimit = computed(() => route.query.timeLimit === 'true')

const errorMessage = ref('')
const errorPopup = ref<{ title: string; message: string; buttonOnClick: () => void } | null>(null)

const state = ref<MatchState>('searching')
const match = ref<{
    you: PlayerData
    friends: PlayerData[]
    opponents: PlayerData[]
}>({
    you: { token: null, player_id: '0', name: '', email: null },
    friends: [],
    opponents: []
})

const mapToMinimal = (players: PlayerData[]) => {
    return players.map(({ player_id, name, avatar_url }) => {
        if (!player_id) throw new Error("Player is missing player_id")
        if (!name) throw new Error(`Player ${player_id} is missing name`)
        return { player_id, name, avatar_url }
    })
}

function cancelMatchmaking() {
    if (mode.value === '1v1') {
        socket.emit("cancelQueue")
    } else if (mode.value === '3v3') {
        socket.emit("cancelQueueTeam")
    }
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
    if (player?.player_id) {
        if (mode.value === '1v1') {
            console.log('Queue for 1v1.')
            socket.emit("queuePlayer", { player: { player_id: player.player_id, name: player.name, email: player.email }, timeLimit: timeLimit.value })
        } else if (mode.value === '3v3') {
            // Not a team
            if (!team.team_id || team.members.length < 3) {
                errorMessage.value = 'You must be in a full team to queue for 3v3.'
                setTimeout(() => {
                    router.replace({ name: 'PvpTypeSelect' })
                }, 1000)
                return
            }
            // Is team leader, else is member
            if (team.isLeader) {
                console.log('Leader queueing for 3v3.')
                socket.emit('queueTeam', { team_id: team.team_id, timeLimit: timeLimit.value })
            } else {
                console.log('Member waiting for 3v3 matchmaking.')
                // members don’t emit queue themselves, they just stay on page
            }

        } else {
            // Error
            errorMessage.value = 'Invalid match mode selected.'
            setTimeout(() => {
                router.replace({ name: 'PvpTypeSelect' })
            }, 1000)
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
                    }, 1000) // 1 second countdown
                }, 1000) // 1 second before showing countdown
            }, 1000) // 1 second before showing teams
        }, 1800) // 1.8 seconds before showing teams;
    })

    // Handle player queue cancellation
    socket.on("playerQueueCanceled", () => {
        console.log(`Player queue canceled, redirecting…`);
        triggerNotification(`Player queue canceled, redirecting…`);
        router.replace({ name: "PvpTypeSelect" });
    });

    // Handle team queue cancellation
    socket.on("teamQueueCanceled", (data: { canceledBy: string }) => {
        console.log(`Team queue canceled by ${data.canceledBy}, redirecting…`);
        triggerNotification(`Team queue canceled by ${data.canceledBy}, redirecting…`);
        router.replace({ name: "PvpTypeSelect" });
    });

    // Handle queue timeout
    socket.on("queueTimeout", (data: { message: string }) => {
        errorPopup.value = {
            title: "Matchmaking Timeout",
            message: data.message,
            buttonOnClick: () => {
                errorPopup.value = null
                router.replace({ name: "PvpTypeSelect" })
            }
        }
    });

    // Handle matchmaking errors
    socket.on("matchmakingError", (data: { message: string }) => {
        errorPopup.value = {
            title: "Matchmaking Error",
            message: data.message,
            buttonOnClick: () => {
                errorPopup.value = null
                router.replace({ name: "PvpTypeSelect" }) // optional redirect
            }
        }
    })
})

onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    // Clean up socket listeners
    socket.off("matchInfo")
    socket.off("queueResponse")
    socket.off("matchResponse")
    socket.off("matchStarted")
})

</script>

<template>
    <MessagePopup v-if="errorPopup" :title="errorPopup.title" :message="errorPopup.message"
        :buttonOnClick="errorPopup.buttonOnClick" />

    <div class="matchmaking-container">
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <!-- Cancel Matchmaking Button -->

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

        <button v-if="state !== 'started'" class="cancel-btn" @click="cancelMatchmaking">
            Cancel Matchmaking
        </button>
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
