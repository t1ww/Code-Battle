<!-- frontend/code-battle/src/components/pve/CodeEditor.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import * as monaco from 'monaco-editor'
import { triggerNotification } from '@/composables/notificationService'

// =============================
// Props / Emits
// =============================
const DEV = inject('DEV') as boolean
const props = defineProps<{
  modelValue: string
  modelLanguage?: string
  teammateCursors?: Record<string, number> // name → cursorIndex
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:modelLanguage', value: string): void
  (e: 'cursorMove', offset: number): void
}>()

// =============================
// Refs & State
// =============================
const editorContainer = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
const selectedLanguage = ref(props.modelLanguage || 'cpp')
let isApplyingExternal = false
const cursorWidgets: Record<string, monaco.editor.IContentWidget> = {}

// Supported languages
const languages = ref([
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' }
])

// =============================
// Helpers
// =============================
const ensureLineExists = (line = 1) => {
  if (!editor) return
  const model = editor.getModel()
  if (!model) return
  if (model.getLineCount() < line) {
    model.applyEdits([{ range: new monaco.Range(1, 1, 1, 1), text: '\n' }])
  }
}

// Create a content widget for a teammate cursor
const createCursorWidget = (playerName: string) => {
  if (!editor) return null

  const wrapper = document.createElement('div')
  wrapper.style.position = 'absolute'
  wrapper.style.pointerEvents = 'none'
  wrapper.style.height = '1.2em'
  wrapper.style.display = 'inline-block'

  const caret = document.createElement('div')
  caret.style.position = 'absolute'
  caret.style.left = '0'
  caret.style.top = '0'
  caret.style.width = '.5rem'
  caret.style.height = '100%'
  caret.style.backgroundColor = '#ff4081'

  const label = document.createElement('span')
  label.textContent = `${playerName} is typing...`
  label.style.color = '#ff4081'
  label.style.fontWeight = 'bold'
  label.style.marginLeft = '0.75rem'
  label.style.position = 'relative'
  label.style.top = '-3px'
  label.style.whiteSpace = 'nowrap'

  wrapper.appendChild(caret)
  wrapper.appendChild(label)

  // JS blink
  let visible = true
  const blink = () => {
    visible = !visible
    caret.style.visibility = visible ? 'visible' : 'hidden'
    requestAnimationFrame(() => setTimeout(blink, 500))
  }
  blink()

  return {
    getId: () => `cursor-${playerName}`,
    getDomNode: () => wrapper,
    getPosition: () => ({
      position: new monaco.Position(1, 1),
      preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
    })
  } as monaco.editor.IContentWidget
}

// Update all cursor widgets positions
const updateCursorWidgets = () => {
  if (!editor || !props.teammateCursors) return

  for (const [playerName, index] of Object.entries(props.teammateCursors)) {
    const model = editor.getModel()
    if (!model) continue
    const pos = model.getPositionAt(index)

    if (!cursorWidgets[playerName]) {
      const widget = createCursorWidget(playerName)
      if (widget) {
        cursorWidgets[playerName] = widget
        editor.addContentWidget(widget)
      }
    }

    const widget = cursorWidgets[playerName]
    if (widget) {
      widget.getPosition = () => ({
        position: pos,
        preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
      })
      editor.layoutContentWidget(widget)
    }
  }
}

// =============================
// Watchers
// =============================
watch(selectedLanguage, (lang) => {
  if (editor) monaco.editor.setModelLanguage(editor.getModel()!, lang)
  emit('update:modelLanguage', lang)
})

watch(() => props.modelValue, (newVal) => {
  if (!editor) return
  const current = editor.getValue()
  if (newVal !== current) {
    const model = editor.getModel()
    if (!model) return
    isApplyingExternal = true
    const selection = editor.getSelection()
    editor.executeEdits('external', [{ range: model.getFullModelRange(), text: newVal }])
    if (selection) editor.setSelection(selection)
    isApplyingExternal = false
  }
})

watch(() => props.teammateCursors, updateCursorWidgets, { deep: true })

// =============================
// Mount
// =============================
onMounted(() => {
  if (!editorContainer.value) return

  if (DEV) {
    triggerNotification("DEV mode is on, paste enabled")
  }

  ; (window as any).MonacoEnvironment = {
    getWorker: (_: any, label: string) => {
      if (label === 'json') return new Worker('/monaco/language/json/json.worker.js', { type: 'module' })
      if (['css', 'scss', 'less'].includes(label)) return new Worker('/monaco/language/css/css.worker.js', { type: 'module' })
      if (label === 'html') return new Worker('/monaco/language/html/html.worker.js', { type: 'module' })
      if (['typescript', 'javascript'].includes(label)) return new Worker('/monaco/language/typescript/ts.worker.js', { type: 'module' })
      return new Worker('/monaco/editor/editor.worker.js', { type: 'module' })
    }
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
    contextmenu: false
  })

  // Local edits → emit
  editor.onDidChangeModelContent(() => {
    if (isApplyingExternal) return
    emit('update:modelValue', editor!.getValue())
  })

  editor.onDidPaste(() => {
    if (!DEV) {
      triggerNotification('Clipboard paste prevented!', 800)
      editor!.trigger('preventPaste', 'undo', null)
    }
  })

  // Emit cursor position
  editor.onDidChangeCursorPosition((e) => {
    emit('cursorMove', editor!.getModel()!.getOffsetAt(e.position))
  })

  updateCursorWidgets()

  // Force a test cursor for debug
  ensureLineExists()
  const testWidget = createCursorWidget('TestCursor')
  if (testWidget) editor.addContentWidget(testWidget)
})

// =============================
// Cleanup
// =============================
onBeforeUnmount(() => {
  if (editor) {
    for (const widget of Object.values(cursorWidgets)) {
      editor.removeContentWidget(widget)
    }
    editor.dispose()
  }
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

/* Laptop / medium screens */
@media (max-width: 1680px) {
  .editor-container {
    height: 24rem;
  }
}

/* Tablet / small screens */
@media (max-width: 1024px) {
  .editor-container {
    height: 22rem;
  }
}

/* Mobile / very small screens */
@media (max-width: 768px) {
  .editor-container {
    height: 20rem;
  }
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
