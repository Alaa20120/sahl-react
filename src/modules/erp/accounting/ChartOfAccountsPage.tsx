import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface Account {
  id: string
  name: string
  name_en: string
  type: string
  parent_id: string | null
  current_balance: number
  normal_balance: string
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) return
      setLoading(true)
      const { data } = await supabase.from('chart_of_accounts').select('*').order('id')
      if (data) setAccounts(data.map((a: any) => ({ id: a.id, name: a.name, name_en: a.name_en || '', type: a.type, parent_id: a.parent_id, current_balance: Number(a.current_balance) || 0, normal_balance: a.normal_balance })))
      setLoading(false)
    }
    load()
  }, [])

  const typeColors: Record<string, { bg: string; text: string }> = {
    asset: { bg: '#DBEAFE', text: '#1D4ED8' },
    liability: { bg: '#FCE7F3', text: '#BE185D' },
    equity: { bg: '#F3E8FF', text: '#7C3AED' },
    revenue: { bg: '#DCFCE7', text: '#15803D' },
    expense: { bg: '#FEF3C7', text: '#B45309' },
  }

  const typeLabels: Record<string, string> = {
    asset: 'أصل', liability: 'خضو', equity: 'ملكية', revenue: 'إيراد', expense: 'مصروف',
  }

  return (
    <>
      <PageHeader title="شجرة الحسابات" subtitle="Chart of Accounts — هيكل الحسابات المحاسبية" />
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><i className="fa fa-spinner fa-spin" /> جارٍ التحميل...</div>
        ) : (
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '2px solid var(--border)' }}>كود</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '2px solid var(--border)' }}>اسم الحساب</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '2px solid var(--border)' }}>النوع</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid var(--border)' }}>طبيعة الحساب</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid var(--border)' }}>الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => {
                const colors = typeColors[a.type] || { bg: '#F3F4F6', text: '#6B7280' }
                const isParent = !a.parent_id || ['1','2','3','4','5'].includes(a.id)
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', fontWeight: isParent ? 700 : 400, background: isParent ? '#F9FAFB' : 'transparent' }}>
                    <td style={{ padding: `12px ${isParent ? 12 : 24}px` }}>{a.id}</td>
                    <td style={{ padding: 12 }}>{a.name} <span style={{ fontSize: 11, color: 'var(--muted)' }}>{a.name_en}</span></td>
                    <td style={{ padding: 12 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: colors.bg, color: colors.text }}>{typeLabels[a.type]}</span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'left' }}>{a.normal_balance === 'debit' ? 'مدين' : 'دائن'}</td>
                    <td style={{ padding: 12, textAlign: 'left' }}>{fmt(a.current_balance)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
