<!-- frontend\code-battle\src\components\gameplay\OpponentPanel.vue -->
<script setup lang="ts">
import PlayerAvatar from '@/components/pvp/PlayerAvatar.vue'
import SandClock from '@/assets/icons.svg/SandClock.vue'
import type { Question } from '@/types/types';

// Add at the top in <script setup>
const props = defineProps<{
    onClose: () => void
    sendSabotage: () => void
    opponent: {
        player_id: string
        avatar_url?: string
        name: string
        points: number
    }
    questions: Question[]
    progress: any
    progressFullPass?: any
    sabotagePoints: number
}>()
</script>

<template>
    <div class="opponent-panel">
        <!-- Close panel button -->
        <button class="side-button close-btn" @click="props.onClose">▶</button>

        <!-- Header -->
        <div class="panel-header">
            <!-- use props.opponent here (previously used `opponent`) -->
            <PlayerAvatar :player="props.opponent" size="40" />
            <span class="panel-title">
                {{ props.opponent?.name }} | Point : {{ props.opponent?.points }}
            </span>
        </div>

        <!-- Question progress -->
        <div class="questions">
            <!-- iterate with index so we can use the same index into the progress array -->
            <div v-for="(q, qIndex) in props.questions" :key="q.id" class="question">
                <hr />
                <div class="question-title">
                    <span v-if="props.progressFullPass?.[qIndex]" class="test-case status-badge pass">✔ Cleared</span>
                    Questions {{ qIndex + 1 }} : {{ q.question_name }}
                </div>

                <!-- Loop through each test case for this question -->
                <div class="test-cases-row">
                    <div class="test-case" v-for="(test, index) in props.progress?.[qIndex] || []" :key="index">
                        <span :class="['status-badge', test ? 'pass' : 'in-progress']">
                            <template v-if="test">TestCase#{{index+1}}: ✔ Passed</template>
                            <template v-else>
                                <SandClock class="sandclock-icon" /> In progress
                            </template>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <hr />

        <!-- Footer -->
        <div class="footer">
            <div>Your sabotage point = {{ props.sabotagePoints }}</div>
            <button class="sabotage-btn" @click="props.sendSabotage()">
                Send sabotage!!!!!
            </button>
        </div>
    </div>
</template>

<style scoped>
hr {
    border: none;
    /* Remove default border */
    height: .1rem;
    /* Thickness */
    background-color: #4e4e4e;
    /* Visible gray color */
    margin: 0.5rem 0;
    /* Optional spacing */
}

.opponent-panel {
    /* changed from fixed to relative so wrapper transform moves it */
    position: relative;
    /* removed right/top/transform */
    width: 24rem;
    height: 75vh;
    background: #8a8a8a;
    color: black;
    padding: 1rem;
    box-sizing: border-box;
    border-radius: 12px 0 0 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: left;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

/* Close button attached to panel (keeps absolute inside panel) */
.close-btn {
    position: absolute;
    left: -35px;
    /* sticks outside panel */
    top: calc(50% - 2.45rem);
    transform: translateY(-50%);
    border-radius: 6px 0 0 6px;
    z-index: 1200;
    /* above panel so visible */
    background: #525252;
}

.panel-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: bold;
    font-size: 1.3rem;
}

.panel-title {
    flex: 1;
    font-size: 1.2rem;
}

.questions {
    flex: 1;
    overflow-y: auto;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding-top: 0.25rem;
}

.question {
    margin-bottom: 0.75rem;
}

.question-title {
    font-weight: bold;
    margin-bottom: 0.25rem;
}

.test-case {
    font-size: 0.9rem;
    margin-left: 0.5rem;
    margin-top: .5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.test-cases-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-left: 0.5rem;
    margin-top: 0.5rem;
}

.test-case.pass {
    color: #101d10;
    font-weight: bold;
}

.footer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sabotage-btn {
    background: #555;
    color: white;
    font-weight: bold;
    padding: 0.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

.sabotage-btn:hover {
    background: #444;
}

.sabotage-btn:active {
    background: #6d4c4c;
}

.status-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: .4rem;
    /* fully rounded */
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
}

/* Different colors per status */
.status-badge.pass {
    /* green */
    background-color: #2ecc71;
}

.status-badge.in-progress {
    /* orange */
    background-color: #f39c12;
}

.sandclock-icon {
    width: 12px;
    height: 12px;
    margin-right: 0.25rem;
    /* space before "In progress" */
    position: relative;
    top: 2px;
    /* nudges it down a little */
}
</style>
