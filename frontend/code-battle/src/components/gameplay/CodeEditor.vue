<!-- frontend/code-battle/src/components/pve/CodeEditor.vue -->
// frontend/code-battle/src/components/pve/CodeEditor.vue
<script setup lang="ts">
import { inject } from 'vue'
import MonacoEditor from 'monaco-editor-vue3'
import * as monaco from 'monaco-editor'
import { triggerNotification } from '@/composables/notificationService'

const DEV = inject('DEV') as boolean
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    parameterHints: { enabled: false },
    snippetSuggestions: 'none',
}

function handleMount(editor: monaco.editor.IStandaloneCodeEditor) {
    if (DEV) {
        triggerNotification("DEV mode is on, you can paste from clipboard, don't forgot to disable it in production.")
    }

    // disable right-click context menu
    editor.updateOptions({ contextmenu: false })

    // intercept paste attempts
    editor.onDidPaste((e) => {
        if (!DEV) {
            e.event.preventDefault?.()
            triggerNotification('Paste prevented!', 1000)
        }
    })
}
</script>

<template>
    <div class="editor-wrapper">
        <MonacoEditor :value="props.modelValue" @update:value="emit('update:modelValue', $event)" language="cpp"
            theme="vs-dark" :options="editorOptions" :onMount="handleMount" :style="{ height: '60vh' }" />
    </div>
</template>

<style scoped>
.editor-wrapper {
    padding-top: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1rem;
}
</style>
