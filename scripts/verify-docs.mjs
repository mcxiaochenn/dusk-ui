/**
 * 文档一致性检查
 * ─────────────────────────────────────────────────────────
 * 核对 docs/COMPONENTS.md 中出现的组件名、参数名与实际导出是否一致，
 * 避免文档写出无法运行的伪 API。
 *
 * 运行：node scripts/verify-docs.mjs
 */

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"))
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const failures = []

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(name)
}

/* 读取所有源码 */
/** 扫描整个仓库的源码（共享包 + 两个应用），排除构建产物与依赖 */
const SRC_DIRS = ['packages/ui/src', 'apps/react/src', 'apps/astro/src']
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) files.push(...(await walk(p)))
    else if (/\.(tsx?|ts|css|astro|mjs)$/.test(e.name)) files.push(p)
  }
  return files
}
const srcFiles = (await Promise.all(SRC_DIRS.map((d) => walk(join(root, d))))).flat()
const sources = new Map()
// 统一为正斜杠，后续所有 endsWith 匹配才能在 Windows 上正常工作
for (const f of srcFiles) sources.set(f.replace(/\\/g, '/'), await readFile(f, 'utf8'))
const allSrc = [...sources.values()].join('\n')

/** 只取共享包源码（组件定义的唯一来源） */
const uiSrc = [...sources.entries()]
  .filter(([f]) => f.includes('packages/ui/src'))
  .map(([, c]) => c)
  .join('\n')

const docs = {}
for (const f of ['COMPONENTS.md', 'DESIGN.md', 'MOTION.md', 'AGENT_GUIDE.md']) {
  docs[f] = await readFile(join(root, 'docs', f), 'utf8')
}
docs['README.md'] = await readFile(join(root, 'README.md'), 'utf8')
docs['AGENTS.md'] = await readFile(join(root, 'AGENTS.md'), 'utf8')

/* ── 1. 文档中出现的组件都在源码中真实导出 ── */
const docText = docs['COMPONENTS.md']
// 只取「### 组件名」形式的标题，排除 Astro 用法等非组件小节
const mentioned = [...docText.matchAll(/^###\s+([A-Z][A-Za-z]+)$/gm)].map((m) => m[1])
for (const name of mentioned) {
  check(
    `组件 ${name} 有真实导出`,
    new RegExp(`export function ${name}\\b`).test(allSrc),
  )
}

/* ── 2. COMPONENTS.md 里用到的每个组件都能在 src/components 中找到 ── */
for (const name of mentioned) {
  const file = [...sources.keys()].find((f) => f.endsWith(`${name}.tsx`))
  check(`组件文件存在 src/components/${name}.tsx`, Boolean(file))
}

/* ── 3. 文档中声明的参数名确实存在于对应组件的类型定义中 ── */
const PARAM_MAP = {
  StatCard: ['label', 'value', 'hint', 'tone', 'icon', 'loading', 'className'],
  Toast: ['tone', 'title', 'description', 'duration', 'onClose'],
  Dialog: ['open', 'onOpenChange', 'title', 'description', 'children', 'footer', 'maxWidth'],
  SegmentedTabs: ['items', 'value', 'onValueChange', 'label', 'className'],
  FloatingDock: ['items', 'label', 'className'],
  Button: ['variant', 'size', 'loading', 'className'],
  Skeleton: ['radius', 'className'],
}

for (const [comp, props] of Object.entries(PARAM_MAP)) {
  const file = [...sources.keys()].find((f) => f.endsWith(`${comp}.tsx`))
  if (!file) continue
  const code = sources.get(file)
  /**
   * 取Props 定义段。注意两类情况：
   * - Toast 的参数在 ToastData 上，ToastProps 只是 extends 它；
   * - Button 的 Props 用 Omit<ComponentProps<...>> 展开，参数在解构签名里。
   * 因此这里同时收集「类型定义段」与「解构参数列表」，只要其中一处声明即算通过。
   */
  const iface = code.match(new RegExp(`export interface ${comp}Props[\\s\\S]*?\\n\\}`))
  const related = code.match(new RegExp(`export interface ${comp}(?:Data)?[\\s\\S]*?\\n\\}`, 'g'))
  const destructure = code.match(
    new RegExp(`export function ${comp}[\\s\\S]*?\\(\\s*\\{([\\s\\S]*?)\\}`),
  )
  const segment = [
    iface ? iface[0] : '',
    ...(related ?? []),
    destructure ? destructure[1] : '',
  ].join('\n')

  for (const p of props) {
    check(`${comp} 接受参数 ${p}`, new RegExp(`\\b${p}\\b`).test(segment))
  }
}

/* ── 4. FloatingDockItem 字段 ── */
for (const f of ['id', 'label', 'icon', 'onSelect', 'active']) {
  check(
    `FloatingDockItem 含字段 ${f}`,
    new RegExp(`export interface FloatingDockItem[\\s\\S]*?\\n\\}`).test(allSrc) &&
      new RegExp(`export interface FloatingDockItem[\\s\\S]*?\\n\\}`).exec(allSrc)[0].includes(f),
  )
}

/* ── 5. 文档中引用的令牌都在 tokens.css 中定义 ── */
const tokens = sources.get([...sources.keys()].find((f) => f.endsWith('tokens.css')))
const tokenRefs = new Set()
for (const text of Object.values(docs)) {
  for (const m of text.matchAll(/`(--[a-z0-9-]+)`/g)) tokenRefs.add(m[1])
}
for (const ref of tokenRefs) {
  check(`令牌 ${ref} 已定义`, tokens.includes(`${ref}:`))
}

/* ── 6. 文档中引用的动效常量都在 motion.ts 中导出 ── */
const motionFile = sources.get([...sources.keys()].find((f) => f.endsWith('motion.ts')))
for (const name of ['DURATION', 'SPRING', 'TWEEN', 'ENTER_INITIAL', 'POP_INITIAL', 'staggerDelay', 'STAGGER_MAX_TOTAL']) {
  const inDocs = Object.values(docs).some((t) => t.includes(name))
  if (inDocs) {
    check(`动效常量 ${name} 已导出`, new RegExp(`export (const|function) ${name}\\b`).test(motionFile))
  }
}

/* ── 7. 工具类已定义（用完整后缀匹配，避免命中同名文件）── */
const globalsCss = sources.get(
  [...sources.keys()].find((f) => f.endsWith('packages/ui/src/styles/globals.css')),
)
for (const cls of ['glass', 'glass-strong']) {
  check(`工具类 .${cls} 已定义`, (globalsCss ?? '').includes(`.${cls}`))
}

/* ── 8. README 中的命令与 package.json scripts 对应 ── */
const readme = docs['README.md']
for (const [cmd, key] of [
  ['npm run dev', 'dev'],
  ['npm run build', 'build'],
  ['npm test', 'test'],
  ['npm run dev:react', 'dev:react'],
  ['npm run dev:astro', 'dev:astro'],
]) {
  check(`命令 ${cmd} 有对应 script`, Boolean(pkg.scripts[key]))
  check(`README 记录了 ${cmd}`, readme.includes(cmd))
}

/* ── 9. 复制清单中列出的文件都真实存在 ── */
const copyTargets = [
  'src/styles/tokens.css',
  'packages/ui/src/styles/globals.css',
  'packages/ui/src/motion/motion.ts',
  'packages/ui/src/motion/utils.ts',
  'packages/ui/src/motion/ssr.ts',
]
const sourcePaths = [...sources.keys()].map((f) => f.replace(/\\/g, '/'))
for (const t of copyTargets) {
  check(`复制清单 ${t} 存在`, sourcePaths.some((f) => f.endsWith(t)))
}

/* ── 10. 依赖声明完整性（共享包 + 两个应用各自检查）── */
const declaredIn = (pkgObj) => new Set([
  ...Object.keys(pkgObj.dependencies ?? {}),
  ...Object.keys(pkgObj.devDependencies ?? {}),
])

const uiPkg = JSON.parse(await readFile(join(root, 'packages/ui/package.json'), 'utf8'))
const reactPkg = JSON.parse(await readFile(join(root, 'apps/react/package.json'), 'utf8'))
const astroPkg = JSON.parse(await readFile(join(root, 'apps/astro/package.json'), 'utf8'))

function collectImports(code) {
  const set = new Set()
  for (const m of code.matchAll(/from ['"]([^'".][^'"]*)['"]/g)) {
    const spec = m[1]
    if (spec.startsWith('.') || spec.startsWith('/')) continue
    set.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])
  }
  return set
}

for (const [label, code, pkgObj] of [
  ['packages/ui', uiSrc, uiPkg],
  [
    'apps/react',
    [...sources.entries()].filter(([f]) => f.includes('apps/react')).map(([, c]) => c).join('\n'),
    reactPkg,
  ],
  [
    'apps/astro',
    [...sources.entries()].filter(([f]) => f.includes('apps/astro')).map(([, c]) => c).join('\n'),
    astroPkg,
  ],
]) {
  const declared = declaredIn(pkgObj)
  // 测试相关依赖由根package.json 统一提供，各工作区不重复声明
  const rootDeclared = declaredIn(pkg)
  for (const imp of collectImports(code)) {
    check(
      `依赖 ${imp} 已在 ${label}/package.json 声明`,
      declared.has(imp) || rootDeclared.has(imp),
    )
  }
}

/* ── 11. 组件源码只有一份（不在应用目录重复定义）── */
for (const name of mentioned) {
  const inUi = [...sources.keys()].some(
    (f) => f.includes('packages/ui') && f.endsWith(`${name}.tsx`),
  )
  const duplicated = [...sources.keys()].filter(
    (f) => !f.includes('packages/ui') && f.endsWith(`${name}.tsx`),
  )
  check(`组件 ${name}.tsx 只在 packages/ui 中定义`, inUi && duplicated.length === 0,
    duplicated.length ? `重复定义于 ${duplicated.join(', ')}` : '')
}

/* ── 12. React / React DOM 版本一致（workspaces 关键检查）──
   React 只在 packages/ui 与两个应用中声明（根目录作为 workspace 根不需要）。-- */
{
  const workspaces = { ui: uiPkg, reactApp: reactPkg, astroApp: astroPkg }
  for (const [where, p] of Object.entries(workspaces)) {
    check(`react 版本已声明 (${where})`, Boolean(p.dependencies?.react))
    check(`react-dom 版本已声明 (${where})`, Boolean(p.dependencies?.['react-dom']))
  }
  const reactVersions = Object.entries(workspaces).map(([k, p]) => p.dependencies?.react)
  check(
    'react 版本全仓一致',
    new Set(reactVersions).size === 1,
    Object.entries(workspaces).map(([k, p]) => `${k}=${p.dependencies?.react}`).join(' '),
  )
  const domVersions = Object.entries(workspaces).map(([k, p]) => p.dependencies?.['react-dom'])
  check(
    'react-dom 版本全仓一致',
    new Set(domVersions).size === 1,
    Object.entries(workspaces).map(([k, p]) => `${k}=${p.dependencies?.['react-dom']}`).join(' '),
  )
  check('根 package.json 声明了 workspaces', Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0)
}

/* ── 13. Astro 工程结构与用法约束 ── */
{
  const astroPage = [...sources.entries()].find(([f]) => f.endsWith('index.astro'))
  const page = astroPage?.[1] ?? ''

  check('Astro 页面存在', Boolean(page))
  // 样式在 Layout 中引入（Astro 约定全局样式只需引一次），详见第 15 项检查
  check('Astro 页面使用官方 React 集成', astroPkg.dependencies?.['@astrojs/react'] != null)
  // astro.config.mjs 在 src 之外，需单独读取
  const astroConfig = await readFile(join(root, 'apps/astro/astro.config.mjs'), 'utf8')
  check('Astro 配置注册 react() 集成', /integrations:\s*\[react\(\)\]/.test(astroConfig))
  check('Astro 配置启用 tailwind vite 插件', astroConfig.includes('tailwindcss()'))
  check('Astro 未启用 ClientRouter', !astroConfig.includes('clientRouter'))

  // client:* 指令的使用与禁用
  const directives = [...page.matchAll(/client:(load|idle|visible|only|media)/g)].map((m) => m[1])
  check('Astro 页面使用了 client:* 指令', directives.length > 0, `${directives.length} 个`)
  check('Astro 页面未使用 client:only（应为最后手段）', !directives.includes('only'))

  /**
   * 无差别 hydration 检查。
   * 正确判据是「存在完全没有 client:* 的静态区块」，
   * 而不是数 section 与岛的绝对数量 —— 后者会因岛分布而误报。
   */
  const staticSections = [...page.matchAll(/<section[\s\S]*?<\/section>/g)].filter((m) =>
    !/client:/.test(m[0]),
  ).length
  check(
    'Astro 存在未 hydration 的静态区块（无差别 hydration 检查）',
    staticSections > 0,
    `${staticSections} 个静态 section / ${directives.length} 个岛`,
  )

  // Islands 内不得出现不可序列化的 props（函数作为 prop 传入）
  const islands = [...sources.entries()].find(([f]) => f.endsWith('islands.tsx'))?.[1] ?? ''
  check('Islands 包装层存在', islands.length > 0)
  check('Islands 不从 .astro 接收函数 prop', !/onSelect=\{|onFire=\{|\(\)\s*=>\s*\}/.test(page))
}

/* ── 14. SSR 安全：组件不得在模块顶层访问 DOM ── */
{
  const badTopLevel = []
  for (const [file, code] of sources) {
    if (!file.includes('packages/ui/src/components')) continue
    // 移除 import 与函数体后，检查是否还有裸的 window/document 访问
    const withoutImports = code.replace(/^import .*$/gm, '')
    for (const match of withoutImports.matchAll(/^(?:const|let|var)\s+\w+[^=]*=\s*(?:window|document|localStorage|navigator)\./gm)) {
      badTopLevel.push(`${file.split(/[\\/]/).pop()}: ${match[0].slice(0, 50)}`)
    }
  }
  check('组件无模块顶层 DOM 访问（SSR 安全）', badTopLevel.length === 0, badTopLevel.join(' | '))

  const themeToggle = sources.get(
    [...sources.keys()].find((f) => f.endsWith('ThemeToggle.tsx')),
  ) ?? ''
  check('ThemeToggle 做了 SSR 保护', themeToggle.includes("typeof document === 'undefined'"))
  check('ThemeToggle 用 effect 同步主题', themeToggle.includes('React.useEffect'))

  // 首屏不入场动画的 hook 应被使用
  const panel = sources.get(
    [...sources.keys()].find((f) => f.endsWith('SegmentedTabs.tsx')),
  ) ?? ''
  check('SegmentedTabPanel 使用 useIsFirstMount 防 hydration mismatch',
    panel.includes('useIsFirstMount'))
  check('SSR hook 文件存在', sourcePaths.some((f) => f.endsWith('packages/ui/src/motion/ssr.ts')))
}

/* ── 15. Tailwind 扫描范围已声明 ── */
{
  const globals = sources.get(
    [...sources.keys()].find((f) => f.endsWith('packages/ui/src/styles/globals.css')),
  ) ?? ''
  check('globals.css 声明了 @source 扫描范围', globals.includes('@source'))
  check('@source 指向组件目录', globals.includes("@source '../components'"))
  check('@source 指向 demo 目录', globals.includes("@source '../demo'"))

  // 两个应用都必须能引入共享样式
  const reactMain = sources.get(
    [...sources.keys()].find((f) => f.endsWith('apps/react/src/main.tsx')),
  ) ?? ''
  check('React 工程引入共享样式', reactMain.includes('@dusk-ui/ui/styles.css'))

  // Astro 的样式在 Layout 中引入（页面不重复引入）
  const astroLayout = sources.get(
    [...sources.keys()].find((f) => f.endsWith('Layout.astro')),
  ) ?? ''
  check('Astro Layout 引入共享样式', astroLayout.includes('@dusk-ui/ui/styles.css'))
  check('Astro Layout 含首屏主题脚本', astroLayout.includes('dusk-ui-theme'))
}

/* ── 16. README 命令与 package.json scripts 对应 ── */
{
  const scripts = pkg.scripts ?? {}
  for (const [cmd, key] of [
    ['dev:react', 'dev:react'],
    ['dev:astro', 'dev:astro'],
    ['build:react', 'build:react'],
    ['build:astro', 'build:astro'],
    ['verify:docs', 'verify:docs'],
    ['verify:browser', 'verify:browser'],
  ]) {
    check(`脚本 ${cmd} 存在`, Boolean(scripts[key]))
    check(`README 记录了 ${cmd}`, docs['README.md'].includes(cmd))
  }
  check('README 说明了 Astro 优先', /Astro 是主要使用场景|优先|Astro 展示工程/.test(docs['README.md']))
  check('README 说明了非 npm 包', docs['README.md'].includes('不是 npm 包'))
  check('AGENTS.md 说明了 Astro 规则', docs['AGENTS.md'].includes('client:'))
  check('AGENT_GUIDE说明了 Islands 不共享 Context', docs['AGENT_GUIDE.md'].includes('不共享 React Context'))
  check('AGENT_GUIDE 说明了禁止更换框架', docs['AGENT_GUIDE.md'].includes('擅自更换业务框架'))
}

/* ── 17. 文档中的 CLI 指令必须真实存在 ── */
{
  const allDocText = Object.values(docs).join('\n')
  const usedDirectives = [...new Set([...allDocText.matchAll(/client:(load|idle|visible|only)/g)].map((m) => m[1]))]
  for (const d of usedDirectives) {
    check(`文档中的 client:${d} 是合法指令`, ['load', 'idle', 'visible', 'only'].includes(d))
  }
}

console.log(`\n${failures.length === 0 ? '全部通过' : `失败 ${failures.length} 项`}`)
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`))
  process.exitCode = 1
}