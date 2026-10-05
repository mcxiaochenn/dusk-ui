import * as React from 'react'
import { cn } from '../motion/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 圆角档位，与 StatCard 保持一致以便加载切换不跳动 */
  radius?: 'control' | 'card' | 'float'
}

const RADIUS = {
  control: 'rounded-control',
  card: 'rounded-card',
  float: 'rounded-float',
}

/**
 * 骨架占位。
 * 尺寸必须与真实内容一致，否则加载切换会出现布局跳动。
 */
export function Skeleton({ className, radius = 'control', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('bg-surface-2', RADIUS[radius], className)}
      {...props}
    />
  )
}