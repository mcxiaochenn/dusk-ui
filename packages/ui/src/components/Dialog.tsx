import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { POP_INITIAL, SPRING, TWEEN } from '../motion/motion'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  /** 底部操作区 */
  footer?: React.ReactNode
  /** 弹窗最大宽度，默认 440px */
  maxWidth?: number
}

/**
 * 模态弹窗。
 *
 * 焦点管理、Esc 关闭、关闭后焦点恢复、`aria-modal` 与标题关联
 * 全部交给 Radix Dialog，不自行实现。
 *
 * 两层结构的原因：
 * - 外层负责固定定位与居中（含 translate），完全交给 CSS；
 * - 内层只做 opacity / scale，避免 Motion 的 transform 与
 *   Tailwind 的 -translate-x-1/2 互相覆盖导致弹窗错位。
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = 440,
}: DialogProps) {
  const reduceMotion = useReducedMotion()

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {/* AnimatePresence 必须包在 Root 内、Portal 外，
          才能捕获到关闭时的退出动画 */}
      <AnimatePresence>
        {open ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              {/* 遮罩只做背景隔离，不对主体施加模糊 */}
              <motion.div
                className="fixed inset-0 z-50 bg-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={TWEEN.dialog}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <div
                style={{ maxWidth }}
                className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2"
              >
                <motion.div
                  className="glass-strong rounded-dialog p-6"
                  // 减弱动画下只淡入，不缩放
                  initial={reduceMotion ? { opacity: 0 } : POP_INITIAL}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0, transition: TWEEN.feedback }
                      : { opacity: 0, scale: 0.97, transition: TWEEN.feedback }
                  }
                  transition={SPRING.pop}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <DialogPrimitive.Title className="text-lg font-semibold">
                        {title}
                      </DialogPrimitive.Title>
                      {description ? (
                        <DialogPrimitive.Description className="mt-1.5 text-sm text-foreground-secondary">
                          {description}
                        </DialogPrimitive.Description>
                      ) : null}
                    </div>

                    <DialogPrimitive.Close
                      aria-label="关闭弹窗"
                      className="grid size-8 shrink-0 place-items-center rounded-control text-foreground-muted transition-colors duration-[150ms] ease-[var(--ease-standard)] hover:bg-accent-subtle hover:text-foreground"
                    >
                      <X className="size-4" aria-hidden />
                    </DialogPrimitive.Close>
                  </div>

                  {/* 内容区可滚动，标题与操作区固定。
                      不加 overflow-hidden 到外层，避免裁掉阴影与焦点环。 */}
                  {children ? (
                    <div className="mt-4 max-h-[min(50vh,320px)] overflow-y-auto overscroll-contain text-sm text-foreground-secondary">
                      {children}
                    </div>
                  ) : null}

                  {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}