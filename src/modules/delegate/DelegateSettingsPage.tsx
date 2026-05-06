import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import { toast } from '@/lib/toast'

export default function DelegateSettingsPage() {
  const [name, setName] = useState('فهد سالم الدوسري')
  const [phone, setPhone] = useState('0504444444')
  const [zone, setZone] = useState('الرياض - الشمال')

  function handleSave() {
    toast('تم حفظ الإعدادات بنجاح', 'success')
  }

  return (
    <>
      <PageHeader title="إعداداتي" subtitle="تعديل بيانات الحساب الشخصي" />

      <div className="grid-2">
        <Card title="البيانات الشخصية">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
            <div className="form-group">
              <label className="form-label">الاسم الكامل</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">رقم الجوال</label>
              <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">المنطقة</label>
              <input className="form-control" value={zone} onChange={e => setZone(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa fa-save" /> حفظ التغييرات
            </button>
          </div>
        </Card>

        <Card title="تغيير كلمة المرور">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
            <div className="form-group">
              <label className="form-label">كلمة المرور الحالية</label>
              <input className="form-control" type="password" placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">كلمة المرور الجديدة</label>
              <input className="form-control" type="password" placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">تأكيد كلمة المرور</label>
              <input className="form-control" type="password" placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa fa-key" /> تغيير كلمة المرور
            </button>
          </div>
        </Card>
      </div>
    </>
  )
}
