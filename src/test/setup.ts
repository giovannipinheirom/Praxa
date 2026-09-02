import { vi } from 'vitest';

// Configurações globais para testes
process.env.SUPABASE_URL = "http://localhost:54321";
process.env.SUPABASE_PUBLISHABLE_KEY = "sb_mock_key_test";

// Mocks globais se necessário
vi.mock('@tanstack/react-start/server', () => ({
  getRequest: vi.fn(() => ({
    headers: {
      get: (key: string) => {
        if (key === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
  })),
}));
