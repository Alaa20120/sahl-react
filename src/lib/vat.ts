/**
 * Centralized VAT calculation utilities.
 * Saudi Arabia VAT rate: 15%
 */

export const VAT_RATE = 0.15

export interface TaxBreakdown {
  subtotal: number
  tax: number
  total: number
}

export function calculateTax(subtotal: number): TaxBreakdown {
  const tax = Math.round(subtotal * VAT_RATE * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100
  return { subtotal, tax, total }
}

export function extractTaxFromTotal(total: number): TaxBreakdown {
  const subtotal = Math.round((total / (1 + VAT_RATE)) * 100) / 100
  const tax = Math.round((total - subtotal) * 100) / 100
  return { subtotal, tax, total }
}

export function formatTaxRate(): string {
  return `${(VAT_RATE * 100).toFixed(0)}%`
}
