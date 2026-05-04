export type AssetStatus = 'active' | 'maintenance' | 'disposed'

export interface FixedAsset {
  id: string
  name: string
  category: string
  purchaseDate: string
  cost: number
  accumulated: number
  bookValue: number
  depRate: number
  status: AssetStatus
  location: string
}

export const ASSET_CATEGORIES = ['الكل', 'أجهزة كمبيوتر', 'معدات مكتبية', 'سيارات', 'أثاث', 'معدات طباعة']

export const FIXED_ASSETS: FixedAsset[] = [
  { id: 'FA-001', name: 'سيارة تويوتا كامري 2022',      category: 'سيارات',          purchaseDate: '2022-03-01', cost: 120000, accumulated: 36000, bookValue: 84000, depRate: 25, status: 'active',      location: 'الرئيسي' },
  { id: 'FA-002', name: 'لابتوب Dell XPS 15',          category: 'أجهزة كمبيوتر',  purchaseDate: '2023-01-15', cost: 12000,  accumulated: 4800,  bookValue: 7200,  depRate: 33, status: 'active',      location: 'الرئيسي' },
  { id: 'FA-003', name: 'طابعة HP LaserJet Pro',       category: 'معدات طباعة',    purchaseDate: '2022-06-10', cost: 4500,   accumulated: 2700,  bookValue: 1800,  depRate: 33, status: 'maintenance', location: 'الرئيسي' },
  { id: 'FA-004', name: 'مكاتب وكراسي (10 طقم)',       category: 'أثاث',            purchaseDate: '2021-08-01', cost: 35000,  accumulated: 21000, bookValue: 14000, depRate: 20, status: 'active',      location: 'الرئيسي' },
  { id: 'FA-005', name: 'سيارة هيلوكس بيك أب',         category: 'سيارات',          purchaseDate: '2023-05-20', cost: 185000, accumulated: 37000, bookValue: 148000,depRate: 20, status: 'active',      location: 'الفرع الشمالي' },
  { id: 'FA-006', name: 'جهاز عرض Epson EB-X41',      category: 'معدات مكتبية',   purchaseDate: '2022-09-05', cost: 3800,   accumulated: 2280,  bookValue: 1520,  depRate: 33, status: 'active',      location: 'الرئيسي' },
  { id: 'FA-007', name: 'ماكينة تصوير Canon IR 2206', category: 'معدات طباعة',    purchaseDate: '2021-04-15', cost: 8500,   accumulated: 8500,  bookValue: 0,     depRate: 33, status: 'disposed',    location: 'الرئيسي' },
]

export const ASSET_STATS = {
  totalCost: 368800,
  totalAccumulated: 112280,
  totalBookValue: 256520,
  activeCount: 5,
}
