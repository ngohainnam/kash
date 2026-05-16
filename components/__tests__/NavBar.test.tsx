/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({ isSignedIn: false })),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import Navbar from '../NavBar';
import { useAuth } from '@clerk/nextjs';

const mockUseAuth = useAuth as jest.Mock;

describe('Navbar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the KASH brand', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false });
    render(<Navbar />);
    expect(screen.getByText('KASH')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false });
    render(<Navbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByText('Visualize')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('shows Sign in and Get started buttons when signed out', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false });
    render(<Navbar />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('shows UserButton when signed in', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: true });
    render(<Navbar />);
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });

  it('applies active class to the current route link', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockUseAuth.mockReturnValue({ isSignedIn: false });
    render(<Navbar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).toContain('active');
  });
});
