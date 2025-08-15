import * as React from "react"
import { cn } from "@/lib/utils" 
import { Modal } from "./modal"
import { Button, type ButtonProps } from "./button"

export interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface AlertDialogActionProps extends ButtonProps {}
export interface AlertDialogCancelProps extends ButtonProps {}

const AlertDialogContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | undefined>(undefined)

export const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      <Modal 
        open={open} 
        onClose={() => onOpenChange(false)}
        size="sm"
        closeOnOverlayClick={false}
      >
        {children}
      </Modal>
    </AlertDialogContext.Provider>
  )
}

export const AlertDialogTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ 
  children, 
  onClick, 
  ...props 
}) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error('AlertDialogTrigger must be used within AlertDialog')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(true)
    onClick?.(e)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export const AlertDialogContent: React.FC<AlertDialogContentProps & {
  children: React.ReactNode
}> = ({ className, children, ...props }) => {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
}

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)

export const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
)

export const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ className, ...props }) => (
  <h2
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
)

export const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ className, ...props }) => (
  <p
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
)

export const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ onClick, ...props }) => {
  const context = React.useContext(AlertDialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.onOpenChange(false)
  }

  return (
    <Button
      onClick={handleClick}
      {...props}
    />
  )
}

export const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ onClick, ...props }) => {
  const context = React.useContext(AlertDialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.onOpenChange(false)
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      {...props}
    />
  )
}