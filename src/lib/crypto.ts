/**
 * Simple client-side password hashing using Web Crypto API.
 * NOTE: This is NOT a replacement for server-side hashing.
 * It's only to avoid storing plaintext passwords in the codebase.
 */

const SALT = 'sahl-erp-salt-v1'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + SALT)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === hash
}
