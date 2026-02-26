import { useEffect, useRef, useCallback, type RefObject } from 'react'
import { animate, createSpring, stagger } from 'animejs'

// ── Shared spring configs ──

const springBouncy = createSpring({ mass: 1, stiffness: 120, damping: 10, velocity: 0 })
const springSnappy = createSpring({ mass: 1, stiffness: 200, damping: 14, velocity: 0 })
const springGentle = createSpring({ mass: 1, stiffness: 80, damping: 12, velocity: 0 })

// ── useAnimeEntrance ──

type EntranceType = 'bounce-up' | 'bounce-down' | 'slide-right' | 'slide-left' | 'scale' | 'fade'

interface EntranceOptions {
  type?: EntranceType
  delay?: number
  duration?: number
}

export function useAnimeEntrance<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: EntranceOptions = {},
) {
  const { type = 'bounce-up', delay = 0, duration = 800 } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    switch (type) {
      case 'bounce-up':
        Object.assign(el.style, { opacity: '0', transform: 'translateY(30px)' })
        animate(el, { opacity: [0, 1], translateY: [30, 0], duration, delay, ease: springBouncy })
        break
      case 'bounce-down':
        Object.assign(el.style, { opacity: '0', transform: 'translateY(-30px)' })
        animate(el, { opacity: [0, 1], translateY: [-30, 0], duration, delay, ease: springBouncy })
        break
      case 'slide-right':
        Object.assign(el.style, { opacity: '0', transform: 'translateX(-40px)' })
        animate(el, { opacity: [0, 1], translateX: [-40, 0], duration, delay, ease: springBouncy })
        break
      case 'slide-left':
        Object.assign(el.style, { opacity: '0', transform: 'translateX(40px)' })
        animate(el, { opacity: [0, 1], translateX: [40, 0], duration, delay, ease: springBouncy })
        break
      case 'scale':
        Object.assign(el.style, { opacity: '0', transform: 'scale(0.8)' })
        animate(el, { opacity: [0, 1], scale: [0.8, 1], duration, delay, ease: springBouncy })
        break
      case 'fade':
        Object.assign(el.style, { opacity: '0' })
        animate(el, { opacity: [0, 1], duration, delay, ease: springBouncy })
        break
    }
  }, [])
}

// ── useAnimeStagger ──

type StaggerType = 'fade-up' | 'fade-right' | 'scale-in' | 'bounce-in'

interface StaggerOptions {
  type?: StaggerType
  staggerDelay?: number
  baseDelay?: number
  duration?: number
  selector?: string
}

export function useAnimeStagger<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: StaggerOptions = {},
) {
  const { type = 'fade-up', staggerDelay = 60, baseDelay = 0, duration = 700, selector } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = selector ? Array.from(el.querySelectorAll(selector)) : Array.from(el.children)
    if (!targets.length) return

    // Set initial state
    targets.forEach((child) => {
      const c = child as HTMLElement
      switch (type) {
        case 'fade-up':
          Object.assign(c.style, { opacity: '0', transform: 'translateY(20px)' })
          break
        case 'fade-right':
          Object.assign(c.style, { opacity: '0', transform: 'translateX(-20px)' })
          break
        case 'scale-in':
          Object.assign(c.style, { opacity: '0', transform: 'scale(0.85)' })
          break
        case 'bounce-in':
          Object.assign(c.style, { opacity: '0', transform: 'scale(0) rotate(180deg)' })
          break
      }
    })

    const delayFn = stagger(staggerDelay, { start: baseDelay })

    switch (type) {
      case 'fade-up':
        animate(targets, { opacity: [0, 1], translateY: [20, 0], delay: delayFn, duration, ease: springBouncy })
        break
      case 'fade-right':
        animate(targets, { opacity: [0, 1], translateX: [-20, 0], delay: delayFn, duration, ease: springBouncy })
        break
      case 'scale-in':
        animate(targets, { opacity: [0, 1], scale: [0.85, 1], delay: delayFn, duration, ease: springBouncy })
        break
      case 'bounce-in':
        animate(targets, { opacity: [0, 1], scale: [0, 1], rotate: [180, 0], delay: delayFn, duration, ease: springBouncy })
        break
    }
  }, [])
}

// ── useAnimeHover ──

type HoverType = 'bounce' | 'wiggle' | 'scale' | 'lift'

interface HoverOptions {
  type?: HoverType
}

export function useAnimeHover<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: HoverOptions = {},
) {
  const { type = 'bounce' } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onEnter = () => {
      switch (type) {
        case 'bounce':
          animate(el, { scale: [1, 1.2, 1], duration: 500, ease: springSnappy })
          break
        case 'wiggle':
          animate(el, { rotate: [0, -12, 12, -8, 8, -4, 0], duration: 600, ease: 'outQuad' })
          break
        case 'scale':
          animate(el, { scale: 1.08, duration: 300, ease: springSnappy })
          break
        case 'lift':
          animate(el, { translateY: -3, scale: 1.02, duration: 300, ease: springGentle })
          break
      }
    }

    const onLeave = () => {
      animate(el, { scale: 1, translateY: 0, rotate: 0, duration: 400, ease: springGentle })
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])
}

// ── useAnimeClick ──

type ClickType = 'pop' | 'pulse' | 'shake'

interface ClickOptions {
  type?: ClickType
}

export function useAnimeClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: ClickOptions = {},
) {
  const { type = 'pop' } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onClick = () => {
      switch (type) {
        case 'pop':
          animate(el, { scale: [1, 1.3, 1], duration: 400, ease: springSnappy })
          break
        case 'pulse':
          animate(el, { scale: [1, 0.9, 1.05, 1], duration: 350, ease: 'outQuad' })
          break
        case 'shake':
          animate(el, { translateX: [0, -8, 8, -4, 4, 0], duration: 400, ease: 'outQuad' })
          break
      }
    }

    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [])
}

// ── useAnimeCounter ──

interface CounterOptions {
  duration?: number
  delay?: number
}

export function useAnimeCounter(
  targetValue: number,
  options: CounterOptions = {},
): RefObject<HTMLElement | null> {
  const { duration = 1200, delay = 0 } = options
  const ref = useRef<HTMLElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (targetValue === prevValue.current && prevValue.current !== 0) return

    const obj = { val: prevValue.current }
    animate(obj, {
      val: targetValue,
      duration,
      delay,
      ease: 'outExpo',
      onRender: () => {
        el.textContent = Math.round(obj.val).toString()
      },
    })

    prevValue.current = targetValue
  }, [targetValue, duration, delay])

  return ref
}

// ── useAnimeTableRows ──

export function useAnimeTableRows<T extends HTMLElement>(
  ref: RefObject<T | null>,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const rows = Array.from(el.querySelectorAll('tbody tr'))
    if (!rows.length) return

    animate(rows, {
      opacity: [0, 1],
      translateX: [30, 0],
      delay: stagger(40),
      duration: 500,
      ease: springSnappy,
    })
  }, deps)
}

// ── useAnimeWiggle ──

export function useAnimeWiggle<T extends HTMLElement>(): [RefObject<T | null>, () => void] {
  const ref = useRef<T>(null)

  const wiggle = useCallback(() => {
    if (!ref.current) return
    animate(ref.current, { rotate: [0, -15, 15, -10, 10, -5, 0], duration: 500, ease: 'outQuad' })
  }, [])

  return [ref, wiggle]
}

// ── useAnimePop ──

export function useAnimePop<T extends HTMLElement>(): [RefObject<T | null>, () => void] {
  const ref = useRef<T>(null)

  const pop = useCallback(() => {
    if (!ref.current) return
    animate(ref.current, { scale: [1, 1.3, 1], duration: 400, ease: springSnappy })
  }, [])

  return [ref, pop]
}
