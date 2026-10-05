# 参考来源与许可说明

本文件记录 Dusk UI 实际使用的参考资料，以及每一项的**使用方式**（设计参考 / 直接采用代码）。

**核实原则**：不凭项目名称猜测许可。下列许可状态均通过 GitHub API 或仓库内LICENSE 文件实际核对，核对日期 2026-10-05。

---

## 1. 汇总

| 项目 | 链接 | 许可 | 使用方式 |
| --- | --- | --- | --- |
| Dusklight（同源博客主题） | 本地 `D:\Git-project\Dusklight` | 见 §4 | **设计参考**（读取样式源码） |
| shadcn/ui | https://github.com/shadcn-ui/ui | MIT | **设计参考**（主题变量命名约定） |
| shadcn/ui 主题规范 | https://ui.shadcn.com/docs/theming | 文档 | **设计参考** |
| Aceternity UI | https://github.com/aceternity/ui | **无 LICENSE 文件** | **设计参考**（未采用代码） |
| Floating Dock | https://ui.aceternity.com/components/floating-dock | 随所属仓库 | **设计参考**（未采用代码） |
| Animate UI | https://github.com/imskyleen/animate-ui | **MIT + Commons Clause** | **设计参考**（未采用代码） |
| linux-do/cdk | https://github.com/linux-do/cdk | MIT | **设计参考**（布局思路） |
| workbuddy-manager | https://github.com/ithtelab/workbuddy-manager | 未声明（NOASSERTION） | **设计参考**（布局思路） |
| Lucide | https://lucide.dev | ISC | **直接采用**：图标库作为 npm 依赖 |
| Radix Dialog | https://www.radix-ui.com | MIT | **直接采用**：作为 npm 依赖 |
| Motion | https://motion.dev | MIT | **直接采用**：作为 npm 依赖 |

---

## 2. 逐项说明

### 2.1 shadcn/ui — MIT

- **链接**：https://github.com-shadcn-ui/ui · 主题规范 https://ui.shadcn.com/docs/theming
- **许可**：MIT（经 GitHub API 确认）
- **使用方式**：**仅设计参考**
- **参考内容**：
  - 「表面 token + `-foreground` 配对」的语义命名约定。
  - 深色主题通过在 `.dark` 选择器内覆盖同名 token 实现。
  - 组件状态（hover / focus / disabled）的组织方式。
- **未采用其组件源码**。Dusk UI 的组件为独立实现。

### 2.2 Aceternity UI（含 Floating Dock）— 无许可证文件

- **链接**：https://github.com/aceternity/ui · https://ui.aceternity.com/components/floating-dock
- **许可**：**仓库根目录没有 LICENSE 文件**，GitHub API 返回 `"license": null`。
- **使用方式**：**仅设计参考，未复制任何代码**
- **参考内容**：Floating Dock 的交互模型 —— 将鼠标 X 位置换算为与各按钮中心的距离，在 `[-150, 0, 150]` 区间上线性映射到 `[40, 80, 40]` 的尺寸，用 `mass: 0.1 / stiffness: 150 / damping: 12` 的弹簧平滑。
- **Dusk UI 的处理**：因**无法确认许可**，按既定规则**独立实现**。本仓库的 `FloatingDock.tsx` 是独立代码：
  - 映射区间改为 `[-120, 0, 120] → [40, 76, 40]`，适配 Dusk UI 的尺寸层级；
  - 增加了 `prefers-reduced-motion` 与触屏端的固定尺寸分支；
  - 增加了键盘焦点显示标签、`aria-current` 标记与底部空间预留的文档说明。
- **说明**：距离映射是这类组件的通用交互思路，但**代码未复制**。

### 2.3 Animate UI — MIT + Commons Clause License Condition

- **链接**：https://github.com/imskyleen/animate-ui
- **许可**：**MIT + Commons Clause**（仓库内 LICENSE.md 全文如下要点）
  > Permission is hereby granted, free of charge, to any person obtaining a copy of this software … subject to the following conditions …
  > **Commons Clause Restriction**: You may use this Software, including for any commercial purpose, **so long as you do not sell or redistribute the components themselves in their original form—whether alone or in a bundle.**
- **版权声明**：Copyright (c) 2025 Elliot Sutton
- **使用方式**：**仅设计参考，未复制任何代码**
- **参考内容**：弹簧按组件角色分级配置的做法；`layoutId` 让选中指示器在同一组元素间连续移动。
- **为何仍然独立实现**：Commons Clause 在 MIT 之上附加了「不得原样再分发组件本身」的约束。由于 Dusk UI 的定位就是**供他人复制源码复用**，直接采用其组件代码会与该条款的意图冲突。
- **本仓库的处理**：`SegmentedTabs.tsx` 的 `layoutId` 用法是 Motion 官方 API 的常规用法，独立编写；`src/lib/motion.ts` 的弹簧参数表为本次设计，数值与组织方式均不同。

### 2.4 linux-do/cdk — MIT

- **链接**：https://github.com/linux-do/cdk
- **许可**：MIT（经 GitHub API 确认）
- **使用方式**：**仅设计参考**
- **参考内容**：工具型界面的信息密度与区块划分方式。
- **未采用其业务代码**。该仓库是完整的业务项目，按既定规则**不搬入 dusk-ui**。

### 2.5 workbuddy-manager — 许可未声明

- **链接**：https://github.com/ithtelab/workbuddy-manager
- **许可**：GitHub API 返回 `"other"` / `NOASSERTION`，未识别出标准许可证。
- **使用方式**：**仅参考管理台类界面的信息组织方式**
- **未阅读或采用其源码**，也未接触任何业务接口、账号体系、后端逻辑、品牌图标或业务文案。

---

## 3. 直接采用的第三方依赖

以下均为**通过 npm 正常安装的依赖**，各自遵循其自身许可证：

| 依赖 | 版本 | 许可 | 用途 |
| --- | --- | --- | --- |
| `react` / `react-dom` | 19.3.0 | MIT | 运行时 |
| `motion` | 14.0.0 | MIT | 动画（`motion/react`） |
| `lucide-react` | 1.52.0 | ISC | 图标 |
| `@radix-ui/react-dialog` | 1.1.23 | MIT | 弹窗焦点与语义管理 |
| `clsx` | 2.1.1 | MIT | className 合并 |
| `tailwind-merge` | 3.7.0 | MIT | Tailwind 类冲突消解 |
| `tailwindcss` / `@tailwindcss/vite` | 4.3.3 | MIT | 原子化CSS |
| `vite` / `@vitejs/plugin-react` | 8.3.2 / 6.1.1 | MIT | 构建 |
| `typescript` | 5.9.3 | Apache-2.0 | 类型检查 |
| `vitest` | 5.0.3 | MIT | 测试 |
| `playwright-core` | 1.x | Apache-2.0 | 仅用于本仓库的浏览器验收脚本 |

这些依赖通过包管理器安装，许可证文本随各包分发，**无需在本文件重复声明**。

---

## 4. 博客来源

- **站点**：https://blog.mcxiaochen.top
- **性质**：作者本人的博客。**仅作设计参考。**
- **核实方式**：通过其同源主题开源仓库 `Dusklight` 的 `src/styles/tokens.css` 读取实际取值。该文件内含明确注释：
  > 色调取 surface-1（近纯白过于生硬，对照源站 blog.mcxiaochen.top 的 `oklch(.97 .005 170)`）

  据此确认博客主色相为 **170**，并读取到其表面层级、强调色饱和度上限、毛玻璃参数、阴影层级、圆角层级与连续曲率方案（详见 `docs/DESIGN.md` 第 1.1 节）。

- **未做的事**：
  - 未修改博客或其源码
  - 未连接此前部署的任何服务器
  - 未下载或复制头像、文章、图片等个人内容
  - 未复制博客的 `Dusklight` 源码文件

- **使用方式**：Dusk UI 的 `tokens.css` 为**独立编写**，取值参考博客的色相与层级思路，但数值经过针对工具界面的重新调整（例如基准文字色从博客的阅读场景调到工具场景的高对比档）。**博客配色不是 dusk-ui 的默认换色结果**，而是其色彩基调的来源。

---

## 5. 原创性声明

- Dusk UI 的**设计理念不是全部原创**。圆角层级、毛玻璃分层、距离放大Dock、弹簧分级、共享指示器等思路均有明确来源，已逐项列于本文档。
- 这些来源项目的作者值得尊重。「代码公开」**不构成**可以任意复制使用的依据；许可条款优先于可见性。
- 本仓库中所有 `.tsx` / `.ts` / `.css` 文件为独立实现。**未复制**任何受限许可（无 LICENSE 或含 Commons Clause）的源码。
- 若后续引入新的第三方代码，**必须**先核对其许可证、保留其要求的版权与许可声明，并更新本文件。

---

## 6. 本仓库的许可状态

Dusk UI 采用 **PolyForm Noncommercial License 1.0.0**（SPDX 标识：`PolyForm-Noncommercial-1.0.0`）。

许可证全文见仓库根目录的 [`LICENSE`](./LICENSE)，与官方原文<https://polyformproject.org/licenses/noncommercial/1.0.0>逐字一致，未作任何修改。

### 6.1 授权范围

**允许**

- 个人使用：研究、实验、测试、个人学习、私人娱乐、兴趣项目（Personal Uses 条明文列举）
- 免费分发与分享：Distribution License 条授予分发权
- 修改与创作衍生作品：Changes and New Works License 条
- 非营利组织、教育机构、政府机构的非商业用途（Noncommercial Organizations 条）

**禁止**

- 任何商业用途。PolyForm NC 的基本前提是「Any noncommercial purpose is a permitted purpose」，因此商业用途**不在许可范围内**，需另行取得作者书面授权
- 售卖、收费下载、订阅制服务
- 以 Dusk UI 提供 SaaS 或托管服务并收取费用
- 将 Dusk UI 集成进商业产品后对外提供
- **任何付费性质的二次分发**（Distribution License 所授予的分发权只覆盖非商业用途）

**必须**

- 向任何获得副本的人传递本许可证全文或上述官方链接（Notices 条）
- 附带作者提供的 `Required Notice:` 原文行

### 6.2 使用方须知的两点

1. **署名是强制的。** Notices 条要求传递许可证与 `Required Notice:` 原文。这意味着使用方**不能**在不提及来源的情况下使用本项目。这与作者的要求方向一致，且强于道德期望——受法律约束。
2. **这不是 OSI 认可的开源许可证。** 禁止商用与开源定义（OSD 第 6 条）互斥，因此GitHub 徽章与自动化信任评分会相应降级。准确的说法是「source-available」（源码可见），不是「open source」。

### 6.3 对上游许可的影响

上游参考项目各自的许可仍然有效，**不因本仓库的选择而改变**：

- 本仓库采用 PolyForm NC，**不改变** MIT / ISC 等上游许可的条款。
- 第三方文件自身要求保留的许可声明（如 §2.3 中的 `Copyright (c) 2025 Elliot Sutton`）已在本文档中如实记录。
- §2.2 与 §2.3 两个许可受限的参考项目均**未复制代码**，本仓库代码为独立实现，因此不存在许可冲突。

### 6.4 作者的额外保留

PolyForm NC 原文包含以下条款，作者据此保留相应权利：

- **禁止暗示背书**：使用方不得以作者姓名、肖像、品牌或声称获得作者背书的方式使用本项目。
- **专利防御**：作者授予专利许可，但若作者主张任何人侵犯其专利，该专利许可立即终止。
- **免责**：软件按现状提供，作者不承担任何赔偿责任。
- **违约救济**：首次收到书面违约通知后，许可可在 32 天内补正；逾期则许可立即终止。