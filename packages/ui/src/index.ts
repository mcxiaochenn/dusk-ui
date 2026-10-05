/**
 * Dusk UI — 组件与样式入口
 * ─────────────────────────────────────────────────────────
 * 这是 @dusk-ui/ui 的唯一公共 API。两个展示工程都从这里导入，
 * 组件源码只有一份。
 *
 * 注意：样式不走 JS 导出，而是通过 package.json 的 exports 字段
 * 以 CSS 文件形式引入（见「样式引入」）：
 *   - '@dusk-ui/ui/styles.css'  → tokens + globals（含 @import 'tailwindcss'）
 *   - '@dusk-ui/ui/demo.css'    → 展示页的布局类
 */

export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'

export { Skeleton } from './components/Skeleton'
export type { SkeletonProps } from './components/Skeleton'

export { StatCard } from './components/StatCard'
export type { StatCardProps, StatTone } from './components/StatCard'

export { Toast, ToastViewport } from './components/Toast'
export type { ToastProps, ToastData, ToastTone } from './components/Toast'

export { Dialog } from './components/Dialog'
export type { DialogProps } from './components/Dialog'

export { SegmentedTabs, SegmentedTabPanel } from './components/SegmentedTabs'
export type {
  SegmentedTabsProps,
  SegmentedTabItem,
  SegmentedTabPanelProps,
} from './components/SegmentedTabs'

export { FloatingDock } from './components/FloatingDock'
export type { FloatingDockItem } from './components/FloatingDock'

export { ThemeToggle } from './components/ThemeToggle'

/* 动效常量 —— 组件与展示页共用同一份参数 */
export {
  DURATION,
  SPRING,
  TWEEN,
  ENTER_INITIAL,
  POP_INITIAL,
  STAGGER_MAX_TOTAL,
  staggerDelay,
} from './motion/motion'

export { cn } from './motion/utils'

/* 演示数据 —— 两个展示工程共用，保证内容一致 */
export {
  DEMO_STATS,
  DEMO_TABS,
  DEMO_POST,
  DEMO_TOASTS,
  DEMO_DOCK,
  DEMO_SPECS,
  DEMO_DIALOG_PARAGRAPHS,
} from './demo/data'
export type {
  DemoStat,
  DemoTab,
  DemoToastCopy,
  DemoDockItem,
} from './demo/data'