// 简单的toast实现，后续可以替换为更完善的库
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

class ToastManager {
  private container: HTMLElement | null = null
  private toasts: Set<HTMLElement> = new Set()

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2'
      document.body.appendChild(this.container)
    }
    return this.container
  }

  private createToast(message: string, type: ToastType, options: ToastOptions = {}) {
    const container = this.ensureContainer()
    const toast = document.createElement('div')
    
    const typeStyles = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white',
    }

    toast.className = `
      ${typeStyles[type]}
      px-4 py-3 rounded-lg shadow-lg
      animate-slide-down
      max-w-sm
      flex items-center gap-2
    `.replace(/\s+/g, ' ').trim()

    const icon = this.getIcon(type)
    toast.innerHTML = `
      ${icon}
      <span class="flex-1">${message}</span>
      <button class="ml-2 hover:opacity-70" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `

    container.appendChild(toast)
    this.toasts.add(toast)

    // 自动移除
    const duration = options.duration ?? 3000
    setTimeout(() => {
      this.removeToast(toast)
    }, duration)

    return toast
  }

  private getIcon(type: ToastType): string {
    const icons = {
      success: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
      </svg>`,
      error: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>`,
      warning: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>`,
      info: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>`,
    }
    return icons[type]
  }

  private removeToast(toast: HTMLElement) {
    if (this.toasts.has(toast)) {
      toast.remove()
      this.toasts.delete(toast)
    }
  }

  success(message: string, options?: ToastOptions) {
    return this.createToast(message, 'success', options)
  }

  error(message: string, options?: ToastOptions) {
    return this.createToast(message, 'error', options)
  }

  warning(message: string, options?: ToastOptions) {
    return this.createToast(message, 'warning', options)
  }

  info(message: string, options?: ToastOptions) {
    return this.createToast(message, 'info', options)
  }

  clear() {
    this.toasts.forEach(toast => toast.remove())
    this.toasts.clear()
  }
}

export const toast = new ToastManager()