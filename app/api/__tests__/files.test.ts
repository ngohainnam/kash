jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    csvFile: { findMany: jest.fn() },
  },
}));

import { GET } from '../files/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockFindMany = prisma.csvFile.findMany as jest.Mock;

describe('GET /api/files', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('returns files for authenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const mockFiles = [
      {
        id: 'f1',
        fileName: 'bank.csv',
        uploadedAt: new Date('2024-01-15T00:00:00.000Z'),
        transactions: JSON.stringify([{ date: '2024-01-01', description: 'Coffee', amount: -5 }]),
      },
    ];
    mockFindMany.mockResolvedValue(mockFiles);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.files).toHaveLength(1);
    expect(json.files[0].fileName).toBe('bank.csv');
    expect(json.files[0].uploadedAt).toBe('2024-01-15T00:00:00.000Z');
    expect(Array.isArray(json.files[0].transactions)).toBe(true);
  });

  it('queries only the current user files', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-2' });
    mockFindMany.mockResolvedValue([]);

    await GET();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-2' } })
    );
  });
});
