import { NextRequest } from 'next/server';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    budget: { deleteMany: jest.fn() },
  },
}));

import { DELETE } from '../budgets/[id]/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockDeleteMany = prisma.budget.deleteMany as jest.Mock;

describe('DELETE /api/budgets/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new NextRequest('http://localhost/api/budgets/b1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'b1' }) });
    expect(res.status).toBe(401);
  });

  it('deletes budget and returns { deleted: true }', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockDeleteMany.mockResolvedValue({ count: 1 });

    const req = new NextRequest('http://localhost/api/budgets/b1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'b1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { id: 'b1', userId: 'user-1' } });
  });
});
