import { createRoot } from 'react-dom/client'
import { BlogUnavailable } from '@dusk-ui/ui/demo'
// 样式来自共享包，与独立 React 展示页、Astro 工程是同一份
import '@dusk-ui/ui/styles.css'

/**
 * 博客 Demo 的降级入口。
 *
 * 博客站点跑在 Astro 展示工程（默认 5182），因为它依赖 Astro 的文件路由；
 * 独立 React 工程是单页应用，没有这套路由。这里给出明确说明而不是 404。
 */
const ASTRO_ORIGIN = 'http://localhost:5182'

const container = document.getElementById('root')
if (!container) throw new Error('找不到 #root 挂载点')

createRoot(container).render(<BlogUnavailable astroUrl={`${ASTRO_ORIGIN}/blog`} />)
