import { NextRequest } from 'next/server';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transactionNote: { deleteMany: jest.fn() },
  },
}));

import { DELETE } from '../notes/[id]/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockDeleteMany = prisma.transactionNote.deleteMany as jest.Mock;

describe('DELETE /api/notes/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new NextRequest('http://localhost/api/notes/n1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'n1' }) });
    expect(res.status).toBe(401);
  });

  it('deletes note and returns { deleted: true }', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockDeleteMany.mockResolvedValue({ count: 1 });

    const req = new NextRequest('http://localhost/api/notes/n1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'n1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { id: 'n1', userId: 'user-1' } });
  });
});
