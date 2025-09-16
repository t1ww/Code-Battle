<template>
    <div v-if="show" class="question-browser">
        <!-- Tabs -->
        <div class="tabs">
            <button v-for="(q, idx) in questions" :key="q.question_id" :class="{ active: idx === currentIndex }"
                @click="currentIndex = idx">
                {{ q.question_name }}
            </button>
        </div>

        <!-- Panel for the selected question -->
        <QuestionDescriptionPanel :show="show" :question="questions[currentIndex]" :timeLimitEnabled="timeLimitEnabled"
            :selectedModifier="selectedModifier" @close="$emit('close')" />
    </div>
</template>

<script setup lang="ts">
import QuestionDescriptionPanel from './QuestionDescriptionPanel.vue';

defineProps<{
    questions: any[] // array of questions (PvP)
    show: boolean
    timeLimitEnabled: boolean
    selectedModifier: string
}>()

defineEmits(['close'])

import { ref } from 'vue';
const currentIndex = ref(0)
</script>

<style scoped>
.tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
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
