<script setup lang="ts">
import { socket } from '@/clients/socket.api'
import { computed, ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useTeamStore } from '@/stores/team'
import { getPlayerData, isAuthenticated } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { logoutPlayer } from "@/stores/auth";

import PlayerAvatar from '@/components/pvp/PlayerAvatar.vue'

// Initializations
const router = useRouter()
const teamStore = useTeamStore()

const self = ref<null | { id: string; name: string; avatar_url?: string }>(null)

const isLoggedIn = computed(() => !!self.value)
const showLogout = ref(false);

// Team formation
const selfAvatar = computed(() => {
  if (!self.value) return null
  return {
    player_id: self.value.id,
    avatar_url: self.value.avatar_url,
  }
})

const teammates = computed(() =>
  teamStore.members.filter(m => m.player_id !== self.value?.id)
)

const createOrShareTeam = async () => {
  if (!teamStore.team_id && self.value) {
    await teamStore.createTeam({
      player_id: self.value.id,
      name: self.value.name,
    })
  }

  const link = teamStore.invite_link.startsWith('http')
    ? teamStore.invite_link
    : `${window.location.origin}${teamStore.invite_link}`

  await navigator.clipboard.writeText(link)
  alert('Invite link copied!')
}

// Login
const goToLogin = () => {
  router.push({ name: 'Login' })
}

// Logout
const toggleLogout = () => {
  showLogout.value = !showLogout.value;
};

const handleLogout = () => {
  logoutPlayer();
  showLogout.value = false;
  router.push({ name: "Login" });
};

// Set self on mount for initial load
onMounted(() => {
  const player = getPlayerData()
  if (player?.id && player?.name) {
    self.value = {
      id: player.id,
      name: player.name,
      avatar_url: player.avatar_url ?? undefined,
    }
  } else {
    self.value = null
  }

  socket.on('teamJoined', (teamData) => {
    if (teamData?.team_id === teamStore.team_id) {
      teamStore.setMembers(teamData.players)
    }
  })
  socket.on('teamLeft', (playerId) => {
    teamStore.setMembers(teamStore.members.filter(m => m.player_id !== playerId))
    if (playerId === self.value?.id) {
      self.value = null
    }
  })
})

// Watch for login/logout changes
watch(isAuthenticated, (loggedIn) => {
  if (loggedIn) {
    const player = getPlayerData()
    if (player?.id && player?.name) {
      self.value = {
        id: player.id,
        name: player.name,
        avatar_url: player.avatar_url ?? undefined,
      }
    }
  } else {
    self.value = null
    teamStore.setMembers([])
  }
})

onBeforeUnmount(() => {
  socket.off('teamJoined')
  socket.off('teamLeft')
})

</script>

<template>
  <nav class="navbar">
    <div class="team-wrapper" v-if="isLoggedIn">
      <div class="avatar-container" v-if="selfAvatar">
        <div :title="self?.name" @click="toggleLogout">
          <PlayerAvatar :player="selfAvatar" />
        </div>

        <transition name="slide-fade">
          <div v-if="showLogout" class="logout-dropdown">
            <button @click="handleLogout">Logout</button>
          </div>
        </transition>
      </div>


      <div v-for="(player, index) in teammates" :key="player.player_id || index" :title="player.name">
        <PlayerAvatar :player="player" />
      </div>

      <div class="add-button" @click="createOrShareTeam">
        <span>+</span>
      </div>
    </div>

    <button v-else class="login-button" @click="goToLogin">Login</button>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #dadada;
  padding: 0.75rem 1.5rem;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-sizing: border-box;
}

.team-wrapper {
  display: flex;
  flex-direction: row-reverse;
  gap: 0.5rem;
  align-items: center;
}

.add-button {
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.add-button:hover {
  background: #e2e2e2;
}

.login-button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  border: none;
  color: white;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
}

.login-button:hover {
  background-color: #0056b3;
}

/* Logout */
.avatar-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logout-dropdown {
  position: absolute;
  top: 72px;
  height: 1.5rem;
  background: rgb(198, 255, 199);
  border: .2rem solid #74ff8e;
  padding: 0.5rem 2rem;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.logout-dropdown button {
  background: none;
  padding: 0;
  border: none;
  font-weight: bold;
  color: rgb(0, 0, 0);
  cursor: pointer;
}

.logout-dropdown button:hover {
  text-decoration: underline;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
