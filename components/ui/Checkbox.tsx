import React, { InputHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  indeterminate?: boolean
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, indeterminate, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = !!indeterminate
      }
    }, [indeterminate])

    const handleRef = React.useCallback((el: HTMLInputElement | null) => {
      // 使用 Object.defineProperty 来避免只读属性错误
      if (internalRef.current !== el) {
        Object.defineProperty(internalRef, 'current', {
          value: el,
          writable: true,
          configurable: true
        })
      }
      if (typeof ref === 'function') {
        ref(el)
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
      }
    }, [ref])

    return (
      <div className="flex items-start mb-4">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500',
              error ? 'border-error-300 focus:ring-error-500' : '',
              className
            )}
            ref={handleRef}
            {...props}
          />
        </div>
        <div className="ml-3 text-sm">
          {label && (
            <label
              htmlFor={props.id}
              className={cn(
                'font-medium text-gray-700',
                props.disabled ? 'opacity-70' : ''
              )}
            >
              {label}
            </label>
          )}
          {error && <p className="text-error-600">{error}</p>}
          {helperText && !error && <p className="text-gray-500">{helperText}</p>}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
