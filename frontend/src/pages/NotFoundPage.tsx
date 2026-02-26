import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { animate, createSpring } from 'animejs'
import { Sparkles } from 'lucide-react'
import logoSvg from '../assets/logo-medmax.svg'
import heroHeart from '../assets/hero-heart.png'

const springBouncy = createSpring({ mass: 1, stiffness: 120, damping: 10, velocity: 0 })
const springSnappy = createSpring({ mass: 1, stiffness: 200, damping: 14, velocity: 0 })
const springGentle = createSpring({ mass: 1, stiffness: 80, damping: 12, velocity: 0 })

export default function NotFoundPage() {
  const navigate = useNavigate()

  const logoRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const heartRef = useRef<HTMLDivElement>(null)

  // Draggable heart
  const dragging = useRef(false)
  const heartPos = useRef({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })

  // Entrance animations
  useEffect(() => {
    if (logoRef.current) {
      Object.assign(logoRef.current.style, { opacity: '0', transform: 'scale(0) rotate(-30deg)' })
      animate(logoRef.current, {
        opacity: [0, 1],
        scale: [0, 1],
        rotate: ['-30deg', '0deg'],
        duration: 800,
        ease: springBouncy,
      })
    }

    if (numberRef.current) {
      Object.assign(numberRef.current.style, { opacity: '0', transform: 'translateY(50px) scale(0.8)' })
      animate(numberRef.current, {
        opacity: [0, 1],
        translateY: [50, 0],
        scale: [0.8, 1],
        duration: 1000,
        delay: 200,
        ease: springBouncy,
      })
    }

    if (textRef.current) {
      Object.assign(textRef.current.style, { opacity: '0', transform: 'translateY(20px)' })
      animate(textRef.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
        delay: 500,
        ease: springBouncy,
      })
    }

    if (buttonsRef.current) {
      const children = Array.from(buttonsRef.current.children) as HTMLElement[]
      children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(20px)' }))
      animate(children, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: (_, i) => 650 + i * 100,
        duration: 700,
        ease: springBouncy,
      })
    }

    if (heartRef.current) {
      Object.assign(heartRef.current.style, { opacity: '0', transform: 'translateX(80px) rotate(25deg)' })
      animate(heartRef.current, {
        opacity: [0, 1],
        translateX: [80, 0],
        rotate: ['25deg', '0deg'],
        duration: 1000,
        delay: 400,
        ease: springGentle,
      })
    }
  }, [])

  // Draggable heart — pointer events
  useEffect(() => {
    const el = heartRef.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      dragging.current = true
      el.setPointerCapture(e.pointerId)

      const rect = el.getBoundingClientRect()
      dragOffset.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      }

      animate(el, { scale: [1, 1.15], rotate: '8deg', duration: 300, ease: springSnappy })
      el.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const parent = el.parentElement
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()

      const x = e.clientX - parentRect.left - parentRect.width / 2 - dragOffset.current.x
      const y = e.clientY - parentRect.top - parentRect.height / 2 - dragOffset.current.y

      heartPos.current = { x, y }
      animate(el, { translateX: x, translateY: y, duration: 200, ease: springGentle })
    }

    const onPointerUp = () => {
      if (!dragging.current) return
      dragging.current = false

      animate(el, {
        translateX: 0,
        translateY: 0,
        scale: [1.15, 0.85, 1.08, 1],
        rotate: ['8deg', '-10deg', '5deg', '0deg'],
        duration: 1000,
        ease: springBouncy,
      })

      heartPos.current = { x: 0, y: 0 }
      el.style.cursor = 'grab'
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  // Idle floating
  useEffect(() => {
    const el = heartRef.current
    if (!el) return
    let cancelled = false

    const floatLoop = () => {
      if (cancelled || dragging.current) {
        if (!cancelled) setTimeout(floatLoop, 500)
        return
      }
      animate(el, {
        translateY: [heartPos.current.y, heartPos.current.y - 14, heartPos.current.y],
        rotate: ['0deg', '4deg', '-4deg', '0deg'],
        duration: 3500,
        ease: 'inOutSine' as unknown as string,
        onComplete: floatLoop,
      })
    }

    const timeout = setTimeout(floatLoop, 1400)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

  // Continuous subtle pulse on 404
  useEffect(() => {
    if (!numberRef.current) return
    const el = numberRef.current
    let cancelled = false

    const pulseLoop = () => {
      if (cancelled) return
      animate(el, {
        scale: [1, 1.02, 1],
        duration: 3000,
        ease: 'inOutSine' as unknown as string,
        onComplete: pulseLoop,
      })
    }

    const timeout = setTimeout(pulseLoop, 1500)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

  const handleBtnEnter = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement
    animate(el, { scale: [1, 1.05, 1], duration: 400, ease: springSnappy })
    const icon = el.querySelector('svg')
    if (icon) animate(icon, { rotate: [0, -15, 15, -10, 10, 0], duration: 600, ease: 'outQuad' })
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-hidden flex flex-col items-center justify-center relative">
      {/* Decorative heart */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          ref={heartRef}
          className="absolute w-[300px] h-[300px] select-none pointer-events-auto"
          style={{ right: 'calc(50% - 420px)', top: 'calc(50% - 240px)', cursor: 'grab', touchAction: 'none' }}
        >
          <img src={heroHeart} alt="" className="w-full h-full pointer-events-none" draggable={false} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-[48px] px-[24px]">
        {/* Logo */}
        <div ref={logoRef} className="flex items-center gap-[12px]">
          <img src={logoSvg} alt="MedMAX" className="w-[48px] h-[48px]" />
          <span
            className="text-[24px] font-semibold leading-[24px] tracking-[-1px] text-dark"
            style={{ fontFeatureSettings: "'ss01' 1" }}
          >
            MedMAX
          </span>
        </div>

        {/* 404 number */}
        <h1
          ref={numberRef}
          className="text-[160px] font-bold leading-[1] tracking-[-8px] text-dark"
          style={{ fontFeatureSettings: "'ss01' 1" }}
        >
          404
        </h1>

        {/* Description */}
        <p
          ref={textRef}
          className="text-[20px] font-normal leading-[28px] tracking-[-0.33px] text-text-secondary text-center max-w-[480px]"
        >
          Страница не найдена. Возможно, она была перемещена или больше не существует.
        </p>

        {/* Buttons */}
        <div ref={buttonsRef} className="flex items-center gap-[12px]">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center px-[16px] py-[8px] rounded-full font-medium text-[16px] leading-[24px] text-dark cursor-pointer"
            style={{ background: 'rgba(120,120,128,0.12)' }}
            onMouseEnter={handleBtnEnter}
          >
            Назад
          </button>
          <button
            onClick={() => navigate('/')}
            className="relative flex items-center gap-[8px] text-white font-medium text-[16px] leading-[24px] px-[16px] py-[8px] rounded-full cursor-pointer overflow-hidden"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #007aff 0%, #007aff 100%)',
            }}
            onMouseEnter={handleBtnEnter}
          >
            <span>На главную</span>
            <Sparkles size={20} />
            <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: 'inset 0 -1px 1px 0 rgba(16,16,18,0.12)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
