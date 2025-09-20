<!-- frontend/code-battle/src/components/pve/CodeEditor.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as monaco from 'monaco-editor'

const editorContainer = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return

  // Monaco worker setup
  ;(window as any).MonacoEnvironment = {
    getWorker: (_: any, label: string) => {
      if (label === 'json') return new Worker('monaco-editor/esm/vs/language/json/json.worker', { type: 'module' })
      if (label === 'css') return new Worker('monaco-editor/esm/vs/language/css/css.worker', { type: 'module' })
      if (label === 'html') return new Worker('monaco-editor/esm/vs/language/html/html.worker', { type: 'module' })
      if (label === 'typescript' || label === 'javascript') return new Worker('monaco-editor/esm/vs/language/typescript/ts.worker', { type: 'module' })
      return new Worker('monaco-editor/esm/vs/editor/editor.worker', { type: 'module' })
    },
  }

  editor = monaco.editor.create(editorContainer.value, {
    value: '',
    language: 'javascript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    suggestOnTriggerCharacters: false,
    quickSuggestions: false,
    parameterHints: { enabled: false },
    contextmenu: false, // disable right-click menu
  })

  // Prevent copy/paste/cut
  const preventClipboard = (e: Event) => e.preventDefault()
  editorContainer.value.addEventListener('copy', preventClipboard)
  editorContainer.value.addEventListener('paste', preventClipboard)
  editorContainer.value.addEventListener('cut', preventClipboard)
  editorContainer.value.addEventListener('contextmenu', preventClipboard)
})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div ref="editorContainer" class="editor-container"></div>
</template>

<style scoped>
.editor-container {
  width: 100%;
  height: 400px;
  border: 1px solid #444;
  border-radius: 4px;
  overflow: hidden;
}
</style>
