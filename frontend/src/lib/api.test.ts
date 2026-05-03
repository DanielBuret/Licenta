import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
  },
}));

import { supabase } from './supabase';
import { api } from './api';

describe('api auth interceptor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('attaches Authorization header when a session exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'tok-123' } },
    });
    const handler = (api.interceptors.request as any).handlers[0];
    const config = await handler.fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer tok-123');
  });

  it('omits Authorization header when no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    const handler = (api.interceptors.request as any).handlers[0];
    const config = await handler.fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});
