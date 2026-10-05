// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Dusk UI Astro 展示工程。
 *
 * 关键点：
 * - 组件来自 @dusk-ui/ui（与独立 React 工程共用同一份源码）
 * - 默认静态输出，不添加服务器适配器
 * - 不启用 ClientRouter（静态页面无需客户端路由）
 * - 演示数据在服务端传入 Islands，保持 props 可序列化
 */
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 5182,
  },
})