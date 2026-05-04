import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

// ERP core
const Dashboard        = lazy(() => import('@/modules/erp/dashboard/DashboardPage'))
const Invoices         = lazy(() => import('@/modules/erp/invoices/InvoicesPage'))
const InvoiceDetail    = lazy(() => import('@/modules/erp/invoices/InvoiceDetailPage'))
const InvoiceNew       = lazy(() => import('@/modules/erp/invoices/InvoiceNewPage'))
const Templates        = lazy(() => import('@/modules/erp/templates/TemplatesPage'))
const Customers        = lazy(() => import('@/modules/erp/customers/CustomersPage'))
const Inventory        = lazy(() => import('@/modules/erp/inventory/InventoryPage'))
const HR               = lazy(() => import('@/modules/erp/hr/HRPage'))
const CRM              = lazy(() => import('@/modules/erp/crm/CRMPage'))

// ERP finance
const Treasury         = lazy(() => import('@/modules/erp/treasury/TreasuryPage'))
const Expenses         = lazy(() => import('@/modules/erp/expenses/ExpensesPage'))
const Purchases        = lazy(() => import('@/modules/erp/purchases/PurchasesPage'))
const PurchaseDetail   = lazy(() => import('@/modules/erp/purchases/PurchaseDetailPage'))
const Budget           = lazy(() => import('@/modules/erp/budget/BudgetPage'))
const FixedAssets      = lazy(() => import('@/modules/erp/fixed-assets/FixedAssetsPage'))

// ERP analytics & reports
const Reports            = lazy(() => import('@/modules/erp/reports/ReportsPage'))
const FinancialReports   = lazy(() => import('@/modules/erp/financial-reports/FinancialReportsPage'))
const Analytics          = lazy(() => import('@/modules/erp/analytics/AnalyticsPage'))
const AccountStatement   = lazy(() => import('@/modules/erp/account-statement/AccountStatementPage'))
const ZATCA              = lazy(() => import('@/modules/erp/zatca/ZATCAPage'))

// ERP operations
const POS              = lazy(() => import('@/modules/erp/pos/POSPage'))

// ERP system
const Users            = lazy(() => import('@/modules/erp/users/UsersPage'))
const Settings         = lazy(() => import('@/modules/erp/settings/SettingsPage'))
const Help             = lazy(() => import('@/modules/erp/help/HelpPage'))

// Other modules
const AdminDashboard   = lazy(() => import('@/modules/admin/AdminDashboard'))
const DelegatePage     = lazy(() => import('@/modules/delegate/DelegatePage'))

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)', fontSize: 14, gap: 12 }}>
    <i className="fa fa-spinner fa-spin" style={{ fontSize: 20 }} />
    جارٍ التحميل...
  </div>
)

const S = (C: React.ComponentType) => (
  <Suspense fallback={<Loader />}><C /></Suspense>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ERP — محمي بتسجيل الدخول */}
        <Route path="/erp" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/erp/dashboard" replace />} />
          <Route path="dashboard"          element={S(Dashboard)} />
          <Route path="invoices"           element={S(Invoices)} />
          <Route path="invoices/new"       element={S(InvoiceNew)} />
          <Route path="invoices/:id"       element={S(InvoiceDetail)} />
          <Route path="customers"          element={S(Customers)} />
          <Route path="inventory"          element={S(Inventory)} />
          <Route path="hr"                 element={S(HR)} />
          <Route path="crm"                element={S(CRM)} />
          <Route path="treasury"           element={S(Treasury)} />
          <Route path="expenses"           element={S(Expenses)} />
          <Route path="purchases"          element={S(Purchases)} />
          <Route path="purchases/:id"      element={S(PurchaseDetail)} />
          <Route path="budget"             element={S(Budget)} />
          <Route path="fixed-assets"       element={S(FixedAssets)} />
          <Route path="reports"            element={S(Reports)} />
          <Route path="financial-reports"  element={S(FinancialReports)} />
          <Route path="analytics"          element={S(Analytics)} />
          <Route path="account-statement"  element={S(AccountStatement)} />
          <Route path="zatca"              element={S(ZATCA)} />
          <Route path="pos"                element={S(POS)} />
          <Route path="users"              element={S(Users)} />
          <Route path="settings"           element={S(Settings)} />
          <Route path="help"               element={S(Help)} />
          <Route path="delegates"          element={S(DelegatePage)} />
          <Route path="templates"          element={S(Templates)} />
        </Route>

        {/* Admin portal */}
        <Route path="/admin" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={S(AdminDashboard)} />
        </Route>

        {/* Delegate portal */}
        <Route path="/delegate" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/delegate/home" replace />} />
          <Route path="home" element={S(DelegatePage)} />
        </Route>

        <Route path="*" element={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, fontFamily: 'Tajawal, sans-serif' }}>
            <div style={{ fontSize: 80, fontWeight: 800, color: 'var(--muted-2)' }}>404</div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>الصفحة غير موجودة</div>
            <a href="/erp/dashboard" className="btn btn-primary"><i className="fa fa-home" /> العودة للرئيسية</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
