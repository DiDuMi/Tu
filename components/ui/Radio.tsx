import React, { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="flex items-start mb-4">
        <div className="flex items-center h-5">
          <input
            type="radio"
            className={cn(
              'h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500',
              error ? 'border-error-300 focus:ring-error-500' : '',
              className
            )}
            ref={ref}
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

Radio.displayName = 'Radio'

export interface RadioGroupProps {
  name: string
  options: Array<{
    value: string
    label: string
    disabled?: boolean
  }>
  value?: string
  onChange?: (value: string) => void
  label?: string
  error?: string
  helperText?: string
  className?: string
  inline?: boolean
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      name,
      options,
      value,
      onChange,
      label,
      error,
      helperText,
      className,
      inline = false,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    return (
      <div className={cn('mb-4', className)} ref={ref} {...props}>
        {label && (
          <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
        )}
        <div className={cn(inline ? 'flex flex-wrap gap-4' : 'space-y-2')}>
          {options.map((option) => (
            <Radio
              key={option.value}
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              label={option.label}
              disabled={option.disabled}
            />
          ))}
        </div>
        {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'

export { Radio, RadioGroup }
