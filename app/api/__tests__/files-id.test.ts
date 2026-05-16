import { NextRequest } from 'next/server';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    csvFile: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { DELETE } from '../files/[id]/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockFindUnique = prisma.csvFile.findUnique as jest.Mock;
const mockDelete = prisma.csvFile.delete as jest.Mock;

describe('DELETE /api/files/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  function makeReq() {
    return new NextRequest('http://localhost/api/files/f1', { method: 'DELETE' });
  }

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: 'f1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when file does not exist', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindUnique.mockResolvedValue(null);

    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: 'f1' }) });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('returns 404 when file belongs to different user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindUnique.mockResolvedValue({ id: 'f1', userId: 'user-other' });

    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: 'f1' }) });
    expect(res.status).toBe(404);
  });

  it('deletes file and returns { success: true }', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindUnique.mockResolvedValue({ id: 'f1', userId: 'user-1' });
    mockDelete.mockResolvedValue({ id: 'f1' });

    const res = await DELETE(makeReq(), { params: Promise.resolve({ id: 'f1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'f1' } });
  });
});
