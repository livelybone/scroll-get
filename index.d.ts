declare function getRect(el: Element): DOMRect

declare function posRelativeToPage(
  el: HTMLElement,
): {
  pageLeft: number
  pageTop: number
}

declare function posRelativeToClient(
  el: Element,
): {
  clientLeft: number
  clientTop: number
}

/**
 * @desc if el === window || el === undefined, return the global scrollbar width info
 *       if el is an Element, return the scrollbar width info of the Element
 *
 * x: width of horizontal scrollbar
 * y: width of vertical scrollbar
 * */
declare function getNativeScrollbarWidth(
  el?: Window | HTMLElement,
): {
  x: number
  y: number
}

/**
 * This affects the performance of the animation by modifying the rate
 *
 * rate >= 0 && rate <= 1
 * */
declare type RateFactor = (rate: number) => number

declare function animation(
  time: number,
  cb: (rate: number) => void,
  rateFactor?: RateFactor,
): Promise<unknown>

/**
 * 获取元素的可能达到的最大的 scrollTop 值
 *
 * Gets the maximum possible scrollTop value for the element
 * */
declare function getMaxScrollTop(el: HTMLElement): number

/**
 * 向上遍历元素的祖先，获取第一个滚动的祖先元素
 *
 * Traverse up the ancestor of the element to get the first scrolling ancestor element
 * */
declare function getScrollParent($el: HTMLElement): HTMLElement | undefined

interface ScrollToElementOptions {
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
declare function scrollToElement(
  el: HTMLElement,
  options?: ScrollToElementOptions,
): Promise<void>

interface ElementInfo {
  element: HTMLElement
  /**
   * @prop areaHeight       元素对应区域的高度，这里认为一个元素对应的区域的高度等于该元素到它在页面上临近的下一个元素的距离加本身的高度
   * @prop viewAreaHeight   元素对应可视区域的高度，在页面上可以被看到的高度
   * @prop viewPercent      viewAreaHeight / areaHeight
   *s
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
declare type GetViewElementsWhenScrollCb = (
  viewElements: ElementInfo[],
  scrollParentRect: DOMRect,
  ev?: Event,
) => any

declare function getViewElementsWhenScroll(
  scrollElement: HTMLElement,
  targetElements: HTMLElement[],
  cb: GetViewElementsWhenScrollCb,
): () => void

export {
  ElementInfo,
  GetViewElementsWhenScrollCb,
  RateFactor,
  ScrollToElementOptions,
  animation,
  getMaxScrollTop,
  getNativeScrollbarWidth,
  getRect,
  getScrollParent,
  getViewElementsWhenScroll,
  posRelativeToClient,
  posRelativeToPage,
  scrollToElement,
}
