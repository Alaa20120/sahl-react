import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface DataPoint {
  month: string
  revenue: number
  expenses: number
}

interface Props {
  data: DataPoint[]
  height?: number
}

const fmt = (v: number) => `${(v / 1000).toFixed(0)}ك`

export default function RevenueChart({ data, height = 260 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) => [`${Number(v).toLocaleString('ar-SA')} ر.س`, name === 'revenue' ? 'الإيراد' : 'المصروفات'] as any}
          labelStyle={{ fontFamily: 'Tajawal', fontWeight: 700 }}
          contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Tajawal' }}
        />
        <Legend
          formatter={v => v === 'revenue' ? 'الإيراد' : 'المصروفات'}
          wrapperStyle={{ fontSize: 12, fontFamily: 'Tajawal' }}
        />
        <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
