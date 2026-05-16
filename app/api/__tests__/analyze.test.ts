import { NextRequest } from 'next/server';

const mockGenerateContent = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    csvFile: { findMany: jest.fn() },
  },
}));
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

import { POST } from '../analyze/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockFindMany = prisma.csvFile.findMany as jest.Mock;

const MOCK_TRANSACTIONS = [
  { date: '2024-01-01', description: 'Coles Supermarket', amount: -80 },
  { date: '2024-01-02', description: 'Salary', amount: 3000 },
  { date: '2024-01-03', description: 'Netflix', amount: -17.99 },
];

const MOCK_AI_RESPONSE = JSON.stringify({
  savings: ['tip1', 'tip2', 'tip3', 'tip4'],
  anomalies: [],
});

describe('POST /api/analyze', () => {
  beforeEach(() => jest.clearAllMocks());

  function makeReq(body: object = {}) {
    return new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns AI analysis for authenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([
      { id: 'f1', userId: 'user-1', transactions: JSON.stringify(MOCK_TRANSACTIONS) },
    ]);
    mockGenerateContent.mockResolvedValue({ text: MOCK_AI_RESPONSE });

    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.savings)).toBe(true);
    expect(json.savings).toHaveLength(4);
    expect(Array.isArray(json.anomalies)).toBe(true);
  });

  it('handles malformed AI response and returns 500', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([
      { id: 'f1', userId: 'user-1', transactions: JSON.stringify(MOCK_TRANSACTIONS) },
    ]);
    mockGenerateContent.mockResolvedValue({ text: 'not valid json at all' });

    const res = await POST(makeReq());
    expect(res.status).toBe(500);
  });

  it('filters by fileIds when provided', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([]);
    mockGenerateContent.mockResolvedValue({ text: MOCK_AI_RESPONSE });

    await POST(makeReq({ fileIds: ['f1', 'f2'] }));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['f1', 'f2'] } }),
      })
    );
  });

  it('skips files with malformed transaction JSON', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([
      { id: 'f1', userId: 'user-1', transactions: 'NOT_JSON' },
    ]);
    mockGenerateContent.mockResolvedValue({ text: MOCK_AI_RESPONSE });

    const res = await POST(makeReq());
    // Should still succeed (gracefully skips bad files)
    expect(res.status).toBe(200);
  });
});
