import * as React from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { cn } from '../motion/utils'
import { SPRING, TWEEN } from '../motion/motion'

export interface FloatingDockItem {
  /** 稳定标识，同时用作锚点跳转目标 */
  id: string
  /** 无障碍标签与悬浮提示文本 */
  label: string
  icon: React.ReactNode
  onSelect: () => void
  /** 是否为当前区域 */
  active?: boolean
}

/** 交互区间：鼠标距离按钮中心多少像素内达到最大放大 */
const DISTANCE_RANGE = 120
/** 静止 / 最大尺寸（px） */
const SIZE_MIN = 40
const SIZE_MAX = 76

/**
 * 悬浮 Dock。
 *
 * 交互模型（距离映射思路参考 Aceternity UI 的 Floating Dock，独立实现）：
 * - 鼠标 X 换算成与每个按钮中心的距离；
 * - 距离在 [-120, 0, 120] 上线性映射到 [40, 76, 40] 像素；
 * - 低刚度弹簧平滑，鼠标快速划过时相邻按钮依次响应。
 *
 * 布局开销（有意取舍，务必知情）：
 * 按钮的宽高是**真实布局尺寸**，因此放大会把相邻按钮推开，
 * 而不是让它们互相压盖。
 * - 代价：Dock 宽度随放大实时变化，会触发布局重排；
 * - 影响范围：仅 Dock 内部的若干按钮，页面其余部分不重排；
 * - 居中保证：外壳用 mx-auto 居中并预留放大余量，
 *   宽度变化时整体仍在视口中央，不会向右漂移；
 * - 触屏端与prefers-reduced-motion 下完全不做尺寸动画，尺寸恒定。
 */
export function FloatingDock({
  items,
  label = '页面导航',
  className,
}: {
  items: FloatingDockItem[]
  label?: string
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  // 桌面端共享的鼠标 X。鼠标离开时置为 Infinity，所有按钮回到静止尺寸。
  const mouseX = useMotionValue(Infinity)
  const interactive = !reduceMotion

  return (
    <>
      {/* 触屏 / 窄屏：固定尺寸导航，不模拟 hover 放大 */}
      <nav
        aria-label={label}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(var(--space-3),env(safe-area-inset-bottom))]',
          'md:hidden',
          className,
        )}
      >
        <div
          className="glass flex items-center gap-1 rounded-dock p-1.5"
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
        >
          {items.map((item) => (
            <DockButton key={item.id} item={item} compact />
          ))}
        </div>
      </nav>

      {/* 桌面端：基于鼠标距离连续放大 */}
      <nav
        aria-label={label}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 hidden justify-center px-4 pb-[max(var(--space-3),env(safe-area-inset-bottom))] md:flex',
          className,
        )}
      >
        {/* py-1 预留放大余量，避免放大后贴到外壳边缘或裁切焦点环 */}
        <div
          className="glass flex items-center gap-2 rounded-dock p-2 py-3"
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
        >
          {items.map((item) => (
            <DockButton key={item.id} item={item} mouseX={interactive ? mouseX : null} />
          ))}
        </div>
      </nav>
    </>
  )
}

function DockButton({
  item,
  compact = false,
  mouseX,
}: {
  item: FloatingDockItem
  compact?: boolean
  mouseX?: MotionValue<number> | null
}) {
  const reduceMotion = useReducedMotion()
  const ref = React.useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)

  /** 是否启用距离放大：仅桌面端且用户未要求减弱动画 */
  const distanceDriven = !compact && mouseX != null

  // Hook 必须无条件调用，故始终准备一个来源：
  // 触屏端用占位值（恒为 Infinity，映射结果恒为最小尺寸）。
  const fallbackX = useMotionValue(Infinity)
  const sourceX = mouseX ?? fallbackX

  // 到本按钮中心的水平距离。鼠标在视口外时为 Infinity，映射结果落在最小值。
  const distance = useTransform(sourceX, (value) => {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds) return Infinity
    return value - (bounds.left + bounds.width / 2)
  })

  const size = useTransform(
    distance,
    [-DISTANCE_RANGE, 0, DISTANCE_RANGE],
    [SIZE_MIN, SIZE_MAX, SIZE_MIN],
  )
  const iconSize = useTransform(
    distance,
    [-DISTANCE_RANGE, 0, DISTANCE_RANGE],
    [18, 28, 18],
  )

  // 弹簧：低刚度 + 中阻尼，跟手但不来回振荡
  const width = useSpring(size, SPRING.dock)
  const height = useSpring(size, SPRING.dock)
  const iconWidth = useSpring(iconSize, SPRING.dock)
  const iconHeight = useSpring(iconSize, SPRING.dock)

  // 标签在 hover 与键盘焦点时都显示，不把信息只交给鼠标
  const showLabel = (hovered || focused) && !compact

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={item.onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={item.label}
      aria-current={item.active ? 'true' : undefined}
      // 按下轻微缩至 0.98 再自然恢复；减弱动画下取消
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      transition={SPRING.press}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-float',
        'transition-colors duration-[150ms] ease-[var(--ease-standard)]',
        compact && 'size-11',
        item.active
          ? 'bg-accent-subtle text-foreground'
          : 'text-foreground-secondary hover:bg-accent-subtle hover:text-foreground',
      )}
      style={
        distanceDriven
          ? { width, height, minWidth: SIZE_MIN, minHeight: SIZE_MIN }
          : compact
            ? undefined
            : { width: SIZE_MIN, height: SIZE_MIN }
      }
    >
      <AnimatePresence>
        {showLabel ? (
          <motion.span
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2, transition: TWEEN.feedback }}
            transition={reduceMotion ? { duration: 0 } : SPRING.pop}
            className="glass pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 rounded-float px-2.5 py-1 text-xs whitespace-nowrap text-foreground"
          >
            {item.label}
          </motion.span>
        ) : null}
      </AnimatePresence>

      <motion.span
        className="grid place-items-center"
        style={distanceDriven ? { width: iconWidth, height: iconHeight } : { width: 20, height: 20 }}
      >
        {item.icon}
      </motion.span>
    </motion.button>
  )
}