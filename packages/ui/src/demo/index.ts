/**
 * Dusk UI — 展示页相关导出
 * ─────────────────────────────────────────────────────────
 * 供 apps/react 与 apps/astro 共用。
 * 数据（data.ts）与 Islands（islands.tsx）都在这里导出。
 */

export {
  DEMO_STATS,
  DEMO_TABS,
  DEMO_POST,
  DEMO_TOASTS,
  DEMO_DOCK,
  DEMO_SPECS,
  DEMO_DIALOG_PARAGRAPHS,
} from './data'

export type { DemoStat, DemoTab, DemoToastCopy, DemoDockItem } from './data'

export {
  StatCardsIsland,
  ToastsIsland,
  DialogIsland,
  SegmentedTabsIsland,
  FloatingDockIsland,
} from './islands'

export { ReactShowcase } from './ReactShowcase'