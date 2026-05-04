export interface Product {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  costPrice: number
  sellPrice: number
  stock: number
  minStock: number
  status: 'active' | 'inactive'
}

export const PRODUCTS: Product[] = [
  { id: '1', sku: 'PRD-001', name: 'لابتوب Dell Inspiron 15', category: 'إلكترونيات', unit: 'قطعة', costPrice: 2800, sellPrice: 3500, stock: 45, minStock: 10, status: 'active' },
  { id: '2', sku: 'PRD-002', name: 'طابعة HP LaserJet', category: 'إلكترونيات', unit: 'قطعة', costPrice: 650, sellPrice: 850, stock: 8, minStock: 10, status: 'active' },
  { id: '3', sku: 'PRD-003', name: 'كرسي مكتبي دوار', category: 'أثاث', unit: 'قطعة', costPrice: 380, sellPrice: 550, stock: 22, minStock: 5, status: 'active' },
  { id: '4', sku: 'PRD-004', name: 'مكيف سبليت 2 طن', category: 'أجهزة منزلية', unit: 'وحدة', costPrice: 1200, sellPrice: 1650, stock: 3, minStock: 5, status: 'active' },
  { id: '5', sku: 'PRD-005', name: 'طاولة اجتماعات 8 أشخاص', category: 'أثاث', unit: 'قطعة', costPrice: 2200, sellPrice: 3200, stock: 6, minStock: 2, status: 'active' },
  { id: '6', sku: 'PRD-006', name: 'هاتف IP بيزنس', category: 'إلكترونيات', unit: 'قطعة', costPrice: 290, sellPrice: 420, stock: 31, minStock: 15, status: 'active' },
  { id: '7', sku: 'PRD-007', name: 'أوراق A4 (كرتون)', category: 'قرطاسية', unit: 'كرتون', costPrice: 55, sellPrice: 80, stock: 120, minStock: 30, status: 'active' },
  { id: '8', sku: 'PRD-008', name: 'حبر طابعة أسود', category: 'قرطاسية', unit: 'خرطوشة', costPrice: 45, sellPrice: 70, stock: 2, minStock: 20, status: 'active' },
]

export const CATEGORIES = ['الكل', 'إلكترونيات', 'أثاث', 'أجهزة منزلية', 'قرطاسية']
