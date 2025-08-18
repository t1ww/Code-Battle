<!-- frontend\code-battle\src\components\pvp\PlayerAvatar.vue -->
<template>
    <div class="avatar-wrapper">
        <div class="avatar-circle">
            <img v-if="player.avatar_url" :src="player.avatar_url" alt="avatar" class="avatar-image" />
            <svg v-else viewBox="0 0 24 24" width="48" height="48">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none" />
                <path d="M4 20c0-4 8-4 8-4s8 0 8 4" stroke="currentColor" stroke-width="2" fill="none" />
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ player: { player_id: string, avatar_url?: string }}>()
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
    border-radius: 50%;
    width: 64px;
    height: 64px;
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
