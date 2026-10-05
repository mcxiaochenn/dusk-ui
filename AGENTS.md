# AGENTS.md

Dusk UI 后续 Agent 的入口。**改动前先读完本文件。**

---

## 工程结构

```
packages/ui/     唯一的组件与样式来源（private，不发布 npm）
apps/react/      独立 React 展示工程（Vite，端口 5181）
apps/astro/      Astro 展示工程（端口 5182）
docs/            共用规范文档
```

用 **npm workspaces**，根目录只有一个 `package-lock.json`，三个工程共用同一份 React（19.3.0）。**不要在子目录单独安装依赖。**

**组件源码只有一份。** 需要改组件就改 `packages/ui/src/`，两个应用自动同步。**不要把组件复制到第二个位置。**

---

## 文档阅读顺序

1. `docs/DESIGN.md` — 颜色、材质、圆角、排版、间距、状态与禁止做法
2. `docs/MOTION.md` — 时长、弹簧参数、液态交互、减弱动画
3. `packages/ui/src/styles/tokens.css` — 实际数值。**改这里，不要在组件里写裸值**
4. `docs/COMPONENTS.md` — 五个组件的真实接口（React 与 Astro 两种用法）
5. `docs/AGENT_GUIDE.md` — 把本仓库风格用到其他项目时读这份
6. `ATTRIBUTION.md` — 参考来源与许可，改动前确认边界

---

## 开发与验证命令

```bash
npm install                 # 安装全部工作区依赖

# 独立 React 工程
npm run dev:react           # → http://localhost:5181
npm run typecheck:react
npm run build:react
npm run preview:react

# Astro 工程
npm run dev:astro           # → http://localhost:5182
npm run typecheck:astro     # astro check
npm run build:astro
npm run preview:astro

# 聚合
npm run build               # 依次构建两个工程
npm run typecheck           # 依次检查两个工程
npm test                # 通知计时行为测试（共享包）
npm run verify:docs         # 文档与实际接口一致性检查
npm run verify:browser      # 双工程浏览器验收（59 项，需先启动两个服务）
```

**提交前必须全部通过。** 不要声称未运行的检查已通过。

浏览器验收建议针对**预览服务**而非 dev，这样能覆盖生产产物：

```bash
npm run build && npm run build:astro
npm run preview:react -- --port 5281     # 另开终端
npm run preview:astro -- --port 5282     # 另开终端
REACT_URL=http://localhost:5281 ASTRO_URL=http://localhost:5282 npm run verify:browser
```

---

## 必须遵守的设计规则

1. **令牌唯一**：颜色、圆角、阴影、时长只在 `src/styles/tokens.css` 定义。组件内禁止裸色号、裸圆角像素值、裸毫秒数。
2. **语义命名**：组件引用 `--surface-1`、`--foreground-secondary` 这类语义令牌，不直接依赖具体色号。
3. **深色只改取值**：深色主题在 `.dark` 内覆盖同名令牌，**不写 `dark:` 颜色类名**。
4. **表面分三种**：内容表面（实色）、玻璃表面（`.glass`，仅悬浮控件）、遮罩与弹窗（`.glass-strong`）。**不要给卡片加毛玻璃。**
5. **圆角层级**：12 / 16 / 20 / 24 / 999px，嵌套时内层小于外层，内边距充足。
6. **焦点不可裁**：焦点样式用 `outline`；禁止全局 `overflow: hidden` 裁掉阴影、焦点环或弹出内容；禁止 `outline: none`。
7. **状态不只靠颜色**：必须配图标或文字。
8. **动效走常量**：时长与弹簧从 `src/lib/motion.ts` 导入。
9. **减弱动画必须处理**：用 `useReducedMotion()` 取消位移与回弹，但**保留清楚的状态反馈**。
10. **悬浮元素要留白**：Dock、通知遮挡正文时，底部留白由 `--dock-height` 推导，不写任意数值。

---

## Astro 工程规则

Astro 是主要使用场景，这些规则优先级最高：

1. **静态内容用 `.astro`**，不要为了「统一」把静态内容写成 React 组件。
2. **只有交互组件用 React Islands**。不要为 Dock / Toast / Dialog / Tabs 重新实现原生 Astro 版本。
3. **`client:*` 按需选择**，不要无差别 `client:load`：
   - 纯静态 → 不加指令
   - 首屏就要可用 → `client:load`
   - 次要交互 → `client:idle`
   - 滚动可见才需要 → `client:visible`
   - `client:only` 是最后手段，必须注释具体原因
4. **Islands 不共享 React Context。** 触发按钮与对应 Host 必须同岛。
5. **props 必须可序列化。** 不能传函数或组件；图标传名称字符串，跳转传 `href`。
6. **不要为跨岛共享状态引入 Redux、事件总线或状态框架。** 跨区域导航用原生锚点。

---

## SSR 安全

共用组件要同时能在服务端渲染：

1. 模块顶层与首次渲染**不访问** `window` / `document` / `localStorage`。
2. DOM 测量、浏览器存储、事件监听放在 effect 或事件处理器内。
3. **首次挂载不施加入场动画**，用 `useIsFirstMount()`（`motion/ssr.ts`）。否则服务端渲染出的 `opacity: 0` 与客户端首帧不一致，会报 hydration mismatch。
4. 不用随机数或当前时间生成不稳定的首屏结构。
5. 事件监听、计时器、动画都要清理。

改完组件后**必须同时验证两个工程**，并确认控制台无 hydration 警告。

---

## Tailwind 扫描范围

`packages/ui/src/styles/globals.css` 中用 `@source '../components'` 与 `@source '../demo'` 声明扫描范围——组件源码不在应用目录下，不声明则语义工具类不会生成，**构建不报错但页面完全失去样式**。

移动组件目录后**必须同步更新 `@source`**，并在构建产物中确认 `bg-surface-1` 等类确实存在。

---

## 禁止运行时拼接 Tailwind 类名

Tailwind 只静态扫描源码。**任何由 `.replace()`、模板字符串或字符串加法拼出的类名都不会被生成。**

```tsx
// ❌ 错误：bg-success / bg-warning / bg-info 永远不会生成
className={iconClassName.replace('text-', 'bg-')}

// ✅ 正确：完整字面量，Tailwind 能扫到
const TONE = { success: { barClassName: 'bg-success' }, /* ... */ }
```

**症状极具欺骗性**：元素存在、动画正常、构建无报错，只是背景色退化为透明。历史事故正是如此——四条通知中三条的倒计时进度条不可见，长期未被发现。

`npm run verify:docs` 已加静态检查拦截该模式；`Toast.test.tsx` 有断言保证四种状态的进度条带不同的 `bg-*` 字面量类。

---

## 精准修改边界

- 只改任务范围内的界面。**不顺手优化、不重构无关代码、不引入新风格。**
- 保留本次改动前已存在的废弃代码，不要顺手删除；只清理本次改动产生的孤立引用。
- 不引入未要求的灵活性、可配置性、预留扩展。
- 不为只使用一次的布局包装通用框架，不为五个组件建几十种 variant。
- 风格迁移不应改变业务逻辑。
- 非React 项目只复用设计规则，不强行引入 React。

---

## Git 安全边界

**默认禁止任何会修改远程仓库的操作。**

- 禁止 `git push`、`git push --force`、`git push --tags`、创建远程仓库、发版、部署、发布 npm，除非用户明确授权。
- 本地操作（`status`、`diff`、`add`、`commit`、`branch`）可以执行。用户说「提交」仅表示本地 commit，不自动推送。
- 禁止 `git reset --hard`、`git clean -fd`、覆盖用户已有修改。
- 不删除原本存在的文件，除非任务明确要求且已确认用途。
- 不修改本机全局配置。
- 不连接或修改任何生产服务器。

---

## 其他硬性边界

- 不引入密钥、账号、Token、个人信息或真实业务数据。
- 不扩展到 Storybook、Figma 插件、主题生成器、CLI、组件商店或多框架适配。
- 不为「方便以后扩展」增加功能。
- 引入第三方代码前**必须**核对许可证并更新 `ATTRIBUTION.md`；许可不明时独立实现。
- 本仓库采用 **PolyForm Noncommercial License 1.0.0**（见 `LICENSE`）：允许个人使用、免费分享与修改，**禁止任何商业用途与付费性质的二次分发**。
- 这是 **source-available（源码可见）**，**不是 OSI 开源许可证**。README、文档与对外表述中不得称其为「开源许可证」。
- **不得**擅自改写 `LICENSE` 的条款原文。任何修改都必须经仓库所有者明确指示。