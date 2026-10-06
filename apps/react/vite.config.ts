import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'

const root = import.meta.dirname

/**
 * 独立 React 展示工程。
 * 组件与样式来自 @dusk-ui/ui（源码直引，不构建发布产物）。
 *
 * 两个入口：
 * - index.html —— 组件展示页
 * - blog/index.html —— /blog 的降级说明页（真正的博客在 Astro 工程）
 */
function blogRoute(): Plugin {
  // /blog 不带扩展名时也要落到 blog.html，而不是单页兜底的首页。
  // dev 与 preview 两处都要配，否则两边行为不一致。
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    if (req.url === '/blog') req.url = '/blog.html'
    next()
  }

  return {
    name: 'blog-route',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), blogRoute()],
  server: {
    port: 5181,
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        blog: resolve(root, 'blog.html'),
      },
    },
  },
})
