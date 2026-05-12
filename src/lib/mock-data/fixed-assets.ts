export type AssetStatus = 'active' | 'maintenance' | 'disposed'
export type AssetOwnership = 'owned' | 'rental'

export interface FixedAsset {
  id: string
  name: string
  category: string
  ownership: AssetOwnership
  purchaseDate: string
  cost: number
  accumulated: number
  bookValue: number
  depRate: number
  status: AssetStatus
  location: string
  monthlyRent?: number
}

export const ASSET_CATEGORIES: string[] = []

export const FIXED_ASSETS: FixedAsset[] = []
