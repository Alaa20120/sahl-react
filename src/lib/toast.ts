type ToastType = 'success' | 'danger' | 'warn' | 'info'

let container: HTMLElement | null = null

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }
  return container
}

export function toast(message: string, type: ToastType = 'success', duration = 3000) {
  const el = document.createElement('div')
  el.className = `toast toast-${type}`

  const icons: Record<ToastType, string> = {
    success: '✓',
    danger: '✕',
    warn: '⚠',
    info: 'ℹ',
  }

  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`
  getContainer().appendChild(el)

  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity .3s'
    setTimeout(() => el.remove(), 300)
  }, duration)
}
