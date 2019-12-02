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
 * @param el                The target element you want scroll to
 * @param [time]            Interval
 * @param [affectParent]    Whether affect the parentElement, when it is true the parentElement will also scroll to the visible area
 * @param [rateFactor]      RateFactor
 * */
export function scrollToElement(
  el: HTMLElement,
  time: number = 300,
  affectParent?: boolean,
  rateFactor?: RateFactor,
): Promise<void> {
  const getMaxScrollTop = ($el: HTMLElement) =>
    $el.scrollHeight - $el.clientHeight
  if (el.parentElement) {
    let parentElement = el.parentElement as HTMLElement

    const parentScroll = () => scrollToElement(parentElement, time)

    let maxScrollTop: number
    let scrollTop: number
    if (parentElement === document.body) {
      maxScrollTop = getMaxScrollTop(document.body)
      scrollTop = document.body.scrollTop
      if (!maxScrollTop) {
        maxScrollTop = getMaxScrollTop(document.documentElement)
        parentElement = document.documentElement
        scrollTop = document.documentElement.scrollTop
      }
    } else {
      maxScrollTop = getMaxScrollTop(parentElement)
      scrollTop = parentElement.scrollTop
    }

    const offsetTop = getRect(el).top - getRect(parentElement).top

    const delta = Math.min(offsetTop, maxScrollTop)
    if (delta && offsetTop && maxScrollTop > 0) {
      return animation(
        time,
        rate => {
          parentElement.scrollTop = scrollTop + delta * rate
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
