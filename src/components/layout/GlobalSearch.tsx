import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '@/store/ui.store'

const QUICK_LINKS = [
  { label: 'فاتورة جديدة', icon: '🧾', href: '/erp/invoices/new' },
  { label: 'عميل جديد', icon: '👤', href: '/erp/customers' },
  { label: 'نقطة البيع', icon: '🏪', href: '/erp/pos' },
  { label: 'التقارير المالية', icon: '📊', href: '/erp/financial-reports' },
  { label: 'الرواتب', icon: '💰', href: '/erp/hr' },
  { label: 'المخزون', icon: '📦', href: '/erp/inventory' },
]

export default function GlobalSearch() {
  const { searchOpen, closeSearch } = useUiStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
    }
  }, [searchOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSearch])

  if (!searchOpen) return null

  const filtered = QUICK_LINKS.filter(l =>
    l.label.includes(query) || !query
  )

  const go = (href: string) => {
    navigate(href)
    closeSearch()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', paddingTop: 120,
      }}
      onClick={closeSearch}
    >
      <div
        style={{
          background: 'var(--card)', borderRadius: 16, width: 560,
          boxShadow: '0 24px 64px rgba(0,0,0,.25)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <i className="fa fa-search" style={{ color: 'var(--muted)', fontSize: 16 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث في الفواتير، العملاء، المنتجات..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              background: 'transparent', color: 'var(--text)',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 4 }}>Esc</span>
        </div>

        <div style={{ padding: '8px 0', maxHeight: 400, overflowY: 'auto' }}>
          <div style={{ padding: '8px 20px 4px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            وصول سريع
          </div>
          {filtered.map(item => (
            <div
              key={item.href}
              onClick={() => go(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', cursor: 'pointer', transition: '.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
