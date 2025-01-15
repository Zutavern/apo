import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmailForm from '@/components/EmailForm'

describe('EmailForm', () => {
  it('rendert das Formular korrekt', () => {
    render(<EmailForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /senden/i })).toBeInTheDocument()
  })

  it('validiert Email-Eingaben', async () => {
    render(<EmailForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /senden/i })

    await userEvent.type(emailInput, 'ungültige-email')
    fireEvent.click(submitButton)
    expect(screen.getByText(/ungültige email/i)).toBeInTheDocument()

    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'test@example.com')
    fireEvent.click(submitButton)
    expect(screen.queryByText(/ungültige email/i)).not.toBeInTheDocument()
  })
}) 