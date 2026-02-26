import { useEffect, useRef, useCallback } from 'react'
import { animate, createSpring, stagger } from 'animejs'
import { Sparkles, Flame, Zap, CircleCheck, Video } from 'lucide-react'
import logoSvg from '../assets/logo-medmax.svg'
import heroHeart from '../assets/hero-heart.png'
import dashboardPreview from '../assets/dashboard-preview.png'
import dragndropPreview from '../assets/dragndrop-preview.png'
import teamAntonov from '../assets/team-antonov.png'
import teamVasilevV from '../assets/team-vasilev-v.png'
import teamVasilevA from '../assets/team-vasilev-a.png'
import teamVasilevE from '../assets/team-vasilev-e.png'

/* ─── Springs ─── */
const springBouncy = createSpring({ mass: 1, stiffness: 120, damping: 10, velocity: 0 })
const springSnappy = createSpring({ mass: 1, stiffness: 200, damping: 14, velocity: 0 })
const springGentle = createSpring({ mass: 1, stiffness: 80, damping: 12, velocity: 0 })

/* ─── Scroll-triggered animation hook ─── */
function useScrollReveal<T extends HTMLElement>(
  callback: (el: T) => void,
  threshold = 0.15,
) {
  const ref = useRef<T>(null)
  const fired = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Hide initially
    el.style.opacity = '0'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true
          callback(el)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

/* ─── Reusable content wrapper ─── */
const Content = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`w-full max-w-[1040px] mx-auto px-[16px] md:px-[24px] ${className}`}>{children}</div>
)

/* ─────────────────── Header ─────────────────── */

function Header() {
  const logoRef = useRef<HTMLImageElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const btnRef = useRef<HTMLAnchorElement>(null)

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
    if (textRef.current) {
      Object.assign(textRef.current.style, { opacity: '0', transform: 'translateX(-20px)' })
      animate(textRef.current, {
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 600,
        delay: 150,
        ease: springBouncy,
      })
    }
    if (btnRef.current) {
      Object.assign(btnRef.current.style, { opacity: '0', transform: 'translateY(-10px)' })
      animate(btnRef.current, {
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 600,
        delay: 300,
        ease: springBouncy,
      })
    }
  }, [])

  const handleBtnEnter = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement
    animate(el, { scale: [1, 1.05, 1], duration: 400, ease: springSnappy })
    const icon = el.querySelector('svg')
    if (icon) animate(icon, { rotate: [0, -15, 15, -10, 10, 0], duration: 600, ease: 'outQuad' })
  }, [])

  return (
    <header className="w-full py-[24px]">
      <div className="w-full max-w-[960px] mx-auto px-[16px] md:px-[24px] flex items-center justify-between">
        <div className="flex items-center gap-[12px]">
          <img ref={logoRef} src={logoSvg} alt="MedMAX" className="w-[48px] h-[48px]" />
          <span
            ref={textRef}
            className="text-[24px] font-semibold leading-[24px] tracking-[-1px] text-dark"
            style={{ fontFeatureSettings: "'ss01' 1" }}
          >
            MedMAX
          </span>
        </div>
        <a
          ref={btnRef}
          href="#contact"
          className="relative flex items-center gap-[8px] text-white font-medium text-[16px] leading-[24px] px-[16px] py-[8px] rounded-full cursor-pointer overflow-hidden"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #007aff 0%, #007aff 100%)',
          }}
          onMouseEnter={handleBtnEnter}
        >
          <span className="hidden sm:inline">Оставить заявку</span>
          <span className="sm:hidden">Заявка</span>
          <Sparkles size={24} />
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: 'inset 0 -1px 1px 0 rgba(16,16,18,0.12)' }} />
        </a>
      </div>
    </header>
  )
}

/* ─────────────────── Hero ─────────────────── */

function Hero() {
  const heartRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const screenshotRef = useRef<HTMLDivElement>(null)

  // Draggable heart state
  const dragging = useRef(false)
  const heartPos = useRef({ x: 0, y: 0 })
  const dragOffset = useRef({ x: 0, y: 0 })
  const originPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Title — fade up
    if (titleRef.current) {
      Object.assign(titleRef.current.style, { opacity: '0', transform: 'translateY(40px)' })
      animate(titleRef.current, {
        opacity: [0, 1],
        translateY: [40, 0],
        duration: 900,
        delay: 200,
        ease: springBouncy,
      })
    }

    // Heart — float in from right with rotation
    if (heartRef.current) {
      Object.assign(heartRef.current.style, { opacity: '0', transform: 'translateX(60px) rotate(20deg)' })
      animate(heartRef.current, {
        opacity: [0, 1],
        translateX: [60, 0],
        rotate: ['20deg', '0deg'],
        duration: 1000,
        delay: 400,
        ease: springGentle,
      })
    }

    // Buttons — stagger fade up
    if (buttonsRef.current) {
      const children = Array.from(buttonsRef.current.children) as HTMLElement[]
      children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(20px)' }))
      animate(children, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100, { start: 500 }),
        duration: 700,
        ease: springBouncy,
      })
    }

    // Screenshot — scale up from below
    if (screenshotRef.current) {
      Object.assign(screenshotRef.current.style, { opacity: '0', transform: 'translateY(60px) scale(0.95)' })
      animate(screenshotRef.current, {
        opacity: [0, 1],
        translateY: [60, 0],
        scale: [0.95, 1],
        duration: 1000,
        delay: 700,
        ease: springGentle,
      })
    }
  }, [])

  // Draggable heart — mouse & touch
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

      // Pickup: slight scale bounce
      animate(el, { scale: [1, 1.12], rotate: '5deg', duration: 300, ease: springSnappy })
      el.style.cursor = 'grabbing'
      el.style.zIndex = '50'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return

      const parent = el.parentElement
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()

      const x = e.clientX - parentRect.left - parentRect.width / 2 - dragOffset.current.x
      const y = e.clientY - parentRect.top - parentRect.height / 2 - dragOffset.current.y

      heartPos.current = { x, y }

      // Use spring animation for smooth trailing
      animate(el, {
        translateX: x,
        translateY: y,
        duration: 200,
        ease: springGentle,
      })
    }

    const onPointerUp = () => {
      if (!dragging.current) return
      dragging.current = false

      // Spring back to origin with a bouncy overshoot
      animate(el, {
        translateX: originPos.current.x,
        translateY: originPos.current.y,
        scale: [1.12, 0.9, 1.05, 1],
        rotate: ['5deg', '-8deg', '4deg', '0deg'],
        duration: 1000,
        ease: springBouncy,
      })

      heartPos.current = { x: 0, y: 0 }
      el.style.cursor = 'grab'
      el.style.zIndex = '10'
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

  // Floating idle animation — only when not dragging
  useEffect(() => {
    if (!heartRef.current) return
    const el = heartRef.current
    let cancelled = false

    const floatLoop = () => {
      if (cancelled || dragging.current) {
        if (!cancelled) setTimeout(floatLoop, 500)
        return
      }
      animate(el, {
        translateY: [heartPos.current.y, heartPos.current.y - 12, heartPos.current.y],
        rotate: ['0deg', '3deg', '-3deg', '0deg'],
        duration: 4000,
        ease: 'inOutSine' as unknown as string,
        onComplete: floatLoop,
      })
    }

    const timeout = setTimeout(floatLoop, 1400)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

  const handleBtnEnter = useCallback((e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement
    animate(el, { scale: [1, 1.05, 1], duration: 400, ease: springSnappy })
  }, [])

  return (
    <div className="relative w-full">
      <div className="relative pt-[32px] md:pt-[64px]">
        <div className="relative w-full max-w-[960px] mx-auto">
          <div
            ref={heartRef}
            className="absolute hidden md:block w-[200px] h-[200px] lg:w-[350px] lg:h-[350px] z-10 select-none"
            style={{ right: '-100px', top: '-56px', cursor: 'grab', touchAction: 'none' }}
          >
            <img
              src={heroHeart}
              alt=""
              className="w-full h-full pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-[24px] md:gap-[48px] w-full max-w-[960px] mx-auto px-[16px] md:px-[24px]">
          <h1
            ref={titleRef}
            className="text-[32px] sm:text-[44px] md:text-[56px] lg:text-[64px] font-medium leading-[1] tracking-[-2px] md:tracking-[-3px] text-center text-dark w-full"
            style={{ fontFeatureSettings: "'ss01' 1" }}
          >
            Цифровая платформа для удаленной подготовки пациентов к операциям
          </h1>

          <div ref={buttonsRef} className="flex flex-wrap justify-center items-start gap-[12px]">
            <a
              href="#features"
              className="flex items-center justify-center px-[16px] py-[8px] rounded-full font-medium text-[16px] leading-[24px] text-dark cursor-pointer"
              style={{ background: 'rgba(120,120,128,0.12)' }}
              onMouseEnter={handleBtnEnter}
            >
              Посмотреть возможности
            </a>
            <a
              href="#contact"
              className="relative flex items-center gap-[8px] text-white font-medium text-[16px] leading-[24px] px-[16px] py-[8px] rounded-full cursor-pointer overflow-hidden"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #007aff 0%, #007aff 100%)',
              }}
              onMouseEnter={handleBtnEnter}
            >
              <span>Оставить заявку</span>
              <Sparkles size={24} />
              <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: 'inset 0 -1px 1px 0 rgba(16,16,18,0.12)' }} />
            </a>
          </div>
        </div>

        <div ref={screenshotRef} className="relative w-full max-w-[960px] mx-auto mt-[32px] md:mt-[64px] px-[16px] md:px-[24px]">
          <div
            className="rounded-[20px] overflow-hidden"
            style={{
              border: '1px solid rgba(120,120,128,0.16)',
              boxShadow: '0 4px 2px 0 rgba(16,16,18,0.01), 0 2px 2px 0 rgba(16,16,18,0.02), 0 1px 1px 0 rgba(16,16,18,0.04), 0 0 1px 0 rgba(16,16,18,0.12)',
            }}
          >
            <img src={dashboardPreview} alt="MedMAX Dashboard" className="w-full block" />
          </div>

          <div
            className="absolute bottom-0 left-[-50vw] right-[-50vw] h-[250px] pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 100%)' }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── Совершенство для каждого ─────────────────── */

function Audience() {
  const items = [
    {
      icon: <Sparkles size={24} className="text-primary" />,
      title: 'Районные поликлиники',
      desc: 'Позволяем врачу сосредоточиться на пациенте — а не на документах',
    },
    {
      icon: <Flame size={24} className="text-primary" />,
      title: 'Межрайонные центры',
      desc: 'Даём хирургу полный контроль над качеством подготовки — дистанционно',
    },
    {
      icon: <Zap size={24} className="text-primary" />,
      title: 'Региональные Минздравы',
      desc: 'Повышаем пропускную способность без расширения коечного фонда',
    },
  ]

  const titleRef = useScrollReveal<HTMLHeadingElement>((el) => {
    animate(el, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      ease: springBouncy,
    })
  })

  const cardsRef = useScrollReveal<HTMLDivElement>((el) => {
    const children = Array.from(el.children) as HTMLElement[]
    children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(20px)' }))
    el.style.opacity = '1'
    animate(children, {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: stagger(120, { start: 100 }),
      duration: 700,
      ease: springBouncy,
    })

    // Bounce icons after cards appear
    setTimeout(() => {
      const icons = Array.from(el.querySelectorAll('svg'))
      if (icons.length) {
        animate(icons, {
          scale: [1, 1.3, 0.9, 1.1, 1],
          rotate: ['0deg', '360deg'],
          delay: stagger(80, { start: 0 }),
          duration: 800,
          ease: springBouncy,
        })
      }
    }, 400)
  })

  return (
    <section className="w-full bg-white py-[40px] md:py-[64px]">
      <Content className="flex flex-col items-center gap-[32px] md:gap-[64px]">
        <h2
          ref={titleRef}
          className="text-[32px] md:text-[48px] font-medium leading-[1] tracking-[-1.5px] md:tracking-[-2px] text-center text-dark"
          style={{ fontFeatureSettings: "'ss01' 1" }}
        >
          Совершенство для каждого
        </h2>
        <div ref={cardsRef} className="flex flex-col md:flex-row gap-[32px] md:gap-[64px] w-full">
          {items.map((item) => (
            <div key={item.title} className="flex-1 flex flex-col gap-[24px]">
              {item.icon}
              <div className="flex flex-col gap-[12px]">
                <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">
                  {item.title}
                </h3>
                <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Content>
    </section>
  )
}

/* ─────────────────── Features ─────────────────── */

function Features() {
  const titleRef = useScrollReveal<HTMLHeadingElement>((el) => {
    animate(el, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      ease: springBouncy,
    })
  })

  const colLeftRef = useScrollReveal<HTMLDivElement>((el) => {
    const children = Array.from(el.children) as HTMLElement[]
    children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(30px)' }))
    el.style.opacity = '1'
    animate(children, {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(150, { start: 0 }),
      duration: 800,
      ease: springBouncy,
    })
  })

  const colCenterRef = useScrollReveal<HTMLDivElement>((el) => {
    const children = Array.from(el.children) as HTMLElement[]
    children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(30px)' }))
    el.style.opacity = '1'
    animate(children, {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(150, { start: 150 }),
      duration: 800,
      ease: springBouncy,
    })
  })

  const colRightRef = useScrollReveal<HTMLDivElement>((el) => {
    const children = Array.from(el.children) as HTMLElement[]
    children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(30px)' }))
    el.style.opacity = '1'
    animate(children, {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(150, { start: 300 }),
      duration: 800,
      ease: springBouncy,
    })
  })

  return (
    <section id="features" className="w-full bg-white py-[40px] md:py-[64px]">
      <Content className="flex flex-col gap-[32px] md:gap-[64px]">
        <h2
          ref={titleRef}
          className="text-[28px] sm:text-[36px] md:text-[48px] font-medium leading-[1.1] md:leading-[48px] tracking-[-1.5px] md:tracking-[-2px] text-dark"
          style={{ fontFeatureSettings: "'ss01' 1" }}
        >
          <span style={{ color: 'rgba(60,60,67,0.52)' }}>От протокола к операции — быстрее.</span>
          <br />
          MedMAX — система подготовки, которая адаптируется под клинику
        </h2>

        <div className="flex flex-col md:flex-row gap-[24px] md:gap-[48px] w-full">
          {/* Left column */}
          <div ref={colLeftRef} className="flex-1 flex flex-col gap-[24px] md:gap-[48px] min-w-0">
            <FeatureCard height="md:h-[350px]" gap="gap-[36px]">
              <div className="flex flex-col gap-[12px]">
                <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">Чаты и видеозвонки</h3>
                <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">Консультации с хирургом в реальном времени</p>
              </div>
              <VideoCallModal />
            </FeatureCard>

            <FeatureCard>
              <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">Telegram-бот</h3>
              <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">Уведомления и напоминания для клиентов</p>
            </FeatureCard>
          </div>

          {/* Center column */}
          <div ref={colCenterRef} className="flex-1 flex flex-col gap-[24px] md:gap-[48px] min-w-0">
            <FeatureCard>
              <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">Офлайн-режим</h3>
              <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">Заполняйте карточки и файлы без интернета</p>
            </FeatureCard>

            <FeatureCard height="md:h-[350px]" gap="gap-[36px]">
              <div className="flex flex-col gap-[12px]">
                <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">Календарь хирурга</h3>
                <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">Удобный календарь для планирования операций</p>
              </div>
              <CalendarWidget />
            </FeatureCard>
          </div>

          {/* Right column */}
          <div ref={colRightRef} className="flex-1 flex flex-col gap-[24px] md:gap-[48px] min-w-0">
            <FeatureCard height="md:h-[350px]" justify="justify-between">
              <img src={dragndropPreview} alt="Drag and drop" className="w-full h-[186px] object-contain" />
              <div className="flex flex-col gap-[12px]">
                <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">Загрузка снимков</h3>
                <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">Планирование операций, назначение, контроль загрузки.</p>
              </div>
            </FeatureCard>

            <FeatureCard>
              <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">Калькулятор ИОЛ</h3>
              <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">Автоматический расчёт линзы по формулам</p>
            </FeatureCard>
          </div>
        </div>
      </Content>
    </section>
  )
}

/* ── Feature card with hover lift ── */

function FeatureCard({
  children,
  height = '',
  gap = 'gap-[12px]',
  justify = '',
}: {
  children: React.ReactNode
  height?: string
  gap?: string
  justify?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onEnter = useCallback(() => {
    if (ref.current) {
      animate(ref.current, { translateY: -4, scale: 1.01, duration: 300, ease: springGentle })
    }
  }, [])

  const onLeave = useCallback(() => {
    if (ref.current) {
      animate(ref.current, { translateY: 0, scale: 1, duration: 400, ease: springGentle })
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`rounded-[28px] overflow-hidden p-[24px] flex flex-col ${gap} ${height} ${justify}`}
      style={{ background: '#f7f8fa', border: '1px solid rgba(120,120,128,0)' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}

/* ── Video call modal (feature card illustration) ── */

function VideoCallModal() {
  return (
    <div
      className="rounded-[28px] p-[22px] flex flex-col items-center gap-[22px] self-center"
      style={{
        background: 'white',
        border: '1px solid rgba(120,120,128,0.16)',
        boxShadow: '0 4px 2px 0 rgba(16,16,18,0.01), 0 2px 2px 0 rgba(16,16,18,0.02), 0 1px 1px 0 rgba(16,16,18,0.04), 0 0 1px 0 rgba(16,16,18,0.12)',
      }}
    >
      <div className="flex items-center gap-[5px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>
        <span className="text-[10px] font-normal leading-[14px] tracking-[-0.19px]" style={{ color: '#34c759' }}>Соединение установлено</span>
      </div>
      <div className="flex flex-col items-center gap-[14px]">
        <div
          className="w-[64px] h-[64px] rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), #ffd000' }}
        >
          <span className="text-[28px] font-bold text-white">В</span>
        </div>
        <div className="flex flex-col items-center gap-[7px]">
          <p className="text-[14px] font-medium leading-[21px] text-dark">Васильев В. А.</p>
          <p className="text-[10px] font-normal leading-[14px] tracking-[-0.19px]" style={{ color: '#34c759' }}>Звонок 01:17</p>
        </div>
      </div>
      <div className="flex items-start gap-[5px]">
        <div className="flex items-center justify-center p-[10px] rounded-[10px]" style={{ background: 'rgba(120,120,128,0.12)' }}>
          <Video size={14} className="text-dark" />
        </div>
        <div
          className="relative flex items-center gap-[5px] px-[10px] py-[10px] rounded-[10px] overflow-hidden"
          style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #ff3b30 0%, #ff3b30 100%)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span className="text-[10px] font-medium text-white leading-[14px]">Завершить звонок</span>
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: 'inset 0 -0.75px 0.75px 0 rgba(16,16,18,0.12)' }} />
        </div>
      </div>
    </div>
  )
}

/* ── Calendar widget (feature card illustration) ── */

function CalendarWidget() {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const weeks = [
    [28, 29, 30, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
  ]

  return (
    <div
      className="rounded-[12px] p-[12px] w-full"
      style={{
        background: 'white',
        border: '0.7px solid rgba(120,120,128,0.16)',
        boxShadow: '0 4px 2px 0 rgba(16,16,18,0.01), 0 2px 2px 0 rgba(16,16,18,0.02), 0 1px 1px 0 rgba(16,16,18,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-[8px]">
        <span className="text-[13px] font-medium leading-[18px] text-dark">Март, 2026</span>
        <div className="flex gap-[4px]">
          <button className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[11px] text-text-secondary" style={{ background: 'rgba(120,120,128,0.12)' }}>‹</button>
          <button className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-[11px] text-text-secondary" style={{ background: 'rgba(120,120,128,0.12)' }}>›</button>
        </div>
      </div>
      <table className="w-full text-center border-separate" style={{ borderSpacing: '0 2px' }}>
        <thead>
          <tr>
            {days.map((d) => (
              <th key={d} className="text-[11px] font-medium py-[4px]" style={{ color: 'rgba(60,60,67,0.52)' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                const isPrevMonth = wi === 0 && day > 20
                const isSelected = day === 15 && wi === 2
                return (
                  <td key={di} className="py-[2px]">
                    <span
                      className="inline-flex items-center justify-center w-[24px] h-[24px] text-[12px] font-medium rounded-full"
                      style={{
                        background: isSelected ? '#101012' : 'transparent',
                        color: isSelected ? 'white' : isPrevMonth ? 'rgba(60,60,67,0.36)' : '#101012',
                      }}
                    >
                      {day}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─────────────────── Team ─────────────────── */

function Team() {
  const members = [
    { name: 'Антонов Алексей', role: 'Продуктовый менеджер', photo: teamAntonov },
    { name: 'Васильев Владлен', role: 'Продуктовый дизайнер', photo: teamVasilevV },
    { name: 'Васильев Андрей', role: 'Фуллстэк разработчик', photo: teamVasilevA },
    { name: 'Васильев Эрхан', role: 'Фронтэнд разработчик', photo: teamVasilevE },
  ]

  const titleRef = useScrollReveal<HTMLDivElement>((el) => {
    animate(el, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      ease: springBouncy,
    })
  })

  const gridRef = useScrollReveal<HTMLDivElement>((el) => {
    const children = Array.from(el.children) as HTMLElement[]
    children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(40px) scale(0.95)' }))
    el.style.opacity = '1'
    animate(children, {
      opacity: [0, 1],
      translateY: [40, 0],
      scale: [0.95, 1],
      delay: stagger(100, { start: 100 }),
      duration: 800,
      ease: springBouncy,
    })
  })

  return (
    <section className="w-full bg-white py-[40px] md:py-[64px]">
      <Content className="flex flex-col items-center gap-[32px] md:gap-[64px]">
        <div ref={titleRef} className="flex flex-col items-center gap-[16px] md:gap-[24px] max-w-[488px] text-center">
          <h2
            className="text-[32px] md:text-[48px] font-medium leading-[1] tracking-[-1.5px] md:tracking-[-2px] text-dark"
            style={{ fontFeatureSettings: "'ss01' 1" }}
          >
            Команда
          </h2>
          <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text-secondary">
            Мы собрались на один хакатон, чтобы решить проблему, с которой сами сталкивались годами, а так же раздать ауры
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-[16px] md:gap-[48px] w-full">
          {members.map((member) => (
            <TeamMember key={member.name} member={member} />
          ))}
        </div>
      </Content>
    </section>
  )
}

function TeamMember({ member }: { member: { name: string; role: string; photo: string } }) {
  const ref = useRef<HTMLDivElement>(null)

  const onEnter = useCallback(() => {
    if (!ref.current) return
    animate(ref.current, { translateY: -6, scale: 1.02, duration: 300, ease: springGentle })
    const img = ref.current.querySelector('img')
    if (img) animate(img, { scale: [1, 1.05], duration: 400, ease: springGentle })
  }, [])

  const onLeave = useCallback(() => {
    if (!ref.current) return
    animate(ref.current, { translateY: 0, scale: 1, duration: 400, ease: springGentle })
    const img = ref.current.querySelector('img')
    if (img) animate(img, { scale: [1.05, 1], duration: 400, ease: springGentle })
  }, [])

  return (
    <div
      ref={ref}
      className="flex flex-col gap-[16px] md:gap-[24px] min-w-0 cursor-pointer"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        className="h-[200px] md:h-[300px] rounded-[20px] md:rounded-[28px] overflow-hidden relative"
        style={{ border: '1px solid rgba(120,120,128,0)' }}
      >
        <div className="absolute inset-0 bg-surface-secondary rounded-[20px] md:rounded-[28px]" />
        <img
          src={member.photo}
          alt={member.name}
          className="absolute inset-0 w-full h-full object-cover rounded-[20px] md:rounded-[28px]"
        />
      </div>
      <div className="flex flex-col gap-[4px] md:gap-[8px]">
        <p className="text-[16px] md:text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-dark">{member.name}</p>
        <p className="text-[14px] md:text-[16px] font-normal leading-[20px] md:leading-[24px] tracking-[-0.25px] text-text-secondary">{member.role}</p>
      </div>
    </div>
  )
}

/* ─────────────────── Pricing ─────────────────── */

function Pricing() {
  const plans = [
    {
      name: 'Базовый',
      desc: 'Описание тарифа',
      price: '15, 000 ₽ / мес',
      features: ['Какое-то преимущество', 'Какое-то преимущество', 'Какое-то преимущество'],
      bg: '#f7f8fa',
      textColor: '#101012',
      descColor: 'rgba(60,60,67,0.72)',
      featureColor: '#101012',
      checkColor: 'rgba(60,60,67,0.52)',
      dividerColor: 'rgba(120,120,128,0.16)',
      buttonStyle: {
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #101012 0%, #101012 100%)',
      } as React.CSSProperties,
      buttonTextColor: 'white',
    },
    {
      name: 'Расширенный',
      desc: 'Описание тарифа',
      price: '25, 000 ₽ / мес',
      features: ['Какое-то преимущество', 'Какое-то преимущество', 'Какое-то преимущество'],
      bg: 'rgba(0,122,255,0.12)',
      textColor: '#101012',
      descColor: 'rgba(60,60,67,0.72)',
      featureColor: '#101012',
      checkColor: '#007aff',
      dividerColor: 'rgba(120,120,128,0.16)',
      buttonStyle: {
        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #007aff 0%, #007aff 100%)',
      } as React.CSSProperties,
      buttonTextColor: 'white',
    },
    {
      name: 'Максимальный',
      desc: 'Описание тарифа',
      price: '50, 000 ₽ / мес',
      features: ['Какое-то преимущество', 'Какое-то преимущество', 'Какое-то преимущество'],
      bg: '#101012',
      textColor: 'white',
      descColor: 'rgba(176,176,185,0.72)',
      featureColor: 'white',
      checkColor: '#34c759',
      dividerColor: 'rgba(255,255,255,0.12)',
      buttonStyle: {
        background: 'white',
      } as React.CSSProperties,
      buttonTextColor: '#101012',
    },
  ]

  const titleRef = useScrollReveal<HTMLHeadingElement>((el) => {
    animate(el, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      ease: springBouncy,
    })
  })

  const cardsRef = useScrollReveal<HTMLDivElement>((el) => {
    const children = Array.from(el.children) as HTMLElement[]
    children.forEach((c) => Object.assign(c.style, { opacity: '0', transform: 'translateY(40px) scale(0.95)' }))
    el.style.opacity = '1'
    animate(children, {
      opacity: [0, 1],
      translateY: [40, 0],
      scale: [0.95, 1],
      delay: stagger(120, { start: 100 }),
      duration: 800,
      ease: springBouncy,
    })
  })

  return (
    <section id="pricing" className="w-full bg-white py-[40px] md:py-[64px]">
      <Content className="flex flex-col items-center gap-[32px] md:gap-[64px]">
        <h2
          ref={titleRef}
          className="text-[32px] md:text-[48px] font-medium leading-[1] tracking-[-1.5px] md:tracking-[-2px] text-center text-dark"
          style={{ fontFeatureSettings: "'ss01' 1" }}
        >
          Тарифы
        </h2>

        <div ref={cardsRef} className="flex flex-col md:flex-row gap-[24px] md:gap-[48px] w-full">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </Content>
    </section>
  )
}

function PricingCard({ plan }: { plan: {
  name: string; desc: string; price: string; features: string[]
  bg: string; textColor: string; descColor: string; featureColor: string
  checkColor: string; dividerColor: string; buttonStyle: React.CSSProperties; buttonTextColor: string
} }) {
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLDivElement>(null)

  const onEnter = useCallback(() => {
    if (ref.current) animate(ref.current, { translateY: -6, scale: 1.02, duration: 300, ease: springGentle })
  }, [])

  const onLeave = useCallback(() => {
    if (ref.current) animate(ref.current, { translateY: 0, scale: 1, duration: 400, ease: springGentle })
  }, [])

  const onBtnEnter = useCallback(() => {
    if (btnRef.current) animate(btnRef.current, { scale: [1, 1.04, 1], duration: 350, ease: springSnappy })
  }, [])

  return (
    <div
      ref={ref}
      className="flex-1 md:h-[500px] rounded-[24px] md:rounded-[28px] overflow-hidden p-[20px] md:p-[24px] flex flex-col justify-between gap-[24px] md:gap-0 min-w-0"
      style={{ background: plan.bg, border: '1px solid rgba(120,120,128,0)' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col gap-[8px]">
          <h3 className="text-[20px] font-medium leading-[20px] tracking-[-0.33px]" style={{ color: plan.textColor }}>{plan.name}</h3>
          <p className="text-[16px] font-normal leading-[24px] tracking-[-0.25px]" style={{ color: plan.descColor }}>{plan.desc}</p>
        </div>
        <div className="w-full h-px" style={{ background: plan.dividerColor }} />
        <p className="text-[24px] font-medium leading-[24px] tracking-[-0.5px]" style={{ color: plan.textColor, fontFeatureSettings: "'ss01' 1" }}>{plan.price}</p>
        <div className="w-full h-px" style={{ background: plan.dividerColor }} />
        <div className="flex flex-col gap-[16px]">
          {plan.features.map((feat, i) => (
            <div key={i} className="flex items-center gap-[8px]">
              <CircleCheck size={24} className="shrink-0" style={{ color: plan.checkColor }} />
              <span className="text-[14px] font-medium leading-[12px]" style={{ color: plan.featureColor }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={btnRef}
        className="relative w-full flex items-center justify-center p-[12px] rounded-[16px] overflow-hidden cursor-pointer"
        style={plan.buttonStyle}
        onMouseEnter={onBtnEnter}
      >
        <span className="text-[16px] font-medium leading-[24px] text-center" style={{ color: plan.buttonTextColor }}>Выбрать тариф</span>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ boxShadow: 'inset 0 -1px 1px 0 rgba(16,16,18,0.12)' }} />
      </div>
    </div>
  )
}

/* ─────────────────── Footer ─────────────────── */

function Footer() {
  const ref = useScrollReveal<HTMLDivElement>((el) => {
    animate(el, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 700,
      ease: springBouncy,
    })
  })

  return (
    <footer className="w-full bg-white" style={{ borderTop: '1px solid rgba(120,120,128,0.16)' }}>
      <Content>
        <div ref={ref} className="flex flex-col sm:flex-row items-center justify-between gap-[24px] py-[40px] md:py-[64px]">
          <div className="flex items-center gap-[12px]">
            <img src={logoSvg} alt="MedMAX" className="w-[48px] h-[48px]" />
            <span
              className="text-[24px] font-semibold leading-[24px] tracking-[-1px] text-dark"
              style={{ fontFeatureSettings: "'ss01' 1" }}
            >
              MedMAX
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-[12px] sm:gap-[24px] text-[14px] sm:text-[16px] font-medium leading-[24px] text-text-secondary">
            <a href="#" className="hover:text-dark transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-dark transition-colors">Условия пользования</a>
          </div>
        </div>
      </Content>
    </footer>
  )
}

/* ─────────────────── Landing Page ─────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <Hero />
      <Audience />
      <Features />
      <Team />
      <Pricing />
      <Footer />
    </div>
  )
}
