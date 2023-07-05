import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'RichTextMarker',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd', 'cjs', 'iife']
    }
  }
})
