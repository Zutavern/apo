import { createServerClient } from '@/utils/supabase-server'
import { cookies } from 'next/headers'

jest.mock('next/headers')

describe('Supabase Server Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('erstellt einen Server-Client', () => {
    const mockCookies = {
      get: jest.fn(),
      set: jest.fn(),
    }
    
    ;(cookies as jest.Mock).mockReturnValue(mockCookies)
    
    const client = createServerClient()
    expect(client).toBeDefined()
  })
}) 