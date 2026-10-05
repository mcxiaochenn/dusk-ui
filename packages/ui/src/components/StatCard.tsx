import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../motion/utils'
import { ENTER_INITIAL, SPRING } from '../motion/motion'
import { useIsFirstMount } from '../motion/ssr'
import { Skeleton } from './Skeleton'

/** 语义色。只允许这四个值，避免出现任意色板。 */
export type StatTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const TONE_TEXT: Record<StatTone, string> = {
  neutral: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
}

export interface StatCardProps {
  /** 指标名称 */
  label: string
  /** 指标数值。会启用等宽数字排版 */
  value: React.ReactNode
  /** 补充说明，可为空 */
  hint?: React.ReactNode
  /** 语义色，只作用于数值与图标 */
  tone?: StatTone
  /** 可选图标，建议 20px */
  icon?: React.ReactNode
  /** 加载态。切换时保持同尺寸，不产生跳动 */
  loading?: boolean
  className?: string
}

/**
 * 统计卡片。
 *
 * 布局：标题在上、数值居中突出、说明在下，三行垂直堆叠。
 * 高度由内容决定，加载态用同尺寸骨架占位。
 */
export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
  loading = false,
  className,
}: StatCardProps) {
  const reduceMotion = useReducedMotion()
  // 首次挂载不施加 initial 动画，保证服务端与客户端首帧一致（避免 hydration mismatch）
  const isFirstMount = useIsFirstMount()

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-card border border-border bg-surface-1 p-5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-foreground-secondary">{label}</span>
        {icon ? (
          <span className={cn('shrink-0', TONE_TEXT[tone])} aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>

      {loading ? (
        // 骨架尺寸对齐真实内容：数值行高与说明行高保持一致
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-24" radius="control" />
          <Skeleton className="h-4 w-32" radius="control" />
        </div>
      ) : (
        <motion.div
          initial={reduceMotion || isFirstMount ? false : ENTER_INITIAL}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING.enter}
          className="flex flex-col gap-1"
        >
          {/* 等宽数字：数值变化时宽度稳定 */}
          <span
            className={cn(
              'text-2xl leading-tight font-semibold [font-variant-numeric:tabular-nums]',
              TONE_TEXT[tone],
            )}
          >
            {value}
          </span>
          {hint ? <span className="text-sm text-foreground-muted">{hint}</span> : null}
        </motion.div>
      )}
    </div>
  )
}