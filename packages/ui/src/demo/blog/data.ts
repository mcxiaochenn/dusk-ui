/**
 * Dusk UI — 博客 Demo 示例内容
 * ─────────────────────────────────────────────────────────
 * 全部为虚构占位内容，不连接任何真实业务接口。
 * 只导出可序列化数据，因此可以安全地作为 props 传入 Astro 的 React Islands，
 * 也可以在 .astro 中直接于服务端取用。
 *
 * 页面结构参考 Dusklight：
 * /blog（文章列表）· /blog/posts/<slug>（详情）
 * /blog/archive（归档）· /blog/tags · /blog/categories · /blog/about
 */

/* ═══════════════════════════════════════════════════════
   封面
   ─────────────────────────────────────────────────────────
   类名必须是**完整字面量**：Tailwind 只静态扫描源码，
   运行时拼出来的类名不会生成样式（构建不报错，但背景全透明）。
   因此这里用查表而不是拼接。
   ═══════════════════════════════════════════════════════ */

const COVER_CLASS = {
  dawn: 'bg-linear-to-br from-accent-subtle via-info-subtle to-surface-2',
  mint: 'bg-linear-to-br from-success-subtle via-accent-subtle to-surface-2',
  dusk: 'bg-linear-to-br from-info-subtle via-warning-subtle to-surface-2',
  slate: 'bg-linear-to-br from-surface-2 via-border-subtle to-surface-3',
  amber: 'bg-linear-to-br from-warning-subtle via-danger-subtle to-surface-2',
  iris: 'bg-linear-to-br from-info-subtle via-accent-subtle to-surface-3',
} as const

export type BlogCoverId = keyof typeof COVER_CLASS

export function coverClassName(cover: BlogCoverId): string {
  return COVER_CLASS[cover]
}

/* ═══════════════════════════════════════════════════════
   站点与作者
   ═══════════════════════════════════════════════════════ */

/** 博客站点信息（虚构） */
export const BLOG_SITE = {
  name: 'Dusklight',
  tagline: '黄昏时的一盏灯',
  description:
    '一个由 Dusk UI 驱动的博客示例站点。全部内容为占位数据，用于演示设计令牌在真实内容排版下的表现。',
  /** 页脚版权行 */
  copyright: 'Dusk UI · 博客 Demo · 内容均为示例占位数据',
} as const

/** 作者信息（虚构） */
export const BLOG_AUTHOR = {
  name: '辰渊尘',
  handle: 'ChenDusk',
  role: '机械专业在读 · 广谱型技术实践者',
  avatar: '辰',
  bio: '写工业软件、软硬件杂项与一些不着调的想法。喜欢自己实现一遍，确认边界在哪。',
  location: '浙江嘉兴',
  links: [
    { label: '首页', href: '/' },
    { label: '归档', href: '/blog/archive' },
    { label: '标签', href: '/blog/tags' },
  ],
} as const

/** 侧栏展示的技能/关键词（虚构） */
export const BLOG_SKILLS = [
  'TypeScript',
  'React',
  'Astro',
  'Rust',
  'C++',
  'Tailwind CSS',
  'Linux',
  '三坐标测量',
] as const

/* ═══════════════════════════════════════════════════════
   分类与标签
   slug 用于 URL，name 用于展示，两者都在常量里，
   避免中文名直接进入路径。
   ═══════════════════════════════════════════════════════ */

export interface BlogCategory {
  slug: string
  name: string
  description: string
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: 'design', name: '设计', description: '视觉规范、令牌体系与界面取舍。' },
  { slug: 'frontend', name: '前端', description: '组件实现、构建流程与性能取舍。' },
  { slug: 'devops', name: '运维', description: '自托管基础设施与日常排障记录。' },
  { slug: 'hardware', name: '硬件', description: '设备折腾、维修与嵌入式小制作。' },
  { slug: 'life', name: '日常', description: '与技术无关或与一切都有关的部分。' },
]

export interface BlogTag {
  slug: string
  name: string
}

export const BLOG_TAGS: BlogTag[] = [
  { slug: 'design-system', name: '设计系统' },
  { slug: 'astro', name: 'Astro' },
  { slug: 'tailwind', name: 'Tailwind' },
  { slug: 'typescript', name: 'TypeScript' },
  { slug: 'android', name: 'Android' },
  { slug: 'selfhost', name: '自托管' },
  { slug: 'measurement', name: '精密测量' },
  { slug: 'notes', name: '随笔' },
]

/* ═══════════════════════════════════════════════════════
   正文块
   ─────────────────────────────────────────────────────────
   用结构化的块描述正文，而不是引入 Markdown 渲染器 ——
   Demo 不引入新依赖，且块类型是有限的四种。
   ═══════════════════════════════════════════════════════ */

export type BlogBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  /** 封面样式 id */
  cover: BlogCoverId
  /** ISO 日期字符串 */
  date: string
  category: string
  tags: string[]
  readingTime: string
  /** 全站推荐：首页顶部的横幅位 */
  featured?: boolean
  /** 置顶：排在列表最前并显示标记 */
  pinned?: boolean
  body: BlogBlock[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'one-token-two-densities',
    title: '同一套令牌，两种密度：从工具界面到内容页面',
    excerpt:
      '工具界面要紧凑，文章页面要疏朗。密度不同不该导致视觉割裂，关键在于哪些令牌跟着密度走、哪些不跟着走。',
    cover: 'dawn',
    date: '2026-09-28',
    category: 'design',
    tags: ['design-system', 'tailwind'],
    readingTime: '7 分钟',
    featured: true,
    pinned: true,
    body: [
      {
        type: 'paragraph',
        text: '同一套设计令牌想要同时服务两种截然不同的页面，最先碰到的问题不是颜色，而是密度。工具界面一屏要放下几十个读数，行高必须压到 1.5 以下；而文章正文如果也这么挤，读三段就累了。',
      },
      {
        type: 'paragraph',
        text: '解决办法不是准备两套令牌，而是把令牌分成「跟着密度走」和「不跟着密度走」两类。色相、强调色、圆角、边框、阴影属于后者，它们在两个场景下取同一个值；字号、行高、间距属于前者，由各自区块自行选择。',
      },
      { type: 'heading', text: ' color 与 border 不参与密度决策' },
      {
        type: 'paragraph',
        text: '如果每个区块都能自由决定边框颜色，那么「这一层是不是比上一层高」的判断就失去了依据。层级的表达必须是全局的：实色靠明度分层，浮层靠毛玻璃与阴影分层。',
      },
      {
        type: 'list',
        items: [
          '内容表面：实色，靠明度与边框分层',
          '玻璃表面：半透明加背景模糊，只用于悬浮控件',
          '遮罩：负责隔离背景，不承担主体可读性',
        ],
      },
      {
        type: 'quote',
        text: '与其争论某个卡片的圆角是 16 还是 20，不如先确认它是第几层。层级清楚了，圆角自然有答案。',
      },
      {
        type: 'paragraph',
        text: '这套规则落地后最直观的变化是：新增页面时不再需要「找参考色」，只需要回答「它属于哪一层」。',
      },
    ],
  },
  {
    slug: 'islands-without-sharing-context',
    title: 'Astro Islands 之间不共享 Context，所以要按交互关系切岛',
    excerpt:
      '把 UI 组件按「看起来是一块」切岛会踩坑：触发按钮和它要控制的内容必须在同一个岛里，否则状态各管各的。',
    cover: 'iris',
    date: '2026-09-15',
    category: 'frontend',
    tags: ['astro', 'typescript'],
    readingTime: '6 分钟',
    body: [
      {
        type: 'paragraph',
        text: '静态页面里放几块交互区域时，很容易顺手按视觉边界切岛：按钮一个岛，弹窗一个岛，列表一个岛。页面看起来没问题，但点下去没反应 —— 因为岛与岛之间没有 React Context，也没有共享的状态容器。',
      },
      {
        type: 'heading',
        text: '按交互关系分组',
      },
      {
        type: 'paragraph',
        text: '正确的切法是按「谁要读写谁的状态」分组。通知的触发按钮、倒计时开关和通知容器必须同岛；弹窗的触发按钮和弹窗本体必须同岛。把它们拆开，中间就隔着一层 HTML 边界。',
      },
      {
        type: 'list',
        items: [
          '静态内容：不加 client:* 指令，构建时就是 HTML',
          '次要交互：client:idle，主内容就绪后再 hydrate',
          '滚动才需要：client:visible',
          'client:only 是最后手段，用之前先在代码里写清为什么不能 SSR',
        ],
      },
      {
        type: 'paragraph',
        text: '代价是岛会稍微胖一点：一个 shell 里可能既有按钮又有展示层。这点体积换来的是行为正确，是当前唯一稳的取舍。',
      },
    ],
  },
  {
    slug: 'static-class-names-only',
    title: 'Tailwind 不会生成拼出来的类名：一次静默失效的排查',
    excerpt:
      '元素在、动画在、构建不报错，只有背景色是透明的。排查到最后发现，问题出在四个类名的运行时拼接上。',
    cover: 'slate',
    date: '2026-08-30',
    category: 'frontend',
    tags: ['tailwind', 'astro'],
    readingTime: '5 分钟',
    body: [
      {
        type: 'paragraph',
        text: 'Tailwind 是静态扫描源码的，也就是说类名必须在源码里以完整字面量的形式出现。用模板字符串或字符串拼接出来的类名，既不会被生成，也不会有任何报错。',
      },
      {
        type: 'paragraph',
        text: '当时的症状很有迷惑性：三条通知的倒计时进度条完全看不见，但 DOM 结构、位置、动画全都正常。第一反应去找 z-index，第二反应去找 overflow，最后才意识到应该直接读计算样式。',
      },
      { type: 'heading', text: '排查顺序' },
      {
        type: 'list',
        items: [
          'getComputedStyle(el).backgroundColor —— 是否透明',
          'getComputedStyle(el).translate —— Tailwind v4 用的是 translate 属性',
          'el.getBoundingClientRect() —— 元素是否跑出了容器',
        ],
      },
      {
        type: 'quote',
        text: '构建通过不等于样式生效。凡是「看起来没生效」的问题，都要以量到的计算样式为准，而不是以读代码为准。',
      },
      {
        type: 'paragraph',
        text: '修法很朴素：四种状态各写一行完整字面量，放进一张查表里。之后再没复发过。',
      },
    ],
  },
  {
    slug: 'selfhost-on-one-machine',
    title: '一台机器上跑十几个服务：我的自托管取舍',
    excerpt:
      '不是所有东西都值得容器化。哪些服务该上 Docker，哪些直接装在宿主上，判断标准其实只有两条。',
    cover: 'mint',
    date: '2026-08-12',
    category: 'devops',
    tags: ['selfhost'],
    readingTime: '8 分钟',
    body: [
      {
        type: 'paragraph',
        text: '自托管久了会发现，容器化本身不是目的。判断要不要上 Docker，只看两条：依赖是否需要隔离，以及重建是否需要可重复。两条都不满足的，直接跑在宿主上更省事。',
      },
      { type: 'heading', text: '适合容器化' },
      {
        type: 'list',
        items: [
          '依赖与宿主冲突，或需要特定运行时版本',
          '需要在不同机器之间搬家，重建步骤必须可重复',
          '要跑多个实例做隔离',
        ],
      },
      { type: 'heading', text: '直接装也行' },
      {
        type: 'paragraph',
        text: '数据库、反向代理这类常年不动、配置文件又长又重要的服务，直接管理反而更好排障。宿主机崩了重建时才追悔的配置，往往都是当初图省事塞进容器里的。',
      },
      {
        type: 'quote',
        text: '备份策略要比部署方式更早想清楚，因为后者可以重来，前者不行。',
      },
    ],
  },
  {
    slug: 'cnc-measurement-first-week',
    title: '第一次上手三坐标测量机：从校验测头到出报告',
    excerpt:
      '精密测量对新手的门槛不在设备，在流程。测头不校、坐标系不定，后面所有读数都是空的。',
    cover: 'slate',
    date: '2026-07-26',
    category: 'hardware',
    tags: ['measurement', 'notes'],
    readingTime: '6 分钟',
    body: [
      {
        type: 'paragraph',
        text: '对着三坐标的第一天，最容易忽略的一步是测头校验。没有校验过的测头半径，软件是不知道针尖在哪里的，采到的点全部带着一个系统性偏移。',
      },
      { type: 'heading', text: '固定顺序' },
      {
        type: 'list',
        items: [
          '校验标准球：确认测针半径与设备自身精度',
          '建立工件坐标系：三个方向的基准依次确定',
          '按特征逐个采集，不要一次性跑完再回来看',
          '出报告前先看重复性，偏差超限要重采',
        ],
      },
      {
        type: 'paragraph',
        text: '流程立住之后，剩下的只是熟能生巧。测量是与精度打交道的活，急躁的代价是全部返工。',
      },
      {
        type: 'quote',
        text: '测量不是采点，是建立信任：信这台机器、信这个坐标系、信自己的读数。',
      },
    ],
  },
  {
    slug: 'android-bl-relock-notes',
    title: '解锁、刷机与回锁：一次踩坑记录',
    excerpt:
      '安卓底层折腾里最有价值的不是命令本身，而是知道哪一步不可逆。记录几条每次动手前都会核对的规则。',
    cover: 'amber',
    date: '2026-07-19',
    category: 'hardware',
    tags: ['android', 'notes'],
    readingTime: '9 分钟',
    body: [
      {
        type: 'paragraph',
        text: 'Bootloader 相关的操作有一条铁律：动分区之前先看清楚回锁条件是国产版本还是国际版本。同一套命令在两种机型上的结果可能完全相反。',
      },
      { type: 'heading', text: '动手前清单' },
      {
        type: 'list',
        items: [
          '完整备份分区，备份要落到另一台设备',
          '确认解锁状态与回锁路径是否已经验证过',
          '记录原始版本号与镜像哈希',
          '留一个确定能进 fastboot 的物理按键组合',
        ],
      },
      {
        type: 'quote',
        text: '任何教程都没有你自己的完整备份可靠，包括我这篇。',
      },
      {
        type: 'paragraph',
        text: '还有一条经验：不要在赶时间的时候做底层操作。绝大多数变砖发生在「就差最后一步」的心态里。',
      },
    ],
  },
  {
    slug: 'reading-long-form',
    title: '长文可读性：行长、留白与一点点克制',
    excerpt:
      '把正文宽度压到 70 个字符左右，比任何字体选择都更能提升长文的可读性。',
    cover: 'dusk',
    date: '2026-07-02',
    category: 'design',
    tags: ['design-system', 'notes'],
    readingTime: '4 分钟',
    body: [
      {
        type: 'paragraph',
        text: '阅读长文时眼睛需要回到行首，行长越长，回头找位置越困难。把正文限制在七十个字符上下，几乎立刻就能感受到差别。',
      },
      {
        type: 'list',
        items: [
          '正文宽度宁窄勿宽，宽到一屏放两行英文就是过宽',
          '行高给到 1.7，标题可以收到 1.25',
          '段落之间的间距要比行距大，让分组看得出来',
          '不要在正文里用纯黑，微降低对比度更耐读',
        ],
      },
      {
        type: 'paragraph',
        text: '这些规则朴素到不能再朴素，但绝大多数「说不上哪里难读」的页面，问题都出在这里。',
      },
    ],
  },
  {
    slug: 'keep-one-source-of-truth',
    title: '一份源码，两个工程：共用度的边界在哪',
    excerpt:
      '组件源码只有一份听起来很美好，实际要做到，得先解决样式扫描、类型检查与文档一致性的三处摩擦。',
    cover: 'mint',
    date: '2026-06-18',
    category: 'frontend',
    tags: ['typescript', 'astro', 'tailwind'],
    readingTime: '7 分钟',
    body: [
      {
        type: 'paragraph',
        text: '把组件放在共享包里，让两个应用引用同一份源码，最直接的收益是不存在两份实现逐渐漂移的问题。代价是三处配置必须跟上。',
      },
      { type: 'heading', text: '三处必要配置' },
      {
        type: 'list',
        items: [
          '样式扫描范围：组件不在应用目录下，必须显式声明 @source',
          '类型检查：共享包要纳入两个工程的 tsconfig include',
          '依赖版本：框架版本必须全仓一致，否则会出现两份运行时',
        ],
      },
      {
        type: 'paragraph',
        text: '这三处都配好之后，新增页面就只需要关心页面本身。而其中最容易被漏掉的是样式扫描 —— 它报错方式是「页面完全没样式」，非常显眼但常常被误当成缓存问题。',
      },
      {
        type: 'quote',
        text: '共用度的边界：能共享的是组件与令牌，不该共享的是页面本身的结构决策。',
      },
    ],
  },
]

/* ═══════════════════════════════════════════════════════
   查询函数
   ─────────────────────────────────────────────────────────
   全部为纯函数，服务端（.astro）与客户端都可以调用，
   不依赖任何运行环境 API。
   ═══════════════════════════════════════════════════════ */

/** 按发布日期倒序（不稳定排序由插入顺序兜底） */
export function getSortedPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** 全站推荐位：取最新的 featured 文章 */
export function getFeaturedPost(): BlogPost | undefined {
  return getSortedPosts().find((post) => post.featured)
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

/** 上一篇／下一篇（按发布时间倒序的相邻关系） */
export function getAdjacentPosts(slug: string): {
  newer: BlogPost | undefined
  older: BlogPost | undefined
} {
  const list = getSortedPosts()
  const index = list.findIndex((post) => post.slug === slug)
  if (index === -1) return { newer: undefined, older: undefined }
  return { newer: list[index - 1], older: list[index + 1] }
}

export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((category) => category.slug === slug)
}

export function categoryName(slug: string): string {
  return getCategoryBySlug(slug)?.name ?? '未分类'
}

export function getTagBySlug(slug: string): BlogTag | undefined {
  return BLOG_TAGS.find((tag) => tag.slug === slug)
}

/** 标签 + 文章数，按数量降序 */
export function getTagsWithCount(): Array<BlogTag & { count: number }> {
  return BLOG_TAGS.map((tag) => ({
    ...tag,
    count: BLOG_POSTS.filter((post) => post.tags.includes(tag.slug)).length,
  })).sort((a, b) => b.count - a.count)
}

/** 分类 + 文章数，保持在 BLOG_CATEGORIES 中的原有顺序 */
export function getCategoriesWithCount(): Array<BlogCategory & { count: number }> {
  return BLOG_CATEGORIES.map((category) => ({
    ...category,
    count: BLOG_POSTS.filter((post) => post.category === category.slug).length,
  }))
}

export function getPostsByTag(tagSlug: string): BlogPost[] {
  return getSortedPosts().filter((post) => post.tags.includes(tagSlug))
}

export function getPostsByCategory(categorySlug: string): BlogPost[] {
  return getSortedPosts().filter((post) => post.category === categorySlug)
}

export interface BlogArchiveYear {
  year: string
  posts: BlogPost[]
}

/** 按年份分组，年份倒序 */
export function getArchive(): BlogArchiveYear[] {
  const groups = new Map<string, BlogPost[]>()
  for (const post of getSortedPosts()) {
    const year = post.date.slice(0, 4)
    const bucket = groups.get(year)
    if (bucket) bucket.push(post)
    else groups.set(year, [post])
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([year, posts]) => ({ year, posts }))
}

/**
 * 日期格式化。
 *
 * 不经过 new Date() 解析，避免时区偏移导致跨天：
 * 输入统一是 'YYYY-MM-DD'，直接按段取值即可。
 */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}

/** 列表页使用的短格式 */
export function formatDateShort(iso: string): string {
  const [month, day] = iso.slice(5).split('-')
  return `${Number(month)} 月 ${Number(day)} 日`
}
