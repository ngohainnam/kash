/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

import StatementCard from '../StatementCard';
import type { CsvFileRecord } from '@/app/api/files/route';

const mockFile: CsvFileRecord = {
  id: 'f1',
  fileName: 'bank-jan-2024.csv',
  uploadedAt: '2024-01-15T00:00:00.000Z',
  transactions: [
    { date: '2024-01-01', description: 'Salary', amount: 3000 },
    { date: '2024-01-02', description: 'Coffee', amount: -5.5 },
    { date: '2024-01-03', description: 'Grocery', amount: -85.2 },
  ],
};

describe('StatementCard', () => {
  const defaultProps = {
    file: mockFile,
    isOpen: false,
    isDeleting: false,
    onToggle: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ([]) });
  });

  it('renders the file name', () => {
    render(<StatementCard {...defaultProps} />);
    expect(screen.getByText('bank-jan-2024.csv')).toBeInTheDocument();
  });

  it('shows transaction count', () => {
    render(<StatementCard {...defaultProps} />);
    expect(screen.getByText('3 txns')).toBeInTheDocument();
  });

  it('calls onToggle when expand button is clicked', () => {
    const onToggle = jest.fn();
    render(<StatementCard {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByTitle('Expand'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<StatementCard {...defaultProps} onDelete={onDelete} />);
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows TransactionTable when isOpen is true', () => {
    render(<StatementCard {...defaultProps} isOpen={true} />);
    // When open, the Date column header should be visible in the table
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('does not show table when isOpen is false', () => {
    render(<StatementCard {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Date')).not.toBeInTheDocument();
  });
});
