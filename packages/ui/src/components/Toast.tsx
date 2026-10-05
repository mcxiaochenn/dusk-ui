import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from 'lucide-react'
import { cn } from '../motion/utils'
import { POP_INITIAL, SPRING, TWEEN } from '../motion/motion'

export type ToastTone = 'success' | 'warning' | 'danger' | 'info'

/**
 * 自动关闭时长的默认值（毫秒）。
 *
 * 这是「不传 duration 时用多少」的唯一来源，调用方不必重复写同一个数字。
 * 需要不同时长时显式传入 `duration`，或在包装层统一配置。
 */
export const TOAST_DEFAULT_DURATION = 5000

/**
 * 状态 → 图标 + 语义色。
 * 每个状态同时具备「图标形状」与「颜色」，
 * 不依赖颜色单独传达状态（色觉障碍用户可凭图标区分）。
 */
const TONE: Record<
  ToastTone,
  {
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
    label: string
    className: string
    iconClassName: string
    /**
     * 倒计时进度条的底色。
     *
     * 必须写成完整的字面量类名，不能由 iconClassName 拼接得出。
     * Tailwind 在构建时静态扫描源码，运行时拼出来的类名不会被生成，
     * 进度条会拿到一个不存在的 class，背景色退化为透明 ——
     * 元素和宽度动画都正常，只是看不见。
     */
    barClassName: string
  }
> = {
  success: {
    icon: CheckCircle2,
    label: '成功',
    className: 'border-success-border',
    iconClassName: 'text-success',
    barClassName: 'bg-success',
  },
  warning: {
    icon: TriangleAlert,
    label: '警告',
    className: 'border-warning-border',
    iconClassName: 'text-warning',
    barClassName: 'bg-warning',
  },
  danger: {
    icon: XCircle,
    label: '错误',
    className: 'border-danger-border',
    iconClassName: 'text-danger',
    barClassName: 'bg-danger',
  },
  info: {
    icon: Info,
    label: '提示',
    className: 'border-info-border',
    iconClassName: 'text-info',
    barClassName: 'bg-info',
  },
}

export interface ToastData {
  tone: ToastTone
  title: string
  description?: string
  /**
   * 自动关闭时长（毫秒）。不传时用 TOAST_DEFAULT_DURATION。
   * 传 0 或负数表示不自动关闭，也不显示倒计时。
   */
  duration?: number
  /**
   * 是否显示倒计时进度条。
   *
   * - 不传：跟随 duration，即存在自动关闭计时器就显示
   * - 传 false：强制不显示（计时仍在后台进行，通知照常自动关闭）
   * - 传 true：不会凭空造出倒计时；duration <= 0 时依然不显示，
   *   因为「没有计时器却画一根进度条」会误导用户
   */
  showCountdown?: boolean
}

export interface ToastProps extends ToastData {
  onClose: () => void
}

/**
 * 单条通知。
 *
 * 倒计时行为：
 * - hover 或键盘焦点进入容器时暂停，视觉进度同步暂停；
 * - 移出后从剩余时间继续，而不是重新计时；
 * - 进度条宽度按「剩余比例」线性递减。
 */
export function Toast({
  tone,
  title,
  description,
  duration = TOAST_DEFAULT_DURATION,
  showCountdown,
  onClose,
}: ToastProps) {
  const reduceMotion = useReducedMotion()
  const meta = TONE[tone]
  const Icon = meta.icon

  /** 是否存在自动关闭计时器 */
  const hasTimer = duration > 0
  /** 是否绘制进度条：显式关闭优先，否则只有确实在计时时才画 */
  const withCountdown = showCountdown === false ? false : hasTimer

  /** 剩余毫秒。用 ref 保存，避免重渲染计时逻辑。 */
  const remainingRef = React.useRef(duration)
  const [paused, setPaused] = React.useState(false)
  const [progress, setProgress] = React.useState(1)

  // 单一计时器：每帧按实际流逝时间扣减剩余量。
  // 不依赖 requestAnimationFrame 是否被节流，卸载时明确清理。
  React.useEffect(() => {
    if (!hasTimer || paused) return

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const delta = now - last
      last = now
      remainingRef.current = Math.max(0, remainingRef.current - delta)

      if (remainingRef.current <= 0) {
        onClose()
        return
      }
      setProgress(remainingRef.current / duration)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, hasTimer, paused, onClose])

  return (
    <motion.div
      layout
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live={tone === 'danger' ? 'assertive' : 'polite'}
      initial={reduceMotion ? { opacity: 0 } : POP_INITIAL}
      animate={{ opacity: 1, scale: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.97, transition: TWEEN.feedback }
      }
      transition={SPRING.pop}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        'glass pointer-events-auto relative w-full overflow-hidden rounded-float p-4 pr-11',
        meta.className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 size-5 shrink-0', meta.iconClassName)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium">
            {/* 状态不只靠颜色：图标 + 屏幕阅读器均可读出 */}
            <span className="sr-only">{meta.label}：</span>
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="关闭通知"
        className="absolute top-3 right-3 grid size-8 place-items-center rounded-control text-foreground-muted transition-colors duration-[150ms] ease-[var(--ease-standard)] hover:bg-accent-subtle hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>

      {/* 倒计时进度：暂停时宽度冻结，与实际剩余时间一致 */}
      {withCountdown ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-border-subtle">
          <div
            className={cn('h-full', meta.barClassName)}
            style={{
              width: `${progress * 100}%`,
              transition: paused ? 'none' : undefined,
            }}
          />
        </div>
      ) : null}
    </motion.div>
  )
}

/** 通知容器：负责位置、退出动画与列表间距 */
export function ToastViewport({
  toasts,
  onDismiss,
}: {
  /** 每条通知由调用方持有id，容器只负责渲染与关闭回调 */
  toasts: Array<ToastData & { id: string }>
  onDismiss: (id: string) => void
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--dock-height)+var(--space-6))] z-50 mx-auto flex w-full max-w-sm flex-col items-center gap-2 px-4"
      // 容器本身不朗读，避免与内部通知的 aria-live 重复播报
      aria-live="off"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => onDismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}