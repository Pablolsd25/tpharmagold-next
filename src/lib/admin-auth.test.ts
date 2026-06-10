import { describe, expect, it } from 'vitest'
import { isAdminEmail, normalizeAdminEmail } from './admin-auth'

describe('normalizeAdminEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeAdminEmail('  Admin@Example.COM ')).toBe('admin@example.com')
  })
})

describe('isAdminEmail', () => {
  it('matches normalized admin list', () => {
    const admins = ['admin@tpharmagold.com', 'ops@example.com']
    expect(isAdminEmail('Admin@tpharmagold.com', admins)).toBe(true)
    expect(isAdminEmail('user@test.com', admins)).toBe(false)
  })
})
