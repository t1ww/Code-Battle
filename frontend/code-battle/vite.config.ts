import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')  // important
    }
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.worker.js', 'monaco-editor/esm/vs/language/typescript/ts.worker.js'],
  },
});