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

import { POST } from '../chat/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockFindMany = prisma.csvFile.findMany as jest.Mock;

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/chat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeReq({ messages: [{ role: 'user', text: 'Hello' }] }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when no messages provided', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(makeReq({ messages: [] }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/messages/i);
  });

  it('returns AI response text for valid request', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([
      {
        id: 'f1',
        fileName: 'bank.csv',
        transactions: JSON.stringify([
          { date: '2024-01-01', description: 'Coffee', amount: -5 },
        ]),
      },
    ]);
    mockGenerateContent.mockResolvedValue({ text: 'You spent $5 on coffee.' });

    const res = await POST(makeReq({ messages: [{ role: 'user', text: 'What did I spend?' }] }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe('You spent $5 on coffee.');
  });

  it('returns 429 when AI is rate limited', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([]);
    mockGenerateContent.mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED quota exceeded'));

    const res = await POST(makeReq({ messages: [{ role: 'user', text: 'Hello' }] }));
    expect(res.status).toBe(429);
  });

  it('returns 500 on generic AI error', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([]);
    mockGenerateContent.mockRejectedValue(new Error('Internal AI failure'));

    const res = await POST(makeReq({ messages: [{ role: 'user', text: 'Hello' }] }));
    expect(res.status).toBe(500);
  });

  it('sends conversation history to AI (multi-turn)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockFindMany.mockResolvedValue([]);
    mockGenerateContent.mockResolvedValue({ text: 'Follow-up answer.' });

    const messages = [
      { role: 'user', text: 'First question' },
      { role: 'model', text: 'First answer' },
      { role: 'user', text: 'Second question' },
    ];

    const res = await POST(makeReq({ messages }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe('Follow-up answer.');
  });
});
