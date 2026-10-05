import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../motion/utils'
import { SPRING } from '../motion/motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

const VARIANT: Record<ButtonVariant, string> = {
  // 高强调面：反色文字，用于页面主操作
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  // 低强调填充面：用于次要操作
  secondary: 'bg-surface-2 text-foreground border border-border hover:bg-surface-3',
  // 无填充：用于工具栏与次级入口
  ghost: 'text-foreground-secondary hover:bg-accent-subtle hover:text-foreground',
  // 破坏性操作
  danger: 'bg-danger text-white hover:opacity-90',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  // 交互目标不小于 40px；移动端在 globals 的媒体查询中提到 44px
  md: 'h-10 px-4 text-base gap-2',
}

export interface ButtonProps
  extends Omit<React.ComponentProps<typeof motion.button>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 展示加载态：禁用交互、显示等待指示，不改变按钮宽度 */
  loading?: boolean
  children?: React.ReactNode
}

/**
 * 基础按钮。
 * 圆角、按下回弹、focus-visible 全部来自令牌，不接受外部覆盖尺寸。
 */
export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.button
      type="button"
      // 减弱动画下取消按压缩放，只保留即时状态切换
      whileTap={reduceMotion || disabled || loading ? undefined : { scale: 0.98 }}
      transition={SPRING.press}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control font-medium',
        'transition-colors duration-[150ms] ease-[var(--ease-standard)]',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[loading=true]:cursor-progress',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      data-loading={loading || undefined}
      {...props}
    >
      {loading ? (
        /**
         * 等待指示器用 SVG 绘制，而不是「border + border-top-transparent」的矩形画法。
         *
         * 原因：全局连续曲率（corner-shape: squircle）会作用到所有元素，
         * 方形盒子加大圆角会被画成圆角方形而非正圆。圆角方形有四重对称，
         * 旋转时看起来像「一个方块在转」，观感割裂。SVG 的 <circle> 恒为正圆，
         * 不受该规则影响。
         *
         * 另外圆头端点（stroke-linecap）让弧的两端是圆角，
         * 比边框画法被 45° 斜切的硬边更连贯。
         *
         * r=6 → 周长约 37.7；dash 26 + gap 12（略大于周长，
         * 因此只出现一段弧），圆头端点再各补 1px，视觉上约四分之三圈。
         */
        <svg
          aria-hidden
          focusable="false"
          viewBox="0 0 14 14"
          fill="none"
          className="size-3.5 shrink-0"
          style={{ animation: 'dusk-spin 700ms linear infinite' }}
        >
          <circle
            cx="7"
            cy="7"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="26 12"
          />
        </svg>
      ) : null}
      {children}
    </motion.button>
  )
}