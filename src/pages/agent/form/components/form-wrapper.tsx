import { cn } from '@/lib/utils'

type FormProps = React.ComponentProps<'form'>

export function FormWrapper({ children, className, ...props }: FormProps) {
  return (
    <form
      className={cn('space-y-space-lg p-space-base', className)}
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault()
      }}
      {...props}
    >
      {children}
    </form>
  )
}
