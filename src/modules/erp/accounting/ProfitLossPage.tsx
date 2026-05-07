import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function ProfitLossPage() {
  const [revenue, setRevenue] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [cogs, setCogs] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) return
      setLoading(true)
      const { data: revData } = await supabase.from('chart_of_accounts').select('current_balance').eq('type', 'revenue')
      const { data: expData } = await supabase.from('chart_of_accounts').select('current_balance').eq('type', 'expense')
      const { data: cogsData } = await supabase.from('chart_of_accounts').select('current_balance').eq('id', '5100').single()
      setRevenue((revData || []).reduce((s, r: any) => s + (Number(r.current_balance) || 0), 0))
      setExpenses((expData || []).reduce((s, e: any) => s + (Number(e.current_balance) || 0), 0))
      setCogs(Number(cogsData?.current_balance) || 0)
      setLoading(false)
    }
    load()
  }, [])

  const grossProfit = revenue - cogs
  const netProfit = grossProfit - (expenses - cogs)

  return (
    <>
      <PageHeader title="قائمة الدخل" subtitle="Profit & Loss Statement" />
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <Card title="الإيرادات"><div style={{ fontSize: 28, fontWeight: 800, color: '#15803D' }}>{fmt(revenue)}</div></Card>
        <Card title="إجمالي المصروفات"><div style={{ fontSize: 28, fontWeight: 800, color: '#B45309' }}>{fmt(expenses)}</div></Card>
        <Card title="صافي الربح"><div style={{ fontSize: 28, fontWeight: 800, color: netProfit >= 0 ? '#15803D' : '#DC2626' }}>{fmt(netProfit)}</div></Card>
      </div>
      <Card title="تفاصيل قائمة الدخل">
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><i className="fa fa-spinner fa-spin" /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#F0FDF4', borderRadius: 8 }}>
              <span>إجمالي الإيرادات</span><span style={{ fontWeight: 700 }}>{fmt(revenue)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#FEF3C7', borderRadius: 8 }}>
              <span>تكلفة البضاعة المباعة</span><span style={{ fontWeight: 700 }}>- {fmt(cogs)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#DBEAFE', borderRadius: 8, fontWeight: 700 }}>
              <span>مجمل الربح (Gross Profit)</span><span>{fmt(grossProfit)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#FEF3C7', borderRadius: 8 }}>
              <span>مصروفات التشغيل</span><span style={{ fontWeight: 700 }}>- {fmt(expenses - cogs)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: netProfit >= 0 ? '#F0FDF4' : '#FEE2E2', borderRadius: 8, fontWeight: 800, fontSize: 18 }}>
              <span>صافي الربح / الخسارة</span><span style={{ color: netProfit >= 0 ? '#15803D' : '#DC2626' }}>{fmt(netProfit)}</span>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
