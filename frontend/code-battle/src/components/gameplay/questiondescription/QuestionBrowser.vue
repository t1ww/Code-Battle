<!-- frontend\code-battle\src\components\gameplay\QuestionBrowser.vue -->
<script setup lang="ts">
import QuestionDescriptionPanel from './QuestionDescriptionPanel.vue'
import { computed } from 'vue'
import { usePvpGameStore } from '@/stores/usePvpGameStore'

const gameStore = usePvpGameStore()

const props = defineProps<{
    questions: any[],
    show: boolean,
    timeLimitEnabled: boolean,
    selectedModifier: string,
    currentQuestionIndex: number,
}>()

const emit = defineEmits(['close', 'update:currentQuestionIndex'])
const currentIdx = computed({
    get: () => props.currentQuestionIndex,
    set: (val: number) => emit('update:currentQuestionIndex', val)
})

// Map questions with finished/testResults info
const questionsWithStatus = computed(() =>
    props.questions.map((q, idx) => {
        const teamKey = gameStore.playerTeam || 'team1'
        const progress = gameStore.progress[teamKey]?.[idx]
        const fullPassFlags = gameStore.progressFullPass?.[teamKey] || []; // boolean[]
        const finished = !!fullPassFlags[idx]; // true only if a single full-pass submission happened
        const testResults = progress?.map((passed: boolean) => ({ passed })) || []
        return { ...q, finished, testResults }
    })
)
</script>

<template>
    <div class="question-browser">
        <!-- Tabs -->
        <div v-if="show" class="tabs">
            <button v-for="(q, idx) in questionsWithStatus" :key="q.id"
                :class="{ active: idx === currentIdx, finished: q.finished }" @click="currentIdx = idx">
                {{ q.question_name }}
                <span v-if="q.finished" class="checkmark">✔</span>
            </button>
        </div>

        <!-- Question description panel -->
        <QuestionDescriptionPanel :show="show" :question="questionsWithStatus[currentIdx]"
            :timeLimitEnabled="timeLimitEnabled" :selectedModifier="selectedModifier" @close="$emit('close')" />
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
    width: 32rem;
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

.tabs button.finished {
    background: #00ff00;
    color: black;
}

.checkmark {
    color: #22c55e;
    font-weight: bold;
    margin-left: 0.5rem;
}
</style>
