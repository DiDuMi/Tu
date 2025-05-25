import { useState, useCallback, ChangeEvent, FormEvent } from 'react'
import { z } from 'zod'

type FormErrors<T> = Partial<Record<keyof T, string>>

interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: z.ZodType<T>
  onSubmit?: (values: T) => void | Promise<void>
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target
      const newValue = type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value

      setValues((prev) => ({
        ...prev,
        [name]: newValue,
      }))

      // 如果字段已经被触摸过，则在值变化时重新验证
      if (touched[name as keyof T] && validationSchema) {
        try {
          const fieldSchema = z.object({ [name]: (validationSchema as any).shape[name] })
          fieldSchema.parse({ [name]: newValue })
          setErrors((prev) => ({
            ...prev,
            [name]: undefined,
          }))
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldError = error.errors.find((err) => err.path[0] === name)
            if (fieldError) {
              setErrors((prev) => ({
                ...prev,
                [name]: fieldError.message,
              }))
            }
          }
        }
      }
    },
    [touched, validationSchema]
  )

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))

    // 在失去焦点时验证字段
    if (validationSchema) {
      try {
        const fieldSchema = z.object({ [name]: (validationSchema as any).shape[name] })
        fieldSchema.parse({ [name]: values[name] })
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }))
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find((err) => err.path[0] === name)
          if (fieldError) {
            setErrors((prev) => ({
              ...prev,
              [name]: fieldError.message,
            }))
          }
        }
      }
    }
  }, [values, validationSchema])

  const validateForm = useCallback(() => {
    if (!validationSchema) return true

    try {
      validationSchema.parse(values)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors<T> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof T
          newErrors[field] = err.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }, [values, validationSchema])

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // 标记所有字段为已触摸
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      )
      setTouched(allTouched)

      const isValid = validateForm()

      if (isValid && onSubmit) {
        setIsSubmitting(true)
        try {
          await onSubmit(values)
        } finally {
          setIsSubmitting(false)
        }
      }
    },
    [values, validateForm, onSubmit]
  )

  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const setFieldError = useCallback((name: keyof T, error: string | undefined) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    validateForm,
  }
}
