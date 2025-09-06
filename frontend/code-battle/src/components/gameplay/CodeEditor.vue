<!-- frontend/code-battle/src/components/pve/CodeEditor.vue -->
<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import MonacoEditor from 'monaco-editor-vue3'
import { triggerNotification } from '@/composables/notificationService'

// ----------------------------
// Monaco Worker Setup
// ----------------------------
// Make sure you copied the workers into `public/monaco/...` as discussed
(window as any).MonacoEnvironment = {
    getWorker: (_: any, label: string) => {
        if (label === 'json') return new Worker('/monaco/language/json/json.worker.js', { type: 'module' })
        if (label === 'css' || label === 'scss' || label === 'less') return new Worker('/monaco/language/css/css.worker.js', { type: 'module' })
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new Worker('/monaco/language/html/html.worker.js', { type: 'module' })
        if (label === 'typescript' || label === 'javascript') return new Worker('/monaco/language/typescript/ts.worker.js', { type: 'module' })
        return new Worker('/monaco/editor/editor.worker.js', { type: 'module' })
    }
}

// ----------------------------
// Props / Emits
// ----------------------------
const DEV = inject('DEV') as boolean
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// ----------------------------
// Editor Options
// ----------------------------
const editorOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    // Disable suggestions
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    parameterHints: { enabled: false },
    snippetSuggestions: 'none'
}

// ----------------------------
// Paste Prevention
// ----------------------------
const editorRef = ref<any>(null)
onMounted(() => {
    if (!editorRef.value) return
    const container = editorRef.value.$el as HTMLElement
    
    // disable Monaco’s right-click menu (so no paste option)
    const editor = editorRef.value.editor
    editor.updateOptions({ contextmenu: false })

    container.addEventListener(
        'paste',
        (e: ClipboardEvent) => {
            if (!DEV) {
                e.preventDefault()
                e.stopPropagation()
                console.log('Paste prevented!')
                triggerNotification('Paste prevented!', 1000);
            }
        },
        { capture: true }
    )
})
</script>

<template>
    <MonacoEditor ref="editorRef" :value="props.modelValue" @update:value="emit('update:modelValue', $event)"
        language="cpp" theme="vs-dark" :options="editorOptions" class="monaco-editor" :style="{ height: '60vh' }" />
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
