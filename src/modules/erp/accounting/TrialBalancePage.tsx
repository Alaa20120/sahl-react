import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface Account {
  id: string
  name: string
  type: string
  normal_balance: string
  current_balance: number
}

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) return
      setLoading(true)
      const { data } = await supabase.from('chart_of_accounts').select('*').eq('is_active', true).neq('id', '1').neq('id', '2').neq('id', '3').neq('id', '4').neq('id', '5').order('id')
      if (data) setAccounts(data.map((a: any) => ({ id: a.id, name: a.name, type: a.type, normal_balance: a.normal_balance, current_balance: Number(a.current_balance) || 0 })))
      setLoading(false)
    }
    load()
  }, [])

  const totalDebit = accounts.reduce((s, a) => s + (a.normal_balance === 'debit' ? Math.max(0, a.current_balance) : 0), 0)
  const totalCredit = accounts.reduce((s, a) => s + (a.normal_balance === 'credit' ? Math.max(0, a.current_balance) : 0), 0)

  return (
    <>
      <PageHeader title="ميزان المراجعة" subtitle="Trial Balance — تحقق من توازن الحسابات" />
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><i className="fa fa-spinner fa-spin" /> جارٍ التحميل...</div>
        ) : (
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '2px solid var(--border)' }}>كود</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '2px solid var(--border)' }}>اسم الحساب</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid var(--border)' }}>النوع</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid var(--border)' }}>مدين</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid var(--border)' }}>دائن</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>{a.id}</td>
                  <td style={{ padding: 12 }}>{a.name}</td>
                  <td style={{ padding: 12, textAlign: 'left' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: a.type === 'asset' ? '#DBEAFE' : a.type === 'liability' ? '#FCE7F3' : a.type === 'equity' ? '#F3E8FF' : a.type === 'revenue' ? '#DCFCE7' : '#FEF3C7', color: a.type === 'asset' ? '#1D4ED8' : a.type === 'liability' ? '#BE185D' : a.type === 'equity' ? '#7C3AED' : a.type === 'revenue' ? '#15803D' : '#B45309' }}>
                      {a.type === 'asset' ? 'أصل' : a.type === 'liability' ? 'خضو' : a.type === 'equity' ? 'ملكية' : a.type === 'revenue' ? 'إيراد' : 'مصروف'}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'left', fontWeight: a.normal_balance === 'debit' ? 600 : 400 }}>{a.normal_balance === 'debit' ? fmt(Math.abs(a.current_balance)) : '-'}</td>
                  <td style={{ padding: 12, textAlign: 'left', fontWeight: a.normal_balance === 'credit' ? 600 : 400 }}>{a.normal_balance === 'credit' ? fmt(Math.abs(a.current_balance)) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg)', fontWeight: 800, fontSize: 15 }}>
                <td colSpan={3} style={{ padding: 12, textAlign: 'right' }}>الإجمالي</td>
                <td style={{ padding: 12, textAlign: 'left' }}>{fmt(totalDebit)}</td>
                <td style={{ padding: 12, textAlign: 'left' }}>{fmt(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
    </>
  )
}
