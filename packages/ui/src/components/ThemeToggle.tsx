import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '../motion/utils'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'dusk-ui-theme'

/**
 * 读取当前已应用的主题。
 * 只在客户端调用；服务端渲染时没有 document，返回 null 表示「未知」。
 */
function readAppliedTheme(): Theme | null {
  if (typeof document === 'undefined') return null
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // 隐私模式下 localStorage 可能不可写，主题仍然生效，仅不持久化
  }
}

/**
 * 浅色／深色切换。
 *
 * SSR 兼容要点：
 * - 模块顶层与首次渲染不访问 document。初值固定为 null，
 *   使服务端输出与客户端首次渲染完全一致，不会 hydration mismatch；
 * - 挂载后再用 effect 读取首屏脚本已应用的主题，同步到组件状态。
 *
 * 主题写在 html.dark 上，因此同页其他 Island 无需共享 Context，
 * CSS 变量会自然响应。
 */
export function ThemeToggle({ className }: { className?: string }) {
  // 首次渲染统一为 null，保证服务端与客户端一致
  const [theme, setTheme] = React.useState<Theme | null>(null)

  // 挂载后同步已应用的主题
  React.useEffect(() => {
    setTheme(readAppliedTheme())
  }, [])

  const options: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: '浅色', icon: <Sun className="size-4" aria-hidden /> },
    { value: 'dark', label: '深色', icon: <Moon className="size-4" aria-hidden /> },
  ]

  return (
    <div
      role="radiogroup"
      aria-label="配色主题"
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        // 主题未知（服务端或同步前）不标记选中项，避免与服务端 HTML 不一致
        const selected = theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            onClick={() => {
              setTheme(option.value)
              applyTheme(option.value)
            }}
            className={cn(
              'grid size-9 place-items-center rounded-pill corner-round transition-colors duration-[150ms] ease-[var(--ease-standard)]',
              selected
                ? 'bg-surface-1 text-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            {option.icon}
          </button>
        )
      })}
    </div>
  )
}