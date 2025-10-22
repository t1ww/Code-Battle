<!-- frontend\code-battle\src\components\gameplay\ChatPanel.vue -->
<script setup lang="ts">
import type { ChatMessage } from '@/composables/usePvpTeamChat'
import { ref } from 'vue'

const props = defineProps<{
    onClose: () => void
    user: { name: string }       // current player
    messages: ChatMessage[]
    onSendMessage: (msg: string) => void
}>()

const newMessage = ref('')

const send = () => {
    const trimmed = newMessage.value.trim()
    if (!trimmed) return
    props.onSendMessage(trimmed)
    newMessage.value = ''
}
</script>

<template>
    <div class="chat-panel">
        <!-- Header -->
        <div class="panel-header">
            <p>Team Chat</p>
            <button class="side-button close-btn" @click="props.onClose">▶</button>
        </div>
        <hr />

        <!-- Messages -->
        <div class="messages">
            <div v-for="(msg, index) in props.messages" :key="index"
                :class="['message', msg.from === props.user.name ? 'own' : 'teammate']">
                <strong>{{ msg.from }}:</strong> {{ msg.text }}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <input v-model="newMessage" @keyup.enter="send" placeholder="Type a message..." />
            <button class="send-btn" @click="send">Send</button>
        </div>
    </div>
</template>

<style scoped>
hr {
    border: none;
    height: 0.1rem;
    background-color: #4e4e4e;
    margin: 0.5rem 0;
}

.chat-panel {
    position: relative;
    width: 24rem;
    height: 50vh;
    background: #8a8a8a;
    color: black;
    padding: 1rem;
    box-sizing: border-box;
    border-radius: 12px 0 0 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.close-btn {
    position: absolute;
    left: -35px;
    top: calc(50% - 2.45rem);
    transform: translateY(-50%);
    border-radius: 6px 0 0 6px;
    z-index: 1200;
    background: #525252;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: bold;
    font-size: 1.3rem;
}

.messages {
    flex: 1;
    overflow-y: auto;
    margin: 0.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.message {
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    max-width: 80%;
}

.message.own {
    background: #c2ffc2;
    align-self: flex-end;
}

.message.teammate {
    background: #e0e0e0;
    align-self: flex-start;
}

.footer {
    display: flex;
    gap: 0.3rem;
}

.footer input {
    flex: 1;
    padding: 0.4rem;
    border-radius: 6px;
    border: none;
}

.send-btn {
    background: #525252;
    color: white;
    border-radius: 6px;
    padding: 0 0.8rem;
}
</style>
