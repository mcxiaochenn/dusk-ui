import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

/**
 * 独立 React 展示工程。
 * 组件与样式来自 @dusk-ui/ui（源码直引，不构建发布产物）。
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5181,
  },
})