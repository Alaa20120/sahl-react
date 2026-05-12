-- ============================================================
-- 🏢 شركة: الفروج الوطني
-- 🗓️  Schema: Sahl ERP Supabase
-- ⚠️  Run this in Supabase SQL Editor (New Query → Paste → Run)
-- ============================================================

-- 1. profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','accountant','cashier','sales','hr','viewer')),
  branch TEXT DEFAULT 'الرئيسي',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('customer','supplier','both')),
  phone TEXT, email TEXT, address TEXT, vat_number TEXT, commercial_reg TEXT,
  balance DECIMAL(12,2) DEFAULT 0, total_invoices INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  since DATE DEFAULT CURRENT_DATE, created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date DATE NOT NULL, amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in','out')), method TEXT, description TEXT,
  ref_id TEXT, balance_before DECIMAL(12,2), balance_after DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. products + stock_movements
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT, unit TEXT DEFAULT 'قطعة',
  cost_price DECIMAL(12,2) DEFAULT 0, sell_price DECIMAL(12,2) DEFAULT 0,
  stock INTEGER DEFAULT 0, min_stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('in','out','adjustment','return')),
  qty INTEGER NOT NULL, reference TEXT, reference_id UUID, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. invoices + items + attachments
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE, barcode TEXT, customer TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id), date DATE NOT NULL, due_date DATE,
  amount DECIMAL(12,2) NOT NULL, tax DECIMAL(12,2) DEFAULT 0, total DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('paid','partial','pending','overdue','draft','confirmed','returned')),
  payment_method TEXT CHECK (payment_method IN ('cash','credit')),
  created_by UUID REFERENCES profiles(id), is_return BOOLEAN DEFAULT FALSE,
  original_invoice_id UUID REFERENCES invoices(id), return_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL, product_id UUID REFERENCES products(id),
  qty INTEGER NOT NULL, price DECIMAL(12,2) NOT NULL, total DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL, type TEXT, storage_path TEXT NOT NULL, uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE, date DATE NOT NULL, due_date DATE,
  supplier TEXT NOT NULL, supplier_vat TEXT, item_count INTEGER DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL, tax DECIMAL(12,2) DEFAULT 0, total DECIMAL(12,2) NOT NULL,
  paid DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('received','pending','partial','cancelled','voided')),
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  description TEXT NOT NULL, product_id UUID REFERENCES products(id),
  qty INTEGER NOT NULL, price DECIMAL(12,2) NOT NULL, total DECIMAL(12,2) NOT NULL
);

-- 6. expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL, employee TEXT, category TEXT, description TEXT,
  type TEXT DEFAULT 'expense' CHECK (type IN ('expense','advance')),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved','pending','rejected')),
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. treasury
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id TEXT PRIMARY KEY, label TEXT NOT NULL, balance DECIMAL(12,2) DEFAULT 0,
  icon TEXT, color TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL, description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in','out')),
  category TEXT NOT NULL CHECK (category IN ('invoice','expense','salary','purchase','transfer','collection','other')),
  amount DECIMAL(12,2) NOT NULL, balance DECIMAL(12,2) NOT NULL,
  account_id TEXT NOT NULL REFERENCES treasury_accounts(id), ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, position TEXT, department TEXT,
  salary DECIMAL(12,2) DEFAULT 0, allowances DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0, net_salary DECIMAL(12,2) DEFAULT 0,
  phone TEXT, email TEXT, iqama TEXT, join_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','leave','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. delegates
CREATE TABLE IF NOT EXISTS delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, phone TEXT, email TEXT, zone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, avatar TEXT,
  location_lat DECIMAL(10,8), location_lng DECIMAL(11,8), location_address TEXT,
  stats_total_sales DECIMAL(12,2) DEFAULT 0, stats_total_purchases DECIMAL(12,2) DEFAULT 0,
  stats_collected DECIMAL(12,2) DEFAULT 0, stats_balance DECIMAL(12,2) DEFAULT 0,
  stats_external_credit DECIMAL(12,2) DEFAULT 0, stats_expenses DECIMAL(12,2) DEFAULT 0,
  stats_company_entrusted DECIMAL(12,2) DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegate_warehouse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), product_name TEXT, product_sku TEXT,
  qty INTEGER DEFAULT 0, cost_price DECIMAL(12,2) DEFAULT 0, received_date DATE,
  status TEXT DEFAULT 'in-stock' CHECK (status IN ('in-stock','reserved','transferred')),
  source TEXT DEFAULT 'purchased' CHECK (source IN ('purchased','company'))
);

CREATE TABLE IF NOT EXISTS delegate_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  number TEXT NOT NULL, date DATE NOT NULL, type TEXT NOT NULL CHECK (type IN ('sale','purchase')),
  party TEXT NOT NULL, customer_id UUID REFERENCES customers(id),
  subtotal DECIMAL(12,2) NOT NULL, tax DECIMAL(12,2) DEFAULT 0, total DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid','pending','overdue','confirmed')),
  payment_method TEXT CHECK (payment_method IN ('cash','credit')), confirmed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegate_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES delegate_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), description TEXT NOT NULL,
  qty INTEGER NOT NULL, price DECIMAL(12,2) NOT NULL, total DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS delegate_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  date DATE NOT NULL, type TEXT NOT NULL CHECK (type IN ('collection','withdrawal','expense','commission','remittance')),
  amount DECIMAL(12,2) NOT NULL, description TEXT, reference TEXT, balance_after DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Double Entry Accounting
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  parent_id TEXT REFERENCES chart_of_accounts(id), is_active BOOLEAN DEFAULT TRUE,
  opening_balance DECIMAL(12,2) DEFAULT 0, current_balance DECIMAL(12,2) DEFAULT 0,
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('debit','credit')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL, reference TEXT, description TEXT NOT NULL,
  source_type TEXT, source_id UUID, total_debit DECIMAL(12,2) NOT NULL,
  total_credit DECIMAL(12,2) NOT NULL, is_posted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES chart_of_accounts(id),
  debit DECIMAL(12,2) DEFAULT 0, credit DECIMAL(12,2) DEFAULT 0, description TEXT
);

-- 11. ZATCA
CREATE TABLE IF NOT EXISTS zatca_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id), uuid TEXT NOT NULL UNIQUE,
  invoice_hash TEXT, qr_code TEXT, xml_content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected')),
  zatca_response TEXT, submitted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products_select" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "purchases_select" ON purchases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "employees_select" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "delegates_select" ON delegates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "customers_write" ON customers FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
CREATE POLICY "invoices_write" ON invoices FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
CREATE POLICY "products_write" ON products FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
CREATE POLICY "purchases_write" ON purchases FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
CREATE POLICY "expenses_write" ON expenses FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
CREATE POLICY "employees_write" ON employees FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
CREATE POLICY "delegates_write" ON delegates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (id = auth.uid());

-- 13. Seed: Treasury Accounts
INSERT INTO treasury_accounts (id, label, balance, icon, color) VALUES
  ('cash', 'الصندوق النقدي', 0, 'fa-money-bill-wave', '#10B981'),
  ('bank', 'البنك الأهلي', 0, 'fa-building-columns', '#2563EB'),
  ('pos', 'جهاز نقاط البيع', 0, 'fa-credit-card', '#7C3AED')
ON CONFLICT (id) DO NOTHING;

-- 14. Seed: Chart of Accounts
INSERT INTO chart_of_accounts (id, name, name_en, type, normal_balance) VALUES
  ('1', 'الأصول', 'Assets', 'asset', 'debit'),
  ('1100', 'النقدية', 'Cash & Bank', 'asset', 'debit'),
  ('1110', 'الصندوق', 'Cash', 'asset', 'debit'),
  ('1120', 'البنك الأهلي', 'Bank', 'asset', 'debit'),
  ('1130', 'نقاط البيع', 'POS', 'asset', 'debit'),
  ('1200', 'المخزون', 'Inventory', 'asset', 'debit'),
  ('1300', 'العملاء', 'Accounts Receivable', 'asset', 'debit'),
  ('1400', 'الأصول الثابتة', 'Fixed Assets', 'asset', 'debit'),
  ('2', 'الخصوم', 'Liabilities', 'liability', 'credit'),
  ('2100', 'الموردين', 'Accounts Payable', 'liability', 'credit'),
  ('2200', 'الضريبة المستحقة', 'VAT Payable', 'liability', 'credit'),
  ('2300', 'الرواتب المستحقة', 'Salaries Payable', 'liability', 'credit'),
  ('3', 'حقوق الملكية', 'Equity', 'equity', 'credit'),
  ('3100', 'رأس المال', 'Capital', 'equity', 'credit'),
  ('3200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'credit'),
  ('4', 'الإيرادات', 'Revenue', 'revenue', 'credit'),
  ('4100', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 'credit'),
  ('4200', 'إيرادات المناديب', 'Delegate Revenue', 'revenue', 'credit'),
  ('4300', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'credit'),
  ('5', 'المصروفات', 'Expenses', 'expense', 'debit'),
  ('5100', 'تكلفة البضاعة المباعة', 'COGS', 'expense', 'debit'),
  ('5200', 'مصروفات التشغيل', 'Operating Expenses', 'expense', 'debit'),
  ('5300', 'الرواتب', 'Salaries', 'expense', 'debit'),
  ('5400', 'الإهلاك', 'Depreciation', 'expense', 'debit')
ON CONFLICT (id) DO NOTHING;

UPDATE chart_of_accounts SET parent_id = '1' WHERE id IN ('1100','1200','1300','1400');
UPDATE chart_of_accounts SET parent_id = '1100' WHERE id IN ('1110','1120','1130');
UPDATE chart_of_accounts SET parent_id = '2' WHERE id IN ('2100','2200','2300');
UPDATE chart_of_accounts SET parent_id = '3' WHERE id IN ('3100','3200');
UPDATE chart_of_accounts SET parent_id = '4' WHERE id IN ('4100','4200','4300');
UPDATE chart_of_accounts SET parent_id = '5' WHERE id IN ('5100','5200','5300','5400');

-- 15. Add password_version to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_version INTEGER DEFAULT 1;

-- 16. Add salary fields to delegates
ALTER TABLE delegates ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2) DEFAULT 4000;
ALTER TABLE delegates ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.0;

-- 17. salary_payments table
CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  delegate_id UUID REFERENCES delegates(id) ON DELETE SET NULL,
  month TEXT NOT NULL,
  basic_salary DECIMAL(12,2) DEFAULT 0,
  allowances DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) DEFAULT 0,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. RLS for salary_payments
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salary_payments_select" ON salary_payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "salary_payments_write" ON salary_payments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));

-- 19. payroll_overrides table (manual edits before running payroll)
CREATE TABLE IF NOT EXISTS payroll_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES delegates(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  basic_salary DECIMAL(12,2),
  allowances DECIMAL(12,2),
  deductions DECIMAL(12,2),
  advance DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month),
  UNIQUE(delegate_id, month)
);

-- 20. RLS for payroll_overrides
ALTER TABLE payroll_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_overrides_select" ON payroll_overrides FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "payroll_overrides_write" ON payroll_overrides FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));

-- 21. company_settings table (single row, id = 'default')
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT,
  name_en TEXT,
  cr TEXT,
  vat TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'المملكة العربية السعودية',
  logo TEXT,
  currency TEXT DEFAULT 'SAR',
  vat_rate DECIMAL(5,2) DEFAULT 15,
  branch TEXT DEFAULT 'الرئيسي',
  fiscal_year_start TEXT DEFAULT '01-01',
  invoice_notes TEXT DEFAULT 'شكراً لتعاملكم معنا. يُرجى الدفع خلال 30 يوماً من تاريخ الفاتورة.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. RLS for company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_settings_select" ON company_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "company_settings_write" ON company_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','accountant')));
