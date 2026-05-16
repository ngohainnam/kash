import { NextRequest } from 'next/server';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    csvFile: { create: jest.fn() },
  },
}));

import { POST } from '../upload/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockCreate = prisma.csvFile.create as jest.Mock;

const VALID_CSV = `Date,Description,Amount
2024-01-01,Coffee at Starbucks,-5.50
2024-01-02,Salary deposit,3000.00
2024-01-03,Grocery Coles,-85.20
`;

const MISSING_COLUMN_CSV = `Date,Description
2024-01-01,Coffee
`;

function makeFormDataReq(content: string, filename = 'bank.csv') {
  const file = new File([content], filename, { type: 'text/csv' });
  const form = new FormData();
  form.append('file', file);
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: form });
}

describe('POST /api/upload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeFormDataReq(VALID_CSV));
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is attached', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const req = new NextRequest('http://localhost/api/upload', { method: 'POST', body: new FormData() });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no file/i);
  });

  it('returns 422 when required CSV columns are missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(makeFormDataReq(MISSING_COLUMN_CSV));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/Amount/i);
  });

  it('parses CSV, saves to DB, and returns transactions', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockCreate.mockResolvedValue({ id: 'file-1', userId: 'user-1', fileName: 'bank.csv' });

    const res = await POST(makeFormDataReq(VALID_CSV));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fileId).toBe('file-1');
    expect(Array.isArray(json.transactions)).toBe(true);
    expect(json.transactions).toHaveLength(3);

    const [coffee, salary, grocery] = json.transactions;
    expect(coffee.description).toBe('Coffee at Starbucks');
    expect(coffee.amount).toBe(-5.5);
    expect(salary.amount).toBe(3000);
    expect(grocery.amount).toBe(-85.2);
  });

  it('skips rows with missing or invalid amount', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockCreate.mockResolvedValue({ id: 'file-2', userId: 'user-1', fileName: 'partial.csv' });

    const csv = `Date,Description,Amount
2024-01-01,Valid,-10.00
2024-01-02,NoBadRow,
2024-01-03,AlsoBad,notanumber
`;
    const res = await POST(makeFormDataReq(csv, 'partial.csv'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactions).toHaveLength(1);
    expect(json.transactions[0].description).toBe('Valid');
  });
});
