/**
 * Dusk UI — 共用演示数据
 * ─────────────────────────────────────────────────────────
 * 两个展示工程（apps/react 与 apps/astro）使用同一份数据，
 * 保证两处展示内容一致，便于对照。
 *
 * 全部为虚构内容，不连接任何真实业务接口。
 * 只包含可序列化数据，可安全地作为 props 传入 Astro 的 React Islands。
 */

import { TOAST_DEFAULT_DURATION } from '../components/Toast'

/** 统计卡片演示数据 */
export interface DemoStat {
  label: string
  value: string
  hint: string
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  /** 图标名，由 React 侧映射为具体组件 */
  icon: 'download' | 'boxes' | 'check' | 'alert'
}

export const DEMO_STATS: DemoStat[] = [
  { label: '构建产物', value: '1.24 MB', hint: 'gzip 后 402 KB', tone: 'neutral', icon: 'download' },
  { label: '组件数量', value: '5', hint: '含必要基础控件', tone: 'info', icon: 'boxes' },
  { label: '类型检查', value: '通过', hint: 'strict 模式无报错', tone: 'success', icon: 'check' },
  { label: '待处理告警', value: '2', hint: '示例数据，非真实指标', tone: 'warning', icon: 'alert' },
]

/** 选项卡定义 */
export interface DemoTab {
  value: string
  label: string
}

export const DEMO_TABS: DemoTab[] = [
  { value: 'tokens', label: '设计令牌' },
  { value: 'materials', label: '材质' },
  { value: 'motion', label: '动效' },
]

/** 虚构文章摘要，用于检验博客内容场景 */
export const DEMO_POST = {
  category: '设计规范',
  title: '把一套令牌用在两类界面上',
  excerpt:
    '工具界面与内容页面的密度差异很大，但它们应当看起来像同一个产品。这段文字是演示内容，用于检验卡片在长文本下的表现。',
  date: '2026-10-05',
  readTime: '6 分钟',
}

/** 通知演示文案 */
export interface DemoToastCopy {
  title: string
  description: string
}

export const DEMO_TOASTS: Record<'success' | 'warning' | 'danger' | 'info', DemoToastCopy> = {
  success: { title: '配置已保存', description: '演示通知，5 秒后自动关闭。' },
  warning: { title: '磁盘空间偏低', description: '鼠标悬停可暂停倒计时。' },
  danger: { title: '部署失败', description: '演示内容，不涉及真实环境。' },
  info: { title: '检查到新版本', description: '演示通知，用于验证进度条同步。' },
}

/**
 * 通知自动关闭时长（毫秒）——「参数由外部传入」的示例。
 *
 * 来源链条：
 *   data.ts 的这个常量
 *     → 页面传给 <ToastsIsland duration={...}>
 *     → 包装层写入每条通知数据
 *     → <Toast duration={...}>
 *
 * 取值为组件导出的默认常量，保证「演示值」与「组件默认值」不会各写一份而漂移。
 * 想改时长时，改这里即可同时影响两个展示工程；调用方传别的数字就会覆盖它。
 */
export const DEMO_TOAST_DURATION: number = TOAST_DEFAULT_DURATION

/**
 * 演示页倒计时开关的初始状态。
 * 默认开启，与「不加开关时」的表现一致。
 */
export const DEMO_COUNTDOWN_DEFAULT = true

/** 底部导航项。href 用锚点，跨区域导航不依赖 React 状态。 */
export interface DemoDockItem {
  id: string
  label: string
  /** 目标区块 id，配合页面锚点跳转 */
  href: string
  icon: 'grid' | 'gauge' | 'book' | 'activity'
}

export const DEMO_DOCK: DemoDockItem[] = [
  { id: 'overview', label: '概览', href: '#overview', icon: 'grid' },
  { id: 'stats', label: '统计卡片', href: '#stats', icon: 'gauge' },
  { id: 'content', label: '内容与选项卡', href: '#content', icon: 'book' },
  { id: 'feedback', label: '通知与弹窗', href: '#feedback', icon: 'activity' },
]

/** 关键设计参数标注 */
export const DEMO_SPECS: string[] = [
  '色相 170 · 来源 blog.mcxiaochen.top',
  '内容宽度 1280px',
  '圆角 12 / 16 / 20 / 24px',
  '间距步进 4px',
]

/** 弹窗正文 */
export const DEMO_DIALOG_PARAGRAPHS: string[] = [
  '弹窗内容区可以滚动，标题与操作区保持固定。',
  '键盘行为由 Radix Dialog 提供：打开时焦点进入弹窗，Esc 关闭，关闭后焦点回到触发按钮。',
  '窄屏下弹窗宽度为视口减去两侧安全边距，不会溢出；内容过长时在内部滚动而不是撑破视口。',
]