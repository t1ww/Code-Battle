<!-- frontend\code-battle\src\components\gameplay\QuestionDescriptionPanel.vue -->
<template>
    <transition name="slide-down">
        <div v-if="show" class="description-popup-panel">
            <div class="description-popup-inner-panel">
                <div class="description-popup-content" v-if="question">
                    <h3>Description</h3>
                    <hr />
                    <h4>Level {{ question.level }}: {{ question.question_name }}</h4>

                    <div class="section">
                        <p><strong>Description:</strong></p>
                        <p>{{ question.description }}</p>
                    </div>

                    <div class="section">
                        <p><strong>Test Cases:</strong></p>
                        <div class="test-cases">
                            <div v-for="(test, i) in question.test_cases" :key="i" class="test-case">
                                <strong>Test Case {{ i + 1 }}</strong><br />
                                Input: {{ test.input || '(no input)' }}<br />
                                Output: {{ test.expected_output }}
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <CheckboxToggle :model-value="timeLimitEnabled" label="Time limit" disabled />
                    </div>

                    <div class="section modifier">
                        <span>Modifier:</span>
                        <span class="modifier-value">{{ selectedModifier }}</span>
                    </div>
                </div>
            </div>
            <div class="description-popup-toggle">
                <button @click="$emit('close')">▲</button>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import CheckboxToggle from '../etc/CheckboxToggle.vue';

defineProps<{
    show: boolean
    question: any
    timeLimitEnabled: boolean
    selectedModifier: string
}>()

defineEmits(['close'])
</script>

<style scoped>
.description-popup-panel {
    position: absolute;
    top: 2rem;
    left: 0;
    width: 100vw;
    color: white;
    z-index: 1000;
    font-size: 14px;
    text-align: left;
}

.description-popup-inner-panel {
    padding: .5rem;
    background-color: #4b5563;
    border-bottom: 2px solid #ccc;
}

.description-popup-content {
    max-width: 1000px;
    margin: 0 auto;
}

.description-popup-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
}

.description-popup-toggle button {
    border: none;
    cursor: pointer;
    width: 4rem;
    background-color: #2e2e2e;
    border-radius: 0rem 0rem .5rem .5rem;
}

.description-popup-toggle button:hover {
    background-color: #2a3a2c;
}

.section {
    margin-bottom: 1rem;
}

.test-cases {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.test-case {
    background-color: #6b7280;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    width: 15vw;
}

.modifier {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.modifier-value {
    background: white;
    color: black;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: bold;
}

.slide-down-enter-active {
    animation: slideDown 0.3s ease-out forwards;
}

.slide-down-leave-active {
    animation: slideUp 0.2s ease-in forwards;
}

@keyframes slideDown {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(0);
        opacity: 1;
    }

    to {
        transform: translateY(-100%);
        opacity: 0;
    }
}
</style>
