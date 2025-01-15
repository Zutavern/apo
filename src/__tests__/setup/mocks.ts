export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
}

export const mockSupabase = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    user: jest.fn(),
  },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => Promise.resolve({ data: [], error: null })),
  insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
  update: jest.fn(() => Promise.resolve({ data: [], error: null })),
  delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
} 