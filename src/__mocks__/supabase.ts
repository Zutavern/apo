export const mockSupabaseClient = {
  auth: {
    signIn: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
        },
      },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ data: [], error: null }),
  update: jest.fn().mockResolvedValue({ data: [], error: null }),
  delete: jest.fn().mockResolvedValue({ data: [], error: null }),
} 