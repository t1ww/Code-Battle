<script setup lang="ts">
import MonacoEditor from 'monaco-editor-vue3'
import { inject } from 'vue';
const DEV = inject('DEV') as boolean
const props = defineProps<{
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const editorOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
}
</script>

<template>
    <MonacoEditor :value="props.modelValue" @update:value="emit('update:modelValue', $event)" language="javascript"
        theme="vs-dark" :options="editorOptions" class="monaco-editor" :style="{ height: '60vh' }" />
</template>

<style scoped>
.monaco-editor {
    padding-top: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1rem;
}
</style>
