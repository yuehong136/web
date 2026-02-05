type FormProps = React.ComponentProps<'form'>

export function FormWrapper({ children, ...props }: FormProps) {
  return (
    <form
      className="space-y-6 p-space-base"
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
