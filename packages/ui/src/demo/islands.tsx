/**
 * Dusk UI — Astro React Islands 包装层
 * ─────────────────────────────────────────────────────────
 * 这些组件**只承担平台接入**，不实现任何界面逻辑。
 * 所有视觉与交互都直接复用 packages/ui 中的核心组件。
 *
 * 为什么需要这一层：
 * - Astro 不能从 .astro 向带 client:* 的岛传入函数，所以
 *   FloatingDock 这类需要回调的组件必须由包装层在客户端自行处理；
 * - 图标需要传名称而非组件（组件不可序列化），由这里映射为具体组件；
 * -触发按钮与对应的 Host 必须放在同一个岛，否则状态无法共享。
 *
 * 所有 props 都是可序列化数据（字符串 / 数字 / 布尔 / 数组 / 普通对象），
 * 符合 Astro 对 client:* 组件 props 的要求。
 */

import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Boxes,
  CheckCircle2,
  Download,
  Gauge,
  Grid3x3,
} from 'lucide-react'
import {
  Button,
  Dialog,
  FloatingDock,
  SegmentedTabPanel,
  SegmentedTabs,
  StatCard,
  Switch,
  ToastViewport,
  type DemoDockItem,
  type DemoStat,
  type DemoTab,
  type DemoToastCopy,
  type StatTone,
  type ToastData,
  type ToastTone,
} from '../index'

/* ═══════════════════════════════════════════════════════
   图标名称映射
   Astro 侧只传字符串，由这里映射为组件。
   ═══════════════════════════════════════════════════════ */

const STAT_ICONS = {
  download: Download,
  boxes: Boxes,
  check: CheckCircle2,
  alert: AlertTriangle,
} as const

const DOCK_ICONS = {
  grid: Grid3x3,
  gauge: Gauge,
  book: BookOpen,
  activity: Activity,
} as const

type StatIconName = keyof typeof STAT_ICONS
type DockIconName = keyof typeof DOCK_ICONS

/* ═══════════════════════════════════════════════════════
   统计卡片岛
   client:visible —— 滚动到可见时才 hydrate
   ═══════════════════════════════════════════════════════ */

/**
 * 统计卡片网格 + 加载态切换。
 * 加载状态与触发按钮同岛，因此放在一个组件里。
 */
export function StatCardsIsland({
  stats,
  specs,
}: {
  stats: DemoStat[]
  specs: string[]
}) {
  const [loading, setLoading] = React.useState(false)

  // 自动复位，避免停在空骨架上。reducer 初始值在两端一致，不会 hydration mismatch。
  React.useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoading(false), 1600)
    return () => window.clearTimeout(timer)
  }, [loading])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          loading={loading}
          onClick={() => setLoading(true)}
          aria-label="切换统计卡片加载状态"
        >
          {loading ? '加载中' : '切换加载状态'}
        </Button>
        {specs.map((spec) => (
          <span
            key={spec}
            className="inline-flex items-center gap-1 rounded-control border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground-muted [font-variant-numeric:tabular-nums]"
          >
            {spec}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = STAT_ICONS[stat.icon as StatIconName] ?? Download
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              tone={stat.tone as StatTone}
              icon={<Icon className="size-5" aria-hidden />}
              loading={loading}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   通知岛
   client:idle —— 触发按钮与 Host 必须同岛，才能共享 toasts 状态
   ═══════════════════════════════════════════════════════ */

type ToastItem = ToastData & { id: string }

/**
 * 四种通知的触发按钮、倒计时开关与通知容器。
 *
 * 三者同岛：开关与按钮写入的状态由同一组件内的 Host 渲染。
 * 拆成不同岛会读不到彼此的状态（Islands 不共享 React Context）。
 */
export function ToastsIsland({
  copy,
  duration,
  countdownDefault = true,
}: {
  copy: Record<ToastTone, DemoToastCopy>
  /**
   * 自动关闭时长（毫秒）。可序列化，因此能从 .astro 传入。
   * 不传时由 <Toast> 自身回退到 TOAST_DEFAULT_DURATION，
   * 这里不重复写默认值，避免两处数字各自漂移。
   */
  duration?: number
  /** 倒计时开关的初始状态 */
  countdownDefault?: boolean
}) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  /** 倒计时显示开关。统一作用于所有类型的通知。 */
  const [countdown, setCountdown] = React.useState(countdownDefault)
  const seq = React.useRef(0)

  const push = React.useCallback(
    (tone: ToastTone) => {
      const item = copy[tone]
      seq.current += 1
      setToasts((prev) => [
        ...prev,
        {
          id: `toast-${seq.current}`,
          tone,
          title: item.title,
          description: item.description,
          // 外部传入的时长；为 undefined 时由组件默认值兜底
          duration,
          // 开关统一作用于四种状态
          showCountdown: countdown,
        },
      ])
    },
    [copy, duration, countdown],
  )

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div>
      <Switch
        checked={countdown}
        onCheckedChange={setCountdown}
        label="显示倒计时"
        description="统一控制四种通知的进度条；关闭后通知仍按时自动关闭"
        className="mb-4"
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => push('success')}>
          成功通知
        </Button>
        <Button onClick={() => push('warning')}>警告通知</Button>
        <Button onClick={() => push('danger')}>错误通知</Button>
        <Button variant="ghost" onClick={() => push('info')}>
          提示通知
        </Button>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   弹窗岛
   client:idle —— 触发按钮与弹窗必须同岛
   ═══════════════════════════════════════════════════════ */

/** 确认弹窗。触发按钮与弹窗同岛，开关状态由 React 管理。 */
export function DialogIsland({
  paragraphs,
  confirmNote,
}: {
  paragraphs: string[]
  confirmNote: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        打开弹窗
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="确认本次操作？"
        description="这是一个演示弹窗，不会提交任何数据。"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              确认
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </Dialog>

      {/* 确认后的静态说明，由 Astro 侧提供文案 */}
      <p className="mt-4 text-xs text-foreground-muted">{confirmNote}</p>
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   选项卡岛
   client:visible —— Tabs 与面板必须同岛（状态共享）
   ═══════════════════════════════════════════════════════ */

/** 胶囊选项卡 + 三个面板。切换真实内容。 */
export function SegmentedTabsIsland({ tabs }: { tabs: DemoTab[] }) {
  const [value, setValue] = React.useState(tabs[0]?.value ?? 'tokens')

  return (
    <div>
      <SegmentedTabs
        items={tabs.map((t) => ({ value: t.value, label: t.label }))}
        value={value}
        onValueChange={setValue}
        label="规范分区"
      />

      <div className="mt-5">
        {value === 'tokens' ? (
          <SegmentedTabPanel value="tokens">
            <p className="text-sm text-foreground-secondary">
              颜色、圆角、阴影、间距与时长集中定义在
              <code className="mx-1 rounded-control bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
                tokens.css
              </code>
              中。组件只引用语义令牌，不写裸色号。
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                浅色与深色共用同一套令牌名，仅在 .dark 覆盖取值
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                对比度以 WCAG AA 4.5:1 为目标
              </li>
            </ul>
          </SegmentedTabPanel>
        ) : null}

        {value === 'materials' ? (
          <SegmentedTabPanel value="materials">
            <p className="text-sm text-foreground-secondary">
              三种表面角色：内容表面用实色，玻璃表面只用于悬浮控件，遮罩负责隔离背景。
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-float border border-border bg-surface-1 p-3 text-center text-xs">
                内容表面
              </div>
              <div className="glass rounded-float p-3 text-center text-xs">玻璃表面</div>
              <div className="rounded-float border border-border bg-surface-3 p-3 text-center text-xs">
                分隔面
              </div>
            </div>
          </SegmentedTabPanel>
        ) : null}

        {value === 'motion' ? (
          <SegmentedTabPanel value="motion">
            <p className="text-sm text-foreground-secondary">
              弹簧按组件角色区分。指示器移动短促无回弹，弹窗缩放只做极小幅度。
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ['指示器', 'stiffness 420 / damping 34'],
                ['入场', 'stiffness 320 / damping 28'],
                ['弹窗', 'stiffness 380 / damping 30'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-foreground-muted">{k}</dt>
                  <dd className="font-mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </SegmentedTabPanel>
        ) : null}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   底部导航岛
   client:load —— 需要立即可用（页面加载后就能导航）
   ═══════════════════════════════════════════════════════ */

/**
 * 悬浮 Dock。
 *
 * Astro 不能传入 onSelect 函数，因此这里接收 href 字符串，
 * 在客户端自行处理跳转。这样 Island 的 props 保持完全可序列化。
 */
export function FloatingDockIsland({ items }: { items: DemoDockItem[] }) {
  const dockItems = items.map((item) => {
    const Icon = DOCK_ICONS[item.icon as DockIconName] ?? Grid3x3
    return {
      id: item.id,
      label: item.label,
      icon: <Icon className="size-5" aria-hidden />,
      // 锚点跳转：跨区域导航不依赖 React 状态
      onSelect: () => {
        document
          .getElementById(item.id)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    }
  })

  return <FloatingDock items={dockItems} label="展示页导航" />
}