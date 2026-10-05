# Dusk UI — Agent 使用指南

本文件供**在其他项目中复用 Dusk UI 风格**的 AI 编程助手阅读。目标是让界面在不了解本仓库历史的前提下，也能产出与 Dusk UI 一致的结果。

---

## 1. 开始实现前必须阅读

按顺序读完这四个文件再动手。**不要跳过直接写代码。**

| 顺序 | 文件 | 读什么 |
| --- | --- | --- |
| 1 | `docs/DESIGN.md` | 颜色、材质、圆角、间距、排版、状态与禁止做法 |
| 2 | `docs/MOTION.md` | 时长档位、弹簧参数、液态交互规则、减弱动画行为 |
| 3 | `src/styles/tokens.css` | 实际取值。**设计文档说「什么规则」，令牌说「具体数值」** |
| 4 | `docs/COMPONENTS.md` | 五个组件的真实接口与适用边界 |

需要复用组件源码时，再读对应组件的 `src/components/*.tsx` 确认接口。

### 只读规则章节，不读规则就开始编码，是本仓库最常见的失败原因。

---

## 2. 应用到新页面

### 2.0 先判断项目类型

| 项目情况 | 做法 |
| --- | --- |
| **Astro 项目** | **优先路径**。静态内容用 `.astro`，交互组件用共享 React 实现 + Islands |
| React 项目 | 直接用 `packages/ui` 的组件与样式 |
| Vue / Svelte / Solid | **只复用设计规则**：令牌数值、材质分层、圆角层级、动效参数。自行用对应框架语法实现，**不要为了风格引入 React** |
| 无原子化 CSS | 写一个包含全部令牌的自定义属性文件，用语义 class 引用 |

### 2.0.1 Astro 项目的组织规则

**这是主要使用场景，规则优先级最高。**

1. **页面结构用 `.astro`** —— 标题、介绍、说明文字、文档链接、静态内容全部由 Astro 输出。不要为了「统一」把静态内容写成 React 组件。
2. **只有交互组件才用 React** —— Dock、Toast、Dialog、Tabs、主题切换。
3. **按需 hydration，不要无差别`client:load`。**

   | 场景 | 指令 |
   | --- | --- |
   | 纯静态内容 | **不加指令** |
   | 首屏就要可用（如主题切换、Dock 导航） | `client:load` |
   | 次要交互（Toast、Dialog 触发器） | `client:idle` |
   | 滚动到可见才需要（统计卡片、Tabs） | `client:visible` |
   | 确实无法服务端渲染 | `client:only="react"` —— **最后手段，必须注释具体原因** |

4. **Islands 不共享 React Context。** 不要指望把 Provider 放在某个岛里让其他岛读到。
5. **按交互关系划分岛，不是按组件边界。** 触发按钮与对应的 Host 必须同岛：

   ```astro
   <!-- ✅ 正确：按钮与 Host 在同一个岛，状态可共享 -->
   <ToastsIsland client:idle copy={DEMO_TOASTS} />

   <!-- ❌ 错误：分开成两个岛，触发按钮写的状态 Host 读不到 -->
   <ToastTrigger client:idle onFire={...} />
   <ToastHost client:idle />
   ```

6. **props 必须可序列化。** 只能传字符串、数字、布尔、数组、普通对象。**不能传函数或组件。**
   - 需要图标：传**图标名字符串**，由React 包装层映射为组件。
   - 需要跳转：传 `href`，包装层在客户端自行处理滚动。
7. **不要为跨岛共享状态引入 Redux、事件总线或状态框架。** 跨区域导航用原生锚点。

**组件样式已由 `@source` 处理**，无需为组件单独引入 CSS；若你把组件复制到其他目录，必须同步更新 `@source`。

### 2.1 搭好令牌层

把 `packages/ui/src/styles/tokens.css` 与 `globals.css` 复制到目标项目，或直接引用 `@dusk-ui/ui/styles.css`。

`globals.css` 里的 `@source '../components'`、`@source '../demo'` 声明了 Tailwind 的扫描范围。**路径变了就必须同步改**，否则语义工具类不会生成，页面会完全失去样式（构建不会报错，但样式全无）。

### 2.2 先判断表面角色

对每一个要写的容器，先回答一个问题：**它会浮在页面内容之上吗？**

| 答案 | 用什么 |
| --- | --- |
| 否 —— 正文、表单、卡片 | 内容表面：`bg-surface-1` + `border border-border`，**不加 backdrop-filter** |
| 是 —— Dock、Toast、悬浮标签 | 玻璃表面：`glass` 工具类 |
| 是 —— 弹窗 | 玻璃表面（强）：`glass-strong` + 背景隔离遮罩 |

这是 Dusk UI 最容易被误用的一点：**毛玻璃只用于悬浮控件**。给每张卡片加毛玻璃会立刻破坏可读性与性能。

### 2.3 只用语义令牌

```tsx
// ✅ 正确
<div className="bg-surface-1 text-foreground border border-border rounded-card" />

// ❌ 错误
<div className="bg-white text-slate-900 border border-slate-200 rounded-[13px]" />
```

深色主题会自动生效，因为令牌在 `.dark` 下有对应覆盖。**不需要写任何 `dark:` 前缀的颜色类。**

### 2.4 补齐五个状态

每个交互元素都要有：**hover、focus-visible、active、disabled、loading**。

```tsx
// ✅ 状态来自令牌与约定
className="rounded-control transition-colors duration-[150ms]
           hover:bg-accent-subtle
           focus-visible:outline-2 focus-visible:outline-offset-2
           disabled:opacity-50 disabled:pointer-events-none"

// ❌ 自行发明
className="rounded-lg transition hover:bg-gray-100 focus:outline-none"
```

**永远不要写 `outline: none` 而不给替代样式。**

### 2.5 动效从常量取

从 `@dusk-ui/ui`（或 `packages/ui/src/motion/motion.ts`）导入，而非写裸数值：

```tsx
import { SPRING, DURATION, ENTER_INITIAL, staggerDelay } from '@dusk-ui/ui'

<motion.div
  initial={ENTER_INITIAL}          // { opacity: 0, y: 8 }
  animate={{ opacity: 1, y: 0 }}
  transition={SPRING.enter}
/>
```

必须用 `useReducedMotion()` 处理减弱动画：

```tsx
const reduceMotion = useReducedMotion()
<motion.div
  initial={reduceMotion ? false : ENTER_INITIAL}
  transition={reduceMotion ? { duration: 0 } : SPRING.enter}
/>
```

**减弱动画时仍要保留清楚的状态反馈**，只是取消位移与回弹。

---

## 3. 在现有项目中采用风格

### 采用风格 ≠ 更换技术栈

Dusk UI 的规则**不要求使用 React**。

| 目标项目情况 | 做法 |
| --- | --- |
| **Astro 项目** | **优先路径**。静态内容 `.astro`，交互组件用共享 React + Islands |
| 已是 React + Tailwind | 引用 `@dusk-ui/ui`，按需取组件。改动最小、收益最大 |
| 已是 React，CSS 方案不同 | 把令牌转成该方案的变量或主题配置，**保留令牌名与取值**。组件按需改写 |
| Vue / Svelte / Solid | **只复用设计规则**：令牌数值、材质分层、圆角层级、动效参数。自行用对应框架语法实现，不要为了风格引入 React |
| 无原子化 CSS | 写一个包含全部令牌的自定义属性文件，用语义 class 引用。视觉规范照样成立 |
| 纯后端 / CLI / 数据脚本 | 无需改动 |

### 迁移时不要做的事

- ❌ 不要借「统一风格」之名重写业务逻辑或组件结构。
- ❌ 不要一次性给整个项目换配色。先在一个页面验证，再推广。
- ❌ 不要为了让风格一致而改变信息架构或交互流程。
- ❌ 不要在旧项目里强行引入 Tailwind，只为了用上 `tokens.css` 的 `@theme` 段。
- ❌ **不要为了套用设计风格而擅自更换业务框架。** 目标项目是 Astro 就继续用 Astro，是 Vue 就继续用 Vue。
- ❌ 不要在 Astro 项目里为 Dock / Toast / Dialog / Tabs 重新实现一套原生 Astro 版本 —— 直接复用 React 实现。
- ❌ **不要运行时拼接 Tailwind 类名**（`.replace('text-','bg-')`、`` `bg-${tone}` ``、`'bg-' + x`）。Tailwind 只静态扫描源码，拼出来的类名永远不会生成。症状极具欺骗性：**元素在、动画在、构建不报错，但样式全无**（曾因此让三条通知的进度条变成透明）。需要变体时用完整字面量的映射表。
- ❌ 不要让样式类名来自后端数据或用户输入 —— 同样不会被生成，且存在注入风险。
- ❌ 不要把组件源码复制到第二个地方。改组件就改 `packages/ui`，两个工程自动同步。

### 迁移时的最小动作

1. 引入 `tokens.css` 与 `globals.css`（或等价物）。
2. 把目标项目里最显眼的 3～5 个界面换成语义令牌类名。
3. 确认深浅主题切换正常、焦点环可见、对比度达标。
4. 其余界面按需逐步迁移。

---

## 4. 可复制的提示词模板

把下面整段交给另一个 Agent，它就能在**任意技术栈**的项目里产出符合 Dusk UI 的界面。

```markdown
请按以下设计规范实现界面。

【项目前提】
- 若项目是 Astro：静态内容用 .astro 输出，交互组件用 React Islands
- 若项目是其他框架：沿用项目现有框架，不要为了风格更换技术栈

【Astro 项目组织规则】
- 页面结构、标题、介绍、说明文字、静态内容全部由 .astro 输出
- 只有需要交互的区域才用 React 组件，并按需选择指令：
  · 首屏就要可用（主题切换、导航）→ client:load
  · 次要交互 → client:idle
  · 滚动到可见才需要 → client:visible
  · 纯静态内容 → 不加任何指令
- 不要把整页包装成单个 client:load 的 React App
- 不要默认使用 client:only="react" 绕过服务端渲染问题
- 不同 Islands 不共享 React Context，不要把 Provider 放在某个岛里
- 触发按钮与对应的 Host 必须放在同一个岛内
- 传给 Islands 的 props 必须可序列化：字符串、数字、布尔、数组、普通对象
  不要传事件函数、组件函数或其他不可序列化对象
- 需要图标时传图标名称字符串，由 React 包装层映射为组件
- 需要跳转时传 href，由包装层在客户端处理
- 跨区域导航用原生锚点，不要引入 Redux、事件总线等全局状态框架

【视觉方向】
简洁、轻盈、克制的工具型界面。低饱和灰阶底色，清晰的内容层级。
柔和圆角、细边框、适量阴影。彩色只用于状态、强调和必要的数据区分。
支持浅色与深色主题。

【颜色】
- 主色相 170（低饱和青绿）。不要因为叫「Dusk」就用紫色或日落渐变。
- 所有颜色用语义命名，不出现裸色号：
  surface-0/1/2/3（页面底/卡片/次级填充/强分隔）、
  foreground / foreground-secondary / foreground-muted、
  accent系列、border / border-subtle / border-strong、ring。
- 状态色四组：success(155) / warning(68) / danger(26) / info(235)，
  每组含base（图标与文字）、subtle（底色）、border 三档。
- 深色主题通过覆盖同名令牌实现，不写`dark:` 颜色前缀。
- 普通文本对比度以 WCAG AA 4.5:1 为目标。
- 状态不能只靠颜色区分，必须配图标或文字。

【排版】
- 只用系统字体栈，含中文回退（PingFang SC / Microsoft YaHei）。
  不请求 Google Fonts，不打包中文字体。
- 字阶：30 / 22 / 18 / 16 / 14 / 13 / 12 px。
- 字重只用 400 / 500 / 600，不用 700 以上。
- 行高：标题 1.25，正文 1.5，长段落 1.7。
- 数值类内容用等宽数字（tabular-nums），避免刷新时宽度抖动。

【圆角】统一层级，内层小于外层
- 12px 输入框与常规按钮
- 16px 通知与小型浮层
- 20px 卡片
- 24px 弹窗与 Dock 外壳
- 999px 标签与胶囊控件
嵌套时留足内边距（卡片 20px）。焦点环不得被容器裁切，
不使用会切掉阴影或弹出内容的全局 overflow: hidden。

【材质】分三种表面角色，先判断再套用
- 内容表面（正文、表单、卡片）：实色，靠明度与边框分层，不用毛玻璃
- 玻璃表面（Dock、Toast、悬浮标签）：半透明 + backdrop-filter
  + 细边框 + 轻微内侧高光 + 柔和投影
- 遮罩与弹窗：遮罩只隔离背景，弹窗主体接近不透明
没有背景可透出时不要加模糊。不要在每张卡片上叠加毛玻璃。
不支持 backdrop-filter 时回退为实色。

【间距与布局】
- 4px 为主要步进，所有间距集中定义，不在组件里写裸像素值
- 页面最大内容宽度 1280px；桌面边距 24px，移动端 16px
- 交互目标不小于 40px，移动端主要操作 44px
- 图标 16 / 18 / 20px；只有图标的按钮必须有 aria-label
- 悬浮元素遮挡正文时，底部留白必须由实际高度推导，不写任意数值

【交互状态】
hover、focus-visible、active、disabled、loading 五态齐全。
焦点样式只在键盘导航时出现（:focus-visible），
绝不用 outline: none 一刀切。

【动效】
- 时长：状态反馈 150ms、弹窗进退场 200ms、内容入场 300ms、列表错峰 50ms
- 弹簧按角色区分：指示器移动 stiffness 420 / damping 34（短促无回弹）；
  入场 320 / 28；弹窗缩放 380 / 30（仅 0.97 幅度）；按钮按下 500 / 26
- 位移幅度一律小：入场上移 8px，弹窗缩放 0.97，按下 0.98
- 优先动画 opacity 与 transform
- 选中指示器用共享 layoutId 在选项间平滑移动，文字不参与缩放
- prefers-reduced-motion 下取消位移、缩放、回弹，
  但必须保留清楚的状态反馈

【明确禁止】
- 写裸色号、裸圆角像素值、裸毫秒数
- 给卡片、按钮、整页背景加毛玻璃
- 状态只用颜色表达
- 大面积渐变背景、营销式 Hero、装饰插画
- 大面积循环漂浮动画、夸张回弹、持续动画模糊
- 为「方便以后扩展」增加未使用的配置项

【交付前自查】
- 深浅主题都清楚、克制？
- 所有文本对比度达到 4.5:1？
- 焦点环在每个可交互元素上都可见？
- 快速连续操作是否产生错位、闪烁或文字拉伸？
- 关闭动画与玻璃效果后，界面是否仍完整可用？
```

---

## 5. 完成前检查清单

逐项确认后再交付。**任何一项未验证，不要声称已通过。**

### 颜色与主题

- [ ] 全项目无裸色号，颜色全部走语义令牌
- [ ] 若用 Tailwind：构建产物的 CSS 里确实有 `bg-surface-1` 等语义类（用 `@source` 声明扫描范围）
- [ ] **没有任何 Tailwind 类名由运行时拼接产生**（`.replace()`、模板字符串、`'bg-' + x`）
- [ ] 每个用到的语义色类都在源码里以**完整字面量**出现（如 `'bg-success'`）
- [ ] 深色主题通过覆盖同名令牌实现，不是用 `dark:` 类名逐个硬写
- [ ] 深浅两套主题下所有文字都清楚，无低对比度残留
- [ ] 状态色在两种主题下都做过检查（深色需提亮，不能简单反转）

### 排版

- [ ] 字体栈含中文回退，无运行时字体网络请求
- [ ] 字重不超过 600
- [ ] 数值类内容启用等宽数字

### 圆角与材质

- [ ] 圆角取自 12 / 16 / 20 / 24 / 999 这套层级，无散落的任意值
- [ ] 嵌套圆角遵循「内小于外」，内边距充足
- [ ] 每个容器都判断过表面角色；卡片上没有误用毛玻璃
- [ ] 玻璃表面下方确实有背景可透出（纯色背景上不算）
- [ ] 无会裁掉阴影、焦点环或弹出内容的 `overflow: hidden`

### 交互与可访问性

- [ ] hover / focus-visible / active / disabled / loading 五态齐全
- [ ] 焦点环在所有可交互元素上可见，且不被裁切
- [ ] 焦点环只在键盘导航时出现
- [ ] 图标按钮有 `aria-label`
- [ ] 状态信息有颜色以外的通道（图标或文字）
- [ ] 弹窗焦点管理正确：进入、Esc 关闭、焦点返回触发元素
- [ ] 移动端主要操作不小于 44px
- [ ] 390px 宽度下无横向溢出，弹窗不溢出视口
- [ ] 浮动的 Dock、通知不会遮挡正文内容

### 动效

- [ ] 时长与弹簧参数来自共用常量，组件内无裸数值
- [ ] `prefers-reduced-motion` 已处理：取消位移、缩放、回弹
- [ ] 减弱动画下**状态反馈依然清楚**（当前选中项、加载态、通知类型可辨）
- [ ] 快速连续操作不产生错位、闪烁或文字拉伸
- [ ] 关闭动画有明确终点，不拖泥带水
- [ ] 无大面积循环漂浮、持续动画模糊、夸张回弹

### 工程

- [ ] 类型检查通过
- [ ] 生产构建通过
- [ ] 文档示例与实际导出的组件接口一致（不是伪 API）
- [ ] 改动范围限于任务涉及的界面，未顺手重构无关代码
- [ ] **没有修改任何业务逻辑**
- [ ] 没有为了风格统一而更换技术栈
- [ ] 组件源码只有一份，没有复制到第二个位置

### Astro（使用 Astro 工程时必查）

- [ ] 静态内容由 `.astro` 输出，**未附加** `client:*` 指令
- [ ] 只有交互组件使用了 React Islands
- [ ] `client:*` 指令按需选择，没有无差别 `client:load`
- [ ] **未使用 `client:only`**（若使用了，代码中有注释说明具体原因）
- [ ] 触发按钮与对应 Host 在**同一个岛**内
- [ ] 传给岛的 props **全部可序列化**，没有函数或组件
- [ ] 图标以**名称字符串**传入，由 React 侧映射
- [ ] 跨区域导航用原生锚点，未引入全局状态框架
- [ ] **控制台无 hydration 警告**（dev 与生产构建都要看）
- [ ] 主题首屏脚本已放入，且刷新后主题保持
- [ ] 产物的 CSS 包含共享组件所需的类（`bg-surface-1` 等）

### SSR 安全（组件作者必查）

- [ ] 模块顶层与首次渲染**不访问** `window` / `document` / `localStorage`
- [ ] DOM 测量、浏览器存储、事件监听都在 effect 或事件处理器内
- [ ] 首次挂载**不施加入场动画**（否则服务端与客户端首帧不一致）
- [ ] 不使用随机数或当前时间生成不稳定的首屏结构
- [ ] 事件监听、计时器、动画都有清理

---

## 6. 边界声明

请如实告知使用者：

- Dusk UI 当前**不是 npm 包**，没有 `npm install dusk-ui`。复用方式是「阅读规范 + 复制源码」。
- 采用 **PolyForm Noncommercial License 1.0.0**：允许个人使用、免费分享与修改，**禁止任何商业用途与付费性质的二次分发**。使用方**必须**传递许可证并保留署名。
  - **这不是 OSI 开源许可证**，应表述为「source-available（源码可见）」，不得称为「开源」。
  - 如果当前项目或使用方有任何商业属性，**必须在使用前确认**是否需要另行取得作者书面授权。
- 第一版**没有** Storybook、主题编辑器、组件生成 CLI、多框架适配、组件市场。
- 性能方面：本仓库**未做** 60fps 测量或低端设备优化验证，不应声称已达标。已知开销见 `MOTION.md` 第 8 节。