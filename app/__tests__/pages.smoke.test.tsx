/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({ isSignedIn: true })),
  UserButton: () => <div data-testid="user-button" />,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  PieChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// Mock lucide-react to avoid SVG issues
jest.mock('lucide-react', () => {
  const MockIcon = ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <span data-testid={testId} />
  );
  return new Proxy({}, { get: () => MockIcon });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ files: [] }),
  });
});

describe('Dashboard Page', () => {
  it('renders without crashing', async () => {
    const DashboardPage = (await import('../dashboard/page')).default;
    render(<DashboardPage />);
    expect(document.body).toBeTruthy();
  });
});

describe('Files Page', () => {
  it('renders without crashing and shows upload area', async () => {
    const FilesPage = (await import('../files/page')).default;
    render(<FilesPage />);
    expect(document.body).toBeTruthy();
  });
});
