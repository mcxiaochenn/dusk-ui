/**
 * 双工程浏览器验收（独立 React + Astro React Islands）
 * ─────────────────────────────────────────────────────────
 * 使用系统已安装的 Edge（playwright-core），不下载浏览器。
 *
 * 覆盖：
 * - 两个工程的深浅主题、主题切换与刷新持久化
 * - 桌面 1440 与移动 390
 * - Dock 鼠标放大与键盘焦点
 * - Toast 四种状态、暂停恢复、关闭
 * - Dialog 打开 / Esc / 焦点返回
 * - Tabs 键盘切换
 * - reduced-motion
 * - hydration 警告与控制台报错
 * - 视觉一致性（同一区块的计算样式对比）
 *
 * 运行：node scripts/verify-browser.mjs
 * 前置：两个 dev server 都在运行（npm run dev:react / npm run dev:astro）
 */

import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const REACT = process.env.REACT_URL ?? 'http://localhost:5181'
const ASTRO = process.env.ASTRO_URL ?? 'http://localhost:5182'
const OUT = new URL('../docs/screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const results = []
function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })

/** 收集控制台报错与页面异常 */
function watch(page) {
  const errors = []
  const warnings = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
    else if (m.type() === 'warning') warnings.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  return { errors, warnings }
}

/** hydration 不匹配的典型特征 */
function hydrationIssues(log) {
  return [...log.warnings, ...log.errors].filter((t) =>
    /hydrat|did not match|server rendered HTML|Text content does not match/i.test(t),
  )
}

/** 在指定视口与主题下打开页面 */
async function open(browser, url, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 900 },
    colorScheme: opts.colorScheme ?? 'light',
    reducedMotion: opts.reducedMotion,
    isMobile: opts.isMobile,
    hasTouch: opts.hasTouch,
  })
  const page = await ctx.newPage()
  const log = watch(page)
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  return { ctx, page, log }
}

/* ═══════════════════════════════════════════════════════
   1. 独立 React 工程
   ═══════════════════════════════════════════════════════ */
console.log('\n── 独立 React 工程 ──')
{
  const { ctx, page, log } = await open(browser, REACT)

  record('React · 桌面浅色渲染', (await page.locator('h1').innerText()) === 'Dusk UI')
  record(
    'React · 共享样式生效（令牌已应用）',
    await page.evaluate(() => {
      const s = getComputedStyle(document.body)
      return (
        s.getPropertyValue('--surface-0').trim().length > 0 &&
        getComputedStyle(document.querySelector('h1')).fontSize === '30px'
      )
    }),
  )
  await page.screenshot({ path: `${OUT}react-desktop-light.png`, fullPage: true })

  /* 深色切换 + 刷新持久化 */
  await page.getByRole('radio', { name: '深色' }).click()
  await page.waitForTimeout(500)
  record(
    'React · 深色切换生效',
    await page.evaluate(() => document.documentElement.classList.contains('dark')),
  )

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  record(
    'React · 主题刷新后保持深色',
    await page.evaluate(() => document.documentElement.classList.contains('dark')),
  )
  await page.screenshot({ path: `${OUT}react-desktop-dark.png`, fullPage: true })
  await page.getByRole('radio', { name: '浅色' }).click()
  await page.waitForTimeout(400)

  /* 统计卡片加载态 */
  await page.getByRole('button', { name: '切换统计卡片加载状态' }).click()
  await page.waitForTimeout(400)
  record(
    'React · 统计卡片骨架出现',
    (await page.locator('#stats [aria-hidden="true"]').count()) > 0,
  )
  await page.screenshot({ path: `${OUT}react-stats-loading.png` })
  await page.waitForTimeout(1600)

  /* Tabs 键盘 */
  await page.getByRole('tab', { name: '材质' }).focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(350)
  record(
    'React · Tabs 方向键切换',
    (await page.getByRole('tab', { name: '动效' }).getAttribute('aria-selected')) === 'true',
  )

  /* Toast：出现 → 暂停 → 恢复关闭 */
  await page.locator('#feedback').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: '警告通知' }).click()
  await page.waitForTimeout(400)
  const toast = page.locator('[role="status"]').first()
  const readW = () =>
    toast.locator('div[style*="width"]').first().evaluate((el) => el.style.width)

  const w1 = await readW()
  await page.waitForTimeout(800)
  const w2 = await readW()
  record('React · 通知倒计时递减', parseFloat(w2) < parseFloat(w1), `${w1} → ${w2}`)

  await toast.hover()
  await page.waitForTimeout(200)
  const p1 = await readW()
  await page.waitForTimeout(900)
  const p2 = await readW()
  record('React · 悬停暂停倒计时', p1 === p2, `${p1} = ${p2}`)
  await page.screenshot({ path: `${OUT}react-toast-paused.png` })

  await page.mouse.move(5, 5)
  const remain = parseFloat(await readW())
  await page.waitForFunction(() => document.querySelectorAll('[role="status"]').length === 0, {
    timeout: Math.ceil((remain / 100) * 5000) + 900,
  })
  record('React · 移出后恢复并自动关闭', (await page.locator('[role="status"]').count()) === 0)

  /* Dialog：打开 → Esc → 焦点返回 */
  const trigger = page.getByRole('button', { name: '打开弹窗' })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await page.waitForTimeout(450)
  record('React · 弹窗打开', await page.getByRole('dialog').isVisible())
  record(
    'React · 弹窗内焦点管理',
    await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
  )
  await page.screenshot({ path: `${OUT}react-dialog.png` })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  record('React · Esc 关闭弹窗', (await page.getByRole('dialog').count()) === 0)
  record(
    'React · 焦点返回触发按钮',
    await page.evaluate(() => document.activeElement?.textContent?.includes('打开弹窗') ?? false),
  )

  /* Dock 放大 + 居中 */
  const dockBtn = page.locator('nav[aria-label="展示页导航"]:visible button[aria-label="统计卡片"]')
  const readCenter = () =>
    page.evaluate(() => {
      const nav = [...document.querySelectorAll('nav[aria-label="展示页导航"]')].find(
        (n) => n.getBoundingClientRect().width > 0,
      )
      const r = nav?.querySelector('div')?.getBoundingClientRect()
      return r ? { cx: r.left + r.width / 2, c: document.body.clientWidth / 2 } : null
    })

  const rest = await readCenter()
  const box = await dockBtn.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(700)
  record('React · Dock 鼠标靠近放大', (await dockBtn.boundingBox()).width > box.width)
  const grown = await readCenter()
  record('React · Dock 放大后仍居中', Math.abs(grown.cx - grown.c) < 1, `偏移 ${Math.abs(grown.cx - grown.c).toFixed(2)}px`)
  record('React · Dock 放大前后不漂移', Math.abs(grown.cx - rest.cx) < 1)
  await page.screenshot({ path: `${OUT}react-dock-hover.png` })

  record(
    'React · 键盘焦点有可见焦点环',
    await page.evaluate(() => {
      // 注意：不能用 Playwright 的 :visible 伪类，page.evaluate 内是原生 DOM 查询
      const nav = [...document.querySelectorAll('nav[aria-label="展示页导航"]')].find(
        (n) => n.getBoundingClientRect().width > 0,
      )
      const btn = nav?.querySelector('button[aria-label="概览"]')
      if (!btn) return false
      btn.focus()
      return parseFloat(getComputedStyle(document.activeElement).outlineWidth) > 0
    }),
  )

  record('React · 无控制台报错', log.errors.length === 0, log.errors.slice(0, 2).join(' | '))
  record('React · 无 hydration 警告', hydrationIssues(log).length === 0, hydrationIssues(log).slice(0, 2).join(' | '))
  await ctx.close()
}

/* ═══════════════════════════════════════════════════════
   2. Astro 工程
   ═══════════════════════════════════════════════════════ */
console.log('\n── Astro 工程 ──')
{
  const { ctx, page, log } = await open(browser, ASTRO)

  record('Astro · 桌面浅色渲染', (await page.locator('h1').innerText()) === 'Dusk UI')

  /* 关键：静态内容应已由 Astro 输出为 HTML */
  const staticInfo = await page.evaluate(() => ({
    hasOverview: !!document.querySelector('#overview h1'),
    hasPost: !!document.querySelector('#content article'),
    hasMaterials: !!document.querySelector('#materials'),
    islands: document.querySelectorAll('astro-island').length,
    materialsHasIsland: !!document.querySelector('#materials astro-island'),
  }))
  record(
    'Astro · 静态内容已渲染进 HTML',
    staticInfo.hasOverview && staticInfo.hasPost && staticInfo.hasMaterials,
    JSON.stringify(staticInfo),
  )
  record(
    'Astro · Islands 数量为 6（2 load + 2 idle + 2 visible）',
    staticInfo.islands === 6,
    `${staticInfo.islands} 个`,
  )
  record('Astro · 材质样本区未 hydration（纯静态）', !staticInfo.materialsHasIsland)

  record(
    'Astro · 共享样式生效',
    await page.evaluate(() => {
      const s = getComputedStyle(document.body)
      return (
        s.getPropertyValue('--surface-0').trim().length > 0 &&
        getComputedStyle(document.querySelector('h1')).fontSize === '30px'
      )
    }),
  )
  await page.screenshot({ path: `${OUT}astro-desktop-light.png`, fullPage: true })

  /* 深色 + 刷新持久化 */
  await page.getByRole('radio', { name: '深色' }).click()
  await page.waitForTimeout(500)
  record(
    'Astro · 深色切换生效',
    await page.evaluate(() => document.documentElement.classList.contains('dark')),
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  record(
    'Astro · 主题刷新后保持深色',
    await page.evaluate(() => document.documentElement.classList.contains('dark')),
  )
  await page.screenshot({ path: `${OUT}astro-desktop-dark.png`, fullPage: true })
  await page.getByRole('radio', { name: '浅色' }).click()
  await page.waitForTimeout(400)

  /* client:visible 的岛在滚动后才 hydrate */
  await page.locator('#stats').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  record(
    'Astro · client:visible 岛滚动后已 hydrate',
    await page.evaluate(() => {
      const el = document.querySelector('#stats astro-island')
      return el ? !el.hasAttribute('ssr') : false
    }),
  )

  /* 统计卡片加载态 */
  await page.getByRole('button', { name: '切换统计卡片加载状态' }).click()
  await page.waitForTimeout(400)
  record(
    'Astro · 统计卡片骨架出现',
    (await page.locator('#stats [aria-hidden="true"]').count()) > 0,
  )
  await page.waitForTimeout(1600)

  /* Tabs 键盘 */
  await page.getByRole('tab', { name: '材质' }).focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(350)
  record(
    'Astro · Tabs 方向键切换',
    (await page.getByRole('tab', { name: '动效' }).getAttribute('aria-selected')) === 'true',
  )

  /* Toast */
  await page.locator('#feedback').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: '警告通知' }).click()
  await page.waitForTimeout(400)
  const toast = page.locator('[role="status"]').first()
  record('Astro · 通知出现', await toast.isVisible())
  const readW = () =>
    toast.locator('div[style*="width"]').first().evaluate((el) => el.style.width)

  const w1 = await readW()
  await page.waitForTimeout(800)
  record('Astro · 通知倒计时递减', parseFloat(await readW()) < parseFloat(w1))

  await toast.hover()
  await page.waitForTimeout(200)
  const p1 = await readW()
  await page.waitForTimeout(900)
  record('Astro · 悬停暂停倒计时', p1 === (await readW()))
  await page.screenshot({ path: `${OUT}astro-toast-paused.png` })
  await page.mouse.move(5, 5)
  const remain = parseFloat(await readW())
  await page.waitForFunction(() => document.querySelectorAll('[role="status"]').length === 0, {
    timeout: Math.ceil((remain / 100) * 5000) + 900,
  })
  record('Astro · 移出后恢复并自动关闭', (await page.locator('[role="status"]').count()) === 0)

  /* Dialog */
  const trigger = page.getByRole('button', { name: '打开弹窗' })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  await page.waitForTimeout(500)
  record('Astro · 弹窗打开', await page.getByRole('dialog').isVisible())
  record(
    'Astro · 弹窗内焦点管理',
    await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
  )
  await page.screenshot({ path: `${OUT}astro-dialog.png` })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  record('Astro · Esc 关闭弹窗', (await page.getByRole('dialog').count()) === 0)
  record(
    'Astro · 焦点返回触发按钮',
    await page.evaluate(() => document.activeElement?.textContent?.includes('打开弹窗') ?? false),
  )

  /* Dock */
  const dockBtn = page.locator('nav[aria-label="展示页导航"]:visible button[aria-label="统计卡片"]')
  const box = await dockBtn.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(700)
  record('Astro · Dock 鼠标靠近放大', (await dockBtn.boundingBox()).width > box.width)
  record(
    'Astro · Dock 放大后仍居中',
    await page.evaluate(() => {
      const nav = [...document.querySelectorAll('nav[aria-label="展示页导航"]')].find(
        (n) => n.getBoundingClientRect().width > 0,
      )
      const r = nav?.querySelector('div')?.getBoundingClientRect()
      return r ? Math.abs(r.left + r.width / 2 - document.body.clientWidth / 2) < 1 : false
    }),
  )
  await page.screenshot({ path: `${OUT}astro-dock-hover.png` })

  record('Astro · 无控制台报错', log.errors.length === 0, log.errors.slice(0, 2).join(' | '))
  record('Astro · 无 hydration 警告', hydrationIssues(log).length === 0, hydrationIssues(log).slice(0, 2).join(' | '))
  await ctx.close()
}

/* ═══════════════════════════════════════════════════════
   3. 视觉一致性对比
   ═══════════════════════════════════════════════════════ */
console.log('\n── 两套工程视觉一致性 ──')
{
  const probe = async (url) => {
    const { ctx, page } = await open(browser, url, { colorScheme: 'dark' })
    await page.locator('#stats').scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    const data = await page.evaluate(() => {
      const pick = (sel, props) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const s = getComputedStyle(el)
        return Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p).trim()]))
      }
      return {
        body: pick('body', ['background-color', 'color', 'font-family']),
        card: pick('#stats .rounded-card', ['background-color', 'border-radius', 'border-top-color', 'padding']),
        dock: pick('nav[aria-label="展示页导航"] > div', ['background-color', 'border-radius']),
        h1: pick('h1', ['font-size', 'font-weight', 'letter-spacing']),
        // 底部留白：Dock 会遮挡正文，两套工程必须一致
        main: pick('main', ['padding-bottom', 'max-width', 'padding-left']),
        sectionTitle: pick('h2', ['font-size', 'font-weight']),
      }
    })
    await ctx.close()
    return data
  }

  const a = await probe(REACT)
  const b = await probe(ASTRO)

  for (const key of ['body', 'card', 'dock', 'h1', 'main', 'sectionTitle']) {
    // 防御：任一侧取样失败（null）不能算通过，否则会静默放过真实差异
    const sampled = a[key] !== null && b[key] !== null
    const same = sampled && JSON.stringify(a[key]) === JSON.stringify(b[key])
    record(
      `视觉一致 · ${key}`,
      same,
      same
        ? JSON.stringify(a[key])
        : sampled
          ? `React ${JSON.stringify(a[key])} vs Astro ${JSON.stringify(b[key])}`
          : '取样失败，无法比较',
    )
  }
}

/* ═══════════════════════════════════════════════════════
   4. 移动端 390
   ═══════════════════════════════════════════════════════ */
console.log('\n── 移动端 390px ──')
for (const [name, url] of [
  ['React', REACT],
  ['Astro', ASTRO],
]) {
  const { ctx, page, log } = await open(browser, url, {
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  })
  record(
    `${name} · 移动端无横向溢出`,
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  )
  record(
    `${name} · 触屏 Dock 固定尺寸 ≥44px`,
    await page.evaluate(() => {
      const nav = [...document.querySelectorAll('nav[aria-label="展示页导航"]')].find(
        (n) => n.getBoundingClientRect().width > 0,
      )
      const btn = nav?.querySelector('button')
      if (!btn) return false
      const r = btn.getBoundingClientRect()
      return r.width >= 44 && r.height >= 44
    }),
  )
  record(`${name} · 移动端无控制台报错`, log.errors.length === 0, log.errors.slice(0, 2).join(' | '))
  await page.screenshot({ path: `${OUT}${name.toLowerCase()}-mobile-dark.png`, fullPage: true })
  await ctx.close()
}

/* ═══════════════════════════════════════════════════════
   5. prefers-reduced-motion
   ═══════════════════════════════════════════════════════ */
console.log('\n── prefers-reduced-motion ──')
for (const [name, url] of [
  ['React', REACT],
  ['Astro', ASTRO],
]) {
  const { ctx, page, log } = await open(browser, url, { reducedMotion: 'reduce' })
  await page.locator('#feedback').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: '提示通知' }).click()
  await page.waitForTimeout(400)
  record(
    `${name} · 减弱动画下通知即时可见`,
    Number(
      await page
        .locator('[role="status"]')
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
    ) > 0.9,
  )

  await page.getByRole('button', { name: '打开弹窗' }).click()
  await page.waitForTimeout(400)
  record(
    `${name} · 减弱动画下弹窗即时可见`,
    Number(
      await page.getByRole('dialog').evaluate((el) => getComputedStyle(el.firstElementChild).opacity),
    ) > 0.9,
  )

  const dockBtn = page.locator('nav[aria-label="展示页导航"]:visible button[aria-label="统计卡片"]')
  const box = await dockBtn.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(600)
  record(`${name} · 减弱动画下 Dock 不放大`, Math.abs((await dockBtn.boundingBox()).width - box.width) < 2)
  record(`${name} · 减弱动画场景无报错`, log.errors.length === 0, log.errors.slice(0, 2).join(' | '))
  await page.screenshot({ path: `${OUT}${name.toLowerCase()}-reduced-motion.png` })
  await ctx.close()
}

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n通过 ${results.length - failed.length}/${results.length}`)
if (failed.length) {
  console.log('失败项：')
  failed.forEach((f) => console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`))
  process.exitCode = 1
}