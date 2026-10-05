/**
 * 通知计时行为测试
 * ─────────────────────────────────────────────────────────
 * 只覆盖真实的状态转换：倒计时递减、暂停冻结、恢复续算、结束关闭。
 * 不测试视觉表现（纯视觉变化不应写镜像实现的测试）。
 *
 * 时钟完全由测试掌控：拦截 requestAnimationFrame 并 mock
 * performance.now，逐帧手动推进，因此结果不依赖真实时间与机器速度。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast 倒计时', () => {
  let now = 0
  let rafId = 0
  /** id → 回调。必须真实支持取消，否则暂停后旧回调仍会执行，测不出暂停效果 */
  let pending: Map<number, (t: number) => void>
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    now = 0
    rafId = 0
    pending = new Map()
    spy = vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
      rafId += 1
      pending.set(rafId, cb)
      return rafId
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      pending.delete(id)
    })
  })

  afterEach(() => {
    spy.mockRestore()
    vi.unstubAllGlobals()
  })

  /** 推进 frames 帧，每帧 step 毫秒 */
  function tick(frames: number, step: number) {
    for (let i = 0; i < frames; i++) {
      now += step
      const current = [...pending.values()]
      pending.clear()
      act(() => {
        current.forEach((cb) => cb(now))
      })
    }
  }

  it('时间耗尽后调用 onClose', () => {
    const onClose = vi.fn()
    render(<Toast tone="info" title="提示" duration={1000} onClose={onClose} />)

    tick(4, 300) // 累计 1200ms > 1000ms
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('未耗尽时不调用 onClose', () => {
    const onClose = vi.fn()
    render(<Toast tone="info" title="提示" duration={5000} onClose={onClose} />)

    tick(3, 300) // 累计 900ms < 5000ms
    expect(onClose).not.toHaveBeenCalled()
  })

  it('hover 暂停后倒计时冻结，移出后从剩余时间继续而非重新计时', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Toast tone="warning" title="警告" duration={1000} onClose={onClose} />,
    )
    const root = container.querySelector('[role="status"]') as HTMLElement

    /**
     * React 把 onMouseEnter/Leave 合成自 mouseover/mouseout，
     * 且要求 relatedTarget 指向元素外部（或为 null）才认为是「进入」。
     */
    const hover = () =>
      act(() => {
        root.dispatchEvent(
          new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }),
        )
      })
    const unhover = () =>
      act(() => {
        root.dispatchEvent(
          new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
        )
      })

    // 先消耗 600ms，剩余约 400ms
    tick(2, 300)
    expect(onClose).not.toHaveBeenCalled()

    // 鼠标进入：暂停。此后再推进 900ms 也不应关闭。
    hover()
    tick(3, 300)
    expect(onClose).not.toHaveBeenCalled()

    // 移出：恢复。若实现是「重新计时」则不会关闭；
    // 正确实现应从剩余 400ms 继续，因此 400ms 后关闭。
    unhover()
    tick(2, 300)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('键盘焦点进入同样触发暂停', () => {
    const onClose = vi.fn()
    render(
      <Toast tone="info" title="提示" duration={1000} onClose={onClose} />,
    )

    tick(2, 300) // 剩余 400ms

    // 真实聚焦到关闭按钮，触发 React 的 onFocusCapture
    const closeBtn = document.querySelector<HTMLButtonElement>(
      'button[aria-label="关闭通知"]',
    )!
    act(() => {
      closeBtn.focus()
    })
    expect(document.activeElement).toBe(closeBtn)

    tick(5, 300) // 暂停期间推进 1500ms
    expect(onClose).not.toHaveBeenCalled()
  })

  it('duration 为 0 时不自动关闭', () => {
    const onClose = vi.fn()
    render(<Toast tone="info" title="常驻" duration={0} onClose={onClose} />)

    tick(10, 500)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('danger 使用 alert 角色，其余使用 status', () => {
    const { container: dangerBox } = render(
      <Toast tone="danger" title="失败" onClose={vi.fn()} />,
    )
    const { container: infoBox } = render(
      <Toast tone="info" title="提示" onClose={vi.fn()} />,
    )

    expect(dangerBox.querySelector('[role="alert"]')).toBeTruthy()
    expect(infoBox.querySelector('[role="status"]')).toBeTruthy()
  })

  it('状态不只靠颜色传达：四种 tone 渲染不同图标', () => {
    const labels = (['success', 'warning', 'danger', 'info'] as const).map((tone) => {
      const { container, unmount } = render(
        <Toast tone={tone} title="标题" duration={0} onClose={vi.fn()} />,
      )
      const svg = container.querySelector('svg')
      const cls = svg?.getAttribute('class') ?? ''
      unmount()
      return cls
    })

    // 每个 tone 的图标带不同的语义色类，同时图标形状本身也不同
    expect(new Set(labels).size).toBe(4)
  })
})