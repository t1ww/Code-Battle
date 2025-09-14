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
        <!-- Close button -->
        <button class="close-btn" @click="$emit('close')">x</button>

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
    background: #1e1e1e;
    color: #dcdcdc;
    font-family: monospace;
    text-align: left;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* sticks terminal input to bottom */
    width: 30rem;
    height: 12rem;
    /* increase as needed */
}

.code-terminal .terminal-output {
    flex: 1 1 auto;
    /* grow and shrink to fill remaining space */
    padding: 8px;
    overflow-y: auto;
}

.close-btn {
    position: absolute;
    top: -1.8rem;
    right: 0;
    width: 3rem;
    height: 2rem;
    background: #3a3a3a;
    border: none;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    z-index: -1;
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
