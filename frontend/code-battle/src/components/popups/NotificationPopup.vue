<!-- frontend\code-battle\src\components\popups\NotificationPopup.vue -->
<template>
    <transition name="notif-slide">
        <div v-if="show" class="notification" @click="$emit('close')">
            ℹ️ {{ message }}
        </div>
    </transition>
</template>

<script setup lang="ts">
defineProps<{
    show: boolean
    message: string
}>()

defineEmits(['close'])
</script>

<style scoped>
.notification {
    position: fixed;
    top: 1rem;
    left: 1rem;
    background-color: #1f2937;
    color: #f9fafb;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 1100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
}

/* Slide in from top-left */
.notif-slide-enter-active {
    animation: notifIn 0.3s ease-out forwards;
}

.notif-slide-leave-active {
    animation: notifOut 0.2s ease-in forwards;
}

@keyframes notifIn {
    from {
        transform: translate(-100%, 0);
        opacity: 0;
    }

    to {
        transform: translate(0, 0);
        opacity: 1;
    }
}

@keyframes notifOut {
    from {
        transform: translate(0, 0);
        opacity: 1;
    }

    to {
        transform: translate(-100%, 0);
        opacity: 0;
    }
}
</style>
