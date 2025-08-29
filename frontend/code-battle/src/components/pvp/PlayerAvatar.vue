<!-- frontend\code-battle\src\components\pvp\PlayerAvatar.vue -->
<template>
    <div class="avatar-wrapper">
        <div class="avatar-circle">
            <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" class="avatar-image" />
            <svg v-else viewBox="0 0 24 24" width="48" height="48">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none" />
                <path d="M4 20c0-4 8-4 8-4s8 0 8 4" stroke="currentColor" stroke-width="2" fill="none" />
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ player: { player_id: string, avatar_url?: string } }>()

const useForcedAvatar = false
const avatarUrl = ref<string | null>(null)

if (useForcedAvatar) {
    avatarUrl.value = props.player.avatar_url || "https://pbs.twimg.com/profile_images/1827036706182221824/0qZwB8zs_400x400.jpg"
} else {
    avatarUrl.value = props.player.avatar_url || null
}
</script>

<style scoped>
.avatar-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80px;
}

.avatar-circle {
    background: rgba(255, 255, 255, 0.5);
    /* Same as navbar height */
    width: 8vh;
    height: 8vh;
    /* Optional cap so it doesn’t get huge */
    max-width: 64px;
    max-height: 64px;
    /* The rest of the config */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}


.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-name {
    margin-top: 4px;
    font-size: 0.9rem;
    text-align: center;
}
</style>
