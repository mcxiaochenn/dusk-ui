# Dusk UI — 组件说明

本文件记录 Dusk UI 五个核心组件的实际接口。**所有示例均与 `packages/ui/src/` 中的真实导出一致**，可直接复制运行。

组件源码只有一份：`packages/ui/`。独立 React 工程（`apps/react`）与 Astro 工程（`apps/astro`）都从这里导入。

---

## 两种用法速查

| | 独立 React 工程 | Astro 工程 |
| --- | --- | --- |
| 导入 | `import { Button } from '@dusk-ui/ui'` | 同左 |
| 样式 | `import '@dusk-ui/ui/styles.css'` | 同左（在 `.astro` 前端脚本中引入） |
| 交互组件 | 直接用，无需指令 | 加 `client:*` 指令按需 hydrate |
| 图标 | 传 `ReactNode` | 传**图标名字符串**，由 Islands 包装层映射 |
| 回调 | 传函数 | **不能传函数**，包装层在客户端自行处理 |

### 通用约定

- 组件从 `../motion/utils` 导入 `cn`（合并 className）。
- 动画参数从 `../motion/motion` 导入，组件内不写裸数值。
- 颜色、圆角、阴影一律走 `packages/ui/src/styles/tokens.css` 中的语义令牌。

### Astro 的两个硬约束

1. **props 必须可序列化。** 不能从 `.astro` 向带 `client:*` 的岛传函数或组件。因此 `FloatingDock` 这类需要回调的组件要通过 `@dusk-ui/ui/demo` 提供的 Islands 包装层使用 —— 包装层接收字符串（如 `href`），在客户端自行处理跳转。
2. **Islands 之间不共享 React Context。** 把 Provider 放在某个岛里，其他岛读不到。因此触发按钮与对应的 Host 必须放在**同一个岛**内。

---

## 基础控件

这些控件不是独立交付物，而是五个核心组件的必要支撑。

### Button

文件：`packages/ui/src/components/Button.tsx`

按钮的基础实现，圆角、按下回弹、focus-visible 全部来自令牌。

```tsx
// 独立 React 工程
import { Button } from '@dusk-ui/ui'

<Button variant="primary">主要操作</Button>
<Button>次要操作</Button>
<Button variant="ghost">工具栏入口</Button>
<Button variant="danger">删除</Button>
<Button size="sm">小号</Button>
```

```astro
<!-- Astro：纯展示按钮不需要 hydration，加不加 client:* 都可以。
     需要点击行为时才加 client:load -->
---
import { Button } from '@dusk-ui/ui'
---

<Button variant="primary" client:load>主要操作</Button>
```

> Astro 中若按钮没有交互需求，**不加** `client:*` 即可，会被静态渲染成 HTML。
<Button loading>保存中</Button>
```

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'secondary'` | 视觉层级 |
| `size` | `'sm' \| 'md'` | `'md'` | `md` 高度 40px，`sm` 为36px |
| `loading` | `boolean` | `false` | 显示旋转指示、禁用交互、设置 `aria-busy`，**不改变按钮宽度** |
| `className` | `string` | — | 追加类名 |

其余属性透传给底层 `motion.button`。

**依赖**：无运行时依赖（`cn` 与动效常量为内部依赖）。
**可访问性**：`:focus-visible` 显示焦点环；`disabled` 与 `loading` 均阻止交互。
**边界**：不提供图标插槽——图标直接作为 `children` 传入并自行设置尺寸。

### Skeleton

文件：`packages/ui/src/components/Skeleton.tsx`

骨架占位。**尺寸必须与真实内容一致，否则加载切换会跳动。**

```tsx
import { Skeleton } from '@dusk-ui/ui'

<Skeleton className="h-8 w-24" />
<Skeleton className="h-4 w-32" radius="card" />
```

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `radius` | `'control' \| 'card' \| 'float'` | `'control'` | 圆角档位 |
| `className` | `string` | — | **必须显式给出宽高** |

**边界**：只负责视觉占位，`aria-hidden` 恒为真。加载状态的语义由外层容器承担。

### ThemeToggle

文件：`packages/ui/src/components/ThemeToggle.tsx`

浅色/深色切换，持久化到 `localStorage`。

```tsx
// 独立 React 工程
import { ThemeToggle } from '@dusk-ui/ui'

<ThemeToggle />
```

```astro
<!-- Astro：必须 client:load。主题需要立即可用，且要读写 localStorage -->
---
import { ThemeToggle } from '@dusk-ui/ui'
---

<ThemeToggle client:load />
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `className` | `string` | 追加类名 |

**依赖**：页面 `<head>` 中需要有首屏内联脚本读取 `localStorage` 后切换 `.dark`，否则会闪烁。Astro 侧放在 `Layout.astro`，React 侧放在 `index.html`，两处逻辑一致。

**SSR 兼容**：组件内部首次渲染不读 `document`（初值为 `null`），挂载后用 `useEffect` 同步已应用的主题。因此服务端输出与客户端首帧一致，不会 hydration mismatch。

**可访问性**：`role="radiogroup"` + `role="radio"` + `aria-checked`，每个按钮有 `aria-label`。
**边界**：只做两态切换，不做跟随系统选项。深色主题写在 `html.dark` 上，因此**其他岛无需共享 Context**，CSS 变量会自然响应。

### Switch

文件：`packages/ui/src/components/Switch.tsx`

受控开关。用于「开 / 关」这类布尔设置。

```tsx
// 独立 React 工程
import * as React from 'react'
import { Switch } from '@dusk-ui/ui'

function Demo() {
  const [on, setOn] = React.useState(true)
  return (
    <Switch
      checked={on}
      onCheckedChange={setOn}
      label="显示倒计时"
      description="关闭后通知仍按时自动关闭"
    />
  )
}
```

```astro
<!-- Astro：开关需要点击，必须 hydrate。
     checked 是受控值，状态要放在岛内维护，不能从 .astro 传入回调。 -->
---
import { Switch } from '@dusk-ui/ui'
---

<Switch client:idle checked={false} onCheckedChange={undefined} label="开关" />
```

> **Astro 注意**：`onCheckedChange` 是函数，**不能从 `.astro` 传入**。开关必须放在岛内部由 React 管理状态（本仓库的做法见 `ToastsIsland`），或在包装层里封装。上面第二个示例仅示意组件本身可用，实际请务必在岛内使用。

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `checked` | `boolean` | 必填 | 受控状态 |
| `onCheckedChange` | `(checked: boolean) => void` | 必填 | 状态变化回调 |
| `label` | `string` | 必填 | 开关本身不显示文字，标签由外部提供，同时作为 `aria-label` |
| `description` | `string` | — | 标签下方的说明文字 |
| `disabled` | `boolean` | `false` | 禁用 |
| `className` | `string` | — | 追加类名 |

**依赖**：无额外运行时依赖（只用 `cn` 与令牌）。
**可访问性**：用 `button[role="switch"]` + `aria-checked`，而非原生 checkbox —— 按钮天然支持空格与回车，也无需 `for`/`id` 关联。状态不只靠颜色：轨道位置（左/右）本身是位置信号。
**边界**：只做受控组件，不维护内部状态，也不提供 indeterminate 半选态。

---

## StatCard

文件：`packages/ui/src/components/StatCard.tsx`

工具型界面的密度基准。加载态与真实内容保持同尺寸，切换时不跳动。

### 用途

展示单个关键指标：标签、数值、补充说明，可选图标与语义色。

### 最小使用示例

```tsx
// 独立 React 工程
import { StatCard } from '@dusk-ui/ui'
import { Download } from 'lucide-react'

<StatCard
  label="构建产物"
  value="1.24 MB"
  hint="gzip 后 402 KB"
  tone="success"
  icon={<Download className="size-5" />}
/>
```

加载态：

```tsx
<StatCard label="构建产物" value="1.24 MB" hint="gzip 后 402 KB" loading />
```

Astro 中 `icon` 需要能序列化的值。**推荐直接用 `StatCardsIsland`**，它接收图标名字符串并在内部映射：

```astro
---
import { DEMO_STATS } from '@dusk-ui/ui/demo'
import { StatCardsIsland } from '@dusk-ui/ui/demo'
---

<!-- client:visible：滚动到可见时才 hydrate -->
<StatCardsIsland client:visible stats={DEMO_STATS} specs={[]} />
```

若要直接用 `StatCard`，需自建一个包装组件把图标名映射为组件，因为 `icon` 的类型是 `ReactNode`，不可从 `.astro` 传入。

### 参数

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | 必填 | 指标名称 |
| `value` | `React.ReactNode` | 必填 | 指标数值，**自动启用等宽数字** |
| `hint` | `React.ReactNode` | — | 补充说明，可省略 |
| `tone` | `'neutral' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` | 语义色，只作用于数值与图标 |
| `icon` | `React.ReactNode` | — | 建议20px |
| `loading` | `boolean` | `false` | 显示同尺寸骨架 |
| `className` | `string` | — | 追加类名 |

### 依赖

- `lucide-react`（仅示例中的图标）
- `motion/react`
- 同目录 `Skeleton.tsx`
- `../motion/motion`、`../motion/utils`
- 必须引入 `packages/ui/src/styles/tokens.css` 与 `globals.css`

### 键盘与可访问性

纯展示组件，无交互。数值使用 `font-variant-numeric: tabular-nums`，刷新时宽度稳定不抖动。

### 复制到其他项目需一起复制

```
src/components/StatCard.tsx
src/components/Skeleton.tsx
packages/ui/src/motion/motion.ts
packages/ui/src/motion/utils.ts
packages/ui/src/motion/ssr.ts
src/styles/tokens.css
src/styles/globals.css
```

`Button.tsx` 与 `Skeleton.tsx` 需保留（`StatCard` 内部会用到骨架，且二者互相引用时要一起留）。

### 适用边界

- 适合 2～4 个并列指标；更多指标请改用表格或列表。
- 数值过长（超过 8 字符）会挤压布局，建议改用 `--text-xl` 字号。
- **不含数字滚轮动画**，需要时自行实现。

---

## FloatingDock

文件：`packages/ui/src/components/FloatingDock.tsx`

桌面端按鼠标距离连续放大的悬浮导航。

### 用途

页面级快速导航或常用操作入口，悬浮在视口底部。

### 最小使用示例

```tsx
// 独立 React 工程：可以直接传 onSelect 函数
import { FloatingDock, type FloatingDockItem } from '@dusk-ui/ui'
import { LayoutGrid, Gauge } from 'lucide-react'

const items: FloatingDockItem[] = [
  { id: 'overview', label: '概览', icon: <LayoutGrid className="size-5" />, onSelect: () => scrollTo('overview'), active: true },
  { id: 'stats', label: '统计', icon: <Gauge className="size-5" />, onSelect: () => scrollTo('stats') },
]

<FloatingDock items={items} label="页面导航" />
```

```astro
<!-- Astro：不能传函数，用 Islands 包装层，只传可序列化数据 -->
---
import { DEMO_DOCK, FloatingDockIsland } from '@dusk-ui/ui/demo'
---

<FloatingDockIsland client:load items={DEMO_DOCK} />
```

> **这就是包装层存在的原因。** `FloatingDock` 需要 `onSelect` 回调，而 Astro 无法把函数传给带 `client:*` 的岛。`FloatingDockIsland` 接收可序列化的 `DemoDockItem[]`（含 `icon` 名称字符串与 `id`），在客户端自行映射图标并处理滚动跳转。

自建包装层的写法：

```tsx
// packages/ui/src/demo/islands.tsx（节选）
export function FloatingDockIsland({ items }: { items: DemoDockItem[] }) {
  const dockItems = items.map((item) => {
    const Icon = DOCK_ICONS[item.icon]   // 字符串 → 组件
    return {
      id: item.id,
      label: item.label,
      icon: <Icon className="size-5" aria-hidden />,
      onSelect: () => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }),
    }
  })
  return <FloatingDock items={dockItems} label="展示页导航" />
}
```

### 参数

`FloatingDock`

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `FloatingDockItem[]` | 必填 | 导航项 |
| `label` | `string` | `'页面导航'` | `<nav>` 的无障碍标签 |
| `className` | `string` | — | 追加类名 |

`FloatingDockItem`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 稳定标识，同时用作锚点目标 |
| `label` | `string` | 是 | 无障碍标签与悬浮提示文本 |
| `icon` | `React.ReactNode` | 是 | 建议 20px |
| `onSelect` | `() => void` | 是 | 点击行为 |
| `active` | `boolean` | 否 | 当前区域，渲染为 `aria-current="true"` |

### 交互模型

鼠标 X 换算成与各按钮中心的距离，在 `[-120, 0, 120]` 上映射到 `[40, 76, 40]` 像素，用 `SPRING.dock`（stiffness 150 / damping 12 / mass 0.1）平滑。

**布局开销**：按钮宽高是真实布局尺寸，放大会推开相邻按钮而非压盖，因此 Dock 宽度会实时变化并触发内部重排。影响范围仅限 Dock 内部；外壳始终居中，验收脚本已校验静止与放大状态下中心漂移 < 1px。

**底部留白**：使用方**必须**在页面底部预留空间，否则内容会被遮挡：

```tsx
<main className="pb-[calc(var(--dock-height)+var(--space-24))]">
```

### 依赖

- `lucide-react`（图标由调用方提供）
- `motion/react`
- `../motion/motion`、`../motion/utils`
- `packages/ui/src/styles/tokens.css`、`globals.css`（`.glass` 工具类来自 globals）

### 键盘与可访问性

- 使用 `<nav>` + `<button>`，每个按钮有 `aria-label`。
- 键盘焦点时显示文字标签，**信息不只交给鼠标**。
- `:focus-visible` 显示焦点环，实测 outline 宽度 3px。
- 当前项标记 `aria-current="true"`。

### 复制到其他项目需一起复制

```
src/components/FloatingDock.tsx
packages/ui/src/motion/motion.ts
packages/ui/src/motion/utils.ts
packages/ui/src/motion/ssr.ts
src/styles/tokens.css
src/styles/globals.css
```

### 适用边界

- **触屏与窄屏（< 768px）自动切换为固定 44px 导航**，不模拟 hover 放大。
- `prefers-reduced-motion` 下不做尺寸动画，尺寸恒定 40px。
- **第一版不实现自由拖拽、位置持久化、分组菜单**，需要时请自行扩展。
- 项目不适合直接使用（单页应用内嵌第三方 iframe）。

---

## Toast

文件：`packages/ui/src/components/Toast.tsx`

四种状态的浮层通知，带倒计时与暂停。

### 用途

操作结果反馈。状态**不依赖颜色单独传达**——每种状态有不同形状的图标。

### 最小使用示例

```tsx
// 独立 React 工程
import { useState } from 'react'
import { ToastViewport, TOAST_DEFAULT_DURATION, type ToastData } from '@dusk-ui/ui'

type Item = ToastData & { id: string }

export function Demo() {
  const [toasts, setToasts] = useState<Item[]>([])
  const [showCountdown, setShowCountdown] = useState(true)

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <>
      <button
        onClick={() =>
          setToasts((p) => [
            ...p,
            {
              id: String(Date.now()),
              tone: 'success',
              title: '已保存',
              // 显式传入时长；省略则用 TOAST_DEFAULT_DURATION
              duration: TOAST_DEFAULT_DURATION,
              showCountdown,
            },
          ])
        }
      >
        触发通知
      </button>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
```

```astro
<!-- Astro：触发按钮与 Host 必须在同一个岛内 -->
---
import {
  DEMO_TOASTS,
  DEMO_TOAST_DURATION,
  DEMO_COUNTDOWN_DEFAULT,
  ToastsIsland,
} from '@dusk-ui/ui/demo'
---

<ToastsIsland
  client:idle
  copy={DEMO_TOASTS}
  duration={DEMO_TOAST_DURATION}
  countdownDefault={DEMO_COUNTDOWN_DEFAULT}
/>
```

> **为什么必须同岛**：`ToastsIsland` 内部同时渲染倒计时开关、四个触发按钮和 `ToastViewport`，`toasts` 与 `countdown` 状态由这一个组件持有。若拆成多个岛，它们不共享 React Context，Host 读不到按钮写入的状态。
>
> 用 `client:idle` 而非 `client:load`：通知不是首屏关键交互，等主线程空闲再 hydrate 即可。
>
> `duration` 与 `countdownDefault` 都是数字/布尔，**可序列化，因此能从 `.astro` 传入**。

### 参数

`Toast`（一般不直接用，由 `ToastViewport` 渲染）

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `'success' \| 'warning' \| 'danger' \| 'info'` | 必填 | 状态 |
| `title` | `string` | 必填 | 标题 |
| `description` | `string` | — | 说明文字 |
| `duration` | `number` | `TOAST_DEFAULT_DURATION`（5000） | 自动关闭毫秒数，`<= 0` 表示不自动关闭 |
| `showCountdown` | `boolean` | 跟随 `duration > 0` | 是否显示倒计时进度条，见下 |
| `onClose` | `() => void` | 必填 | 关闭回调 |

`ToastsIsland`（Astro / React 展示页用）

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `copy` | `Record<ToastTone, DemoToastCopy>` | 必填 | 四种状态的文案 |
| `duration` | `number` | 由 `<Toast>` 兜底 | 自动关闭时长，转交给每条通知 |
| `countdownDefault` | `boolean` | `true` | 倒计时开关的初始状态 |

### 倒计时：开关与时长

**时长是外部传入的参数，不是写死的。**

参数来源链条，只有一个默认值定义处：

```
Toast.tsx 导出 TOAST_DEFAULT_DURATION = 5000   ← 唯一的默认值定义
   ↓ 不传时兜底
demo/data.ts 的 DEMO_TOAST_DURATION           ← 演示值，直接取用上面的常量
   ↓ 页面显式传入
<ToastsIsland duration={DEMO_TOAST_DURATION}>  ← Astro 可序列化传入
   ↓ 写入每条通知数据
<Toast duration={...}>
```

- **默认值处理**：只有 `<Toast>` 有默认值（`TOAST_DEFAULT_DURATION`）。`ToastsIsland` **不重复写默认值**，`duration` 为 `undefined` 时直接透传，由组件兜底 —— 避免两处数字各自漂移。
- **想改时长**：改 `demo/data.ts` 的 `DEMO_TOAST_DURATION` 会同时影响两个展示工程；调用方传别的数字即可覆盖。

### `showCountdown` 的语义

| `duration` | `showCountdown` | 进度条 | 自动关闭 |
| --- | --- | --- | --- |
| `> 0` | 不传 | 显示 | 是 |
| `> 0` | `false` | **不显示** | **仍然自动关闭** |
| `> 0` | `true` | 显示 | 是 |
| `<= 0` | 不传 / `true` | **不显示** | 否 |
| `<= 0` | `false` | 不显示 | 否 |

要点：

- 开关**只控制显示，不改计时**。关掉进度条后通知照常按时关闭。
- `duration <= 0` 时即使传 `showCountdown: true` **也不会画进度条** —— 没有计时器却画一根不会走的进度条会误导用户。
- 展示页的开关**统一作用于四种状态**，不区分类型。

> **实现约束（回归防线）**：进度条颜色是 `TONE[tone].barClassName` 里的**完整字面量类名**（`bg-success` 等），不能由 `iconClassName` 拼接得出。
>
> 曾经这里写成 `iconClassName.replace('text-', 'bg-')`，Tailwind 静态扫描不到运行时拼出的类名，`bg-success` / `bg-warning` / `bg-info` 从未被生成，**三条进度条背景色退化为透明** —— 元素和宽度动画都在，只是肉眼看不见。`Toast.test.tsx` 已加断言，校验四种状态各自带不同的 `bg-*` 字面量类。

`ToastViewport`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `toasts` | `Array<ToastData & { id: string }>` | 通知列表 |
| `onDismiss` | `(id: string) => void` | 关闭回调 |

### 倒计时行为

- 进度条按剩余比例线性递减。
- **鼠标悬停或键盘焦点进入容器时暂停**，视觉进度同步冻结。
- 移出后**从剩余时间继续**，而不是重新计时。

此行为有测试覆盖：`packages/ui/src/components/Toast.test.tsx` 验证递减、暂停冻结、恢复续算、结束关闭四条路径。

### 依赖

- `lucide-react`（四个状态图标内置于组件）
- `motion/react`
- `../motion/motion`、`../motion/utils`
- `packages/ui/src/styles/tokens.css`、`globals.css`

### 键盘与可访问性

| 状态 | `role` | `aria-live` |
| --- | --- | --- |
| danger | `alert` | `assertive` |
| success / warning / info | `status` | `polite` |

- 标题内含 `sr-only` 状态前缀（如「警告：」），屏幕阅读器可读出状态。
- 关闭按钮有 `aria-label="关闭通知"`。
- 焦点进入容器会暂停倒计时，用户可安心阅读或操作。
- 容器本身设 `aria-live="off"`，避免与内部通知重复播报。

### 复制到其他项目需一起复制

```
src/components/Toast.tsx
src/components/Toast.test.tsx   # 可选，但建议保留计时回归测试
packages/ui/src/motion/motion.ts
packages/ui/src/motion/utils.ts
packages/ui/src/motion/ssr.ts
src/styles/tokens.css
src/styles/globals.css
```

### 适用边界

- 适合短反馈（数秒内读完）。长内容请用 Dialog。
- **同一时刻建议不超过 3 条**，更多会堆叠遮挡内容。
- 不支持点击整条通知跳转，也不支持进度条拖拽。

---

## Dialog

文件：`packages/ui/src/components/Dialog.tsx`

模态弹窗。焦点管理、Esc、焦点恢复全部交给 Radix。

### 用途

需要用户确认或阅读一段有限内容的场景。

### 最小使用示例

```tsx
// 独立 React 工程
import { useState } from 'react'
import { Button, Dialog } from '@dusk-ui/ui'

export function Demo() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        打开弹窗
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="确认本次操作？"
        description="此操作不会影响其他数据。"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              确认
            </Button>
          </>
        }
      >
        <p>弹窗内容区可以滚动，标题与操作区保持固定。</p>
      </Dialog>
    </>
  )
}
```

```astro
<!-- Astro：触发按钮与弹窗必须在同一个岛内 -->
---
import { DEMO_DIALOG_PARAGRAPHS, DialogIsland } from '@dusk-ui/ui/demo'
---

<DialogIsland
  client:idle
  paragraphs={DEMO_DIALOG_PARAGRAPHS}
  confirmNote="确认后此处显示操作已确认（演示状态）。"
/>
```

> `onOpenChange`、`footer` 都是函数或含函数的 React 节点，**不能从 `.astro` 传入**。包装层把可序列化的 `paragraphs: string[]` 收进来，在岛内部自行组织触发按钮、操作区与开关状态。

### 参数

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | 必填 | 受控开关 |
| `onOpenChange` | `(open: boolean) => void` | 必填 | 开关变化回调 |
| `title` | `string` | 必填 | 标题，自动关联 `aria-labelledby` |
| `description` | `string` | — | 说明，自动关联 `aria-describedby` |
| `children` | `React.ReactNode` | — | 内容区，可滚动 |
| `footer` | `React.ReactNode` | — | 底部操作区 |
| `maxWidth` | `number` | `440` | 最大宽度（px） |

### 布局约束

- 宽度为 `calc(100vw - 2rem)`，**窄屏不溢出**（实测 390px 下左右边界均在视口内）。
- 内容区 `max-height: min(50vh, 320px)` 并可滚动，**长内容撑破不了视口**。
- 两层结构：外层负责固定定位与居中（CSS），内层只做 `opacity` / `scale`，避免 Motion 的 transform 与 Tailwind 的 `-translate-x-1/2` 互相覆盖导致错位。
- 不使用全局 `overflow: hidden`，不会裁掉阴影与焦点环。

### 依赖

- **`@radix-ui/react-dialog`** — 焦点陷阱、Esc、`aria-modal`、焦点恢复
- `lucide-react`（关闭图标）
- `motion/react`
- `../motion/motion`、`../motion/utils`
- `packages/ui/src/styles/tokens.css`、`globals.css`

### 键盘与可访问性

由 Radix Dialog 提供，已实测通过：

- 打开时焦点自动进入弹窗内。
- `Esc` 关闭弹窗。
- 关闭后焦点**回到触发按钮**。
- `aria-modal` 与标题语义正确。

### 复制到其他项目需一起复制

```
src/components/Dialog.tsx
packages/ui/src/motion/motion.ts
packages/ui/src/motion/utils.ts
packages/ui/src/motion/ssr.ts
src/styles/tokens.css
src/styles/globals.css
```

以及依赖 `@radix-ui/react-dialog`。

### 适用边界

- 只支持**单个**模态。嵌套弹窗请改为分步流程。
- 不支持侧滑抽屉、表单校验集成、多步向导。
- 不适合承载长列表或需要滚动定位的内容。

---

## SegmentedTabs

文件：`packages/ui/src/components/SegmentedTabs.tsx`

胶囊式选项卡。选中指示器是同一块表面在选项间移动。

### 用途

在 2～5 个互斥视图之间切换。

### 最小使用示例

```tsx
import { useState } from 'react'
import { SegmentedTabs, SegmentedTabPanel } from '@dusk-ui/ui'

const TABS = [
  { value: 'overview', label: '概览' },
  { value: 'detail', label: '详情' },
] as const

type TabValue = (typeof TABS)[number]['value']

export function Demo() {
  const [tab, setTab] = useState<TabValue>('overview')

  return (
    <>
      <SegmentedTabs
        items={TABS.map((t) => ({ value: t.value, label: t.label }))}
        value={tab}
        onValueChange={setTab}
        label="视图切换"
      />

      <SegmentedTabPanel value="overview">概览内容</SegmentedTabPanel>
    </>
  )
}
```

```astro
<!-- Astro：Tabs 与其面板必须在同一个岛内 -->
---
import { DEMO_TABS, SegmentedTabsIsland } from '@dusk-ui/ui/demo'
---

<SegmentedTabsIsland client:visible tabs={DEMO_TABS} />
```

> **面板必须与 Tabs 同岛。** `value` 是选中状态，若面板在另一个岛，它无法得知当前选中项。包装层同时渲染 `SegmentedTabs` 与三个 `SegmentedTabPanel`，状态由这一个组件持有。
>
> 面板内容在包装层内部写定（而不是从 `.astro` 传入），因为 `children` 属于不可序列化的 React 节点。若面板内容需要来自 Astro，应改为传字符串或数据数组，由包装层渲染。

### 参数

`SegmentedTabs`

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `Array<{ value: T; label: string }>` | 必填 | 选项定义 |
| `value` | `T` | 必填 | 当前选中值 |
| `onValueChange` | `(value: T) => void` | 必填 | 选中变化回调 |
| `label` | `string` | 必填 | `<div role="tablist">` 的无障碍标签 |
| `className` | `string` | — | 追加类名 |

`SegmentedTabPanel`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `string` | 与对应选项的 `value` 一致，用于关联 `aria-labelledby` |
| `children` | `React.ReactNode` | 面板内容 |

> **要点**：每个 `SegmentedTabPanel` 的 `value` 必须与对应选项的 `value` 相同，否则 `aria-labelledby` 关联会断开。

### 液态交互

指示器使用 Motion `layoutId="dusk-segmented-indicator"`，因此：

- 快速连续点击时从**当前实际位置**继续过渡，不跳回起点。
- **文字不参与缩放**，切换时始终清晰。

### 依赖

- `motion/react`
- `../motion/motion`、`../motion/utils`
- `packages/ui/src/styles/tokens.css`、`globals.css`

### 键盘与可访问性

- `role="tablist"` / `role="tab"` / `role="tabpanel"`，遵循 WAI-ARIA Tabs 模式。
- **自动激活**：方向键切换即改变选中项。
- `ArrowRight` / `ArrowDown` 下一项，`ArrowLeft` / `ArrowUp` 上一项，首尾循环。
- `Home` 跳到首项，`End` 跳到末项。
- 焦点跟随选中项，键盘用户不会失去位置感。
- 切换基准取**当前聚焦的 tab**而非选中值，避免焦点与选中态短暂不同步时方向算错。

### 复制到其他项目需一起复制

```
src/components/SegmentedTabs.tsx
packages/ui/src/motion/motion.ts
packages/ui/src/motion/utils.ts
packages/ui/src/motion/ssr.ts
src/styles/tokens.css
src/styles/globals.css
```

### 适用边界

- 选项数量建议 2～5 个。超过 5 个请改用下拉选择。
- 选项文字过长会导致指示器宽度差异过大，移动效果变差，建议控制在 6 个字符内。
- 不支持图标+ 文字混排的复杂项，也不支持禁用单项。
- 采用自动激活模式，**不适合**需要「确认后才切换」的场景。