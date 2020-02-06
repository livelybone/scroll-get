export function getRect(el: Element) {
  return el.getBoundingClientRect()
}

export function posRelativeToPage(el: HTMLElement) {
  const o = { pageLeft: 0, pageTop: 0 }
  let $el = el
  while ($el) {
    o.pageLeft += $el.offsetLeft
    o.pageTop += $el.offsetTop
    $el = $el.offsetParent as HTMLElement
  }
  return o
}

export function posRelativeToClient(el: Element) {
  const rect = getRect(el)
  return { clientLeft: rect.left, clientTop: rect.top }
}

/**
 * @desc if el === window || el === undefined, return the global scrollbar width info
 *       if el is an Element, return the scrollbar width info of the Element
 *
 * x: width of horizontal scrollbar
 * y: width of vertical scrollbar
 * */
export function getNativeScrollbarWidth(el?: Window | HTMLElement) {
  const $el = el || window
  const isWindow = $el === window
  try {
    let info: { x: number; y: number } | null = isWindow
      ? (window as any).nativeScrollbarWidth
      : null
    if (!(info && typeof info.y === 'number' && typeof info.x === 'number')) {
      // If nativeScrollbarWidth is illegal, reset it
      const wrapper = isWindow
        ? document.createElement('div')
        : ($el as HTMLElement)
      if (isWindow) {
        wrapper.setAttribute(
          'style',
          'position:fixed;top:0;left:0;opacity:0;pointer-events:none;width:200px;height:200px;overflow:scroll',
        )
        document.body.appendChild(wrapper)
      }
      info = {
        y: wrapper.offsetWidth - wrapper.clientWidth,
        x: wrapper.offsetHeight - wrapper.clientHeight,
      }
      if (isWindow) {
        ;(window as any).nativeScrollbarWidth = info
        document.body.removeChild(wrapper)
      }
    }
    return info
  } catch (e) {
    // For server render
    return { y: 17, x: 17 }
  }
}

/**
 * This affects the performance of the animation by modifying the rate
 *
 * rate >= 0 && rate <= 1
 * */
export type RateFactor = (rate: number) => number

function defaultRateFactor(rate: number) {
  return rate + (1 - rate) * rate
}

export function animation(
  time: number,
  cb: (rate: number) => void,
  rateFactor?: RateFactor,
) {
  const $rateFactor = rateFactor || defaultRateFactor
  const run = ($cb: () => boolean) => {
    window.requestAnimationFrame(() => {
      if ($cb()) run($cb)
    })
  }

  return new Promise(res => {
    const start = Date.now()
    run(() => {
      const rate = $rateFactor(Math.min(1, (Date.now() - start) / time))
      cb(rate)
      if (rate >= 1) {
        res()
        return false
      }
      return true
    })
  })
}

/**
 * 获取元素的可能达到的最大的 scrollTop 值
 *
 * Gets the maximum possible scrollTop value for the element
 * */
export function getMaxScrollTop(el: HTMLElement) {
  const lastChild = el.children[el.children.length - 1]
  const getStyle = ($el?: Element | null): CSSStyleDeclaration | undefined => {
    if ($el) {
      // @ts-ignore
      return getComputedStyle ? getComputedStyle($el) : $el.currentStyle
    }
    return undefined
  }
  const getMaxExceedMarginBottom = (
    $el: Element | null | undefined,
    lastMarginBottom = 0,
  ): number => {
    const style = getStyle($el)
    if (style && style.display === 'block')
      return getMaxExceedMarginBottom(
        $el!.children[$el!.children.length - 1],
        Math.max(lastMarginBottom, parseInt(style.marginBottom, 10)),
      )
    return lastMarginBottom
  }
  const marginBottom = getMaxExceedMarginBottom(lastChild)
  return Math.max(0, el.scrollHeight - el.clientHeight - marginBottom)
}

/**
 * 向上遍历元素的祖先，获取第一个滚动的祖先元素
 *
 * Traverse up the ancestor of the element to get the first scrolling ancestor element
 * */
export function getScrollParent($el: HTMLElement): HTMLElement | undefined {
  if ($el.parentElement) {
    const scrollParent = $el.parentElement as HTMLElement
    if (getMaxScrollTop(scrollParent)) return scrollParent
    return getScrollParent(scrollParent)
  }
  return undefined
}

export interface ScrollToElementOptions {
  /**
   * Interval
   *
   * Default: 300
   * */
  time?: number
  /**
   * Whether affect the scrollParent, when it is true the scrollParent will also scroll to the visible area
   * */
  affectParent?: boolean
  /**
   * RateFactor
   * */
  rateFactor?: RateFactor
  offset?: number
}

/**
 * @param el                The target element you want scroll to
 * @param [options]         ScrollToElementOptions
 * */
export function scrollToElement(
  el: HTMLElement,
  options?: ScrollToElementOptions,
): Promise<void> {
  const { affectParent, rateFactor, offset = 0, time = 300 } = options || {}
  let scrollParent = getScrollParent(el)
  if (scrollParent) {
    const parentScroll = () =>
      scrollToElement(scrollParent!, { time, affectParent, rateFactor })

    let maxScrollTop: number
    let scrollTop: number
    if (scrollParent === document.body) {
      maxScrollTop = getMaxScrollTop(document.body)
      scrollTop = document.body.scrollTop
      if (!maxScrollTop) {
        maxScrollTop = getMaxScrollTop(document.documentElement)
        scrollParent = document.documentElement
        scrollTop = document.documentElement.scrollTop
      }
    } else {
      maxScrollTop = getMaxScrollTop(scrollParent)
      scrollTop = scrollParent.scrollTop
    }

    const offsetTop = getRect(el).top - getRect(scrollParent).top

    const delta = Math.min(offsetTop + offset, maxScrollTop)
    if (delta && offsetTop && maxScrollTop > 0) {
      return animation(
        time,
        rate => {
          scrollParent!.scrollTop = scrollTop + delta * rate
        },
        rateFactor,
      ).then(affectParent ? parentScroll : null)
    }

    if (affectParent) {
      return parentScroll()
    }
  }
  return Promise.resolve()
}

export interface ElementInfo {
  element: HTMLElement
  /**
   * @prop areaHeight       元素对应区域的高度，这里认为一个元素对应的区域的高度等于该元素到它在页面上临近的下一个元素的距离加本身的高度
   * @prop viewAreaHeight   元素对应可视区域的高度，在页面上可以被看到的高度
   * @prop viewPercent      viewAreaHeight / areaHeight
   *
   * @prop areaHeight       The height of an element's area, which is considered to be equal to the distance from the element to its next adjacent element on the page plus the height of the element itself
   * @prop viewAreaHeight   The height of the visible area of the element on the page
   * @prop viewPercent      viewAreaHeight / areaHeight
   * */
  rect: DOMRect & {
    areaHeight: number
    viewAreaHeight: number
    viewPercent: number
  }
}

/**
 * @param viewElements   当前可见区域代表的元素，通过对比各自排序
 * */
export type GetViewElementsWhenScrollCb = (
  viewElements: ElementInfo[],
  scrollParentRect: DOMRect,
  ev?: Event,
) => any

export function getViewElementsWhenScroll(
  scrollElement: HTMLElement,
  targetElements: HTMLElement[],
  cb: GetViewElementsWhenScrollCb,
) {
  if (targetElements.length > 0) {
    let oldEl: ElementInfo[] = []

    // 排序：比较元素位置
    targetElements.sort((a, b) => getRect(a).top - getRect(b).top)

    const scroll = (ev?: Event) => {
      const scrollRect = getRect(scrollElement)
      const elementsRect = targetElements.map(getRect)

      // 重新计算元素当前的区域高度及可见区域高度
      const rects = elementsRect.map((rect, i) => {
        const $rect = rect as ElementInfo['rect']
        $rect.areaHeight =
          i !== elementsRect.length - 1
            ? elementsRect[i + 1].top - $rect.top
            : $rect.height
        $rect.viewAreaHeight = Math.max(
          0,
          scrollRect.height +
            $rect.areaHeight -
            (Math.max(
              $rect.top + $rect.areaHeight,
              scrollRect.top + scrollRect.height,
            ) -
              Math.min(scrollRect.top, $rect.top)),
        )
        $rect.viewPercent = $rect.viewAreaHeight / $rect.areaHeight
        return { rect: $rect, element: targetElements[i] }
      })

      // 通过比较各自当前的可见区域的大小获得当前的最近元素
      const viewElements = rects
        .sort((a, b) => {
          return b.rect.viewPercent - a.rect.viewPercent
        })
        .filter(el => {
          return el.rect.viewPercent > 0
        })
      if (
        viewElements.length !== oldEl.length ||
        viewElements.some((el, i) => el.element !== oldEl[i].element)
      ) {
        cb((oldEl = viewElements), scrollRect, ev)
      }
    }
    scroll()
    scrollElement.addEventListener('scroll', scroll)
    return () => scrollElement.removeEventListener('scroll', scroll)
  }
  return () => {}
}
