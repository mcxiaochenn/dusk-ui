import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../motion/utils'
import { SPRING } from '../motion/motion'
import { useIsFirstMount } from '../motion/ssr'

export interface SegmentedTabItem<T extends string = string> {
  value: T
  label: string
}

export interface SegmentedTabsProps<T extends string = string> {
  items: Array<SegmentedTabItem<T>>
  value: T
  onValueChange: (value: T) => void
  /** 无障碍标签，说明这组选项卡的用途 */
  label: string
  className?: string
}

/**
 * 胶囊式选项卡。
 *
 * 液态感来自共享指示器：`layoutId` 让同一块底板在选项之间
 * 移动，快速连续点击时 Motion 会从当前实际位置继续过渡，
 * 而不是跳回起点。文字不参与缩放，切换时保持清晰。
 *
 * 键盘行为遵循 WAI-ARIA Tabs：左右方向键切换，
 * Home/End 跳到首尾，激活态跟随焦点。
 */
export function SegmentedTabs<T extends string = string>({
  items,
  value,
  onValueChange,
  label,
  className,
}: SegmentedTabsProps<T>) {
  const reduceMotion = useReducedMotion()
  const listRef = React.useRef<HTMLDivElement>(null)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const tabNodes = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])]

    /**
     * 基准必须是「当前聚焦的 tab」而不是选中项value。
     * 本组件是自动激活模式（方向键即切换），正常情况下两者一致；
     * 但点击非选中项的边缘、或焦点与选中态短暂不同步时，
     * 用 value 会算错方向。tabNodes 的顺序与 items 一致，
     * 因此用 DOM 顺序的焦点下标即可。
     */
    const focusedIndex = tabNodes.findIndex((node) => node === document.activeElement)
    const base = focusedIndex >= 0 ? focusedIndex : items.findIndex((i) => i.value === value)
    if (base < 0) return

    let next = base

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (base + 1) % items.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (base - 1 + items.length) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const target = items[next]
    if (!target) return
    onValueChange(target.value)
    // 焦点跟随选中项，保证键盘用户不会失去位置感
    tabNodes[next]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`dusk-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`dusk-tabpanel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'relative rounded-pill px-4 py-1.5 text-sm font-medium whitespace-nowrap',
              'transition-colors duration-[150ms] ease-[var(--ease-standard)]',
              selected ? 'text-foreground' : 'text-foreground-muted hover:text-foreground-secondary',
            )}
          >
            {/* 共享指示器：同一 layoutId 在选项间连续移动。
                减弱动画下退化为瞬时切换，不产生滑动。 */}
            {selected ? (
              <motion.span
                layoutId="dusk-segmented-indicator"
                className="absolute inset-0 -z-10 rounded-pill border border-border bg-surface-1 shadow-xs"
                transition={reduceMotion ? { duration: 0 } : SPRING.indicator}
              />
            ) : null}
            <span className="relative">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export interface SegmentedTabPanelProps {
  value: string
  children: React.ReactNode
}

/**
 * 与选项卡对应的内容面板。切换时短促淡入。
 *
 * SSR 兼容：首次挂载不施加 initial 动画（服务端与客户端首帧一致），
 * 避免 hydration mismatch；Tab 切换会改变 key 从而重新挂载，
 * 此时正常播放入场动画。
 */
export function SegmentedTabPanel({ value, children }: SegmentedTabPanelProps) {
  const reduceMotion = useReducedMotion()
  const isFirstMount = useIsFirstMount()

  return (
    <motion.div
      key={value}
      role="tabpanel"
      id={`dusk-tabpanel-${value}`}
      aria-labelledby={`dusk-tab-${value}`}
      tabIndex={0}
      initial={reduceMotion || isFirstMount ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : SPRING.enter}
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
    >
      {children}
    </motion.div>
  )
}