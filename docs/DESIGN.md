# Dusk UI — 视觉与交互规范

本文件是Dusk UI 视觉决策的唯一说明来源。实现界面时**只允许引用本文档与 `src/styles/tokens.css` 中定义的规则**，不要引入本文档没有的取值。

---

## 1. 设计来源与融合方式

本节严格区分三类信息：**观察事实**（在参考站点实际看到或读到源码确认）、**借鉴**（来自其他参考项目的思路）、**设计提案**（本次为工具界面新定的规则）。

### 1.1 观察事实：来自 blog.mcxiaochen.top

Dusk UI 的色彩基调来自作者本人的博客站点。核实方式与结论：

| 观察项 | 结论 | 核实依据 |
| --- | --- | --- |
| 主色相 | **170（青绿）**，低饱和 | 站点同源主题源码 `tokens.css` 中明确记载「对照源站 blog.mcxiaochen.top 的 `oklch(.97 .005 170)`」 |
| 表面色 | 浅色底带极低色相偏移，不是纯白 | 同上，`--surface-0: oklch(0.965 0.008 170)` 量级 |
| 强调色饱和度上限 | Chroma 不超过约 0.18 | 同上，`--accent: oklch(0.55 0.16 var(--hue))` |
| 材质 | 已存在毛玻璃体系：半透明底+ 边框 + 内侧高光 + 柔和投影 | 同上 `glass.css`：`blur() saturate()` + `inset 0 0.5px 0` 高光 |
| 阴影 | 四级 elevation，靠不透明度递增 | 同上 `--shadow-sm/md/lg/xl` |
| 圆角 | 已成体系，小控件到面板递进 | 同上 `--radius-sm/md/lg/xl` |
| 连续曲率 | 已用 `corner-shape: squircle` 做渐进增强，保留 `border-radius` 回退 | 同上 `base.css` 中的 `@supports (corner-shape: squircle)` |

**关键澄清**：博客名为「Dusk」，但其实际配色**不是紫色、蓝紫渐变或日落色**，而是色相 170 的青绿。Dusk UI 沿用这一事实，不因品牌名而强行改成暖色。

### 1.2 借鉴：来自其他参考项目

| 来源 | 借鉴内容 | 边界 |
| --- | --- | --- |
| shadcn/ui（MIT） | 「表面token + `-foreground` 配对」的语义命名约定；深色通过 `.dark` 覆盖同名token | 仅借鉴命名与结构思路，未复制其组件源码 |
| Aceternity UI（**无 LICENSE**） | Floating Dock 的「鼠标距离→ 尺寸连续映射 + 弹簧平滑」交互模型 | **许可无法确认，因此独立实现**，未复制任何源码 |
| Animate UI（MIT + Commons Clause） | 弹簧按组件角色分级配置；指示器用 `layoutId` 在选项间连续移动 | **含附加限制条款，因此独立实现**，仅参考参数设计思路 |
| linux-do/cdk（MIT） | 工具型界面的信息密度与区块划分 | 仅参考布局，未取用代码 |
| workbuddy-manager（许可未声明） | 管理台的信息组织方式 |仅参考布局思路 |

### 1.3 设计提案：为工具界面新定的规则

以下内容博客中没有，为本次新增，**属于 Dusk UI 的设计决定而非对博客的描述**：

- **信息密度**：博客面向阅读，工具界面面向操作，因此正文默认降到 14px，标签降到 12px。
- **交互目标下限**：常规 40px，移动端主要操作 44px。博客无此约束。
- **页面最大宽度 1280px**：博客正文宽度为 800px 左右，工具界面需要更宽的横向空间来并排展示指标。
- **语义状态色**：success / warning / danger / info 四色。博客仅有 danger / success / warning 三色且只用于内联提示，Dusk UI 将其扩展为完整状态体系并补齐 info。
- **三类表面角色的明确划分**：博客的玻璃只用于导航与悬浮件；Dusk UI 把这条规则写成可执行的判定标准（见第 4 节）。

---

## 2. 颜色

全部定义在 `src/styles/tokens.css`。**组件只引用语义令牌，禁止写裸色号。**

### 2.1 表面与文字

| 语义令牌 | 用途 | 浅色 | 深色 |
| --- | --- | --- | --- |
| `--surface-0` | 页面底色 | `oklch(0.965 0.008 170)` | `oklch(0.155 0.012 170)` |
| `--surface-1` | 卡片、表单、统计卡片 | `oklch(0.995 0.004 170)` | `oklch(0.205 0.014 170)` |
| `--surface-2` | 次级填充（分段控件底、标签） | `oklch(0.945 0.012 170)` | `oklch(0.250 0.016 170)` |
| `--surface-3` | 更强分隔与hover 填充 | `oklch(0.905 0.014 170)` | `oklch(0.300 0.018 170)` |
| `--foreground` | 正文 | `oklch(0.205 0.018 170)` | `oklch(0.940 0.008 170)` |
| `--foreground-secondary` | 次要正文、说明 | `oklch(0.395 0.020 170)` | `oklch(0.775 0.014 170)` |
| `--foreground-muted` | 辅助文字、占位、标注 | `oklch(0.505 0.018 170)` | `oklch(0.640 0.014 170)` |
| `--foreground-inverse` | 深色底上的文字 | `oklch(0.985 0.004 170)` | `oklch(0.180 0.014 170)` |

### 2.2 强调色

| 令牌 | 用途 |
| --- | --- |
| `--accent` | 主按钮底色、当前选中态、图标强调 |
| `--accent-hover` | 主按钮 hover |
| `--accent-bright` | 需要在深色底上更亮的强调 |
| `--accent-foreground` | 强调色底之上的文字 |
| `--accent-subtle` | 选中项底、标签底等低强度强调面 |
| `--accent-subtle-hover` | 强调面 hover |

### 2.3 边框与焦点

| 令牌 | 用途 |
| --- | --- |
| `--border` | 常规边框、卡片边|
| `--border-subtle` | 弱分隔线（如卡片内的hr） |
| `--border-strong` | 需要强调的边界 |
| `--ring` | focus-visible 焦点环颜色 |
| `--ring-offset` | 焦点环与元素的间隔色 |

### 2.4 语义状态色

每种状态三档：`base`（图标与文字）、`subtle`（底色）、`border`（边框）。

| 状态 | 色相 | 典型用途 |
| --- | --- | --- |
| success | 155 | 成功、通过、健康 |
| warning | 68–78 | 警告、待处理、偏低 |
| danger | 26 | 错误、失败、破坏性操作 |
| info | 235 | 提示、中性信息 |

**约束**：状态**不得只靠颜色传达**。四种 Toast 各带不同形状的图标（对勾、三角、叉、圆点），危险操作额外用 `role="alert"` 播报。

### 2.5 对比度

- 普通文本对比度以 **WCAG AA 4.5:1** 为目标。
- 深色下的状态色需提亮（如 success 从`L=0.505` 提到 `L=0.760`），不能简单反转浅色取值。
- 玻璃表面上的文字必须落在「接近不透明」的底上（`--glass-bg-strong`），不允许正文直接压在高透玻璃上。

---

## 3. 排版

### 3.1 字体栈

只使用本机系统字体，**不请求 Google Fonts，不打包中文 web font**：

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
  'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
  'Source Han Sans SC', 'Noto Sans CJK SC', sans-serif;
--font-mono: ui-monospace, 'Cascadia Code', 'JetBrains Mono', Menlo,
  Consolas, 'Sarasa Mono SC', monospace;
```

### 3.2 字阶

| 令牌 | 字号 | 典型用途 |
| --- | --- | --- |
| `--text-2xl` | 30px | 页面主标题 |
| `--text-xl` | 22px | 区块标题 |
| `--text-lg` | 18px | 卡片标题、弹窗标题 |
| `--text-md` | 16px | 强调正文、按钮文字 |
| `--text-base` | 14px | 默认正文、导航项 |
| `--text-sm` | 13px | 次要说明 |
| `--text-xs` | 12px | 标签、辅助标注 |

### 3.3 行高、字重、字距

- 行高：`--leading-tight` 1.25（标题）、`--leading-normal` 1.5（正文）、`--leading-relaxed` 1.7（长段落）。
- 字重：正文 400，控件与强调 500，标题 600。**不使用 700 以上的粗体**，工具界面需要克制。
- 字距：标题用 `--tracking-tight`（-0.02em），正文 0，小标签用 `--tracking-wide`（0.04em）。

### 3.4 等宽数字

**统计数值必须使用等宽数字** `[font-variant-numeric: tabular-nums]`，否则数值刷新时宽度变化会造成抖动。

### 3.5 图标与文字搭配

- 图标尺寸：`--size-icon-sm` 16px、`--size-icon` 18px、`--size-icon-lg` 20px。
- 图标放在文字**左侧**，间距取`--space-1`～`--space-2`。
- 只有图标没有文字的按钮，必须提供 `aria-label`。
- 图标颜色跟随文字颜色或使用语义色，**不使用图标单独表达状态**。

---

## 4. 材质

### 4.1 三种表面角色

判定标准：**这个东西是否会浮在页面内容之上？**

**A. 内容表面** — 正文、表单、统计卡片、文章卡片
- 实色背景（`--surface-1`）
- 主要靠明度差与`--border` 区分层级
- **不使用 `backdrop-filter`**，保证阅读不受背景干扰

**B. 玻璃表面** — Dock、Toast、小型 Popover、悬浮标签
- 半透明背景 + 适量 `backdrop-filter`（模糊 + 饱和度提升）
- 一条细边框 + 轻微内侧高光 + 柔和投影
- 高光仅表达材质，**不形成明显发光描边**

**C. 遮罩与弹窗**
- 遮罩（`--overlay`）只负责隔离背景，不做模糊主体
- 弹窗主体使用**接近不透明**的玻璃（`--glass-bg-strong`），保证长文本可读
- **避免多个大面积 backdrop-filter 相互叠加**

### 4.2 玻璃参数

集中定义在令牌中，浅色与深色**分别调整**（深色不是简单反转：底色更暗、边框更亮、模糊略降）：

| 令牌 | 浅色 | 深色 |
| --- | --- | --- |
| `--glass-bg` | `oklch(0.985 0.006 170 / 0.62)` | `oklch(0.240 0.014 170 / 0.55)` |
| `--glass-bg-strong` | `oklch(0.990 0.005 170 / 0.88)` | `oklch(0.235 0.014 170 / 0.90)` |
| `--glass-border` | `oklch(0.860 0.012 170 / 0.55)` | `oklch(1 0 0 / 0.14)` |
| `--glass-highlight` | `inset 0 0.5px 0 oklch(1 0 0 / 0.65)` | `inset 0 0.5px 0 oklch(1 0 0 / 0.12)` |
| `--glass-blur` | 20px（移动端 12px） | 18px（移动端 12px） |
| `--glass-saturation` | 145% | 130% |

工具类：`.glass`（悬浮件）、`.glass-strong`（弹窗/大浮层）。

### 4.3 回退

- 不支持 `backdrop-filter` 时，用 `@supports not (...)` 回退为 `--surface-fallback` 实色。
- 用户设置 `prefers-reduced-transparency: reduce` 时同样给实色。
- **没有背景内容可以透出时，不强行增加模糊** —— 纯色背景上的玻璃等于只增加了合成开销。

### 4.4 性能约束

- 移动端把 `--glass-blur` 降到 12px，减少大面积模糊。
- **不持续动画** `blur`、`backdrop-filter` 或大范围阴影。
- **不给大量元素永久添加 `will-change`**。
- 不在每张卡片、每个按钮、整页背景上同时使用毛玻璃。

---

## 5. 圆角

### 5.1 层级

| 令牌 | 值 | 适用 |
| --- | --- | --- |
| `--radius-control` | 12px | 输入框、常规按钮、标签 |
| `--radius-float` | 16px | 通知 Toast、小型浮层、图标容器 |
| `--radius-card` | 20px | 卡片、统计卡片 |
| `--radius-dialog` | 24px | 弹窗 |
| `--radius-dock` | 24px | Dock 外壳 |
| `--radius-pill` | 999px | 分段控件、状态标签、胶囊 |

### 5.2 「平滑圆角」的实际含义

把圆角调大不等于平滑。必须满足：

1. **内外嵌套圆角协调**，留有足够内边距（卡片 padding 20px，Dock padding 8–12px）。
2. **内层圆角小于外层**，避免角部间距失衡。例：20px 圆角的卡片里放 16px 圆角的元素；24px 圆角的 Dock 外壳里放 16px 圆角的按钮。
3. 边框、背景、阴影、裁切范围保持一致。
4. **焦点环不得被圆角容器裁掉** —— 焦点样式使用 `outline`，不使用会被 `overflow` 截断的内阴影。
5. **不使用会切掉阴影、焦点或弹出内容的全局 `overflow: hidden`**。

### 5.3 连续曲率（渐进增强）

```css
@supports (corner-shape: squircle) {
  :where(*, *::before, *::after) {
    corner-shape: var(--corner-shape, var(--corner-shape-continuous));
  }
}
```

第一版以可靠的 CSS `border-radius` 为基础。`@supports` 保证不支持的引擎完全忽略本段并保留普通圆角回退。`:where()` 保持零特异性，组件可在局部设置 `--corner-shape: round` 显式退出连续曲率（默认取 `--corner-shape-continuous`）。

**不为追求数学上的连续曲率引入 Canvas、复杂 SVG 路径或额外依赖。**

### 5.4 何时退出连续曲率（`corner-round`）

squircle 是超椭圆，具备**四重对称**。用在胶囊与圆角矩形上更柔和，但用在「方形盒子 + 大圆角」上会画成**圆角方形而不是正圆**。最明显的破绽出现在旋转元素上：圆角方形转起来像「一个方块在转」，观感割裂。

判定规则一句话：**长宽近似相等的盒子 + 大圆角 = 本意是正圆，必须退出连续曲率。**

```css
@utility corner-round {
  --corner-shape: round;
}
```

| 场景 | 处理 |
| --- | --- |
| 圆形旋钮（Switch 滑块） | 加 `corner-round` |
| 圆形图标按钮（ThemeToggle 选项卡） | 加 `corner-round` |
| 加载指示器 | 用 SVG `<circle>` 绘制，天然不受影响 |
| 胶囊控件（长宽不等：标签、分段控件、开关轨道） | 保持 squircle |
| 圆角矩形（卡片、弹窗、输入框） | 保持 squircle |
| 装饰性色块 | 保持 squircle：形状不承载语义，柔和感正是设计意图 |

用 `@utility` 注册而非裸 CSS 类，因此可与 Tailwind 变体组合（`md:corner-round`）。

---

## 6. 间距与布局

### 6.1 间距步进

以 **4px** 为主要步进，全部令牌化：

`--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-5` 20px · `--space-6` 24px · `--space-8` 32px · `--space-10` 40px · `--space-12` 48px · `--space-16` 64px · `--space-24` 96px

**组件内不写裸像素间距**，需要新间距时先加令牌。

### 6.2 页面框架

| 项 | 值 |
| --- | --- |
| 页面最大内容宽度 | `--page-max-width` 1280px |
| 桌面边距 | `--space-6` 24px |
| 移动边距 | `--space-4` 16px |
| 区块纵向间距 | `--space-16` 64px |
| Dock 预留高度 | `--dock-height` 72px |

浮动元素（Dock、通知）遮挡正文时，页面底部留白**必须由 `--dock-height` 推导**，不写任意数值。

### 6.3 卡片

- 内边距：`--space-5` 20px（小卡片可用 `--space-4`）。
- 圆角：`--radius-card`。
- 背景：`--surface-1` + `border: 1px solid var(--border)`。
- 阴影：默认 `--shadow-xs`；hover 时可升至 `--shadow-sm`。
- 内部元素纵向间距：`--space-3`～`--space-4`。

### 6.4 表单

- 控件高度不低于 `--size-control` 40px，移动端 `--size-control-mobile` 44px。
- 标签与控件间距 `--space-2`；控件之间纵向间距 `--space-4`。
- 同行的按钮间距 `--space-2`。
- 校验错误信息用 `--danger`，且**同时给出文字说明**，不只改边框颜色。

### 6.5 操作区域

- 主要操作在右或视觉末位，次要操作在前。
- 危险操作与常规操作之间至少间隔 `--space-2`，视觉上不并排成同权重。
- 操作区与内容之间间隔 `--space-6`。

---

## 7. 交互状态

| 状态 | 表现 | 时长 |
| --- | --- | --- |
| hover | 背景或边框变化，不做位移 | 150ms |
| focus-visible | `outline: 2px solid var(--ring); outline-offset: 2px` | 即时 |
| active | 按下缩至 0.98 | 弹簧，见 MOTION.md |
| disabled | `opacity: 0.5` + `pointer-events: none` | — |
| loading | 保持原宽度，左侧显示旋转指示器，`aria-busy="true"` | 循环 |

**焦点样式只在键盘导航时出现**：`:focus-visible` 生效，`:focus:not(:focus-visible)` 清除 outline。绝不用 `outline: none` 一刀切。

### 加载态

Skeleton 尺寸必须与真实内容一致，否则切换时会跳动。加载与加载完成的切换使用淡入淡出，不使用翻转或位移。

---

## 8. 无障碍

- 普通文本对比度以 WCAG AA 4.5:1 为目标。
- 状态不只靠颜色区分，必须有图标或文字。
- 所有交互元素可键盘到达，焦点顺序与视觉顺序一致。
- 焦点环可见且不被裁切。
- 图标按钮提供 `aria-label`。
- 动态区域使用 `aria-live`：普通通知 `polite`，错误 `assertive`。
- `prefers-reduced-motion` 下取消位移、缩放、回弹，**保留即时状态切换**。

---

## 9. 推荐做法

1. 先在 `tokens.css` 找已有令牌，**找不到再新增**，新增时同步更新本文件。
2. 组件只引用语义令牌，不写裸色号、裸圆角、裸时长。
3. 新界面先判断每个元素属于哪种表面角色（内容/ 玻璃 / 遮罩），再决定样式。
4. 嵌套圆角遵循「内小于外」，并留足内边距。
5. 动画优先动`opacity` 和 `transform`。
6. 任何交互都要补齐 hover、focus-visible、active、disabled、loading 五态。
7. 状态信息同时提供颜色与非颜色通道。

## 10. 禁止做法

1. ❌ 直接写 `#hex`、`rgb()`、圆角像素值、毫秒数——绕过令牌体系。
2. ❌ 把"Dusk"当作必须用紫色、蓝紫渐变或日落配色的理由。
3. ❌ 在卡片、按钮、整页背景上叠加毛玻璃。
4. ❌ 用 `overflow: hidden` 裁掉阴影、焦点环或弹出内容。
5. ❌ 焦点样式用 `outline: none` 而不提供替代。
6. ❌ 状态只用颜色表达。
7. ❌ 在组件里写死间距数值，导致同一含义在不同组件有不同取值。
8. ❌ 大面积渐变背景、营销式 Hero、装饰性插画。
9. ❌ 引入运行时字体网络请求或大体积中文字体。
10. ❌ 为「方便以后扩展」而增加未使用的配置项与变体。