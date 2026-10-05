import * as React from 'react'

/**
 * 判断当前渲染是否为该组件的首次挂载。
 *
 * 用途：配合服务端渲染避免 hydration mismatch。
 *
 * Motion 在服务端渲染时会把 `initial` 指定的样式写进 HTML
 * （例如 `opacity: 0`），而客户端 hydrate 时入场动画往往已经
 * 开始执行，DOM 上的样式变成 `opacity: 1`。两者不一致时
 * React 会报「server rendered HTML didn't match」。
 *
 * 解决方式：首次挂载时不给initial 样式（服务端与客户端首帧
 * 因此完全一致），之后的重新渲染才应用入场动画。
 * 对 Tabs 面板这类「切换时重新挂载」的组件，视觉上无损失 ——
 * 首次出现的面板本就应该是最终状态。
 *
 * 注意：本hook 只在客户端可靠；服务端渲染时恒为 true，
 * 这正是我们想要的首帧一致行为。
 */
export function useIsFirstMount(): boolean {
  const isFirst = React.useRef(true)

  React.useEffect(() => {
    isFirst.current = false
  }, [])

  return isFirst.current
}

/**
 * SSR 安全的入场动画开关。
 *
 * - 首次挂载：`enabled` 为 false，不施加 initial 动画；
 * - 后续挂载（切换 Tab 等）：`enabled` 为 true，正常播放入场动画。
 */
export function useEnterAnimation(): { enabled: boolean; initial: false | { opacity: number; y: number } } {
  const isFirst = useIsFirstMount()
  return { enabled: !isFirst, initial: isFirst ? false : { opacity: 0, y: 8 } }
}