import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactShowcase } from '@dusk-ui/ui/demo'
// 样式来自共享包，React 与 Astro 两个工程用的是同一份
import '@dusk-ui/ui/styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('找不到 #root 挂载点')

createRoot(container).render(
  <StrictMode>
    <ReactShowcase />
  </StrictMode>,
)