import React, { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { RippleEffect } from './RippleEffect'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
        success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500',
        warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500',
        error: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
        link: 'bg-transparent underline-offset-4 hover:underline text-primary-500 hover:bg-transparent',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  enableRipple?: boolean
  rippleColor?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, enableRipple = true, rippleColor, children, onClick, type = 'button', ...props }, ref) => {
    const buttonContent = (
      <>
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </>
    )

    const buttonClasses = cn(buttonVariants({ variant, size, fullWidth, className }))

    // 根据变体自动选择波纹颜色
    const defaultRippleColor = rippleColor || (
      variant === 'outline' || variant === 'ghost'
        ? 'rgba(59, 130, 246, 0.3)'
        : 'rgba(255, 255, 255, 0.6)'
    )

    if (enableRipple && !isLoading && !props.disabled) {
      return (
        <RippleEffect
          as="button"
          color={defaultRippleColor}
          onClick={onClick}
          className={buttonClasses}
          disabled={isLoading || props.disabled}
          type={type}
          {...props}
          ref={ref}
        >
          {buttonContent}
        </RippleEffect>
      )
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={isLoading || props.disabled}
        onClick={onClick}
        type={type}
        {...props}
      >
        {buttonContent}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
