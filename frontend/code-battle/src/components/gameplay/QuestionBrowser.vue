<!-- frontend\code-battle\src\components\gameplay\QuestionBrowser.vue -->
<script setup lang="ts">
import QuestionDescriptionPanel from './QuestionDescriptionPanel.vue'
import { computed } from 'vue'

const props = defineProps<{
    questions: any[],
    show: boolean,
    timeLimitEnabled: boolean,
    selectedModifier: string,
    currentQuestionIndex: number, // passed from parent
}>()

// Use a computed to sync with parent
const emit = defineEmits(['close', 'update:currentQuestionIndex'])
const currentIdx = computed({
    get: () => props.currentQuestionIndex, // read prop
    set: (val: number) => emit('update:currentQuestionIndex', val) // emit change to parent
})
</script>

<template>
    <div class="question-browser">
        <!-- 🔹 Tabs for switching between questions -->
        <div v-if="show" class="tabs">
            <button v-for="(q, idx) in questions" :key="q.question_id" :class="{ active: idx === currentIdx }"
                @click="currentIdx = idx">
                {{ q.question_name }}
            </button>
        </div>

        <!-- 🔹 The question description panel -->
        <QuestionDescriptionPanel :show="show" :question="questions[currentQuestionIndex]" :timeLimitEnabled="timeLimitEnabled"
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
    background: #313a42;
    border: none;
    color: white;
    cursor: pointer;
    border-radius: 4px 4px 0 0;
    width: 12rem;
}

.tabs button:hover {
    background: #485466;
    font-weight: bold;
}

.tabs button.active {
    background: #191d24;
    color: var(--theme-color);
    border: solid 1px var(--theme-color);
    font-weight: bold;
}
</style>
