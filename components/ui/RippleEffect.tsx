import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface RippleProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  color?: string
  duration?: number
  onClick?: (e: React.MouseEvent) => void
  as?: 'div' | 'button'
  type?: 'button' | 'submit' | 'reset'
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

export const RippleEffect = React.forwardRef<HTMLElement, RippleProps & React.HTMLAttributes<HTMLElement>>(({
  children,
  className,
  disabled = false,
  color = 'rgba(255, 255, 255, 0.6)',
  duration = 600,
  onClick,
  as = 'div',
  type = 'button',
  ...props
}, ref) => {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const addRipple = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
      size,
    }

    setRipples(prev => [...prev, newRipple])

    // 移除波纹效果
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, duration)
  }, [duration])

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!disabled) {
      addRipple(event)
    }
    onClick?.(event)
  }, [addRipple, disabled, onClick])

  const commonProps = {
    className: cn('relative overflow-hidden', className),
    onClick: handleClick,
    disabled: as === 'button' ? disabled : undefined,
    ...props
  }

  const rippleElements = (
    <>
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
            transform: 'scale(0)',
            animation: `ripple ${duration}ms ease-out`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )

  if (as === 'button') {
    return (
      <button
        {...commonProps}
        type={type}
        ref={ref as React.Ref<HTMLButtonElement>}
      >
        {rippleElements}
      </button>
    )
  }

  return (
    <div {...commonProps} ref={ref as React.Ref<HTMLDivElement>}>
      {rippleElements}
    </div>
  )
})

RippleEffect.displayName = 'RippleEffect'

// 增强版按钮组件，集成波纹效果
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  rippleColor?: string
  children: React.ReactNode
}

export function RippleButton({
  variant = 'default',
  size = 'md',
  rippleColor,
  children,
  className,
  disabled,
  onClick,
  ...props
}: RippleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

  const variantClasses = {
    default: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary-500',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  // 根据变体自动选择波纹颜色
  const defaultRippleColor = rippleColor || (
    variant === 'outline' || variant === 'ghost'
      ? 'rgba(59, 130, 246, 0.3)'
      : 'rgba(255, 255, 255, 0.6)'
  )

  return (
    <RippleEffect
      color={defaultRippleColor}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </RippleEffect>
  )
}

// 卡片点击波纹效果
export function RippleCard({
  children,
  className,
  onClick,
  ...props
}: {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <RippleEffect
      color="rgba(59, 130, 246, 0.1)"
      duration={800}
      onClick={onClick}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </RippleEffect>
  )
}
