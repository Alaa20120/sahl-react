import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt, fmtDate } from '@/lib/format'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  total_debit: number
  total_credit: number
  is_posted: boolean
  lines: { account_id: string; account_name: string; debit: number; credit: number; description: string }[]
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) return
      setLoading(true)
      const { data } = await supabase.from('journal_entries').select('*, journal_entry_lines(*)').order('date', { ascending: false })
      if (data) {
        const mapped = await Promise.all(data.map(async (e: any) => {
          const lines = await Promise.all((e.journal_entry_lines || []).map(async (l: any) => {
            const { data: acc } = await supabase.from('chart_of_accounts').select('name').eq('id', l.account_id).single()
            return { account_id: l.account_id, account_name: acc?.name || l.account_id, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, description: l.description || '' }
          }))
          return { id: e.id, date: e.date, reference: e.reference || '', description: e.description, total_debit: Number(e.total_debit) || 0, total_credit: Number(e.total_credit) || 0, is_posted: e.is_posted, lines }
        }))
        setEntries(mapped)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <PageHeader title="دفتر اليومية" subtitle="سجل القيود المحاسبية" />
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><i className="fa fa-spinner fa-spin" /> جارٍ التحميل...</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>لا توجد قيود مسجلة بعد</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {entries.map(e => (
              <div key={e.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: 'var(--bg)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{e.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(e.date)} | {e.reference}</div>
                </div>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead><tr style={{ background: '#F4F6FA' }}><th style={{ padding: 8, textAlign: 'right' }}>الحساب</th><th style={{ padding: 8, textAlign: 'left' }}>مدين</th><th style={{ padding: 8, textAlign: 'left' }}>دائن</th></tr></thead>
                  <tbody>
                    {e.lines.map((l, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 16px' }}>{l.account_name}</td>
                        <td style={{ padding: 8, textAlign: 'left', color: l.debit > 0 ? 'var(--text)' : 'var(--muted)' }}>{l.debit > 0 ? fmt(l.debit) : '-'}</td>
                        <td style={{ padding: 8, textAlign: 'left', color: l.credit > 0 ? 'var(--text)' : 'var(--muted)' }}>{l.credit > 0 ? fmt(l.credit) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F4F6FA', fontWeight: 700 }}>
                      <td style={{ padding: 8 }}>الإجمالي</td>
                      <td style={{ padding: 8, textAlign: 'left' }}>{fmt(e.total_debit)}</td>
                      <td style={{ padding: 8, textAlign: 'left' }}>{fmt(e.total_credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
