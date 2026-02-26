import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

/* ── Inline SVG icons from Figma (Ionicons filled) ── */

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11.1415 1.06982C11.8035 0.945708 12.4864 0.966925 13.1415 1.13232L13.3056 1.17724C14.1205 1.4242 14.8316 1.9436 15.5751 2.47314L15.704 2.56591L19.8036 5.48193L19.8974 5.54833L20.3349 5.86181C20.765 6.1763 21.1681 6.50303 21.4921 6.91454L21.6259 7.09325C21.9265 7.51558 22.1545 7.98553 22.3007 8.4829L22.3661 8.73583C22.4965 9.32743 22.4914 9.93964 22.4911 10.5737V16.6431L22.4852 17.7212C22.4824 17.8883 22.478 18.0495 22.4716 18.2036L22.4452 18.646C22.3969 19.2362 22.2881 19.8524 21.9823 20.4526C21.5915 21.2192 20.9969 21.8616 20.2675 22.3091L19.9462 22.4888C19.4961 22.718 19.0371 22.8368 18.5868 22.9018L18.1395 22.9517C18.0202 22.9614 17.8968 22.9685 17.7704 22.9741L17.3808 22.9868C17.2856 22.9888 17.1585 22.992 17.0458 22.9849C16.9515 22.9789 16.8255 22.9635 16.6874 22.9165L16.5468 22.8579C16.3291 22.751 16.1445 22.5843 16.0165 22.3794L15.9647 22.2886C15.8656 22.0968 15.8384 21.9138 15.828 21.7895C15.8186 21.6766 15.8192 21.5482 15.8192 21.4507V14.1186C15.8192 12.9589 14.8794 12.019 13.7196 12.019H10.2948C9.13512 12.0191 8.19526 12.9589 8.19521 14.1186V21.4507C8.19521 21.5481 8.19579 21.6766 8.18642 21.7895C8.17865 21.8827 8.16103 22.0091 8.11122 22.147L8.0497 22.2886C7.93819 22.504 7.76713 22.6854 7.55947 22.8091L7.46865 22.8579C7.2765 22.9524 7.09504 22.9768 6.96962 22.9849L6.63466 22.9868C6.49926 22.9841 6.36625 22.9798 6.2372 22.9741L5.86122 22.9517C5.34458 22.9094 4.80827 22.8214 4.28017 22.5952L4.05458 22.4888C3.17816 22.0422 2.46513 21.3297 2.01845 20.4536C1.78954 20.0042 1.67086 19.5448 1.60536 19.0942L1.55458 18.646C1.53165 18.3653 1.52103 18.0551 1.51552 17.7202L1.50966 16.6431V10.5737C1.5093 9.85046 1.50238 9.15292 1.69911 8.4829L1.7665 8.27099C1.93634 7.78107 2.18786 7.32223 2.50868 6.91454L2.67665 6.71532C3.08328 6.26605 3.58553 5.91558 4.10243 5.54833L4.15712 5.51025C4.1732 5.49905 4.18563 5.49012 4.19716 5.48193L8.29677 2.56591L8.42568 2.47314L9.0165 2.05712C9.6049 1.65285 10.196 1.29992 10.8593 1.13232L11.1415 1.06982Z" fill="currentColor"/>
    </svg>
  )
}

function IconChatbubble({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 1C17.7866 1 22.4775 5.69095 22.4775 11.4775C22.4775 15.4577 20.2579 18.9189 16.9893 20.6924C14.5666 22.1167 11.7449 22.9365 8.73145 22.9365C6.87457 22.9365 5.08976 22.6261 3.42676 22.0547C2.74231 21.8192 2.60385 20.9291 3 20.3232C3.35581 19.7792 3.62235 19.1713 3.77832 18.5205C3.84462 18.2438 3.76109 17.9565 3.59082 17.7285C2.28718 15.9828 1.52246 13.8257 1.52246 11.4775C1.52251 5.69095 6.21339 1 12 1ZM7.00879 10.5312C6.18036 10.5312 5.50879 11.2028 5.50879 12.0312C5.50879 12.8597 6.18036 13.5312 7.00879 13.5312C7.8371 13.5311 8.50879 12.8596 8.50879 12.0312C8.50879 11.2029 7.8371 10.5314 7.00879 10.5312ZM12 10.5312C11.1716 10.5312 10.5 11.2028 10.5 12.0312C10.5 12.8597 11.1716 13.5312 12 13.5312C12.8284 13.5312 13.5 12.8597 13.5 12.0312C13.5 11.2028 12.8284 10.5312 12 10.5312ZM17.0088 10.5312C16.1804 10.5312 15.5088 11.2028 15.5088 12.0312C15.5088 12.8597 16.1804 13.5312 17.0088 13.5312C17.8371 13.5311 18.5088 12.8596 18.5088 12.0312C18.5088 11.2029 17.8371 10.5314 17.0088 10.5312Z" fill="currentColor"/>
    </svg>
  )
}

function IconCalculator({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 22C7.75736 22 5.63604 22 4.31802 20.5355C3 19.0711 3 16.714 3 12C3 7.28595 3 4.92893 4.31802 3.46447C5.63604 2 7.75736 2 12 2C16.2426 2 18.364 2 19.682 3.46447C21 4.92893 21 7.28595 21 12C21 16.714 21 19.0711 19.682 20.5355C18.364 22 16.2426 22 12 22ZM15 6H9C8.53501 6 8.30252 6 8.11177 6.05111C7.59413 6.18981 7.18981 6.59413 7.05111 7.11177C7 7.30252 7 7.53501 7 8C7 8.46499 7 8.69748 7.05111 8.88823C7.18981 9.40587 7.59413 9.81019 8.11177 9.94889C8.30252 10 8.53501 10 9 10H15C15.465 10 15.6975 10 15.8882 9.94889C16.4059 9.81019 16.8102 9.40587 16.9489 8.88823C17 8.69748 17 8.46499 17 8C17 7.53501 17 7.30252 16.9489 7.11177C16.8102 6.59413 16.4059 6.18981 15.8882 6.05111C15.6975 6 15.465 6 15 6ZM9 13C9 13.5523 8.55228 14 8 14C7.44772 14 7 13.5523 7 13C7 12.4477 7.44772 12 8 12C8.55228 12 9 12.4477 9 13ZM12 14C12.5523 14 13 13.5523 13 13C13 12.4477 12.5523 12 12 12C11.4477 12 11 12.4477 11 13C11 13.5523 11.4477 14 12 14ZM17 13C17 13.5523 16.5523 14 16 14C15.4477 14 15 13.5523 15 13C15 12.4477 15.4477 12 16 12C16.5523 12 17 12.4477 17 13ZM16 18C16.5523 18 17 17.5523 17 17C17 16.4477 16.5523 16 16 16C15.4477 16 15 16.4477 15 17C15 17.5523 15.4477 18 16 18ZM13 17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17C11 16.4477 11.4477 16 12 16C12.5523 16 13 16.4477 13 17ZM8 18C8.55228 18 9 17.5523 9 17C9 16.4477 8.55228 16 8 16C7.44772 16 7 16.4477 7 17C7 17.5523 7.44772 18 8 18Z" fill="currentColor"/>
    </svg>
  )
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.2656 0.99646C13.0953 0.996486 13.8934 1.31408 14.4971 1.88318L19.2324 6.34705C20.062 7.13468 20.5332 8.2275 20.5371 9.37146V16.7949C20.5371 17.7242 20.5374 18.4686 20.4883 19.0703C20.4378 19.6882 20.3319 20.2235 20.0811 20.7158C19.6794 21.5041 19.0383 22.1452 18.25 22.5469C17.7576 22.7978 17.2224 22.9036 16.6045 22.9541C16.0028 23.0033 15.2584 23.0039 14.3291 23.0039H10.6709C9.74156 23.0039 7.99721 23.0032 7.39551 22.9541C6.77759 22.9036 6.24238 22.7978 5.75 22.5469C4.96167 22.1452 4.32062 21.5042 3.91895 20.7158C3.6681 20.2235 3.5622 19.6882 3.51172 19.0703C3.46258 18.4686 3.46288 17.7243 3.46289 16.7949L3.46289 7.20544C3.46288 6.27612 3.46258 5.53176 3.51172 4.93005C3.5622 4.31217 3.6681 3.7769 3.91895 3.28455C4.32062 2.49621 4.96167 1.85518 5.75 1.45349C6.24238 1.20261 6.77759 1.09675 7.39551 1.04626C7.99721 0.997118 9.74156 0.996453 10.6709 0.99646H12.2656ZM6.80762 18.6729C6.35397 18.7191 6 19.1025 6 19.5684C6.0002 20.0341 6.35406 20.4177 6.80762 20.4639L6.89941 20.4688H14.4678C14.9647 20.4688 15.368 20.0652 15.3682 19.5684C15.3682 19.0713 14.9648 18.668 14.4678 18.668H6.89941L6.80762 18.6729ZM6.90039 15.165L6.80859 15.1699C6.35478 15.2159 6.00022 15.5995 6 16.0654C6 16.5315 6.35464 16.915 6.80859 16.9609L6.90039 16.9658H10.5449C11.0418 16.9656 11.4453 16.5624 11.4453 16.0654C11.4451 15.5687 11.0417 15.1652 10.5449 15.165H6.90039ZM11.4961 6.69177C11.4961 7.14463 11.4956 7.53039 11.5215 7.84705C11.5487 8.1798 11.6089 8.50437 11.7666 8.81384C12.0043 9.28009 12.3833 9.65919 12.8496 9.89685C13.159 10.0545 13.4828 10.1148 13.8154 10.142C14.1322 10.1678 14.5186 10.1674 14.9717 10.1674H18.998V9.48474C18.998 9.16813 18.998 9.00981 18.9639 8.82751C18.9382 8.69029 18.8729 8.48562 18.8145 8.35876C18.7368 8.19023 18.6699 8.0953 18.5361 7.90662C18.4143 7.73477 18.2855 7.5703 18.1729 7.46326L13.9717 3.4281C13.6286 3.09858 13.4571 2.93349 13.2588 2.8158C13.0831 2.71151 12.8923 2.63478 12.6934 2.58826C12.4688 2.53578 12.2306 2.53552 11.7549 2.53552H11.4961V6.69177Z" fill="currentColor"/>
    </svg>
  )
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M13.3884 20.1963C13.8936 20.1963 14.3178 20.6263 14.1745 21.124C13.8599 22.2165 13.0048 22.9998 11.9997 23C10.9944 23 10.1396 22.2165 9.82488 21.124C9.6816 20.6264 10.1049 20.1965 10.61 20.1963H13.3884Z" fill="currentColor"/>
      <path d="M11.9997 1C12.1913 1 12.3788 1.00564 12.5622 1.0166C15.082 1.16732 16.378 2.33122 17.3825 3.78418C18.3578 5.19494 18.6813 6.8246 18.6813 7.94629V11.3311C18.6813 12.3455 18.6929 12.6273 18.7741 12.875C18.7932 12.9332 18.8158 12.99 18.8405 13.0459C18.9456 13.284 19.1239 13.4982 19.7975 14.2402L19.8405 14.2881C20.3318 14.8292 20.7632 15.3043 21.0475 15.709C21.3219 16.0995 21.6653 16.7017 21.485 17.4141C21.4358 17.6087 21.3566 17.7941 21.2516 17.9639C20.8673 18.5853 20.2042 18.7386 19.7389 18.7988C19.257 18.8611 18.625 18.8604 17.905 18.8604H6.10711C5.3868 18.8604 4.75418 18.8612 4.27215 18.7988C3.80694 18.7386 3.14471 18.5851 2.76043 17.9639C2.65543 17.7941 2.57631 17.6087 2.52703 17.4141C2.3468 16.7017 2.69013 16.0995 2.96453 15.709C3.24888 15.3043 3.68026 14.8292 4.17156 14.2881L4.21453 14.2402C4.88813 13.4982 5.06648 13.284 5.17156 13.0459C5.19619 12.9901 5.21795 12.9331 5.23699 12.875C5.31821 12.6273 5.33074 12.3455 5.33074 11.3311V7.94629C5.33074 6.82458 5.65427 5.19496 6.62957 3.78418C7.63406 2.33122 8.91734 1.16732 11.4372 1.0166C11.6206 1.00564 11.8081 1 11.9997 1Z" fill="currentColor"/>
    </svg>
  )
}

function IconExit({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15.2422 3.36621C17.106 3.36621 18.0384 3.36642 18.7734 3.6709C19.7535 4.07689 20.5325 4.85587 20.9385 5.83594C21.2427 6.57094 21.2422 7.50287 21.2422 9.36621V14.6338C21.2422 16.4971 21.2427 17.4291 20.9385 18.1641C20.5325 19.1441 19.7535 19.9231 18.7734 20.3291C18.0384 20.6336 17.106 20.6338 15.2422 20.6338C13.3787 20.6338 12.4469 20.6336 11.7119 20.3291C10.7318 19.9231 9.95284 19.1442 9.54688 18.1641C9.24259 17.4291 9.24219 16.4972 9.24219 14.6338V12.8994H14.8359L13.0752 14.6602C12.7237 15.0116 12.7238 15.5821 13.0752 15.9336C13.4266 16.2848 13.9962 16.2847 14.3477 15.9336L17.6455 12.6357C17.9963 12.2843 17.9966 11.7146 17.6455 11.3633L14.3477 8.06641L14.2793 8.00391C13.9259 7.71598 13.4046 7.73731 13.0752 8.06641C12.7458 8.39595 12.7253 8.91708 13.0137 9.27051L13.0752 9.33887L14.8359 11.0996H9.24219V9.36621C9.24219 7.50285 9.24259 6.57095 9.54688 5.83594C9.95284 4.85585 10.7318 4.07688 11.7119 3.6709C12.4469 3.36644 13.3787 3.36621 15.2422 3.36621ZM9.24219 12.8994H4.33008L4.2373 12.8945C3.78376 12.8483 3.42988 12.4657 3.42969 12C3.42988 11.5343 3.78375 11.1507 4.2373 11.1045L4.33008 11.0996H9.24219V12.8994Z" fill="currentColor"/>
    </svg>
  )
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M20.5625 8.40039C20.9822 8.40039 21.3221 8.74053 21.3223 9.16016V16.3018C21.3221 18.9249 19.1955 21.0518 16.5723 21.0518H7.42676C4.8037 21.0516 2.67697 18.9248 2.67676 16.3018V9.16016C2.67688 8.74076 3.01711 8.40072 3.43652 8.40039H20.5625ZM9.55371 10.1914C8.30859 10.1914 7.50781 10.7676 7.19531 11.4561C7.12208 11.6221 7.08789 11.7637 7.08789 11.9297C7.08799 12.286 7.29795 12.5254 7.70801 12.5254C8.03972 12.5253 8.21102 12.4032 8.37207 12.0713C8.60156 11.5732 8.96289 11.3242 9.55859 11.3242C10.2712 11.3244 10.6523 11.7003 10.6523 12.2666C10.6522 12.8425 10.1734 13.243 9.43652 13.2432H9.14844C8.79199 13.2432 8.58691 13.458 8.58691 13.7656C8.58702 14.0829 8.79209 14.293 9.14844 14.293H9.45605C10.3103 14.2931 10.8135 14.674 10.8086 15.3574C10.8085 15.9431 10.3102 16.3631 9.58789 16.3633C8.85566 16.3633 8.47461 16.0701 8.22559 15.5771C8.07918 15.3087 7.89327 15.1915 7.60059 15.1914C7.19531 15.1914 6.95117 15.4307 6.95117 15.8115C6.95121 15.9579 6.9854 16.1143 7.06348 16.2754C7.39563 16.9686 8.22096 17.5498 9.56348 17.5498C11.1988 17.5496 12.3075 16.6999 12.3076 15.4209C12.3076 14.4494 11.6286 13.8341 10.5791 13.7363V13.707C11.4089 13.536 12.0487 12.9499 12.0488 12.0566C12.0488 10.9288 11.0427 10.1916 9.55371 10.1914ZM15.6279 10.2402C15.3253 10.2402 15.0907 10.2843 14.749 10.5186L13.3525 11.4854C13.123 11.6465 13.0352 11.8125 13.0352 12.0371C13.0353 12.3495 13.255 12.5645 13.5527 12.5645C13.7038 12.5644 13.8068 12.5302 13.9434 12.4326L14.9736 11.7148H15.0029V16.7588C15.003 17.203 15.3009 17.4961 15.7354 17.4961C16.1696 17.4959 16.4628 17.2028 16.4629 16.7588V11.0654C16.4629 10.5578 16.1501 10.2404 15.6279 10.2402Z" fill="currentColor"/>
      <path d="M16.1709 1.00098C16.5849 1.00111 16.9207 1.33703 16.9209 1.75098V2.4043H17.5811C19.6475 2.40455 21.3223 4.07999 21.3223 6.14648C21.3219 6.56443 20.9834 6.90315 20.5654 6.90332H3.43457C3.01672 6.90312 2.67711 6.56451 2.67676 6.14648C2.67676 4.07996 4.35246 2.40449 6.41895 2.4043H7.09863V1.75098C7.09886 1.33703 7.43467 1.00111 7.84863 1.00098C8.26271 1.00098 8.59841 1.33695 8.59863 1.75098V2.4043H15.4209V1.75098C15.4211 1.33695 15.7568 1.00098 16.1709 1.00098Z" fill="currentColor"/>
    </svg>
  )
}

function IconChevronBack({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M13.7107 5.26221C14.0621 4.91119 14.6318 4.91107 14.9831 5.26221C15.3343 5.61368 15.3344 6.18426 14.9831 6.53565L10.0144 11.5044C9.80612 11.7127 9.68802 11.8314 9.6091 11.9243C9.58537 11.9523 9.57124 11.9716 9.5632 11.9829C9.56151 11.9933 9.56158 12.0037 9.5632 12.0142C9.57119 12.0255 9.5851 12.0455 9.6091 12.0737C9.68803 12.1667 9.8062 12.2855 10.0144 12.4937L14.9831 17.4624L15.0446 17.5308C15.3328 17.8842 15.3123 18.4054 14.9831 18.7349C14.6538 19.0642 14.1325 19.0852 13.779 18.7974L13.7107 18.7349L8.74191 13.7671C8.55451 13.5797 8.3746 13.4008 8.23703 13.2388C8.09274 13.0688 7.94266 12.8582 7.85422 12.5864C7.73023 12.2048 7.73024 11.7932 7.85422 11.4116L7.93136 11.2192C8.01771 11.0373 8.12875 10.8868 8.23703 10.7593C8.37462 10.5972 8.55443 10.4184 8.74191 10.231L13.7107 5.26221Z" fill="currentColor"/>
    </svg>
  )
}

/* ── Nav config ── */

interface NavItem {
  icon: React.FC<{ className?: string }>
  label: string
  path?: string
  disabled?: boolean
}

const doctorNav: NavItem[] = [
  { icon: IconHome, label: 'Панель управления', path: '/doctor' },
  { icon: IconChatbubble, label: 'Сообщения', path: '/doctor/messages' },
  { icon: IconCalculator, label: 'Калькулятор ИОЛ', path: '/doctor/iol' },
  { icon: IconFile, label: 'Справочник МКБ-10', disabled: true },
  { icon: IconBell, label: 'Уведомления', disabled: true },
]

const surgeonNav: NavItem[] = [
  { icon: IconHome, label: 'Панель управления', path: '/surgeon' },
  { icon: IconChatbubble, label: 'Сообщения', path: '/surgeon/messages' },
  { icon: IconCalendar, label: 'Календарь операций', path: '/surgeon/calendar' },
  { icon: IconFile, label: 'Справочник МКБ-10', disabled: true },
  { icon: IconBell, label: 'Уведомления', disabled: true },
]

const AVATAR_GRADIENTS: Record<string, string> = {
  doctor: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), #34C759',
  surgeon: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), #007AFF',
}

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Врач-офтальмолог',
  surgeon: 'Хирург',
}

/** "Иванов Петр Сергеевич" → "Иванов П. С." */
function shortenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return fullName
  const lastName = parts[0]
  const initials = parts.slice(1).map((p) => `${p.charAt(0).toUpperCase()}.`).join(' ')
  return `${lastName} ${initials}`
}

/* ── Component ── */

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

function Sidebar({ onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [collapseHover, setCollapseHover] = useState(false)
  const [exitHover, setExitHover] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()
  const navigate = useNavigate()

  const role = user?.role ?? 'doctor'
  const navItems = role === 'surgeon' ? surgeonNav : doctorNav
  const initials = user?.full_name?.charAt(0).toUpperCase() ?? '?'

  return (
    <aside
      style={{
        width: collapsed ? 88 : 300,
        maxWidth: '85vw',
        padding: '24px 16px',
        gap: 24,
        transition: 'width 0.2s ease',
      }}
      className="relative flex flex-col shrink-0 h-screen bg-surface border-r border-border"
    >
      {/* ── Collapse toggle (desktop only) ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={() => setCollapseHover(true)}
        onMouseLeave={() => setCollapseHover(false)}
        className="hidden lg:flex absolute z-10 items-center justify-center cursor-pointer"
        style={{
          width: 32,
          height: 32,
          borderRadius: 9999,
          background: collapseHover ? '#f7f8fa' : 'white',
          border: '1px solid rgba(120,120,128,0.16)',
          boxShadow: '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)',
          right: -16,
          top: 88,
          transition: 'background 0.15s ease',
        }}
        title={collapsed ? 'Развернуть' : 'Свернуть'}
      >
        <div style={{ transform: collapsed ? 'rotate(180deg)' : undefined, display: 'flex' }}>
          <IconChevronBack className="shrink-0" />
        </div>
      </button>

      {/* ── Main content (flex-1) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 0 0', gap: 24, minHeight: 0 }}>
        {/* Avatar section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12, flexShrink: 0 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              background: AVATAR_GRADIENTS[role] ?? AVATAR_GRADIENTS.doctor,
              fontFamily: "'SF Pro Rounded', sans-serif",
              fontSize: 24.5,
              fontWeight: 800,
              lineHeight: '21px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', minWidth: 0 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: '20px',
                  letterSpacing: -0.33,
                  color: '#101012',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.full_name ? shortenName(user.full_name) : ''}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: '24px',
                  letterSpacing: -0.25,
                  color: 'rgba(60,60,67,0.72)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {ROLE_LABELS[role] ?? 'Пользователь'}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ width: '100%', height: 0, borderTop: '1px solid rgba(120,120,128,0.16)', flexShrink: 0 }} />

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navItems.map((item) => {
            const isActive = item.path
              ? item.path === '/doctor' || item.path === '/surgeon'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path)
              : false
            const Icon = item.icon

            return (
              <button
                key={item.label}
                onClick={() => { if (item.path && !item.disabled) { navigate(item.path); onClose?.() } }}
                onMouseEnter={() => !item.disabled && setHoveredNav(item.label)}
                onMouseLeave={() => setHoveredNav(null)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : undefined,
                  gap: 0,
                  padding: 16,
                  borderRadius: 16,
                  border: 'none',
                  width: '100%',
                  cursor: item.disabled ? 'default' : 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                  overflow: 'clip',
                  transition: 'background 0.15s ease, opacity 0.15s ease',
                  ...(isActive && !item.disabled
                    ? {
                        backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
                        boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)',
                        color: 'white',
                        opacity: hoveredNav === item.label ? 0.85 : 1,
                      }
                    : {
                        background: hoveredNav === item.label && !item.disabled ? 'rgba(120,120,128,0.08)' : 'transparent',
                        color: item.disabled ? 'rgba(60,60,67,0.36)' : '#101012',
                      }),
                }}
              >
                <Icon className="shrink-0" />
                {!collapsed && (
                  <span
                    style={{
                      padding: '0 8px',
                      lineHeight: '24px',
                      letterSpacing: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Exit button ── */}
      <button
        onClick={logout}
        onMouseEnter={() => setExitHover(true)}
        onMouseLeave={() => setExitHover(false)}
        title={collapsed ? 'Выйти из платформы' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : undefined,
          gap: 0,
          padding: 16,
          borderRadius: 16,
          border: 'none',
          width: '100%',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
          overflow: 'clip',
          backgroundColor: exitHover ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.12)',
          color: '#FF3B30',
          flexShrink: 0,
          transition: 'background-color 0.15s ease',
        }}
      >
        <IconExit className="shrink-0" />
        {!collapsed && (
          <span
            style={{
              padding: '0 8px',
              lineHeight: '24px',
              letterSpacing: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Выйти из платформы
          </span>
        )}
      </button>
    </aside>
  )
}

export default Sidebar
