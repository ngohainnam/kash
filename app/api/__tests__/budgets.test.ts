import { NextRequest } from 'next/server';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    budget: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { GET, POST } from '../budgets/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockFindMany = prisma.budget.findMany as jest.Mock;
const mockUpsert = prisma.budget.upsert as jest.Mock;

describe('GET /api/budgets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns budgets for authenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const budgets = [{ id: 'b1', category: 'Food', monthlyLimit: 500, month: '2024-01' }];
    mockFindMany.mockResolvedValue(budgets);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.budgets).toEqual(budgets);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });
});

describe('POST /api/budgets', () => {
  beforeEach(() => jest.clearAllMocks());

  function makeReq(body: object) {
    return new NextRequest('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeReq({ category: 'Food', monthlyLimit: 500, month: '2024-01' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when category is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(makeReq({ monthlyLimit: 500, month: '2024-01' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/category/i);
  });

  it('returns 400 when monthlyLimit is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(makeReq({ category: 'Food', month: '2024-01' }));
    expect(res.status).toBe(400);
  });

  it('upserts and returns the budget', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const budget = { id: 'b1', userId: 'user-1', category: 'Food', monthlyLimit: 500, month: '2024-01' };
    mockUpsert.mockResolvedValue(budget);

    const res = await POST(makeReq({ category: 'Food', monthlyLimit: 500, month: '2024-01' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.budget).toEqual(budget);
    expect(mockUpsert).toHaveBeenCalled();
  });
});
