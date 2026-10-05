/**
 * Dusk UI — 动效共用参数
 * ─────────────────────────────────────────────────────────
 * 唯一的小型常量文件。组件从这里取时长与弹簧参数，
 * 不要在组件内写裸数字，也不要在此扩展成动画配置系统。
 *
 * 完整规则见 docs/MOTION.md。
 */

import type { Transition } from 'motion/react'

/** 时长档位（毫秒）。与 tokens.css 中的 --duration-* 一一对应。 */
export const DURATION = {
  /** 状态反馈：hover / focus / active */
  feedback: 150,
  /** 弹窗与通知进退场 */
  dialog: 200,
  /** 内容入场 */
  enter: 300,
  /** 列表错峰单步 */
  stagger: 50,
} as const

/**
 * 列表错峰总延迟上限。
 * 无论列表多长，入场动画都在这个时间内完成，
 * 避免长列表迟迟无法交互。
 */
export const STAGGER_MAX_TOTAL = 240

/**
 * 弹簧参数，按组件角色区分。
 *
 * stiffness — 刚度。数值越大回弹越快，越「急」。
 * damping   — 阻尼。数值越大越快停住；过小会来回振荡。
 * mass      — 质量。数值越大越沉，启动和停止都更慢。
 *
 * damping 接近临界阻尼时不振荡；本文件所有配置均为
 * 「轻微回弹」或「接近临界阻尼」，不使用夸张弹跳。
 */
export const SPRING = {
  /** Dock 尺寸变化：需要跟手但不晃，用低刚度 + 中阻尼 */
  dock: { type: 'spring', stiffness: 150, damping: 12, mass: 0.1 },
  /** 选项卡指示器移动：短促、几乎无回弹 */
  indicator: { type: 'spring', stiffness: 420, damping: 34, mass: 0.6 },
  /** 内容入场：小幅位移 + 淡入 */
  enter: { type: 'spring', stiffness: 320, damping: 28, mass: 0.7 },
  /** 弹窗与通知的缩放：极小幅、短促回弹 */
  pop: { type: 'spring', stiffness: 380, damping: 30, mass: 0.7 },
  /** 按钮按下回弹 */
  press: { type: 'spring', stiffness: 500, damping: 26, mass: 0.5 },
} as const satisfies Record<string, Transition>

/** 线性淡入淡出：只动 opacity，不做位移 */
export const TWEEN = {
  feedback: { duration: DURATION.feedback / 1000, ease: 'easeOut' },
  dialog: { duration: DURATION.dialog / 1000, ease: 'easeOut' },
} as const satisfies Record<string, Transition>

/** 入场统一初始态：淡入 + 小幅上移。位移刻意做小（8px）。 */
export const ENTER_INITIAL = { opacity: 0, y: 8 } as const

/** 弹窗初始态：淡入 + 极小缩放（0.97），不做明显位移 */
export const POP_INITIAL = { opacity: 0, scale: 0.97 } as const

/**
 * 计算列表错峰延迟。
 * @param index 元素序号
 * @param total 列表总长度
 * 超过上限后所有剩余元素共用同一延迟，避免尾部等待过久。
 */
export function staggerDelay(index: number, total: number): number {
  const steps = Math.min(index, total)
  const raw = steps * (DURATION.stagger / 1000)
  return Math.min(raw, STAGGER_MAX_TOTAL / 1000)
}