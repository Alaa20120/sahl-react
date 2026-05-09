-- =====================================================
-- SAHL ERP - Complete Supabase Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- HELPER: updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. PROFILES (linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'readonly'
                CHECK (role IN ('admin','accountant','cashier','hr','readonly','delegate')),
  avatar      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'readonly')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 2. CUSTOMERS
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'customer'
                    CHECK (type IN ('customer','supplier','both')),
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  vat_number      TEXT,
  commercial_reg  TEXT,
  balance         NUMERIC(12,2) DEFAULT 0,
  total_invoices  INTEGER DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','inactive')),
  since           DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_type   ON customers(type);

-- =====================================================
-- 3. CUSTOMER_PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  amount          NUMERIC(12,2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('in','out')),
  method          TEXT,
  description     TEXT,
  ref_id          TEXT,
  balance_before  NUMERIC(12,2) DEFAULT 0,
  balance_after   NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON customer_payments(customer_id);

-- =====================================================
-- 4. PRODUCTS (Inventory)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT,
  unit        TEXT DEFAULT 'قطعة',
  cost_price  NUMERIC(12,2) DEFAULT 0,
  sell_price  NUMERIC(12,2) DEFAULT 0,
  stock       INTEGER DEFAULT 0,
  min_stock   INTEGER DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku      ON products(sku);

-- =====================================================
-- 5. STOCK_MOVEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('in','out')),
  qty         INTEGER NOT NULL,
  reference   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- =====================================================
-- 6. INVOICES (Sales)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number              TEXT UNIQUE NOT NULL,
  barcode             TEXT,
  customer            TEXT NOT NULL,
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE,
  amount              NUMERIC(12,2) DEFAULT 0,
  tax                 NUMERIC(12,2) DEFAULT 0,
  total               NUMERIC(12,2) DEFAULT 0,
  paid_amount         NUMERIC(12,2) DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('paid','partial','pending','overdue','draft','confirmed','returned')),
  payment_method      TEXT CHECK (payment_method IN ('cash','credit')),
  is_return           BOOLEAN DEFAULT FALSE,
  original_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  return_reason       TEXT,
  created_by          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer    ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date        ON invoices(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at  ON invoices(created_at DESC);

-- =====================================================
-- 7. INVOICE_ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =====================================================
-- 8. PURCHASES
-- =====================================================
CREATE TABLE IF NOT EXISTS purchases (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number       TEXT UNIQUE NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date     DATE,
  supplier     TEXT NOT NULL,
  supplier_vat TEXT,
  item_count   INTEGER DEFAULT 0,
  amount       NUMERIC(12,2) DEFAULT 0,
  tax          NUMERIC(12,2) DEFAULT 0,
  total        NUMERIC(12,2) DEFAULT 0,
  paid         NUMERIC(12,2) DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('received','pending','partial','cancelled','voided')),
  created_by   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS purchases_updated_at ON purchases;
CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_purchases_status     ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_date       ON purchases(date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- =====================================================
-- 9. PURCHASE_ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);

-- =====================================================
-- 10. EXPENSES
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  employee    TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  type        TEXT NOT NULL DEFAULT 'expense'
                CHECK (type IN ('expense','advance')),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('approved','pending','rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date   ON expenses(date DESC);

-- =====================================================
-- 11. TREASURY_ACCOUNTS
-- =====================================================
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  balance    NUMERIC(12,2) DEFAULT 0,
  icon       TEXT DEFAULT 'fa-wallet',
  color      TEXT DEFAULT '#2563EB',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS treasury_accounts_updated_at ON treasury_accounts;
CREATE TRIGGER treasury_accounts_updated_at
  BEFORE UPDATE ON treasury_accounts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Default accounts
INSERT INTO treasury_accounts (id, label, balance, icon, color) VALUES
  ('cash',  'الصندوق النقدي',  0, 'fa-money-bill-wave', '#10B981'),
  ('bank',  'الحساب البنكي',   0, 'fa-university',      '#2563EB'),
  ('pos',   'نقطة البيع (POS)',0, 'fa-credit-card',     '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. TREASURY_TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('in','out')),
  category    TEXT NOT NULL
                CHECK (category IN ('invoice','expense','salary','purchase','transfer','collection','other')),
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance     NUMERIC(12,2) DEFAULT 0,
  ref         TEXT,
  account_id  TEXT NOT NULL REFERENCES treasury_accounts(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treasury_transactions_account ON treasury_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_date    ON treasury_transactions(date DESC);

-- =====================================================
-- 13. EMPLOYEES (HR)
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  position    TEXT NOT NULL,
  department  TEXT NOT NULL,
  salary      NUMERIC(12,2) DEFAULT 0,
  allowances  NUMERIC(12,2) DEFAULT 0,
  deductions  NUMERIC(12,2) DEFAULT 0,
  net_salary  NUMERIC(12,2) DEFAULT 0,
  phone       TEXT,
  email       TEXT,
  iqama       TEXT,
  join_date   DATE DEFAULT CURRENT_DATE,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','leave','inactive')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS employees_updated_at ON employees;
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_employees_status     ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

-- =====================================================
-- 14. DELEGATES
-- =====================================================
CREATE TABLE IF NOT EXISTS delegates (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  phone                 TEXT,
  email                 TEXT,
  zone                  TEXT,
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','inactive')),
  username              TEXT UNIQUE NOT NULL,
  password_hash         TEXT NOT NULL,
  avatar                TEXT,
  location_lat          NUMERIC(10,6) DEFAULT 24.7136,
  location_lng          NUMERIC(10,6) DEFAULT 46.6753,
  location_address      TEXT,
  location_timestamp    TIMESTAMPTZ,
  stats_total_sales     NUMERIC(12,2) DEFAULT 0,
  stats_total_purchases NUMERIC(12,2) DEFAULT 0,
  stats_collected       NUMERIC(12,2) DEFAULT 0,
  stats_balance         NUMERIC(12,2) DEFAULT 0,
  stats_external_credit NUMERIC(12,2) DEFAULT 0,
  stats_expenses        NUMERIC(12,2) DEFAULT 0,
  stats_company_entrusted NUMERIC(12,2) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS delegates_updated_at ON delegates;
CREATE TRIGGER delegates_updated_at
  BEFORE UPDATE ON delegates
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_delegates_status   ON delegates(status);
CREATE INDEX IF NOT EXISTS idx_delegates_username ON delegates(username);

-- =====================================================
-- 15. DELEGATE_WAREHOUSE
-- =====================================================
CREATE TABLE IF NOT EXISTS delegate_warehouse (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delegate_id   TEXT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  product_sku   TEXT,
  qty           INTEGER DEFAULT 0,
  cost_price    NUMERIC(12,2) DEFAULT 0,
  received_date DATE DEFAULT CURRENT_DATE,
  status        TEXT NOT NULL DEFAULT 'in-stock'
                  CHECK (status IN ('in-stock','reserved','transferred')),
  source        TEXT NOT NULL DEFAULT 'purchased'
                  CHECK (source IN ('purchased','company')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS delegate_warehouse_updated_at ON delegate_warehouse;
CREATE TRIGGER delegate_warehouse_updated_at
  BEFORE UPDATE ON delegate_warehouse
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_delegate_warehouse_delegate ON delegate_warehouse(delegate_id);

-- =====================================================
-- 16. DELEGATE_INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS delegate_invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delegate_id     TEXT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  number          TEXT UNIQUE NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  type            TEXT NOT NULL CHECK (type IN ('sale','purchase')),
  party           TEXT NOT NULL,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  subtotal        NUMERIC(12,2) DEFAULT 0,
  tax             NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  paid_amount     NUMERIC(12,2) DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('paid','pending','overdue','confirmed')),
  payment_method  TEXT CHECK (payment_method IN ('cash','credit')),
  confirmed_at    DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS delegate_invoices_updated_at ON delegate_invoices;
CREATE TRIGGER delegate_invoices_updated_at
  BEFORE UPDATE ON delegate_invoices
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_delegate_invoices_delegate ON delegate_invoices(delegate_id);
CREATE INDEX IF NOT EXISTS idx_delegate_invoices_status   ON delegate_invoices(status);

-- =====================================================
-- 17. DELEGATE_INVOICE_ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS delegate_invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES delegate_invoices(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delegate_invoice_items_invoice ON delegate_invoice_items(invoice_id);

-- =====================================================
-- 18. DELEGATE_TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS delegate_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delegate_id   TEXT NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  type          TEXT NOT NULL
                  CHECK (type IN ('collection','withdrawal','expense','commission','remittance')),
  amount        NUMERIC(12,2) NOT NULL,
  description   TEXT,
  reference     TEXT,
  balance_after NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delegate_transactions_delegate ON delegate_transactions(delegate_id);
CREATE INDEX IF NOT EXISTS idx_delegate_transactions_date     ON delegate_transactions(date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegate_warehouse   ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegate_invoices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegate_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegate_transactions ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ───────────────────────────────────────────────────
-- PROFILES policies
-- ───────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id OR get_my_role() = 'admin');

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ───────────────────────────────────────────────────
-- CUSTOMERS policies (all authenticated users read, admin/accountant write)
-- ───────────────────────────────────────────────────
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "customers_delete" ON customers
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- CUSTOMER_PAYMENTS policies
-- ───────────────────────────────────────────────────
CREATE POLICY "customer_payments_select" ON customer_payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "customer_payments_insert" ON customer_payments
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "customer_payments_delete" ON customer_payments
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- PRODUCTS policies
-- ───────────────────────────────────────────────────
CREATE POLICY "products_select" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "products_insert" ON products
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "products_update" ON products
  FOR UPDATE USING (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "products_delete" ON products
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- STOCK_MOVEMENTS policies
-- ───────────────────────────────────────────────────
CREATE POLICY "stock_movements_select" ON stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "stock_movements_insert" ON stock_movements
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier'));

-- ───────────────────────────────────────────────────
-- INVOICES policies
-- ───────────────────────────────────────────────────
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- INVOICE_ITEMS policies
-- ───────────────────────────────────────────────────
CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "invoice_items_insert" ON invoice_items
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier'));

CREATE POLICY "invoice_items_delete" ON invoice_items
  FOR DELETE USING (get_my_role() IN ('admin','accountant'));

-- ───────────────────────────────────────────────────
-- PURCHASES policies
-- ───────────────────────────────────────────────────
CREATE POLICY "purchases_select" ON purchases
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "purchases_insert" ON purchases
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant'));

CREATE POLICY "purchases_update" ON purchases
  FOR UPDATE USING (get_my_role() IN ('admin','accountant'));

CREATE POLICY "purchases_delete" ON purchases
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- PURCHASE_ITEMS policies
-- ───────────────────────────────────────────────────
CREATE POLICY "purchase_items_select" ON purchase_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "purchase_items_insert" ON purchase_items
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant'));

CREATE POLICY "purchase_items_delete" ON purchase_items
  FOR DELETE USING (get_my_role() IN ('admin','accountant'));

-- ───────────────────────────────────────────────────
-- EXPENSES policies
-- ───────────────────────────────────────────────────
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier','hr'));

CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE USING (get_my_role() IN ('admin','accountant','hr'));

CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- TREASURY policies
-- ───────────────────────────────────────────────────
CREATE POLICY "treasury_accounts_select" ON treasury_accounts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "treasury_accounts_update" ON treasury_accounts
  FOR UPDATE USING (get_my_role() IN ('admin','accountant'));

CREATE POLICY "treasury_transactions_select" ON treasury_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "treasury_transactions_insert" ON treasury_transactions
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant','cashier'));

-- ───────────────────────────────────────────────────
-- EMPLOYEES policies
-- ───────────────────────────────────────────────────
CREATE POLICY "employees_select" ON employees
  FOR SELECT USING (get_my_role() IN ('admin','accountant','hr'));

CREATE POLICY "employees_insert" ON employees
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','hr'));

CREATE POLICY "employees_update" ON employees
  FOR UPDATE USING (get_my_role() IN ('admin','hr'));

CREATE POLICY "employees_delete" ON employees
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- DELEGATES policies
-- ───────────────────────────────────────────────────
CREATE POLICY "delegates_select" ON delegates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "delegates_insert" ON delegates
  FOR INSERT WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "delegates_update" ON delegates
  FOR UPDATE USING (get_my_role() IN ('admin','accountant'));

CREATE POLICY "delegates_delete" ON delegates
  FOR DELETE USING (get_my_role() = 'admin');

-- ───────────────────────────────────────────────────
-- DELEGATE_WAREHOUSE policies
-- ───────────────────────────────────────────────────
CREATE POLICY "delegate_warehouse_select" ON delegate_warehouse
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "delegate_warehouse_insert" ON delegate_warehouse
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant'));

CREATE POLICY "delegate_warehouse_update" ON delegate_warehouse
  FOR UPDATE USING (get_my_role() IN ('admin','accountant'));

-- ───────────────────────────────────────────────────
-- DELEGATE_INVOICES policies
-- ───────────────────────────────────────────────────
CREATE POLICY "delegate_invoices_select" ON delegate_invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "delegate_invoices_insert" ON delegate_invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "delegate_invoices_update" ON delegate_invoices
  FOR UPDATE USING (get_my_role() IN ('admin','accountant'));

-- ───────────────────────────────────────────────────
-- DELEGATE_INVOICE_ITEMS policies
-- ───────────────────────────────────────────────────
CREATE POLICY "delegate_invoice_items_select" ON delegate_invoice_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "delegate_invoice_items_insert" ON delegate_invoice_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ───────────────────────────────────────────────────
-- DELEGATE_TRANSACTIONS policies
-- ───────────────────────────────────────────────────
CREATE POLICY "delegate_transactions_select" ON delegate_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "delegate_transactions_insert" ON delegate_transactions
  FOR INSERT WITH CHECK (get_my_role() IN ('admin','accountant'));

-- =====================================================
-- DONE ✅
-- =====================================================

