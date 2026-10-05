import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Palette } from 'lucide-react'
import { Button } from '../components/Button'
import { ThemeToggle } from '../components/ThemeToggle'
import type { ToastTone } from '../components/Toast'
import { useIsFirstMount } from '../motion/ssr'
import type { DemoToastCopy } from './data'
import {
  DEMO_DIALOG_PARAGRAPHS,
  DEMO_DOCK,
  DEMO_POST,
  DEMO_SPECS,
  DEMO_STATS,
  DEMO_TABS,
  DEMO_TOASTS,
} from './data'
import {
  DialogIsland,
  FloatingDockIsland,
  SegmentedTabsIsland,
  StatCardsIsland,
  ToastsIsland,
} from './islands'

/* ═══════════════════════════════════════════════════════
   页面区块
   ═══════════════════════════════════════════════════════ */

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <div className="mb-5">
        <h2 className="text-xl">{title}</h2>
        <p className="mt-1.5 max-w-prose text-sm text-foreground-secondary">{description}</p>
      </div>
      {children}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   独立 React 展示页
   ─────────────────────────────────────────────────────────
   交互区块与 Astro 版复用同一批 Islands 组件，
   保证两套展示的组件、演示内容与行为完全一致。
   ═══════════════════════════════════════════════════════ */

export function ReactShowcase() {
  const reduceMotion = useReducedMotion()
  const isFirstMount = useIsFirstMount()

  return (
    <div className="min-h-screen">
      {/* 背景色块：静态、低对比，仅用于观察玻璃透出效果 */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 size-[26rem] rounded-pill bg-accent-subtle opacity-60" />
        <div className="absolute top-1/3 -right-40 size-[24rem] rounded-pill bg-info-subtle opacity-50" />
      </div>

      <header className="sticky top-0 z-30 border-b border-border-subtle bg-[var(--glass-bg-strong)] backdrop-blur-[var(--glass-blur)]">
        <div className="mx-auto flex max-w-[var(--page-max-width)] items-center justify-between gap-4 px-[var(--gutter)] py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-control bg-accent text-accent-foreground">
              <Palette className="size-4" aria-hidden />
            </span>
            <span className="text-md font-semibold">Dusk UI</span>
            <span className="rounded-pill border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground-muted">
              独立 React 工程
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* pb 只预留 Dock 高度：浮动 Dock 会遮挡正文，底部必须留白。
          footer 自身不再重复预留，否则会叠加出过大空白。 */}
      <main className="mx-auto max-w-[var(--page-max-width)] space-y-16 px-[var(--gutter)] pt-10 pb-[calc(var(--dock-height)+var(--space-6))]">
        {/* ── 概览 ── */}
        <section id="overview" className="scroll-mt-20">
          <motion.div
            initial={reduceMotion || isFirstMount ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-2xl">Dusk UI</h1>
            <p className="mt-3 max-w-prose text-md text-foreground-secondary">
              一套轻量界面设计规范与组件集合。开发者可以读文档理解规则，AI
              Agent 可以读取约束生成一致界面，React 项目可以直接复制源码复用。
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {DEMO_SPECS.map((spec) => (
                <span
                  key={spec}
                  className="inline-flex items-center gap-1 rounded-control border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground-muted [font-variant-numeric:tabular-nums]"
                >
                  {spec}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() =>
                  document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                查看统计卡片
              </Button>
              <Button
                onClick={() =>
                  document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                前往通知与弹窗
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ── 统计卡片 ── */}
        <Section
          id="stats"
          title="统计卡片"
          description="工具型界面的密度基准。加载态与真实内容保持同尺寸，切换时不跳动。"
        >
          <StatCardsIsland stats={DEMO_STATS} specs={[]} />
        </Section>

        {/* ── 内容与选项卡 ── */}
        <Section
          id="content"
          title="内容与选项卡"
          description="博客内容场景与工具界面共用同一套令牌。左侧卡片为虚构内容，仅用于检验排版。"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <article className="rounded-card border border-border bg-surface-1 p-6">
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <span className="rounded-pill bg-accent-subtle px-2 py-0.5 text-accent">
                  {DEMO_POST.category}
                </span>
                <span>{DEMO_POST.date}</span>
                <span aria-hidden>·</span>
                <span>{DEMO_POST.readTime}</span>
              </div>
              <h3 className="mt-3 text-lg">{DEMO_POST.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {DEMO_POST.excerpt}
              </p>
              <div className="mt-5 flex items-center gap-2 border-t border-border-subtle pt-4">
                <Button size="sm" variant="ghost">
                  阅读全文
                </Button>
                <span className="text-xs text-foreground-muted">演示内容</span>
              </div>
            </article>

            <div className="rounded-card border border-border bg-surface-1 p-6">
              <SegmentedTabsIsland tabs={DEMO_TABS} />
            </div>
          </div>
        </Section>

        {/* ── 通知与弹窗 ── */}
        <Section
          id="feedback"
          title="通知与弹窗"
          description="四种通知状态各自带图标，不依赖颜色单独传达信息。弹窗的焦点管理与 Esc 关闭由 Radix 处理。"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-card border border-border bg-surface-1 p-6">
              <ToastsIsland copy={DEMO_TOASTS as Record<ToastTone, DemoToastCopy>} />
            </div>

            <div className="rounded-card border border-border bg-surface-1 p-6">
              <DialogIsland
                paragraphs={DEMO_DIALOG_PARAGRAPHS}
                confirmNote="确认后此处显示操作已确认（演示状态，未提交任何数据）。"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[
              '通知圆角 16px',
              '弹窗圆角 24px',
              '悬停暂停倒计时',
              'aria-live 已设置',
            ].map((spec) => (
              <span
                key={spec}
                className="inline-flex items-center gap-1 rounded-control border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground-muted [font-variant-numeric:tabular-nums]"
              >
                {spec}
              </span>
            ))}
          </div>
        </Section>
      </main>

      <footer className="mx-auto max-w-[var(--page-max-width)] px-[var(--gutter)] pb-[calc(var(--dock-height)+var(--space-6))]">
        <p className="border-t border-border-subtle pt-6 text-xs text-foreground-muted">
          Dusk UI · 独立 React 展示工程 · 组件与样式来自 @dusk-ui/ui · 数据均为演示用途
        </p>
      </footer>

      <FloatingDockIsland items={DEMO_DOCK} />
    </div>
  )
}

export default ReactShowcase
