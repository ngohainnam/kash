import { NextRequest } from 'next/server';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transactionNote: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { GET, POST } from '../notes/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock;
const mockFindMany = prisma.transactionNote.findMany as jest.Mock;
const mockDeleteMany = prisma.transactionNote.deleteMany as jest.Mock;
const mockUpsert = prisma.transactionNote.upsert as jest.Mock;

describe('GET /api/notes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const req = new NextRequest('http://localhost/api/notes?fileId=f1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when fileId is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const req = new NextRequest('http://localhost/api/notes');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/fileId/i);
  });

  it('returns notes for the given fileId', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const notes = [{ id: 'n1', txIndex: 0, note: 'Important', userId: 'user-1', fileId: 'f1' }];
    mockFindMany.mockResolvedValue(notes);

    const req = new NextRequest('http://localhost/api/notes?fileId=f1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.notes).toEqual(notes);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', fileId: 'f1' } })
    );
  });
});

describe('POST /api/notes', () => {
  beforeEach(() => jest.clearAllMocks());

  function makeReq(body: object) {
    return new NextRequest('http://localhost/api/notes', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeReq({ fileId: 'f1', txIndex: 0, note: 'test' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when fileId is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(makeReq({ txIndex: 0, note: 'test' }));
    expect(res.status).toBe(400);
  });

  it('deletes note when note is empty/whitespace', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockDeleteMany.mockResolvedValue({ count: 1 });

    const res = await POST(makeReq({ fileId: 'f1', txIndex: 0, note: '   ' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockDeleteMany).toHaveBeenCalled();
  });

  it('upserts note and returns it', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const note = { id: 'n1', userId: 'user-1', fileId: 'f1', txIndex: 0, note: 'Test note' };
    mockUpsert.mockResolvedValue(note);

    const res = await POST(makeReq({ fileId: 'f1', txIndex: 0, note: 'Test note' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.note).toEqual(note);
    expect(mockUpsert).toHaveBeenCalled();
  });
});
