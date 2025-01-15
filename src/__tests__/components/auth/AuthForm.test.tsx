import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthForm } from '@/components/auth/AuthForm'
import { mockSupabaseClient } from '@/__mocks__/supabase'

jest.mock('@supabase/supabase-js')

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rendert das Anmeldeformular', () => {
    render(<AuthForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument()
  })

  it('verarbeitet die Anmeldung', async () => {
    render(<AuthForm />)
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/passwort/i), 'password123')
    
    fireEvent.click(screen.getByRole('button', { name: /anmelden/i }))
    
    expect(mockSupabaseClient.auth.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('zeigt Fehlermeldungen an', async () => {
    mockSupabaseClient.auth.signIn.mockRejectedValueOnce(new Error('Ungültige Anmeldedaten'))
    
    render(<AuthForm />)
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/passwort/i), 'wrong')
    
    fireEvent.click(screen.getByRole('button', { name: /anmelden/i }))
    
    expect(await screen.findByText(/ungültige anmeldedaten/i)).toBeInTheDocument()
  })
}) 