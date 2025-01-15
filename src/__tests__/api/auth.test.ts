import { createMocks } from 'node-mocks-http'
import authHandler from '@/app/api/auth/route'

describe('Auth API', () => {
  it('gibt 405 zurück für nicht erlaubte Methoden', async () => {
    const { req, res } = createMocks({
      method: 'PUT',
    })

    await authHandler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })

  it('validiert Login-Daten', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    await authHandler(req, res)
    expect(res._getStatusCode()).toBe(200)
    
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('token')
  })
}) 