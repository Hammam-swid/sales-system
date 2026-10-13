import logoColor from '../assets/logos/logo-color.svg'
import logoWhite from '../assets/logos/logo-white.svg'
import { t } from '../i18n/ar'

interface LogoProps {
  // 'white' for navy, dark and gradient grounds; 'color' for white and light grounds.
  variant: 'white' | 'color'
  // Width in px. The design system's minimum is 96.
  width?: number
}

export function Logo({ variant, width = 96 }: LogoProps) {
  return (
    <img
      src={variant === 'white' ? logoWhite : logoColor}
      alt={t.brand}
      width={width}
      style={{ width, height: 'auto' }}
      draggable={false}
    />
  )
}
