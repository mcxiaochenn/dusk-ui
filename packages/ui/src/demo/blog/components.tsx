/**
 * Dusk UI — 博客 Demo 共用展示组件
 * ─────────────────────────────────────────────────────────
 * 这些组件只负责「把一个数据对象渲染成一块界面」，
 * 不含任何状态，因此在 Astro 中可以不加 client:* 指令，
 * 由服务端直接输出静态 HTML；在 React 工程中也能直接复用。
 *
 * 约束：
 * - 类名一律写完整字面量，不做运行时拼接（Tailwind 静态扫描）；
 * - 跳转全部用 href 字符串，不接收函数 prop，保证 props 可序列化；
 * - 颜色、圆角、时长全部引用语义令牌，不写裸值。
 */

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Clock3,
} from 'lucide-react'
import { cn } from '../../motion/utils'
import {
  categoryName,
  coverClassName,
  formatDate,
  formatDateShort,
  type BlogBlock,
  type BlogCoverId,
  type BlogPost,
} from './data'

/* ═══════════════════════════════════════════════════════
   封面
   ═══════════════════════════════════════════════════════ */

/**
 * 渐变封面占位图。
 *
 * 示例站点不引入外部图片资源，因此用令牌色渐变加一组几何线条表达封面，
 * 深浅主题下都能自然跟随令牌变化。
 */
export function CoverArt({
  cover,
  className,
}: {
  cover: BlogCoverId
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-control border border-border-subtle',
        coverClassName(cover),
        className,
      )}
    >
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <circle cx="248" cy="42" r="58" className="fill-surface-1 opacity-25" />
        <circle cx="248" cy="42" r="58" className="stroke-border-strong" fill="none" strokeWidth="1" />
        <circle cx="248" cy="42" r="34" className="stroke-border-strong" fill="none" strokeWidth="1" />
        <path
          d="M0 138c46-26 92-26 138 0s92 26 138 0"
          className="stroke-border-strong"
          fill="none"
          strokeWidth="1"
        />
        <path
          d="M0 156c46-26 92-26 138 0s92 26 138 0"
          className="stroke-border"
          fill="none"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   元信息与标签
   ═══════════════════════════════════════════════════════ */

/** 分类胶囊。颜色与文字共同表达分类，不依赖颜色单独传达信息。 */
export function CategoryPill({
  slug,
  href,
}: {
  slug: string
  href?: string
}) {
  const label = categoryName(slug)
  const className =
    'inline-flex items-center rounded-pill bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent'
  return href ? (
    <a href={href} className={cn(className, 'transition-colors hover:bg-accent-subtle-hover')}>
      {label}
    </a>
  ) : (
    <span className={className}>{label}</span>
  )
}

export function TagPill({
  label,
  href,
  count,
}: {
  label: string
  href?: string
  count?: number
}) {
  const className =
    'inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground-secondary transition-colors hover:border-border-strong hover:text-foreground'
  const content = (
    <>
      <span aria-hidden="true" className="text-foreground-muted">
        #
      </span>
      {label}
      {count === undefined ? null : (
        <span className="text-xs text-foreground-muted [font-variant-numeric:tabular-nums]">
          {count}
        </span>
      )}
    </>
  )
  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <span className={className}>{content}</span>
  )
}

/** 日期 / 分类 / 阅读时长行。 */
export function PostMeta({
  date,
  category,
  readingTime,
  categoryHref,
}: {
  date: string
  category?: string
  readingTime?: string
  categoryHref?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="size-3.5" aria-hidden />
        <time dateTime={date}>{formatDate(date)}</time>
      </span>
      {category ? <CategoryPill slug={category} href={categoryHref} /> : null}
      {readingTime ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {readingTime}
        </span>
      ) : null}
    </div>
  )
}

/** 置顶标记。文字 + 图标，不靠颜色单独表达。 */
export function PinnedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 px-2 py-0.5 text-xs text-foreground-secondary">
      <Clock3 className="size-3" aria-hidden />
      置顶
    </span>
  )
}

/* ═══════════════════════════════════════════════════════
   摘要：正文的第一段文字
   ═══════════════════════════════════════════════════════ */

/** 取正文第一个段落，用作元描述；没有段落时回退到摘要。 */
function firstParagraph(post: BlogPost): string {
  const paragraph = post.body.find((block) => block.type === 'paragraph')
  return paragraph?.type === 'paragraph' ? paragraph.text : post.excerpt
}

/* ═══════════════════════════════════════════════════════
   文章卡片
   ═══════════════════════════════════════════════════════ */

/**
 * 文章卡片。
 *
 * `orientation` 决定排布：
 * - vertical：列表默认形态，封面在上
 * - horizontal：推荐位与竖排窄栏使用，封面在左
 */
export function PostCard({
  post,
  orientation = 'vertical',
  headingLevel = 'h3',
}: {
  post: BlogPost
  orientation?: 'vertical' | 'horizontal'
  /** 标题层级由页面决定，保证一个页面的标题序列不断层 */
  headingLevel?: 'h2' | 'h3'
}) {
  const href = `/blog/posts/${post.slug}`
  const Heading = headingLevel
  const horizontal = orientation === 'horizontal'

  return (
    <article
      className={cn(
        'group rounded-card border border-border bg-surface-1 transition-colors duration-[150ms] ease-[var(--ease-standard)] hover:border-border-strong',
        horizontal ? 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-[10rem_1fr]' : 'flex flex-col p-4',
      )}
    >
      <CoverArt
        cover={post.cover}
        className={horizontal ? 'aspect-[4/3] sm:aspect-[1/1]' : 'aspect-[16/9]'}
      />

      <div className={cn('flex min-w-0 flex-col', horizontal ? 'gap-2 py-1' : 'mt-4 gap-2')}>
        <PostMeta
          date={post.date}
          category={post.category}
          readingTime={post.readingTime}
          categoryHref={`/blog/categories/${post.category}`}
        />

        <Heading className="text-lg">
          <a
            href={href}
            className="transition-colors duration-[150ms] ease-[var(--ease-standard)] hover:text-accent"
          >
            {post.title}
          </a>
        </Heading>
        <p className="text-sm leading-relaxed text-foreground-secondary">{firstParagraph(post)}</p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {post.pinned ? <PinnedBadge /> : null}
          {post.tags.map((tag) => (
            <TagPill key={tag} label={tag} href={`/blog/tags/${tag}`} />
          ))}
        </div>
      </div>
    </article>
  )
}

/* ═══════════════════════════════════════════════════════
   归档条目
   ═══════════════════════════════════════════════════════ */

/** 归档 / 侧栏使用的紧凑条目：日期 + 标题。 */
export function ArchiveItem({ post }: { post: BlogPost }) {
  return (
    <li className="border-b border-border-subtle last:border-b-0">
      <a
        href={`/blog/posts/${post.slug}`}
        className="flex items-baseline gap-3 py-2.5 transition-colors duration-[150ms] ease-[var(--ease-standard)] hover:text-accent"
      >
        <time
          dateTime={post.date}
          className="w-16 shrink-0 text-xs text-foreground-muted [font-variant-numeric:tabular-nums]"
        >
          {formatDateShort(post.date)}
        </time>
        <span className="min-w-0 flex-1 truncate text-sm">{post.title}</span>
      </a>
    </li>
  )
}

/* ═══════════════════════════════════════════════════════
   正文
   ═══════════════════════════════════════════════════════ */

/**
 * 正文渲染。
 *
 * 引入结构化块而不是 Markdown 渲染器：Demo 不增加依赖，
 * 块类型也只用得到四种。行长统一限制在非满宽容器内，
 * 具体宽度由外层页面决定。
 */
export function PostBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h2 key={index} className="mt-8 text-lg">
              {block.text}
            </h2>
          )
        }
        if (block.type === 'list') {
          return (
            <ul
              key={index}
              className="mt-4 list-disc space-y-2 pl-5 text-md leading-relaxed text-foreground-secondary"
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'quote') {
          return (
            <blockquote
              key={index}
              className="mt-6 rounded-control border-l-2 border-accent bg-accent-subtle px-4 py-3 text-md leading-relaxed text-foreground-secondary italic"
            >
              {block.text}
            </blockquote>
          )
        }
        return (
          <p key={index} className="mt-4 text-md leading-relaxed text-foreground-secondary">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   上下篇导航
   ═══════════════════════════════════════════════════════ */

export function PostNav({
  newer,
  older,
}: {
  newer: BlogPost | undefined
  older: BlogPost | undefined
}) {
  const item = (post: BlogPost, direction: 'newer' | 'older') => (
    <a
      key={post.slug}
      href={`/blog/posts/${post.slug}`}
      className="flex flex-col gap-1 rounded-card border border-border bg-surface-1 p-4 transition-colors duration-[150ms] ease-[var(--ease-standard)] hover:border-border-strong"
    >
      <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
        {direction === 'newer' ? (
          <>
            <ArrowLeft className="size-3.5" aria-hidden />
            更新的一篇
          </>
        ) : (
          <>
            更早的一篇
            <ArrowRight className="size-3.5" aria-hidden />
          </>
        )}
      </span>
      <span className="text-sm font-medium">{post.title}</span>
    </a>
  )

  return (
    <nav aria-label="上下篇导航" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {newer ? item(newer, 'newer') : <span aria-hidden="true" />}
      {older ? item(older, 'older') : null}
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════
   作者卡片
   ═══════════════════════════════════════════════════════ */

export function AuthorCard({
  name,
  role,
  bio,
  avatar,
  location,
}: {
  name: string
  role: string
  bio: string
  avatar: string
  location: string
}) {
  return (
    <div className="rounded-card border border-border bg-surface-1 p-6">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-pill bg-accent text-md font-semibold text-accent-foreground"
        >
          {avatar}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold">{name}</p>
          <p className="mt-0.5 text-sm text-foreground-secondary">{role}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-foreground-secondary">{bio}</p>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-foreground-muted">
        <span aria-hidden="true">📍</span>
        {location}
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   React 工程的降级页
   ─────────────────────────────────────────────────────────
   博客 Demo 的页面在实现上依赖 Astro 的文件路由与静态页面结构，
   独立 React 工程没有这套路由。这里给出明确说明而不是悄悄 404。
   ═══════════════════════════════════════════════════════ */

export function BlogUnavailable({ astroUrl }: { astroUrl: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[42rem] flex-col justify-center px-[var(--gutter)] py-16">
      <p className="text-xs text-foreground-muted">Dusk UI · 博客 Demo</p>
      <h1 className="mt-3 text-2xl">这个站点跑在 Astro 工程里</h1>
      <p className="mt-4 text-md leading-relaxed text-foreground-secondary">
        博客 Demo 依赖 Astro 的文件路由与静态页面结构（首页、详情、归档、标签、分类、关于），
        独立 React 工程是单页展示，没有这套路由，因此这里只放一条说明。
      </p>
      <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
        其中的展示组件（文章卡片、封面、标签、元信息）来自
        <code className="mx-1 rounded-control bg-surface-2 px-1.5 py-0.5 font-mono text-xs">
          @dusk-ui/ui/demo
        </code>
         ，React 工程同样可以直接使用 —— 缺的是页面结构，不是组件。
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={astroUrl}
          className="inline-flex h-10 items-center rounded-control bg-accent px-4 text-base font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          前往 Astro 工程的博客
        </a>
        <a
          href="/"
          className="inline-flex h-10 items-center rounded-control border border-border bg-surface-2 px-4 text-base font-medium transition-colors hover:bg-surface-3"
        >
          返回组件展示页
        </a>
      </div>
      <p className="mt-6 text-xs text-foreground-muted">{astroUrl}/blog</p>
    </main>
  )
}
