<!-- frontend\code-battle\src\components\gameplay\QuestionBrowser.vue -->
<script setup lang="ts">
import QuestionDescriptionPanel from './QuestionDescriptionPanel.vue'
import { ref } from 'vue'

defineProps<{
    questions: any[] // array of questions (PvP)
    show: boolean
    timeLimitEnabled: boolean
    selectedModifier: string
}>()

defineEmits(['close'])

const currentIndex = ref(0)
</script>

<template>
    <div class="question-browser">
        <!-- 🔹 Tabs for switching between questions -->
        <div v-if="show" class="tabs">
            <button v-for="(q, idx) in questions" :key="q.question_id" :class="{ active: idx === currentIndex }"
                @click="currentIndex = idx">
                {{ q.question_name }}
            </button>
        </div>

        <!-- 🔹 The question description panel -->
        <QuestionDescriptionPanel :show="show" :question="questions[currentIndex]" :timeLimitEnabled="timeLimitEnabled"
            :selectedModifier="selectedModifier" @close="$emit('close')" />
    </div>
</template>


<style scoped>
.tabs {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: 0.5rem;
    width: 100%;
    background: #2e2e2e;
    padding: 0.25rem 0.5rem;
    border-bottom: 2px solid #ccc;
    z-index: 1100;
}

.tabs button {
    padding: 0.25rem 0.5rem;
    background: #4b5563;
    border: none;
    color: white;
    cursor: pointer;
    border-radius: 4px 4px 0 0;
}

.tabs button.active {
    background: #6b7280;
    font-weight: bold;
}
</style>
