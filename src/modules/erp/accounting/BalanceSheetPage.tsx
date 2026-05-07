import { useState, useEffect } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { fmt } from '@/lib/format'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export default function BalanceSheetPage() {
  const [assets, setAssets] = useState(0)
  const [liabilities, setLiabilities] = useState(0)
  const [equity, setEquity] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) return
      setLoading(true)
      const [aRes, lRes, eRes] = await Promise.all([
        supabase.from('chart_of_accounts').select('current_balance').eq('type', 'asset').neq('id', '1'),
        supabase.from('chart_of_accounts').select('current_balance').eq('type', 'liability').neq('id', '2'),
        supabase.from('chart_of_accounts').select('current_balance').eq('type', 'equity').neq('id', '3'),
      ])
      setAssets((aRes.data || []).reduce((s, r: any) => s + (Number(r.current_balance) || 0), 0))
      setLiabilities((lRes.data || []).reduce((s, r: any) => s + (Number(r.current_balance) || 0), 0))
      setEquity((eRes.data || []).reduce((s, r: any) => s + (Number(r.current_balance) || 0), 0))
      setLoading(false)
    }
    load()
  }, [])

  const totalLiabilitiesAndEquity = liabilities + equity
  const isBalanced = Math.abs(assets - totalLiabilitiesAndEquity) < 0.01

  return (
    <>
      <PageHeader title="الميزانية العمومية" subtitle="Balance Sheet — الأصول = الخصوم + حقوق الملكية" />
      <div className="stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <Card title="الأصول"><div style={{ fontSize: 28, fontWeight: 800, color: '#1D4ED8' }}>{fmt(assets)}</div></Card>
        <Card title="الخصوم"><div style={{ fontSize: 28, fontWeight: 800, color: '#BE185D' }}>{fmt(liabilities)}</div></Card>
        <Card title="حقوق الملكية"><div style={{ fontSize: 28, fontWeight: 800, color: '#7C3AED' }}>{fmt(equity)}</div></Card>
      </div>
      <Card title="معادلة الميزانية">
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><i className="fa fa-spinner fa-spin" /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: 24 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 20, fontWeight: 700 }}>
              <div style={{ padding: '16px 24px', background: '#DBEAFE', borderRadius: 12, color: '#1D4ED8' }}>الأصول = {fmt(assets)}</div>
              <div style={{ fontSize: 28 }}>=</div>
              <div style={{ padding: '16px 24px', background: '#FCE7F3', borderRadius: 12, color: '#BE185D' }}>الخصوم = {fmt(liabilities)}</div>
              <div style={{ fontSize: 28 }}>+</div>
              <div style={{ padding: '16px 24px', background: '#F3E8FF', borderRadius: 12, color: '#7C3AED' }}>حقوق الملكية = {fmt(equity)}</div>
            </div>
            <div style={{
              padding: '12px 24px', borderRadius: 8, fontWeight: 700,
              background: isBalanced ? '#F0FDF4' : '#FEE2E2',
              color: isBalanced ? '#15803D' : '#DC2626',
            }}>
              {isBalanced ? '✅ الميزانية متوازنة' : `⚠️ فرق: ${fmt(Math.abs(assets - totalLiabilitiesAndEquity))}`}
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
