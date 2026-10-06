# Dusk UI

轻量界面设计规范与组件集合，供**开发者**与 **AI 编程助手**复用。

Dusk UI 想解决的是同一个问题的两面：人需要能读懂一套设计规则，AI Agent 需要能拿到一份明确、无歧义的约束。

**组件源码只有一份，两套展示工程共用：**

```
packages/ui/          唯一的组件与设计样式来源（React 组件 + tokens + 动效）
├─ apps/react/        独立 React 展示工程（Vite）
└─ apps/astro/        Astro 展示工程（Astro 页面结构 + 按需交互的 React Islands）
```

- 视觉基调来自作者博客 [blog.mcxiaochen.top](https://blog.mcxiaochen.top)（低饱和青绿、色相 170），不是默认 shadcn 换色。
- 支持浅色、深色与移动端。
- **Astro 是主要使用场景**：静态内容由 Astro 输出，只有交互区域才 hydrate。
- 当前**不是 npm 包**，复用方式是「阅读规范 + 复制源码」或直接引用 `packages/ui`。

---

## 适合谁使用

| 角色 | 用法 |
| --- | --- |
| Astro 项目开发者 | 直接复用 `packages/ui`：静态内容用 `.astro`，交互组件用 React Islands |
| React 项目开发者 | 引入 `packages/ui` 的组件与样式，或复制源码到自己的项目 |
| AI 编程助手 | 读 `docs/AGENT_GUIDE.md`，按其中的规则与提示词模板生成界面 |
| 设计决策者 | 读 `docs/DESIGN.md` 了解每条规则背后的取舍 |
| 其他技术栈项目 | 只复用设计规则（令牌数值、材质分层、动效参数），不引入 React |

---

## 本地运行

需要 Node.js ≥ 22.12。使用 npm workspaces，**根目录只有一个锁文件**，三个工程共用同一份 React。

```bash
npm install                # 安装全部工作区依赖
```

### 独立 React 工程

```bash
npm run dev:react          # 开发服务器 → http://localhost:5181
npm run typecheck          # TypeScript 检查
npm run build:react        # 生产构建 → apps/react/dist
npm run preview:react      # 预览生产产物
```

### Astro 工程

```bash
npm run dev:astro          # 开发服务器 → http://localhost:5182
npm run typecheck:astro    # astro check
npm run build:astro        # 生产构建 → apps/astro/dist
npm run preview:astro      # 预览生产产物
```

### 聚合命令

```bash
npm run dev# 默认启动 React 工程
npm run dev:react          # 等价于 npm run dev
npm run dev:astro          # 另开终端启动 Astro 工程

npm run build              # 依次构建两个工程
npm run typecheck          # 依次检查两个工程
npm test                   # 通知计时行为测试（共享包）
npm run verify:docs        # 文档与实际接口一致性检查
npm run verify:browser     # 双工程浏览器验收（需先启动两个服务）
```

浏览器验收默认针对预览服务。用preview 而非 dev 验证，能覆盖生产产物：

```bash
npm run build && npm run build:astro
npm run preview:react -- --port 5281     # 另开终端
npm run preview:astro -- --port 5282     # 另开终端
REACT_URL=http://localhost:5281 ASTRO_URL=http://localhost:5282 npm run verify:browser
```

脚本使用系统已安装的 Edge（`playwright-core`，不下载浏览器），输出截图到 `docs/screenshots/`。共59 项检查，覆盖两套工程的深浅主题、主题刷新持久化、Dock / Toast / Dialog / Tabs 交互、键盘焦点、reduced-motion、移动端 390px、hydration 警告与两套视觉一致性。

---

## 文档导航

| 文档 | 内容 |
| --- | --- |
| [`docs/DESIGN.md`](docs/DESIGN.md) | 视觉规范：颜色、材质、圆角、排版、间距、状态、禁止做法。**含设计来源与融合方式** |
| [`docs/MOTION.md`](docs/MOTION.md) | 动效规范：时长档位、弹簧参数、液态交互规则、减弱动画行为 |
| [`docs/COMPONENTS.md`](docs/COMPONENTS.md) | 五个核心组件的真实接口、参数、依赖、可访问性与适用边界 |
| [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md) | **交给其他 Agent 使用**：阅读顺序、应用步骤、提示词模板、检查清单 |
| [`AGENTS.md`](AGENTS.md) | 本仓库后续 Agent 的入口：开发命令、设计规则、修改与 Git 边界 |
| [`ATTRIBUTION.md`](ATTRIBUTION.md) | 参考来源、许可处理、以及**哪些是观察、哪些是设计提案** |

---

## 如何把规范用于其他项目

### 方式一：只取设计规则（任何技术栈）

读 [`docs/DESIGN.md`](docs/DESIGN.md) 与 [`docs/MOTION.md`](docs/MOTION.md)，把令牌数值、材质分层、圆角层级、动效参数落到你现有的主题系统里。**不需要 React，不需要 Tailwind。**

### 方式二：复制样式层

复制这两个文件到项目全局样式：

```
packages/ui/src/styles/tokens.css     # 全部设计令牌
packages/ui/src/styles/globals.css    # .glass 工具类、连续曲率回退、减弱动画兜底
```

`globals.css` 依赖 Tailwind v4 的 `@import 'tailwindcss'`，并用 `@source '../components'`、`@source '../demo'` 声明扫描范围。

> **重要**：如果不使用 Tailwind，保留 `tokens.css` 并把 `@theme inline` 段改为你的主题机制；`.glass` 等工具类改写为普通 class。**但 `@source` 必须重新指向你实际的组件目录**，否则语义类名（`bg-surface-1` 等）不会生成，页面会完全失去样式。

### 方式三：引用 `@dusk-ui/ui`（推荐，React / Astro 均可）

**文件依赖**（源码直引，不构建发布产物）：

```
packages/ui/src/styles/tokens.css
packages/ui/src/styles/globals.css
packages/ui/src/motion/motion.ts       # 动效常量与弹簧参数
packages/ui/src/motion/utils.ts        # cn()
packages/ui/src/motion/ssr.ts          # SSR 安全的首屏动画 hook
packages/ui/src/components/<你要用的组件>.tsx
```

**运行时依赖**（通过 npm 安装）：

| 依赖 | 许可 | 何时需要 |
| --- | --- | --- |
| `motion` | MIT | 所有组件 |
| `lucide-react` | ISC | StatCard、Toast、Dialog 的图标 |
| `@radix-ui/react-dialog` | MIT | 仅 Dialog |
| `clsx` + `tailwind-merge` | MIT | `cn()` |

**Astro 工程额外需要**：`@astrojs/react` 集成。

每个组件的精确依赖见 [`docs/COMPONENTS.md`](docs/COMPONENTS.md) 的「复制到其他项目需一起复制」小节。

---

## 在 Astro 中使用

Astro 是主要使用场景。页面结构与静态内容由 Astro 输出，只有交互区域才 hydrate。

```astro
---
// 样式与组件都来自 @dusk-ui/ui
import '@dusk-ui/ui/styles.css'
import { Button } from '@dusk-ui/ui'
import { DEMO_STATS, StatCardsIsland } from '@dusk-ui/ui/demo'
---

<!-- 静态内容：不加 client:*，构建时就是 HTML -->
<section>
  <h1>Dusk UI</h1>
  <p>这一段是 Astro 静态输出，没有 hydration 成本。</p>
  <a href="#stats">跳到统计卡片</a>
</section>

<!-- 需要交互：按需选择指令 -->
<StatCardsIsland client:visible stats={DEMO_STATS} specs={[]} />
```

### Islands 的三条规则

1. **props 必须可序列化** —— 不能传函数或组件。需要回调的组件（如 Dock）用 `@dusk-ui/ui/demo` 提供的包装层，它接收字符串（如 `href`）并在客户端自行处理。
2. **Islands 之间不共享 React Context** —— 触发按钮与对应的 Host 必须放在**同一个岛**内。
3. **不要无差别加 `client:load`** —— 静态内容不加指令；次要交互用 `client:idle` 或 `client:visible`。

本仓库的示例划分：

| 岛 | 指令 | 理由 |
| --- | --- | --- |
| `ThemeToggle` | `client:load` | 需立即可用，首屏即可切换主题 |
| `FloatingDockIsland` | `client:load` | 导航需立即可用 |
| `ToastsIsland` | `client:idle` | 触发按钮与 Host 必须同岛 |
| `DialogIsland` | `client:idle` | 触发按钮与弹窗必须同岛 |
| `StatCardsIsland` | `client:visible` | 滚动到可见时才需要 |
| `SegmentedTabsIsland` | `client:visible` | 滚动到可见时才需要 |

**未使用 `client:only`** —— 全部组件都能服务端渲染。若将来某个组件确实无法 SSR（例如直接依赖 `window` 且无法降级），才使用它，并在代码中注释具体原因。

---

## 目录结构

```
dusk-ui/
├─ docs/规范文档
│  ├─ DESIGN.md         视觉规范
│  ├─ MOTION.md         动效规范
│  ├─ COMPONENTS.md     组件说明（React 与 Astro 两种用法）
│  ├─ AGENT_GUIDE.md    Agent 使用指南
│  └─ screenshots/      浏览器验收截图
├─ packages/
│  └─ ui/               唯一的组件与样式来源
│     └─ src/
│        ├─ components/ 五个核心组件 + 四个基础控件
│        ├─ demo/       共用演示数据 + Astro Islands 包装层 + 博客 Demo（blog/）
│        ├─ motion/     动效常量、cn()、SSR hook
│        ├─ styles/     tokens.css + globals.css
│        └─ index.ts    唯一公共 API
├─ apps/
│  ├─ react/            独立 React 展示工程（Vite，端口 5181）
│  │  └─ blog.html      /blog 入口：说明博客站点位于 Astro 工程
│  └─ astro/            Astro 展示工程（端口 5182）
│     └─ src/
│        ├─ components/ BlogNav.astro（博客悬浮导航 + 移动端抽屉）
│        ├─ layouts/    Layout.astro（展示页骨架）· BlogLayout.astro（博客骨架）
│        └─ pages/
│           ├─ index.astro    展示页（含博客 Demo 入口卡片）
│           └─ blog/          博客 Demo：首页 / 详情 / 归档 / 标签 / 分类 / 关于
├─ scripts/             验收脚本
├─ AGENTS.md
├─ ATTRIBUTION.md
└─ README.md
```

---

## 核心组件

| 组件 | 说明 |
| --- | --- |
| `StatCard` | 统计指标卡片，带等宽数字与同尺寸骨架 |
| `FloatingDock` | 桌面端按鼠标距离连续放大的悬浮导航；触屏端固定 44px |
| `Toast` | 四种状态通知，悬停/聚焦暂停倒计时；倒计时可开关，时长外部可配 |
| `Dialog` | 基于 Radix 的模态弹窗，焦点管理与 Esc 全部交给 Radix |
| `SegmentedTabs` | 胶囊选项卡，选中指示器为共享表面并平滑移动 |

基础控件：`Button`、`Skeleton`、`Switch`、`ThemeToggle`。

---

## 当前版本边界

**已包含**

- 设计令牌（浅色 / 深色）、五种表面材质与连续曲率渐进增强
- 五个核心组件 + 四个基础控件
- **两套展示工程**（独立 React + Astro React Islands），共用同一份组件源码与样式
- Astro 页面结构 + 6 个按需 hydrate 的 React Islands，无 `client:only`
- SSR 兼容处理：首屏不入场动画，避免 hydration mismatch
- 通知计时的行为测试（7 项）
- 浏览器验收脚本（59 项检查，含两套视觉一致性对比）

**不包含（第一版刻意不做）**

- ❌ npm 包发布 —— 当前**不是** `npm install @dusk-ui/ui`，是内部源码复用
- ❌ Storybook、Figma 插件、主题生成器、组件 CLI、组件市场
- ❌ 原生 Astro 组件库——交互组件一律复用 React 实现
- ❌ 非 React 框架适配（Vue / Svelte 等请只复用设计规则）
- ❌ 后端、数据库、账号体系、服务器适配器
- ❌ 主题编辑器、多品牌主题引擎、JSON → CSS 生成流水线
- ❌ Turborepo / Nx / Changesets / 发布流水线
- ❌ 性能基准数据 —— **未做 60fps 或低端设备优化验证**，不应声称已达标

---

## 许可状态

Dusk UI 采用 **[PolyForm Noncommercial License 1.0.0](./LICENSE)**（SPDX：`PolyForm-Noncommercial-1.0.0`）。

| | |
| --- | --- |
| ✅ 允许 | 个人学习、研究、兴趣项目使用 |
| ✅ 允许 | 免费分发与分享 |
| ✅ 允许 | 修改与创作衍生作品 |
| ✅ 允许 | 非营利组织、教育机构、政府机构的非商业用途 |
| ❌ 禁止 | 任何商业用途 |
| ❌ 禁止 | 售卖、收费下载、订阅制服务 |
| ❌ 禁止 | 以本项目提供收费的 SaaS / 托管服务 |
| ❌ 禁止 | 集成进商业产品后对外提供 |
| ❌ 禁止 | 任何付费性质的二次分发 |
| 📋 必须 | 传递许可证全文或官方链接，并保留 `Required Notice:` |

商业用途需另行取得作者书面授权。

**这不是 OSI 认可的开源许可证** —— 禁止商用与开源定义（OSD 第6 条）互斥。准确的说法是 **source-available（源码可见）**，不是 open source。

上游参考项目各自的许可仍然有效，不受本仓库选择影响。两项许可受限的参考（Aceternity UI 无 LICENSE、Animate UI 为 MIT + Commons Clause）均**未复制代码**，为独立实现。详见 [`ATTRIBUTION.md`](ATTRIBUTION.md)。

---

## 致谢

设计理念参考了 [shadcn/ui](https://github.com/shadcn-ui/ui)、[Animate UI](https://github.com/imskyleen/animate-ui)、[Aceternity UI](https://github.com/aceternity/ui) 等开源项目的公开思路。视觉基调来自作者本人的博客。这些项目及其作者值得尊重；「代码公开」不构成任意复制的依据。详见 [`ATTRIBUTION.md`](ATTRIBUTION.md)。