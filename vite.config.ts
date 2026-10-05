import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * 根配置仅用于运行共享包的单元测试。
 * 两个展示工程各自有独立的构建配置：
 * - apps/react/vite.config.ts
 * - apps/astro/astro.config.mjs
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['packages/ui/src/**/*.test.tsx', 'packages/ui/src/**/*.test.ts'],
  },
})