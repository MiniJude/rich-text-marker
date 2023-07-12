import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from "@vitejs/plugin-vue-jsx"
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts(), vueJsx()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RichTextMaker',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd', 'iife']
    }
  },
  resolve: {
    alias: {
      '@': resolve('./src')
    }
  }
})
