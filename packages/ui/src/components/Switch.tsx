import { cn } from '../motion/utils'

export interface SwitchProps {
  /** 受控状态 */
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** 必填：开关本身不显示文字，标签由外部提供 */
  label: string
  /** 标签下方的说明文字 */
  description?: string
  disabled?: boolean
  className?: string
}

/**
 * 开关。
 *
 * 用 `button[role="switch"]` 而非原生 checkbox：
 * 按钮天然支持空格与回车，键位行为无需额外处理，
 * 也不必与 label 的 for/id 关联才能在点标签时生效。
 *
 * 状态不只靠颜色：轨道位置（左/右）本身就是位置信号，
 * 加上 `aria-checked`，色觉障碍与屏幕阅读器用户都能判断。
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-pill border transition-colors duration-[150ms] ease-[var(--ease-standard)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
          'disabled:pointer-events-none disabled:opacity-50',
          checked ? 'border-accent bg-accent' : 'border-border bg-surface-3',
        )}
      >
        <span
          aria-hidden
          className={cn(
            /**
             * 必须显式写 left：绝对定位元素若 left 为 auto，会取「静态位置」，
             * 而 button 的浏览器默认样式是 text-align: center，
             * 静态位置因此被居中（实测解析为 17px 而非 0），
             * 再叠加 translate-x 就会把滑块推出轨道外。
             */
            'absolute top-0.5 left-0.5 size-3.5 rounded-pill transition-transform duration-[150ms] ease-[var(--ease-standard)]',
            // 左右两侧各留 3px：轨道 36px - 边框 2px - 滑块 14px - 左偏移 2px = 16px 位移量
            checked ? 'translate-x-4 bg-accent-foreground' : 'translate-x-0 bg-surface-1',
          )}
        />
      </button>

      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
