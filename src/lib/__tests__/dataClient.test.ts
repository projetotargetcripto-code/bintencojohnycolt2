import { afterEach, describe, expect, it, vi } from 'vitest'

describe('dataClient env variables', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('throws error when env vars are missing', async () => {
    vi.resetModules()
    vi.stubEnv('DEV', 'true')
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    await expect(import('../dataClient')).rejects.toThrowError()
  })
})

