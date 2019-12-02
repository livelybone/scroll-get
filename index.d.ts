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
 * @param el                The target element you want scroll to
 * @param [time]            Interval
 * @param [affectParent]    Whether affect the parentElement, when it is true the parentElement will also scroll to the visible area
 * @param [rateFactor]      RateFactor
 * */
declare function scrollToElement(
  el: HTMLElement,
  time?: number,
  affectParent?: boolean,
  rateFactor?: RateFactor,
): Promise<void>

export {
  RateFactor,
  animation,
  getNativeScrollbarWidth,
  getRect,
  posRelativeToClient,
  posRelativeToPage,
  scrollToElement,
}
