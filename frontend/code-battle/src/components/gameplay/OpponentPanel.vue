<!-- frontend\code-battle\src\components\gameplay\OpponentPanel.vue -->
<script setup lang="ts">
import PlayerAvatar from '@/components/pvp/PlayerAvatar.vue'
import SandClock from '@/assets/icons.svg/SandClock.vue'

// Add at the top in <script setup>
const props = defineProps<{
    onClose: () => void
    sendSabotage: () => void
}>()

// Dummy opponent for now
const opponent = {
    player_id: 'dummy-1',
    avatar_url: '', // fallback avatar
    name: 'Opponent',
    points: 2,
}

// Example progress data
const questions = [
    {
        id: 1,
        title: 'Hello world',
        cases: [
            { id: 1, status: 'pass' },
            { id: 2, status: 'pass' },
        ],
    },
    {
        id: 2,
        title: 'Sum of Two Numbers',
        cases: [
            { id: 1, status: 'in-progress' },
            { id: 2, status: 'in-progress' },
        ],
    },
    {
        id: 3,
        title: 'Even or Odd',
        cases: [
            { id: 1, status: 'in-progress' },
            { id: 2, status: 'in-progress' },
        ],
    },
]
const sabotagePoints = 2
</script>

<template>
    <div class="opponent-panel">
        <!-- Close panel button -->
        <button class="side-button close-btn" @click="props.onClose">▶</button>

        <!-- Header -->
        <div class="panel-header">
            <PlayerAvatar :player="opponent" size="40" />
            <span class="panel-title">
                {{ opponent.name }} | Point : {{ opponent.points }}
            </span>
        </div>

        <!-- Question progress -->
        <div class="questions">
            <div v-for="q in questions" :key="q.id" class="question">
                <hr />
                <div class="question-title">
                    Questions {{ q.id }} : {{ q.title }}
                </div>
                <div v-for="c in q.cases" :key="c.id" class="test-case" :class="c.status">
                    Test Case {{ c.id }} :
                    <span :class="['status-badge', c.status]">
                        <template v-if="c.status === 'pass'">
                            ✔ Pass
                        </template>
                        <template v-else>
                            <SandClock class="sandclock-icon" />
                            In progress
                        </template>
                    </span>
                </div>
            </div>
        </div>

        <hr />

        <!-- Footer -->
        <div class="footer">
            <div>Your sabotage point = {{ sabotagePoints }}</div>
            <button class="sabotage-btn" @click="props.sendSabotage()">
                Send sabotage!!!!
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
    height: 34.5rem;
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
