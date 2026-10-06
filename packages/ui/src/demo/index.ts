/**
 * Dusk UI — 展示页相关导出
 * ─────────────────────────────────────────────────────────
 * 供 apps/react 与 apps/astro 共用。
 * 数据（data.ts）与 Islands（islands.tsx）都在这里导出。
 */

export {
  DEMO_STATS,
  DEMO_TABS,
  DEMO_POST,
  DEMO_TOASTS,
  DEMO_TOAST_DURATION,
  DEMO_COUNTDOWN_DEFAULT,
  DEMO_DOCK,
  DEMO_SPECS,
  DEMO_DIALOG_PARAGRAPHS,
} from './data'

export type { DemoStat, DemoTab, DemoToastCopy, DemoDockItem } from './data'

export {
  StatCardsIsland,
  ToastsIsland,
  DialogIsland,
  SegmentedTabsIsland,
  FloatingDockIsland,
} from './islands'

export { ReactShowcase } from './ReactShowcase'

/* ═══════════════════════════════════════════════════════
   博客 Demo
   ─────────────────────────────────────────────────────────
   内容与展示组件都放在这里，页面结构由 Astro 的文件路由提供。
   组件本身不依赖路由，React 工程也能直接使用。
   ═══════════════════════════════════════════════════════ */

export {
  BLOG_AUTHOR,
  BLOG_CATEGORIES,
  BLOG_POSTS,
  BLOG_SITE,
  BLOG_SKILLS,
  BLOG_TAGS,
  categoryName,
  coverClassName,
  formatDate,
  formatDateShort,
  getAdjacentPosts,
  getArchive,
  getCategoriesWithCount,
  getFeaturedPost,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getSortedPosts,
  getTagsWithCount,
} from './blog/data'
export type {
  BlogArchiveYear,
  BlogBlock,
  BlogCategory,
  BlogCoverId,
  BlogPost,
  BlogTag,
} from './blog/data'

export {
  ArchiveItem,
  AuthorCard,
  BlogUnavailable,
  CategoryPill,
  CoverArt,
  PinnedBadge,
  PostBody,
  PostCard,
  PostMeta,
  PostNav,
  TagPill,
} from './blog/components'