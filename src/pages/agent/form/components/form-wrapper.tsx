import { cn } from '@/lib/utils'

type FormProps = React.ComponentProps<'form'>

export function FormWrapper({
  children,
  className,
  onSubmit,
  ...props
}: FormProps) {
  return (
    <form
      {...props}
      className={cn('space-y-space-lg p-space-base', className)}
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(e)
      }}
    >
      {children}
    </form>
  )
}
