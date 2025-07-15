<template>
    <MonacoEditor :value="modelValue" @update:value="emit('update:modelValue', $event)" language="javascript"
        theme="vs-dark" :options="editorOptions" class="monaco-editor" :style="{ height: '20rem' }" />
</template>


<script setup lang="ts">
import MonacoEditor from 'monaco-editor-vue3'

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

<style scoped>
.monaco-editor {
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
}
</style>
