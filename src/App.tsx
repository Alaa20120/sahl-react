import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import InvoiceView from '@/pages/InvoiceView'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useCustomerStore } from '@/store/customer.store'
import { useInvoiceStore } from '@/store/invoice.store'
import { useInventoryStore } from '@/store/inventory.store'
import { usePurchaseStore } from '@/store/purchase.store'
import { useExpenseStore } from '@/store/expense.store'
import { useTreasuryStore } from '@/store/treasury.store'
import { useHRStore } from '@/store/hr.store'
import { useDelegateStore } from '@/store/delegate.store'
import { useCategoryStore } from '@/store/category.store'

// ERP core
const Dashboard        = lazy(() => import('@/modules/erp/dashboard/DashboardPage'))
const Invoices         = lazy(() => import('@/modules/erp/invoices/InvoicesPage'))
const InvoiceDetail    = lazy(() => import('@/modules/erp/invoices/InvoiceDetailPage'))
const InvoiceNew       = lazy(() => import('@/modules/erp/invoices/InvoiceNewPage'))
const Templates        = lazy(() => import('@/modules/erp/templates/TemplatesPage'))
const Customers        = lazy(() => import('@/modules/erp/customers/CustomersPage'))
const Inventory        = lazy(() => import('@/modules/erp/inventory/InventoryPage'))
const ProductDetail    = lazy(() => import('@/modules/erp/inventory/ProductDetailPage'))
const HR               = lazy(() => import('@/modules/erp/hr/HRPage'))

// ERP finance
const Treasury         = lazy(() => import('@/modules/erp/treasury/TreasuryPage'))
const Expenses         = lazy(() => import('@/modules/erp/expenses/ExpensesPage'))
const Purchases        = lazy(() => import('@/modules/erp/purchases/PurchasesPage'))
const PurchaseDetail   = lazy(() => import('@/modules/erp/purchases/PurchaseDetailPage'))
const Budget           = lazy(() => import('@/modules/erp/budget/BudgetPage'))

// ERP analytics & reports
const Reports            = lazy(() => import('@/modules/erp/reports/ReportsPage'))
const FinancialReports   = lazy(() => import('@/modules/erp/financial-reports/FinancialReportsPage'))
const Analytics          = lazy(() => import('@/modules/erp/analytics/AnalyticsPage'))
const Insights           = lazy(() => import('@/modules/erp/insights/InsightsPage'))
const AccountStatement   = lazy(() => import('@/modules/erp/account-statement/AccountStatementPage'))
const ZATCA              = lazy(() => import('@/modules/erp/zatca/ZATCAPage'))

// ERP accounting (Double Entry)
const JournalPage        = lazy(() => import('@/modules/erp/accounting/JournalPage'))
const TrialBalancePage   = lazy(() => import('@/modules/erp/accounting/TrialBalancePage'))
const ChartOfAccountsPage = lazy(() => import('@/modules/erp/accounting/ChartOfAccountsPage'))
const ProfitLossPage     = lazy(() => import('@/modules/erp/accounting/ProfitLossPage'))
const BalanceSheetPage   = lazy(() => import('@/modules/erp/accounting/BalanceSheetPage'))

// ERP system
const Settings         = lazy(() => import('@/modules/erp/settings/SettingsPage'))
const Help             = lazy(() => import('@/modules/erp/help/HelpPage'))

// Other modules
const AdminDashboard      = lazy(() => import('@/modules/admin/AdminDashboard'))
const DelegatePage        = lazy(() => import('@/modules/delegate/DelegatePage'))
const DelegateInvoices    = lazy(() => import('@/modules/delegate/DelegateInvoicesPage'))
const DelegateWarehouse   = lazy(() => import('@/modules/delegate/DelegateWarehousePage'))
const DelegateCustomers   = lazy(() => import('@/modules/delegate/DelegateCustomersPage'))
const DelegateSettings    = lazy(() => import('@/modules/delegate/DelegateSettingsPage'))
const DelegatePOS         = lazy(() => import('@/modules/delegate/DelegatePOSPage'))
const DelegateInvoiceDetail = lazy(() => import('@/modules/delegate/DelegateInvoiceDetailPage'))
const DelegatesListPage   = lazy(() => import('@/modules/erp/delegates/DelegatesListPage'))
const DelegateDetailPage  = lazy(() => import('@/modules/erp/delegates/DelegateDetailPage'))
const CustomersBalance    = lazy(() => import('@/modules/erp/customers/CustomersBalancePage'))

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)', fontSize: 14, gap: 12 }}>
    <i className="fa fa-spinner fa-spin" style={{ fontSize: 20 }} />
    جارٍ التحميل...
  </div>
)

const S = (C: React.ComponentType) => (
  <Suspense fallback={<Loader />}><C /></Suspense>
)

function AppDataProvider() {
  const initAuth = useAuthStore(s => s.initAuth)
  const checkPasswordVersion = useAuthStore(s => s.checkPasswordVersion)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    // Init Supabase auth listener — handles session restore on refresh automatically
    const unsubscribe = initAuth()

    // Check password version - if changed on another device, force logout
    if (!checkPasswordVersion()) {
      logout()
      window.location.href = '/'
      return
    }

    // Fetch all data if Supabase is configured
    if (isSupabaseConfigured()) {
      useCustomerStore.getState().fetch()
      useInvoiceStore.getState().fetch()
      useInventoryStore.getState().fetch()
      usePurchaseStore.getState().fetch()
      useExpenseStore.getState().fetch()
      useTreasuryStore.getState().fetch()
      useHRStore.getState().fetch()
      useDelegateStore.getState().fetch()
      useCategoryStore.getState().fetch()
    }

    return unsubscribe
  }, [initAuth, checkPasswordVersion, logout])

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    // Realtime subscriptions
    const channels = [
      supabase.channel('products-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => useInventoryStore.getState().fetch()),
      supabase.channel('invoices-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => useInvoiceStore.getState().fetch()),
      supabase.channel('customers-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => useCustomerStore.getState().fetch()),
      supabase.channel('purchases-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => usePurchaseStore.getState().fetch()),
      supabase.channel('expenses-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => useExpenseStore.getState().fetch()),
      supabase.channel('delegate-warehouse-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'delegate_warehouse' }, () => useDelegateStore.getState().fetch()),
      supabase.channel('delegate-invoices-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'delegate_invoices' }, () => useDelegateStore.getState().fetch()),
      supabase.channel('salary-payments-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_payments' }, () => useHRStore.getState().fetch()),
    ]
    channels.forEach(c => c.subscribe())
    return () => channels.forEach(c => supabase.removeChannel(c))
  }, [])

  return null
}

function PWAInstallButton() {
  const [prompt, setPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt) return null
  return (
    <button
      id="pwa-install-btn"
      onClick={() => { prompt.prompt(); prompt.userChoice.then(() => setPrompt(null)) }}
    >
      <i className="fa fa-download" />
      ثبّت التطبيق
    </button>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/">
      <AppDataProvider />
      <PWAInstallButton />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invoice/:number" element={<InvoiceView />} />

        {/* ERP — محمي بتسجيل الدخول (admin & staff only) */}
        <Route path="/erp" element={<ProtectedRoute allowedRoles={['admin', 'accountant', 'cashier', 'hr', 'readonly']}><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/erp/dashboard" replace />} />
          <Route path="dashboard"          element={S(Dashboard)} />
          <Route path="invoices"           element={S(Invoices)} />
          <Route path="invoices/new"       element={S(InvoiceNew)} />
          <Route path="invoices/:id"       element={S(InvoiceDetail)} />
          <Route path="customers"          element={S(Customers)} />
          <Route path="inventory"          element={S(Inventory)} />
          <Route path="inventory/:id"      element={S(ProductDetail)} />
          <Route path="hr"                 element={S(HR)} />

          <Route path="treasury"           element={S(Treasury)} />
          <Route path="expenses"           element={S(Expenses)} />
          <Route path="purchases"          element={S(Purchases)} />
          <Route path="purchases/:id"      element={S(PurchaseDetail)} />
          <Route path="budget"             element={S(Budget)} />
          <Route path="insights"            element={S(Insights)} />
          <Route path="reports"            element={S(Reports)} />
          <Route path="financial-reports"  element={S(FinancialReports)} />
          <Route path="analytics"          element={S(Analytics)} />
          <Route path="account-statement"  element={S(AccountStatement)} />
          <Route path="zatca"              element={S(ZATCA)} />

          {/* Double Entry Accounting */}
          <Route path="accounting/journal"          element={S(JournalPage)} />
          <Route path="accounting/trial-balance"    element={S(TrialBalancePage)} />
          <Route path="accounting/chart-of-accounts" element={S(ChartOfAccountsPage)} />
          <Route path="accounting/profit-loss"      element={S(ProfitLossPage)} />
          <Route path="accounting/balance-sheet"    element={S(BalanceSheetPage)} />

          <Route path="settings"           element={S(Settings)} />
          <Route path="help"               element={S(Help)} />
          <Route path="delegates"            element={S(DelegatesListPage)} />
          <Route path="delegates/:id"      element={S(DelegateDetailPage)} />
          <Route path="delegates/:delegateId/invoices/:id" element={S(DelegateInvoiceDetail)} />
          <Route path="customers-balance"  element={S(CustomersBalance)} />
          <Route path="templates"          element={S(Templates)} />
        </Route>

        {/* Admin portal */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={S(AdminDashboard)} />
        </Route>

        {/* Delegate portal */}
        <Route path="/delegate" element={<ProtectedRoute allowedRoles={['delegate']}><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/delegate/home" replace />} />
          <Route path="home"       element={S(DelegatePage)} />
          <Route path="pos"        element={S(DelegatePOS)} />
          <Route path="invoices"   element={S(DelegateInvoices)} />
          <Route path="invoices/:id" element={S(DelegateInvoiceDetail)} />
          <Route path="warehouse"  element={S(DelegateWarehouse)} />
          <Route path="customers"  element={S(DelegateCustomers)} />
          <Route path="settings"   element={S(DelegateSettings)} />
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
