<!-- frontend/code-battle/src/components/pve/CodeEditor.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import * as monaco from 'monaco-editor'
import { triggerNotification } from '@/composables/notificationService';

// =============================
// Props / Emits
// =============================
const DEV = inject('DEV') as boolean
// Accept v-model
const props = defineProps<{ modelValue: string, modelLanguage?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:modelLanguage', value: string): void
}>()

const editorContainer = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
const selectedLanguage = ref(props.modelLanguage || 'cpp')

// Supported languages
const languages = ref([
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' }
])

// Watch for language changes and emit to parent
watch(selectedLanguage, (lang) => {
  if (editor) monaco.editor.setModelLanguage(editor.getModel()!, lang)
  emit('update:modelLanguage', lang)
})

// =============================
onMounted(() => {
  if (DEV) {
    triggerNotification(
      "DEV mode is on, you can paste from clipboard. Don't forget to disable it in production."
    )
  }
  if (!editorContainer.value) return

    ; (window as any).MonacoEnvironment = {
      getWorker: (_: any, label: string) => {
        if (label === 'json') return new Worker('/monaco/language/json/json.worker.js', { type: 'module' })
        if (label === 'css' || label === 'scss' || label === 'less') return new Worker('/monaco/language/css/css.worker.js', { type: 'module' })
        if (label === 'html') return new Worker('/monaco/language/html/html.worker.js', { type: 'module' })
        if (label === 'typescript' || label === 'javascript') return new Worker('/monaco/language/typescript/ts.worker.js', { type: 'module' })
        return new Worker('/monaco/editor/editor.worker.js', { type: 'module' })
      },
    }

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue || '',
    language: selectedLanguage.value,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    suggestOnTriggerCharacters: false,
    quickSuggestions: false,
    parameterHints: { enabled: false },
    contextmenu: false,
  })

  // Sync editor changes to parent
  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor!.getValue())
  })

  // Replace your editorDom paste listener with this:
  editor.onDidPaste(() => {
    if (!DEV) {
      console.log('Paste blocked!')
      triggerNotification('Clipboard paste prevented!', 800)

      const model = editor!.getModel()
      if (!model) return

      // simple approach: undo the paste
      editor!.trigger('preventPaste', 'undo', null)
    }
  })

})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div class="language-selector">
    <select id="language" v-model="selectedLanguage">
      <option v-for="lang in languages" :key="lang.value" :value="lang.value">
        {{ lang.label }}
      </option>
    </select>
  </div>
  <div ref="editorContainer" class="editor-container"></div>
</template>

<style scoped>
.editor-container {
  width: 100%;
  height: 36rem;
  border: 0.1rem solid var(--theme-color);
  border-radius: 0.25rem;
  overflow: hidden;
  text-align: left;

  padding-top: 1rem;
  background: #202020;

  /* Initial glow state */
  box-shadow: 0 0 0rem rgba(0, 0, 0, 0);

  /* Apply pulsing animation */
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {

  0%,
  60% {
    box-shadow: 0 0 0rem rgba(0, 0, 0, 0), 0 0 0rem var(--theme-color);
  }

  100% {
    box-shadow: 0 0 0.5rem var(--theme-color), 0 0 1rem rgba(0, 0, 0, 0.2);
  }
}

/* Styled dropdown */
.language-selector {
  display: inline-block;
  margin-bottom: 1rem;
  position: relative;
}

.language-selector select {
  background-color: #2e2e2e;
  color: #fff;
  border: 0.0625rem solid #555;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.95rem;
  width: 10rem;
  /* remove default arrow */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

/* Remove default arrow for IE/Edge */
.language-selector select::-ms-expand {
  display: none;
}

.language-selector select:hover {
  background-color: #3a3a3a;
  border-color: #777;
}

.language-selector select:focus {
  outline: none;
  border-color: #aaa;
}

/* Custom arrow */
.language-selector::after {
  content: '▾';
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #ccc;
  font-size: 0.85rem;
}
</style>
