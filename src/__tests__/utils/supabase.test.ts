import { createClient } from '@supabase/supabase-js'
import { mockSupabaseClient } from '@/__mocks__/supabase'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}))

describe('Supabase Client', () => {
  beforeEach(() => {
    (createClient as jest.Mock).mockImplementation(() => mockSupabaseClient)
  })

  it('verarbeitet Benutzeranmeldung korrekt', async () => {
    const { data, error } = await mockSupabaseClient.auth.signIn({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(error).toBeNull()
    expect(data).toHaveProperty('user')
    expect(data.user).toHaveProperty('email', 'test@example.com')
  })
}) 