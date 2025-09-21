<!-- frontend\code-battle\src\components\gameplay\CodeTerminal.vue -->
<script setup lang="ts">
import { nextTick, ref } from "vue";

const props = defineProps<{
    sendInput: (input: string) => void; // <- receive from parent
}>();

const emitInput = defineEmits<{
    (e: "input", value: string): void;
    (e: "close"): void;
}>();

const lines = ref<string[]>([]);
const currentInput = ref("");
const outputContainer = ref<HTMLDivElement>();

function submitInput() {
    if (!currentInput.value.trim()) return;

    emitInput("input", currentInput.value);
    props.sendInput(currentInput.value); // <- use parent's sendInput
    currentInput.value = "";
}

function pushOutput(msg: string) {
    lines.value.push(msg);
    nextTick(() => outputContainer.value?.scrollTo(0, outputContainer.value.scrollHeight));
}

defineExpose({ pushOutput });
</script>

<template>
    <div class="code-terminal">
        <!-- Terminal header -->
        <div class="terminal-header">
            &gt;_terminal
        </div>
        <div class="terminal-divider"></div>

        <!-- Close button -->
        <button class="close-btn" @click="$emit('close')"><span>x</span></button>

        <div class="terminal-output" ref="outputContainer">
            <pre v-for="(line, i) in lines" :key="i">{{ line }}</pre>
        </div>

        <div class="terminal-input">
            <input v-model="currentInput" @keydown.enter.prevent="submitInput"
                placeholder="Type input here and press Enter" />
            <button @click="submitInput">Send</button>
        </div>
    </div>
</template>

<style scoped>
.code-terminal {
    position: relative;
    background: #525252;
    color: #dcdcdc;
    font-family: monospace;
    text-align: left;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* sticks terminal input to bottom */
    width: 40rem;
    height: 18rem;
    /* increase as needed */
}

.code-terminal .terminal-output {
    flex: 1 1 auto;
    /* grow and shrink to fill remaining space */
    padding: 8px;
    overflow-y: auto;
}

.terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0.5rem;
    background: #3a3a3a;
    font-weight: bold;
    color: #fff;
    font-size: 0.9rem;
    border-radius: 4px 4px 0 0;
}

.close-btn {
    position: absolute;
    top: -1.8rem;
    right: 0;
    width: 3rem;
    height: 2rem;
    background: #444444;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: -1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.close-btn:hover {
    border: 1px solid #888888;
}

.close-btn span {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 1.4rem;
    height: 1.4rem;
    font-size: 1.25rem;
    color: white;
    border: 1px solid #888888;
    /* inner border */
    border-radius: .25rem;
    box-sizing: border-box;
    padding-bottom: 0.1rem;
}

.terminal-input {
    display: flex;
    padding: 4px;
    border-top: 1px solid #444;
}

.terminal-input input {
    flex: 1;
    background: #2e2e2e;
    color: #fff;
    border: none;
    padding: 4px 8px;
}

.terminal-input button {
    margin-left: 4px;
    background: #3a3a3a;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
    color: #fff;
}
</style>
